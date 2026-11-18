import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import type {
  CreateActivityInput,
  UpdateActivityInput,
} from '../../../src/lib/contracts/activity.schemas.js';
import { forbidden, notFound, serviceUnavailable } from '../../lib/errors.js';
import { matchCuratedLandmark } from '../maps/landmarks.js';

function resolveCoordinates(
  input: {
    locationName?: string | null;
    title?: string;
    lat?: number | null;
    lng?: number | null;
    coordSource?: 'curated' | 'nominatim' | 'manual' | 'unverified';
  },
  destinations: string[],
): { lat: number | null; lng: number | null; coordSource: string } {
  if (typeof input.lat === 'number' && typeof input.lng === 'number') {
    return {
      lat: input.lat,
      lng: input.lng,
      coordSource: input.coordSource ?? 'manual',
    };
  }
  const matched =
    matchCuratedLandmark(input.locationName, destinations) ??
    matchCuratedLandmark(input.title, destinations);
  if (matched) {
    return { lat: matched.lat, lng: matched.lng, coordSource: 'curated' };
  }
  return { lat: null, lng: null, coordSource: 'unverified' };
}

export async function createManualActivity(
  prisma: PrismaClient | undefined,
  tripId: string,
  input: CreateActivityInput,
): Promise<{ activityId: string }> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  return prisma.$transaction(async (tx) => {
    const day = await tx.itineraryDay.findUnique({
      where: { id: input.dayId },
      include: {
        activities: { orderBy: { sortOrder: 'asc' } },
        version: { include: { itinerary: { include: { trip: true } } } },
      },
    });
    if (!day || day.version.itinerary.tripId !== tripId) {
      throw notFound('Target itinerary day not found for this trip.');
    }
    if (day.version.itinerary.trip.isDemo) {
      throw forbidden('Clone the demo trip before editing activities.');
    }

    const coords = resolveCoordinates(
      input,
      day.version.itinerary.trip.destinations,
    );
    const created = await tx.activity.create({
      data: {
        dayId: day.id,
        stableKey: `manual-${crypto.randomBytes(5).toString('hex')}`,
        sortOrder: day.activities.length,
        title: input.title,
        description: input.description,
        category: input.category,
        timeSlot: input.timeSlot,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        estimatedCostMinor: input.estimatedCostMinor,
        locationName: input.locationName ?? null,
        lat: coords.lat,
        lng: coords.lng,
        coordSource: coords.coordSource,
        compromiseExplanation: 'Added directly in workspace.',
        matchedTravellers: [],
        included: input.included,
      },
    });

    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
    return { activityId: created.id };
  });
}

export async function updateManualActivity(
  prisma: PrismaClient | undefined,
  tripId: string,
  activityId: string,
  input: UpdateActivityInput,
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  await prisma.$transaction(async (tx) => {
    const existing = await tx.activity.findUnique({
      where: { id: activityId },
      include: {
        day: {
          include: {
            version: { include: { itinerary: { include: { trip: true } } } },
          },
        },
      },
    });
    if (!existing || existing.day.version.itinerary.tripId !== tripId) {
      throw notFound('Activity not found.');
    }
    if (existing.day.version.itinerary.trip.isDemo) {
      throw forbidden('Clone the demo trip before editing activities.');
    }

    let coordPatch: { lat?: number | null; lng?: number | null; coordSource?: string } = {};
    if (input.lat !== undefined || input.lng !== undefined) {
      coordPatch = {
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        coordSource:
          input.lat != null && input.lng != null
            ? (input.coordSource ?? 'manual')
            : 'unverified',
      };
    } else if (
      input.locationName !== undefined &&
      input.locationName !== existing.locationName
    ) {
      coordPatch = resolveCoordinates(
        { locationName: input.locationName, title: input.title ?? existing.title },
        existing.day.version.itinerary.trip.destinations,
      );
    }

    await tx.activity.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.timeSlot !== undefined ? { timeSlot: input.timeSlot } : {}),
        ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
        ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
        ...(input.estimatedCostMinor !== undefined
          ? { estimatedCostMinor: input.estimatedCostMinor }
          : {}),
        ...(input.locationName !== undefined
          ? { locationName: input.locationName }
          : {}),
        ...(input.included !== undefined ? { included: input.included } : {}),
        ...coordPatch,
      },
    });

    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}

export async function deleteAndReorderActivities(
  prisma: PrismaClient | undefined,
  tripId: string,
  activityId: string,
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  await prisma.$transaction(async (tx) => {
    const existing = await tx.activity.findUnique({
      where: { id: activityId },
      include: {
        day: {
          include: {
            version: { include: { itinerary: { include: { trip: true } } } },
          },
        },
      },
    });
    if (!existing || existing.day.version.itinerary.tripId !== tripId) {
      throw notFound('Activity not found.');
    }
    if (existing.day.version.itinerary.trip.isDemo) {
      throw forbidden('Clone the demo trip before deleting activities.');
    }

    await tx.activity.delete({ where: { id: existing.id } });
    const remaining = await tx.activity.findMany({
      where: { dayId: existing.dayId },
      orderBy: { sortOrder: 'asc' },
    });
    for (const [idx, act] of remaining.entries()) {
      if (act.sortOrder !== idx) {
        await tx.activity.update({ where: { id: act.id }, data: { sortOrder: idx } });
      }
    }
    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}
