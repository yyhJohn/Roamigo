import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import {
  ActivityDecisionSchema,
  CastVoteSchema,
} from '../../../src/lib/contracts/vote.schemas.js';
import { notFound } from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getRequiredAuth,
  requireAuth,
  requireTripRole,
} from '../../middleware/auth.js';
import {
  castAuthoritativeVote,
  retractAuthoritativeVote,
  setOrganiserDecision,
} from './votes.service.js';

export function createVotesRouter(
  prisma: PrismaClient | undefined,
  onTripChanged?: (tripId: string) => void,
): Router {
  const router = Router();
  const requireVoters = requireTripRole(prisma, ['OWNER', 'EDITOR', 'MEMBER']);
  const requireEditors = requireTripRole(prisma, ['OWNER', 'EDITOR']);

  router.put(
    '/trips/:tripId/activities/:activityId/vote',
    requireAuth,
    requireVoters,
    asyncHandler(async (req, res) => {
      const { tripId, activityId } = req.params;
      if (typeof tripId !== 'string' || typeof activityId !== 'string') {
        throw notFound('Activity not found.');
      }
      const auth = getRequiredAuth(req);
      const { direction } = CastVoteSchema.parse(req.body);
      await castAuthoritativeVote(
        prisma,
        tripId,
        activityId,
        auth.user.id,
        direction,
      );
      onTripChanged?.(tripId);
      sendOk(res, { voted: true, direction });
    }),
  );

  router.delete(
    '/trips/:tripId/activities/:activityId/vote',
    requireAuth,
    requireVoters,
    asyncHandler(async (req, res) => {
      const { tripId, activityId } = req.params;
      if (typeof tripId !== 'string' || typeof activityId !== 'string') {
        throw notFound('Activity not found.');
      }
      const auth = getRequiredAuth(req);
      await retractAuthoritativeVote(prisma, tripId, activityId, auth.user.id);
      onTripChanged?.(tripId);
      sendOk(res, { retracted: true });
    }),
  );

  router.patch(
    '/trips/:tripId/activities/:activityId/decision',
    requireAuth,
    requireEditors,
    asyncHandler(async (req, res) => {
      const { tripId, activityId } = req.params;
      if (typeof tripId !== 'string' || typeof activityId !== 'string') {
        throw notFound('Activity not found.');
      }
      const { decisionStatus } = ActivityDecisionSchema.parse(req.body);
      await setOrganiserDecision(prisma, tripId, activityId, decisionStatus);
      onTripChanged?.(tripId);
      sendOk(res, { decisionStatus });
    }),
  );

  return router;
}
