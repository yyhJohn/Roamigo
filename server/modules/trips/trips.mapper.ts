import type { TripRole } from '@prisma/client';
import type {
  TripMemberPreviewDto,
  TripSummaryDto,
} from '../../../src/lib/contracts/trip.schemas.js';
import type { TripDetailDto } from '../../../src/lib/contracts/tripDetail.types.js';
import { TRIP_DETAIL_INCLUDE, type LoadedTripDetail } from './trips.query.js';

export { TRIP_DETAIL_INCLUDE, type LoadedTripDetail };

function mapMembers(
  trip: LoadedTripDetail,
  viewerUserId: string,
  viewerRole: TripRole,
): TripMemberPreviewDto[] {
  return trip.members.map((m) => {
    const canSeeEmail =
      m.userId === viewerUserId ||
      viewerRole === 'OWNER' ||
      m.user.privacyShareEmail;
    return {
      memberId: m.id,
      userId: m.userId,
      displayName: m.user.displayName,
      email: canSeeEmail ? m.user.email : null,
      avatarColor: m.user.avatarColor,
      role: m.role,
    };
  });
}

export function mapTripSummary(
  trip: LoadedTripDetail,
  viewerUserId: string,
  overrideRole?: TripRole,
): TripSummaryDto {
  const memberRow = trip.members.find((m) => m.userId === viewerUserId);
  const myRole: TripRole = overrideRole ?? memberRow?.role ?? 'VIEWER';
  const activeVersion =
    trip.itinerary?.versions.find(
      (v) => v.id === trip.itinerary?.activeVersionId,
    ) ?? trip.itinerary?.versions[0];

  let estimatedPerPersonMinor = 0;
  if (activeVersion) {
    for (const day of activeVersion.days) {
      for (const act of day.activities) {
        if (act.included) {
          estimatedPerPersonMinor += act.estimatedCostMinor;
        }
      }
    }
  }

  return {
    id: trip.id,
    title: trip.title,
    destinations: trip.destinations,
    departureCity: trip.departureCity,
    startDate: trip.startDate,
    endDate: trip.endDate,
    groupSize: trip.groupSize,
    currency: trip.currency,
    status: trip.status,
    wizardStep: trip.wizardStep,
    coverImageKey: trip.coverImageKey,
    isDemo: trip.isDemo,
    version: trip.version,
    myRole,
    memberCount: trip.members.length,
    membersPreview: mapMembers(trip, viewerUserId, myRole).slice(0, 5),
    estimatedPerPersonMinor,
    sharedCapMinor: trip.budget?.sharedCapMinor ?? null,
    hasItinerary: Boolean(activeVersion),
  };
}

export function mapTripDetail(
  trip: LoadedTripDetail,
  viewerUserId: string,
  role: TripRole,
  isDemoReadOnly: boolean,
): TripDetailDto {
  const summary = mapTripSummary(trip, viewerUserId, role);
  const activeVersion =
    trip.itinerary?.versions.find(
      (v) => v.id === trip.itinerary?.activeVersionId,
    ) ?? trip.itinerary?.versions[0];

  return {
    summary,
    isDemoReadOnly,
    wizardDraftJson:
      trip.wizardDraftJson && typeof trip.wizardDraftJson === 'object'
        ? (trip.wizardDraftJson as Record<string, unknown>)
        : null,
    members: mapMembers(trip, viewerUserId, role),
    invitations:
      role === 'OWNER' || role === 'EDITOR'
        ? trip.invitations.map((inv) => ({
            id: inv.id,
            email: inv.email,
            role: inv.role,
            status: inv.status,
            expiresAt: inv.expiresAt.toISOString(),
          }))
        : [],
    preferences: trip.preferences.map((p) => ({
      id: p.id,
      memberId: p.memberId,
      displayName: p.displayName,
      budgetMinor: p.budgetMinor,
      accommodationPref: p.accommodationPref,
      transportPref: p.transportPref,
      pace: p.pace,
      dietaryOrAccess: p.dietaryOrAccess,
      notes: p.notes,
      interests: p.interests,
    })),
    itinerary:
      trip.itinerary && activeVersion
        ? {
            id: trip.itinerary.id,
            chosenDestination: trip.itinerary.chosenDestination,
            activeVersionId: activeVersion.id,
            versionNumber: activeVersion.versionNumber,
            overview: activeVersion.overview,
            compromiseSummary: activeVersion.compromiseSummary,
            source: activeVersion.source,
            days: activeVersion.days.map((d) => ({
              id: d.id,
              dayNumber: d.dayNumber,
              date: d.date,
              theme: d.theme,
              activities: d.activities.map((a) => ({
                id: a.id,
                dayId: a.dayId,
                stableKey: a.stableKey,
                sortOrder: a.sortOrder,
                title: a.title,
                description: a.description,
                category: a.category,
                timeSlot: a.timeSlot,
                startTime: a.startTime,
                endTime: a.endTime,
                estimatedCostMinor: a.estimatedCostMinor,
                locationName: a.locationName,
                lat: a.lat,
                lng: a.lng,
                coordSource: a.coordSource,
                compromiseExplanation: a.compromiseExplanation,
                matchedTravellers: a.matchedTravellers,
                included: a.included,
                decisionStatus: a.decisionStatus,
                votes: a.votes.map((v) => ({
                  userId: v.userId,
                  direction: v.direction,
                })),
              })),
            })),
          }
        : null,
    budget: trip.budget
      ? {
          sharedCapMinor: trip.budget.sharedCapMinor,
          accommodationEstMinor: trip.budget.accommodationEstMinor,
          transportEstMinor: trip.budget.transportEstMinor,
          foodCapMinor: trip.budget.foodCapMinor,
          activitiesCapMinor: trip.budget.activitiesCapMinor,
          notes: trip.budget.notes,
        }
      : null,
    expenses: trip.expenses.map((e) => ({
      id: e.id,
      paidByUserId: e.paidByUserId,
      category: e.category,
      title: e.title,
      amountMinor: e.amountMinor,
      currency: e.currency,
      splitMode: e.splitMode,
      incurredOn: e.incurredOn,
      notes: e.notes,
      splits: e.splits.map((s) => ({
        userId: s.userId,
        shareMinor: s.shareMinor,
        basisPoints: s.basisPoints,
      })),
    })),
    settlements: trip.settlements.map((s) => ({
      id: s.id,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amountMinor: s.amountMinor,
      currency: s.currency,
      status: s.status,
    })),
  };
}
