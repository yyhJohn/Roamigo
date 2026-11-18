import type { ItinerarySource, PrismaClient } from '@prisma/client';
import type { AiWorkspaceItinerary } from '../../../src/lib/contracts/ai.schemas.js';

export async function persistItineraryVersionWithVoteCarryover(
  prisma: PrismaClient,
  tripId: string,
  userId: string,
  source: ItinerarySource,
  payload: AiWorkspaceItinerary,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const existingItin = await tx.itinerary.findUnique({
      where: { tripId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
          include: {
            days: { include: { activities: { include: { votes: true } } } },
          },
        },
      },
    });

    const prevVotesByStableKey = new Map<
      string,
      { userId: string; direction: 'UP' | 'DOWN' }[]
    >();
    const prevCoordsByStableKey = new Map<
      string,
      { lat: number | null; lng: number | null; coordSource: string }
    >();

    const latestVer = existingItin?.versions[0];
    if (latestVer) {
      for (const d of latestVer.days) {
        for (const a of d.activities) {
          prevVotesByStableKey.set(
            a.stableKey,
            a.votes.map((v) => ({ userId: v.userId, direction: v.direction })),
          );
          prevCoordsByStableKey.set(a.stableKey, {
            lat: a.lat,
            lng: a.lng,
            coordSource: a.coordSource,
          });
        }
      }
    }

    const itin =
      existingItin ??
      (await tx.itinerary.create({
        data: { tripId, chosenDestination: payload.chosenDestination },
      }));

    const nextVersionNumber = (latestVer?.versionNumber ?? 0) + 1;
    const createdVer = await tx.itineraryVersion.create({
      data: {
        itineraryId: itin.id,
        versionNumber: nextVersionNumber,
        overview: payload.overview,
        compromiseSummary: payload.compromiseSummary,
        source,
        createdById: userId,
      },
    });

    await tx.itinerary.update({
      where: { id: itin.id },
      data: {
        activeVersionId: createdVer.id,
        chosenDestination: payload.chosenDestination,
      },
    });

    for (const day of payload.days) {
      const dbDay = await tx.itineraryDay.create({
        data: {
          versionId: createdVer.id,
          dayNumber: day.dayNumber,
          date: day.date,
          theme: day.theme,
        },
      });
      for (const [idx, act] of day.activities.entries()) {
        const carriedCoord = prevCoordsByStableKey.get(act.stableKey);
        const dbAct = await tx.activity.create({
          data: {
            dayId: dbDay.id,
            stableKey: act.stableKey,
            sortOrder: idx,
            title: act.title,
            description: act.description,
            category: act.category,
            timeSlot: act.timeSlot,
            startTime: act.startTime ?? null,
            endTime: act.endTime ?? null,
            estimatedCostMinor: act.estimatedCostMinor,
            locationName: act.locationName ?? null,
            lat: carriedCoord?.lat ?? null,
            lng: carriedCoord?.lng ?? null,
            coordSource: carriedCoord?.coordSource ?? 'unverified',
            compromiseExplanation: act.compromiseExplanation,
            matchedTravellers: act.matchedTravellers,
            included: act.included,
          },
        });
        const carriedVotes = prevVotesByStableKey.get(act.stableKey);
        if (carriedVotes && carriedVotes.length > 0) {
          await tx.vote.createMany({
            data: carriedVotes.map((v) => ({
              activityId: dbAct.id,
              userId: v.userId,
              direction: v.direction,
            })),
          });
        }
      }
    }

    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });

    return nextVersionNumber;
  });
}
