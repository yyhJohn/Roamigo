import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import {
  UpdateTripMetaSchema,
  UpsertPreferenceSchema,
  WizardTripPayloadSchema,
} from '../../../src/lib/contracts/trip.schemas.js';
import { forbidden, notFound, serviceUnavailable } from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getRequiredAuth,
  getRequiredTripAccess,
  requireAuth,
  requireTripRole,
} from '../../middleware/auth.js';
import { cloneExistingTrip } from './cloneTrip.service.js';
import { importLocalTripToAccount } from './importLocal.service.js';
import { mapTripDetail, TRIP_DETAIL_INCLUDE } from './trips.mapper.js';
import { listTripsForUser, saveWizardTrip } from './trips.service.js';

export function createTripsRouter(prisma?: PrismaClient): Router {
  const router = Router();

  router.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const trips = await listTripsForUser(prisma, auth.user.id, {
        filter: typeof req.query.filter === 'string' ? req.query.filter : 'all',
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
        sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
      });
      sendOk(res, { trips });
    }),
  );

  router.post(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const input = WizardTripPayloadSchema.parse(req.body);
      const tripId = await saveWizardTrip(prisma, auth.user, input);
      sendOk(res, { tripId }, 201);
    }),
  );

  router.post(
    '/import-local',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const tripId = await importLocalTripToAccount(prisma, auth.user, req.body);
      sendOk(res, { tripId }, 201);
    }),
  );

  router.get(
    '/:tripId',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR', 'MEMBER', 'VIEWER']),
    asyncHandler(async (req, res) => {
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
      sendOk(
        res,
        mapTripDetail(loaded, auth.user.id, access.role, access.isDemoReadOnly),
      );
    }),
  );

  router.put(
    '/:tripId/wizard',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR']),
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Clone the demo trip to edit it.');
      }
      const input = WizardTripPayloadSchema.parse(req.body);
      const tripId = await saveWizardTrip(
        prisma,
        auth.user,
        input,
        access.trip.id,
      );
      sendOk(res, { tripId });
    }),
  );

  router.patch(
    '/:tripId',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR']),
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Demo trip is read-only. Clone it to customize.');
      }
      const patch = UpdateTripMetaSchema.parse(req.body);
      await prisma.trip.update({
        where: { id: access.trip.id },
        data: { ...patch, version: { increment: 1 } },
      });
      sendOk(res, { updated: true });
    }),
  );

  router.post(
    '/:tripId/archive',
    requireAuth,
    requireTripRole(prisma, ['OWNER']),
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Cannot archive the public demo trip.');
      }
      await prisma.trip.update({
        where: { id: access.trip.id },
        data: { status: 'ARCHIVED', version: { increment: 1 } },
      });
      sendOk(res, { archived: true });
    }),
  );

  router.post(
    '/:tripId/clone',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const srcId = req.params.tripId;
      if (typeof srcId !== 'string') {
        throw notFound('Trip not found.');
      }
      const tripId = await cloneExistingTrip(prisma, auth.user, srcId);
      sendOk(res, { tripId }, 201);
    }),
  );

  router.delete(
    '/:tripId',
    requireAuth,
    requireTripRole(prisma, ['OWNER']),
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Cannot delete the public demo trip.');
      }
      await prisma.trip.delete({ where: { id: access.trip.id } });
      sendOk(res, { deleted: true });
    }),
  );

  router.put(
    '/:tripId/preferences/me',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR', 'MEMBER']),
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Clone the demo trip to customize preferences.');
      }
      const input = UpsertPreferenceSchema.parse(req.body);
      const member = await prisma.tripMember.findUniqueOrThrow({
        where: {
          tripId_userId: { tripId: access.trip.id, userId: auth.user.id },
        },
      });
      const pref = await prisma.travellerPreference.upsert({
        where: { memberId: member.id },
        update: input,
        create: { ...input, tripId: access.trip.id, memberId: member.id },
      });
      sendOk(res, { preferenceId: pref.id });
    }),
  );

  return router;
}
