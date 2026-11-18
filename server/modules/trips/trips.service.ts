import type { Prisma, PrismaClient, User } from '@prisma/client';
import type {
  TripSummaryDto,
  WizardTripPayload,
} from '../../../src/lib/contracts/trip.schemas.js';
import { forbidden, notFound, serviceUnavailable } from '../../lib/errors.js';
import { mapTripSummary, TRIP_DETAIL_INCLUDE } from './trips.mapper.js';

function pickCoverKey(destinations: string[]): string {
  const joined = destinations.join(' ').toLowerCase();
  if (joined.includes('lisbon')) return 'lisbon';
  if (joined.includes('kyoto') || joined.includes('tokyo')) return 'kyoto';
  if (joined.includes('edinburgh') || joined.includes('scotland')) {
    return 'edinburgh';
  }
  return 'barcelona';
}

export async function listTripsForUser(
  prisma: PrismaClient | undefined,
  userId: string,
  query: { filter?: string; search?: string; sort?: string },
): Promise<TripSummaryDto[]> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const filter = (query.filter ?? 'all').toLowerCase();
  const search = query.search?.trim();

  const where: Prisma.TripWhereInput = {
    members: { some: { userId } },
    ...(filter === 'upcoming' ? { status: { in: ['UPCOMING', 'ACTIVE'] } } : {}),
    ...(filter === 'drafts' ? { status: 'DRAFT' } : {}),
    ...(filter === 'past' ? { status: 'PAST' } : {}),
    ...(filter === 'archived'
      ? { status: 'ARCHIVED' }
      : filter === 'all'
        ? { status: { not: 'ARCHIVED' } }
        : {}),
    ...(filter === 'shared'
      ? { ownerId: { not: userId }, status: { not: 'ARCHIVED' } }
      : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { destinations: { hasSome: [search] } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.TripOrderByWithRelationInput =
    query.sort === 'startDate' ? { startDate: 'asc' } : { updatedAt: 'desc' };

  const memberTrips = await prisma.trip.findMany({
    where,
    include: TRIP_DETAIL_INCLUDE,
    orderBy,
  });

  const summaries = memberTrips.map((t) => mapTripSummary(t, userId));

  if ((filter === 'all' || filter === 'upcoming') && !search) {
    const alreadyHasDemo = summaries.some((t) => t.isDemo);
    if (!alreadyHasDemo) {
      const demoTrip = await prisma.trip.findFirst({
        where: { isDemo: true },
        include: TRIP_DETAIL_INCLUDE,
      });
      if (demoTrip) {
        summaries.push(mapTripSummary(demoTrip, userId, 'VIEWER'));
      }
    }
  }

  return summaries;
}

export async function saveWizardTrip(
  prisma: PrismaClient | undefined,
  user: User,
  input: WizardTripPayload,
  existingTripId?: string,
): Promise<string> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const nextStatus = input.finalize ? 'UPCOMING' : 'DRAFT';
  const coverImageKey = pickCoverKey(input.destinations);
  const draftJson = input as unknown as Prisma.InputJsonObject;

  return prisma.$transaction(async (tx) => {
    if (existingTripId) {
      const current = await tx.trip.findUnique({
        where: { id: existingTripId },
        include: { members: { where: { userId: user.id } } },
      });
      if (!current) {
        throw notFound('Draft trip not found.');
      }
      const myMember = current.members[0];
      if (!myMember || (myMember.role !== 'OWNER' && myMember.role !== 'EDITOR')) {
        throw forbidden('Cannot edit this trip.');
      }

      await tx.trip.update({
        where: { id: existingTripId },
        data: {
          title: input.title,
          destinations: input.destinations,
          departureCity: input.departureCity,
          startDate: input.startDate,
          endDate: input.endDate,
          groupSize: input.groupSize,
          currency: input.currency,
          status: current.status === 'DRAFT' ? nextStatus : current.status,
          wizardStep: input.wizardStep,
          wizardDraftJson: draftJson,
          coverImageKey,
          version: { increment: 1 },
        },
      });

      await tx.travellerPreference.upsert({
        where: { memberId: myMember.id },
        update: {
          displayName: user.displayName,
          budgetMinor: input.personalBudgetMinor,
          accommodationPref: input.accommodationPref,
          transportPref: input.transportPref,
          pace: input.pace,
          dietaryOrAccess: input.dietaryOrAccess,
          notes: input.notes,
          interests:
            input.interests.length > 0 ? input.interests : ['sightseeing'],
        },
        create: {
          tripId: existingTripId,
          memberId: myMember.id,
          displayName: user.displayName,
          budgetMinor: input.personalBudgetMinor,
          accommodationPref: input.accommodationPref,
          transportPref: input.transportPref,
          pace: input.pace,
          dietaryOrAccess: input.dietaryOrAccess,
          notes: input.notes,
          interests:
            input.interests.length > 0 ? input.interests : ['sightseeing'],
        },
      });

      await tx.budget.upsert({
        where: { tripId: existingTripId },
        update: { sharedCapMinor: input.sharedCapMinor ?? null },
        create: {
          tripId: existingTripId,
          sharedCapMinor: input.sharedCapMinor ?? null,
        },
      });
      return existingTripId;
    }

    const created = await tx.trip.create({
      data: {
        ownerId: user.id,
        title: input.title,
        destinations: input.destinations,
        departureCity: input.departureCity,
        startDate: input.startDate,
        endDate: input.endDate,
        groupSize: input.groupSize,
        currency: input.currency,
        status: nextStatus,
        wizardStep: input.wizardStep,
        wizardDraftJson: draftJson,
        coverImageKey,
      },
    });

    const ownerMember = await tx.tripMember.create({
      data: { tripId: created.id, userId: user.id, role: 'OWNER' },
    });

    await tx.travellerPreference.create({
      data: {
        tripId: created.id,
        memberId: ownerMember.id,
        displayName: user.displayName,
        budgetMinor: input.personalBudgetMinor,
        accommodationPref: input.accommodationPref,
        transportPref: input.transportPref,
        pace: input.pace,
        dietaryOrAccess: input.dietaryOrAccess,
        notes: input.notes,
        interests:
          input.interests.length > 0 ? input.interests : ['sightseeing'],
      },
    });

    await tx.budget.create({
      data: {
        tripId: created.id,
        sharedCapMinor: input.sharedCapMinor ?? null,
      },
    });

    return created.id;
  });
}
