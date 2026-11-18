import type { PrismaClient } from '@prisma/client';
import { forbidden, notFound, serviceUnavailable } from '../../lib/errors.js';

async function verifyActivityBelongsToEditableTrip(
  prisma: PrismaClient,
  tripId: string,
  activityId: string,
) {
  const act = await prisma.activity.findUnique({
    where: { id: activityId },
    include: {
      day: {
        include: {
          version: { include: { itinerary: { include: { trip: true } } } },
        },
      },
    },
  });
  if (!act || act.day.version.itinerary.tripId !== tripId) {
    throw notFound('Activity not found on this trip.');
  }
  if (act.day.version.itinerary.trip.isDemo) {
    throw forbidden('Clone the demo trip before voting or locking decisions.');
  }
  return act;
}

export async function castAuthoritativeVote(
  prisma: PrismaClient | undefined,
  tripId: string,
  activityId: string,
  userId: string,
  direction: 'UP' | 'DOWN',
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  await verifyActivityBelongsToEditableTrip(prisma, tripId, activityId);

  await prisma.$transaction(async (tx) => {
    await tx.vote.upsert({
      where: {
        activityId_userId: { activityId, userId },
      },
      create: { activityId, userId, direction },
      update: { direction },
    });
    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}

export async function retractAuthoritativeVote(
  prisma: PrismaClient | undefined,
  tripId: string,
  activityId: string,
  userId: string,
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  await verifyActivityBelongsToEditableTrip(prisma, tripId, activityId);

  await prisma.$transaction(async (tx) => {
    await tx.vote.deleteMany({
      where: { activityId, userId },
    });
    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}

export async function setOrganiserDecision(
  prisma: PrismaClient | undefined,
  tripId: string,
  activityId: string,
  decisionStatus: 'PROPOSED' | 'LOCKED_IN' | 'EXCLUDED',
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  await verifyActivityBelongsToEditableTrip(prisma, tripId, activityId);

  await prisma.$transaction(async (tx) => {
    await tx.activity.update({
      where: { id: activityId },
      data: {
        decisionStatus,
        ...(decisionStatus === 'EXCLUDED' ? { included: false } : {}),
        ...(decisionStatus === 'LOCKED_IN' ? { included: true } : {}),
      },
    });
    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}
