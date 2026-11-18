import type { PrismaClient, User } from '@prisma/client';
import type { CreateManualDayInput } from '../../../src/lib/contracts/activity.schemas.js';
import { forbidden, notFound, serviceUnavailable } from '../../lib/errors.js';

export async function addManualDay(
  prisma: PrismaClient | undefined,
  user: User,
  tripId: string,
  input: CreateManualDayInput,
): Promise<{ dayId: string; dayNumber: number }> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: {
        itinerary: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              include: { days: { orderBy: { dayNumber: 'asc' } } },
            },
          },
        },
      },
    });
    if (!trip) throw notFound('Trip not found.');
    if (trip.isDemo) {
      throw forbidden('Clone the demo trip before adding days or activities.');
    }

    let itin = trip.itinerary;
    if (!itin) {
      itin = await tx.itinerary.create({
        data: {
          tripId: trip.id,
          chosenDestination: trip.destinations[0] ?? 'Destination',
        },
        include: { versions: { include: { days: true } } },
      });
    }

    let activeVersion =
      itin.versions.find((v) => v.id === itin?.activeVersionId) ??
      itin.versions[0];
    if (!activeVersion) {
      activeVersion = await tx.itineraryVersion.create({
        data: {
          itineraryId: itin.id,
          versionNumber: 1,
          overview: `Collaborative itinerary for ${itin.chosenDestination}.`,
          compromiseSummary: 'Manual workspace schedule.',
          source: 'MANUAL',
          createdById: user.id,
        },
        include: { days: true },
      });
      await tx.itinerary.update({
        where: { id: itin.id },
        data: { activeVersionId: activeVersion.id },
      });
    }

    const nextDayNumber =
      activeVersion.days.reduce((max, d) => Math.max(max, d.dayNumber), 0) + 1;
    const created = await tx.itineraryDay.create({
      data: {
        versionId: activeVersion.id,
        dayNumber: nextDayNumber,
        date: input.date,
        theme: input.theme,
      },
    });

    await tx.trip.update({
      where: { id: trip.id },
      data: { version: { increment: 1 } },
    });

    return { dayId: created.id, dayNumber: nextDayNumber };
  });
}
