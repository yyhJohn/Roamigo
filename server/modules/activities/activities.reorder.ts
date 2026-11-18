import type { PrismaClient } from '@prisma/client';
import type { ReorderActivityInput } from '../../../src/lib/contracts/activity.schemas.js';
import {
  badRequest,
  forbidden,
  notFound,
  serviceUnavailable,
} from '../../lib/errors.js';

export async function reorderManualActivity(
  prisma: PrismaClient | undefined,
  tripId: string,
  input: ReorderActivityInput,
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');

  await prisma.$transaction(async (tx) => {
    const act = await tx.activity.findUnique({
      where: { id: input.activityId },
      include: {
        day: {
          include: {
            version: { include: { itinerary: { include: { trip: true } } } },
          },
        },
      },
    });
    if (!act || act.day.version.itinerary.tripId !== tripId) {
      throw notFound('Activity not found.');
    }
    if (act.day.version.itinerary.trip.isDemo) {
      throw forbidden('Clone the demo trip before reordering activities.');
    }

    const sourceDayId = act.dayId;
    const destDayId = input.targetDayId ?? sourceDayId;

    if (destDayId !== sourceDayId) {
      const destDay = await tx.itineraryDay.findUnique({
        where: { id: destDayId },
      });
      if (!destDay || destDay.versionId !== act.day.versionId) {
        throw badRequest('Target day must belong to the same itinerary version.');
      }

      const sourceSiblings = await tx.activity.findMany({
        where: { dayId: sourceDayId, id: { not: act.id } },
        orderBy: { sortOrder: 'asc' },
      });
      for (const [idx, s] of sourceSiblings.entries()) {
        await tx.activity.update({ where: { id: s.id }, data: { sortOrder: idx } });
      }

      const destSiblings = await tx.activity.findMany({
        where: { dayId: destDayId },
        orderBy: { sortOrder: 'asc' },
      });
      const insertAt = Math.max(
        0,
        Math.min(input.targetIndex ?? destSiblings.length, destSiblings.length),
      );
      const nextList = [
        ...destSiblings.slice(0, insertAt).map((x) => x.id),
        act.id,
        ...destSiblings.slice(insertAt).map((x) => x.id),
      ];
      for (const [idx, id] of nextList.entries()) {
        await tx.activity.update({
          where: { id },
          data: { dayId: destDayId, sortOrder: idx },
        });
      }
    } else {
      const siblings = await tx.activity.findMany({
        where: { dayId: sourceDayId },
        orderBy: { sortOrder: 'asc' },
      });
      const currentIdx = siblings.findIndex((s) => s.id === act.id);
      if (currentIdx === -1) return;

      let nextIdx = currentIdx;
      if (input.direction === 'UP') {
        nextIdx = Math.max(0, currentIdx - 1);
      } else if (input.direction === 'DOWN') {
        nextIdx = Math.min(siblings.length - 1, currentIdx + 1);
      } else if (typeof input.targetIndex === 'number') {
        nextIdx = Math.max(0, Math.min(input.targetIndex, siblings.length - 1));
      }

      if (nextIdx !== currentIdx) {
        const ids = siblings.map((s) => s.id);
        ids.splice(currentIdx, 1);
        ids.splice(nextIdx, 0, act.id);
        for (const [idx, id] of ids.entries()) {
          await tx.activity.update({ where: { id }, data: { sortOrder: idx } });
        }
      }
    }

    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}
