import type { PrismaClient, User } from '@prisma/client';
import type {
  AiWorkspaceItinerary,
  StagedAiProposalDto,
} from '../../../src/lib/contracts/ai.schemas.js';
import {
  badRequest,
  notFound,
  serviceUnavailable,
} from '../../lib/errors.js';
import { TRIP_DETAIL_INCLUDE } from '../trips/trips.query.js';
import { mapAiErrorToAppError, runAuditedAiOperation } from './ai.audit.js';
import { computeProposalDiffAndImpact } from './ai.diff.js';
import { persistItineraryVersionWithVoteCarryover } from './ai.persistence.js';
import type { TravelAIProvider } from './ai.types.js';

export { mapAiErrorToAppError };

export async function generateWorkspaceItineraryVersion(
  prisma: PrismaClient | undefined,
  aiProvider: TravelAIProvider,
  user: User,
  tripId: string,
  signal?: AbortSignal,
): Promise<{ versionNumber: number }> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { preferences: true },
  });
  if (!trip) throw notFound('Trip not found.');
  if (trip.preferences.length === 0) {
    throw badRequest('Add at least one traveller preference before generating.');
  }

  return runAuditedAiOperation({
    prisma,
    tripId: trip.id,
    userId: user.id,
    aiProvider,
    operation: 'GENERATE_ITINERARY',
    execute: async () => {
      const generated = await aiProvider.generateWorkspaceItinerary(
        {
          destinations: trip.destinations,
          departureCity: trip.departureCity,
          startDate: trip.startDate,
          endDate: trip.endDate,
          groupSize: trip.groupSize,
          currency: trip.currency,
          travellers: trip.preferences.map((p) => ({
            displayName: p.displayName,
            budgetMinor: p.budgetMinor,
            accommodationPref: p.accommodationPref,
            transportPref: p.transportPref,
            pace: p.pace,
            dietaryOrAccess: p.dietaryOrAccess,
            interests: p.interests,
          })),
        },
        signal,
      );
      const versionNumber = await persistItineraryVersionWithVoteCarryover(
        prisma,
        trip.id,
        user.id,
        'AI',
        generated,
      );
      return { versionNumber };
    },
  });
}

export async function proposeWorkspaceAssistantDiff(
  prisma: PrismaClient | undefined,
  aiProvider: TravelAIProvider,
  user: User,
  tripId: string,
  instruction: string,
  targetDayNumber?: number,
  signal?: AbortSignal,
): Promise<StagedAiProposalDto> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: TRIP_DETAIL_INCLUDE,
  });
  if (!trip) throw notFound('Trip not found.');
  const activeVer =
    trip.itinerary?.versions.find(
      (v) => v.id === trip.itinerary?.activeVersionId,
    ) ?? trip.itinerary?.versions[0];
  if (!trip.itinerary || !activeVer) {
    throw badRequest(
      'Generate or add an initial itinerary before requesting AI edits.',
    );
  }
  const chosenDestination = trip.itinerary.chosenDestination;
  const currentDays: AiWorkspaceItinerary['days'] = activeVer.days.map((d) => ({
    dayNumber: d.dayNumber,
    date: d.date,
    theme: d.theme,
    activities: d.activities.map((a) => ({
      stableKey: a.stableKey,
      title: a.title,
      description: a.description,
      category: a.category,
      timeSlot: a.timeSlot,
      startTime: a.startTime,
      endTime: a.endTime,
      estimatedCostMinor: a.estimatedCostMinor,
      locationName: a.locationName,
      compromiseExplanation: a.compromiseExplanation,
      matchedTravellers: a.matchedTravellers,
      included: a.included,
    })),
  }));

  return runAuditedAiOperation({
    prisma,
    tripId: trip.id,
    userId: user.id,
    aiProvider,
    operation: 'PROPOSE_DIFF',
    execute: async () => {
      const rawProposal = await aiProvider.proposeItineraryDiff(
        {
          chosenDestination,
          currency: trip.currency,
          instruction,
          targetDayNumber,
          travellers: trip.preferences.map((p) => ({
            displayName: p.displayName,
            budgetMinor: p.budgetMinor,
            accommodationPref: p.accommodationPref,
            transportPref: p.transportPref,
            pace: p.pace,
            dietaryOrAccess: p.dietaryOrAccess,
            interests: p.interests,
          })),
          currentDays,
        },
        signal,
      );
      return computeProposalDiffAndImpact(
        currentDays,
        rawProposal,
        trip.preferences.map((p) => ({
          displayName: p.displayName,
          budgetMinor: p.budgetMinor,
        })),
      );
    },
  });
}

export async function applyConfirmedAiProposal(
  prisma: PrismaClient | undefined,
  user: User,
  tripId: string,
  summary: string,
  days: AiWorkspaceItinerary['days'],
): Promise<{ versionNumber: number }> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      itinerary: {
        include: { versions: { take: 1, orderBy: { versionNumber: 'desc' } } },
      },
    },
  });
  if (!trip || !trip.itinerary) throw notFound('Itinerary not found.');
  const prevOverview =
    trip.itinerary.versions[0]?.overview ?? 'Updated collaborative itinerary.';
  const versionNumber = await persistItineraryVersionWithVoteCarryover(
    prisma,
    trip.id,
    user.id,
    'ASSISTANT',
    {
      chosenDestination: trip.itinerary.chosenDestination,
      overview: prevOverview,
      compromiseSummary: summary,
      days,
    },
  );
  return { versionNumber };
}
