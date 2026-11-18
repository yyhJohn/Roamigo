import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import {
  serializeExpensesCsv,
  serializeItineraryIcs,
  slugifyFilename,
} from '../../../src/lib/domain/exports.js';
import { notFound, serviceUnavailable } from '../../lib/errors.js';
import { asyncHandler } from '../../lib/http.js';
import {
  getRequiredAuth,
  getRequiredTripAccess,
  requireAuth,
  requireTripRole,
} from '../../middleware/auth.js';
import { mapTripDetail, TRIP_DETAIL_INCLUDE } from '../trips/trips.mapper.js';

export function createExportsRouter(prisma?: PrismaClient): Router {
  const router = Router();
  const requireAnyMember = requireTripRole(prisma, [
    'OWNER',
    'EDITOR',
    'MEMBER',
    'VIEWER',
  ]);

  async function loadMappedDetail(req: Parameters<typeof getRequiredAuth>[0]) {
    if (!prisma) {
      throw serviceUnavailable('Database is not configured.');
    }
    const auth = getRequiredAuth(req);
    const access = getRequiredTripAccess(req);
    const loaded = await prisma.trip.findUnique({
      where: { id: access.trip.id },
      include: TRIP_DETAIL_INCLUDE,
    });
    if (!loaded) {
      throw notFound('Trip not found.');
    }
    return mapTripDetail(
      loaded,
      auth.user.id,
      access.role,
      access.isDemoReadOnly,
    );
  }

  router.get(
    '/trips/:tripId/export/json',
    requireAuth,
    requireAnyMember,
    asyncHandler(async (req, res) => {
      const detail = await loadMappedDetail(req);
      const slug = slugifyFilename(detail.summary.title);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${slug}-backup.json"`,
      );
      res.status(200).send(
        JSON.stringify(
          {
            schemaVersion: 'roamigo.export.v1',
            exportedAt: new Date().toISOString(),
            trip: detail,
          },
          null,
          2,
        ),
      );
    }),
  );

  router.get(
    '/trips/:tripId/export/ics',
    requireAuth,
    requireAnyMember,
    asyncHandler(async (req, res) => {
      const detail = await loadMappedDetail(req);
      const slug = slugifyFilename(detail.summary.title);
      const stamp = new Date()
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z');
      const ics = serializeItineraryIcs(detail, stamp);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${slug}-itinerary.ics"`,
      );
      res.status(200).send(ics);
    }),
  );

  router.get(
    '/trips/:tripId/export/csv',
    requireAuth,
    requireAnyMember,
    asyncHandler(async (req, res) => {
      const detail = await loadMappedDetail(req);
      const slug = slugifyFilename(detail.summary.title);
      const csv = serializeExpensesCsv(detail);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${slug}-expenses.csv"`,
      );
      res.status(200).send(csv);
    }),
  );

  return router;
}
