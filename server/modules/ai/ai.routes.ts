import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import {
  ApplyAiProposalSchema,
  AssistPromptInputSchema,
} from '../../../src/lib/contracts/ai.schemas.js';
import type { ServerConfig } from '../../config.js';
import { forbidden } from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getRequiredAuth,
  getRequiredTripAccess,
  requireAuth,
  requireTripRole,
} from '../../middleware/auth.js';
import { createScopedRateLimiter } from '../../middleware/security.js';
import {
  applyConfirmedAiProposal,
  generateWorkspaceItineraryVersion,
  proposeWorkspaceAssistantDiff,
} from './ai.service.js';
import type { TravelAIProvider } from './ai.types.js';

export function createWorkspaceAiRouter(
  config: ServerConfig,
  aiProvider: TravelAIProvider,
  prisma?: PrismaClient,
  onTripChanged?: (tripId: string) => void,
): Router {
  const router = Router();
  const aiLimiter = createScopedRateLimiter(config, 15, 60_000);

  router.post(
    '/trips/:tripId/itinerary/generate',
    requireAuth,
    aiLimiter,
    requireTripRole(prisma, ['OWNER', 'EDITOR']),
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Clone the demo trip to generate a new AI itinerary.');
      }
      const out = await generateWorkspaceItineraryVersion(
        prisma,
        aiProvider,
        auth.user,
        access.trip.id,
      );
      onTripChanged?.(access.trip.id);
      sendOk(res, out);
    }),
  );

  router.post(
    '/trips/:tripId/ai/propose',
    requireAuth,
    aiLimiter,
    requireTripRole(prisma, ['OWNER', 'EDITOR', 'MEMBER']),
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Clone the demo trip to test AI modification proposals.');
      }
      const input = AssistPromptInputSchema.parse(req.body);
      const proposal = await proposeWorkspaceAssistantDiff(
        prisma,
        aiProvider,
        auth.user,
        access.trip.id,
        input.instruction,
        input.targetDayNumber,
      );
      sendOk(res, { proposal });
    }),
  );

  router.post(
    '/trips/:tripId/ai/apply',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR']),
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Clone the demo trip before applying itinerary changes.');
      }
      const input = ApplyAiProposalSchema.parse(req.body);
      const out = await applyConfirmedAiProposal(
        prisma,
        auth.user,
        access.trip.id,
        input.summary,
        input.days,
      );
      onTripChanged?.(access.trip.id);
      sendOk(res, out);
    }),
  );

  return router;
}
