import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import type { PlaceCandidateDto } from '../../../src/lib/contracts/activity.schemas.js';
import type { ServerConfig } from '../../config.js';
import { notFound, serviceUnavailable } from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import { requireAuth, requireTripRole } from '../../middleware/auth.js';
import { searchCuratedLandmarks } from './landmarks.js';

interface NominatimHit {
  display_name?: string;
  lat?: string;
  lon?: string;
}

async function queryNominatim(
  query: string,
  userAgent: string,
): Promise<PlaceCandidateDto[]> {
  if (!query.trim()) return [];
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '4');
  url.searchParams.set('q', query.trim());

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3500),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];
    const out: PlaceCandidateDto[] = [];
    for (const item of data as NominatimHit[]) {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (
        item.display_name &&
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        const parts = item.display_name.split(',').map((s) => s.trim());
        out.push({
          name: parts.slice(0, 2).join(', '),
          city: parts[2] ?? parts[1] ?? '',
          lat,
          lng,
          coordSource: 'nominatim',
        });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export function createMapsRouter(
  config: ServerConfig,
  prisma: PrismaClient | undefined,
): Router {
  const router = Router();

  router.get(
    '/trips/:tripId/maps/search',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR', 'MEMBER', 'VIEWER']),
    asyncHandler(async (req, res) => {
      if (!prisma) throw serviceUnavailable('Database is not configured.');
      const tripId = req.params.tripId;
      if (typeof tripId !== 'string') throw notFound('Trip not found.');

      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: { destinations: true },
      });
      if (!trip) throw notFound('Trip not found.');

      const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 120) : '';
      const curated = searchCuratedLandmarks(q, trip.destinations);

      let external: PlaceCandidateDto[] = [];
      if (
        config.geocodingProvider?.toLowerCase() === 'nominatim' &&
        q.trim().length >= 3 &&
        curated.length < 3
      ) {
        const contextualQuery =
          trip.destinations.length > 0
            ? `${q.trim()}, ${trip.destinations[0]}`
            : q.trim();
        external = await queryNominatim(
          contextualQuery,
          config.geocodingUserAgent || 'Roamigo/1.0',
        );
      }

      sendOk(res, {
        provider: config.geocodingProvider || 'curated',
        places: [...curated, ...external],
      });
    }),
  );

  return router;
}
