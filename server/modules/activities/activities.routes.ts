import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import {
  CreateActivitySchema,
  CreateManualDaySchema,
  ReorderActivitySchema,
  UpdateActivitySchema,
} from '../../../src/lib/contracts/activity.schemas.js';
import { notFound } from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getRequiredAuth,
  requireAuth,
  requireTripRole,
} from '../../middleware/auth.js';
import { reorderManualActivity } from './activities.reorder.js';
import {
  createManualActivity,
  deleteAndReorderActivities,
  updateManualActivity,
} from './activities.service.js';
import { addManualDay } from './days.service.js';

export function createActivitiesRouter(
  prisma: PrismaClient | undefined,
  onTripChanged?: (tripId: string) => void,
): Router {
  const router = Router();
  const requireEditors = requireTripRole(prisma, ['OWNER', 'EDITOR']);

  router.post(
    '/trips/:tripId/days',
    requireAuth,
    requireEditors,
    asyncHandler(async (req, res) => {
      const tripId = req.params.tripId;
      if (typeof tripId !== 'string') throw notFound('Trip not found.');
      const auth = getRequiredAuth(req);
      const data = CreateManualDaySchema.parse(req.body);
      const out = await addManualDay(prisma, auth.user, tripId, data);
      onTripChanged?.(tripId);
      sendOk(res, out, 201);
    }),
  );

  router.post(
    '/trips/:tripId/activities',
    requireAuth,
    requireEditors,
    asyncHandler(async (req, res) => {
      const tripId = req.params.tripId;
      if (typeof tripId !== 'string') throw notFound('Trip not found.');
      const data = CreateActivitySchema.parse(req.body);
      const out = await createManualActivity(prisma, tripId, data);
      onTripChanged?.(tripId);
      sendOk(res, out, 201);
    }),
  );

  router.post(
    '/trips/:tripId/activities/reorder',
    requireAuth,
    requireEditors,
    asyncHandler(async (req, res) => {
      const tripId = req.params.tripId;
      if (typeof tripId !== 'string') throw notFound('Trip not found.');
      const data = ReorderActivitySchema.parse(req.body);
      await reorderManualActivity(prisma, tripId, data);
      onTripChanged?.(tripId);
      sendOk(res, { reordered: true });
    }),
  );

  router.patch(
    '/trips/:tripId/activities/:activityId',
    requireAuth,
    requireEditors,
    asyncHandler(async (req, res) => {
      const { tripId, activityId } = req.params;
      if (typeof tripId !== 'string' || typeof activityId !== 'string') {
        throw notFound('Activity not found.');
      }
      const data = UpdateActivitySchema.parse(req.body);
      await updateManualActivity(prisma, tripId, activityId, data);
      onTripChanged?.(tripId);
      sendOk(res, { updated: true });
    }),
  );

  router.delete(
    '/trips/:tripId/activities/:activityId',
    requireAuth,
    requireEditors,
    asyncHandler(async (req, res) => {
      const { tripId, activityId } = req.params;
      if (typeof tripId !== 'string' || typeof activityId !== 'string') {
        throw notFound('Activity not found.');
      }
      await deleteAndReorderActivities(prisma, tripId, activityId);
      onTripChanged?.(tripId);
      sendOk(res, { deleted: true });
    }),
  );

  return router;
}
