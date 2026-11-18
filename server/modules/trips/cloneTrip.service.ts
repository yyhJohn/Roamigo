import type { PrismaClient, User } from '@prisma/client';
import { forbidden, notFound, serviceUnavailable } from '../../lib/errors.js';
import { TRIP_DETAIL_INCLUDE } from './trips.mapper.js';

export async function cloneExistingTrip(
  prisma: PrismaClient | undefined,
  user: User,
  sourceTripId: string,
): Promise<string> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const src = await prisma.trip.findUnique({
    where: { id: sourceTripId },
    include: TRIP_DETAIL_INCLUDE,
  });
  if (!src) {
    throw notFound('Source trip not found.');
  }
  const isMember = src.members.some((m) => m.userId === user.id);
  if (!src.isDemo && !isMember) {
    throw forbidden('You do not have access to clone this trip.');
  }

  return prisma.$transaction(async (tx) => {
    const cleanTitle = src.title.replace(/\s*\(Demo Trip\)\s*/i, '').trim();
    const copy = await tx.trip.create({
      data: {
        ownerId: user.id,
        title: `${cleanTitle} (My Copy)`,
        destinations: src.destinations,
        departureCity: src.departureCity,
        startDate: src.startDate,
        endDate: src.endDate,
        groupSize: src.groupSize,
        currency: src.currency,
        status: 'UPCOMING',
        wizardStep: 10,
        coverImageKey: src.coverImageKey,
        isDemo: false,
      },
    });
    const m = await tx.tripMember.create({
      data: { tripId: copy.id, userId: user.id, role: 'OWNER' },
    });
    await tx.travellerPreference.create({
      data: {
        tripId: copy.id,
        memberId: m.id,
        displayName: user.displayName,
        budgetMinor: src.preferences[0]?.budgetMinor ?? 30000,
        interests: src.preferences[0]?.interests ?? ['culture', 'food'],
      },
    });
    await tx.budget.create({
      data: {
        tripId: copy.id,
        sharedCapMinor: src.budget?.sharedCapMinor ?? null,
        accommodationEstMinor: src.budget?.accommodationEstMinor ?? 0,
        transportEstMinor: src.budget?.transportEstMinor ?? 0,
      },
    });

    const activeVer = src.itinerary?.versions[0];
    if (src.itinerary && activeVer) {
      const itin = await tx.itinerary.create({
        data: {
          tripId: copy.id,
          chosenDestination: src.itinerary.chosenDestination,
        },
      });
      const v1 = await tx.itineraryVersion.create({
        data: {
          itineraryId: itin.id,
          versionNumber: 1,
          overview: activeVer.overview,
          compromiseSummary: activeVer.compromiseSummary,
          source: 'MANUAL',
          createdById: user.id,
        },
      });
      await tx.itinerary.update({
        where: { id: itin.id },
        data: { activeVersionId: v1.id },
      });
      for (const day of activeVer.days) {
        const d = await tx.itineraryDay.create({
          data: {
            versionId: v1.id,
            dayNumber: day.dayNumber,
            date: day.date,
            theme: day.theme,
          },
        });
        for (const act of day.activities) {
          await tx.activity.create({
            data: {
              dayId: d.id,
              stableKey: act.stableKey,
              sortOrder: act.sortOrder,
              title: act.title,
              description: act.description,
              category: act.category,
              timeSlot: act.timeSlot,
              startTime: act.startTime,
              endTime: act.endTime,
              estimatedCostMinor: act.estimatedCostMinor,
              locationName: act.locationName,
              lat: act.lat,
              lng: act.lng,
              coordSource: act.coordSource,
              compromiseExplanation: act.compromiseExplanation,
              matchedTravellers: act.matchedTravellers,
              included: act.included,
            },
          });
        }
      }
    }
    return copy.id;
  });
}
