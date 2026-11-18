import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { CreateInvitationSchema } from '../../../src/lib/contracts/trip.schemas.js';
import type { ServerConfig } from '../../config.js';
import { sha256Hex } from '../../lib/crypto.js';
import {
  forbidden,
  notFound,
  serviceUnavailable,
} from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getRequiredAuth,
  getRequiredTripAccess,
  requireAuth,
  requireTripRole,
} from '../../middleware/auth.js';
import {
  acceptInvitationToken,
  issueTripInvitation,
} from './invitations.service.js';

export function createInvitationsRouter(
  config: ServerConfig,
  prisma?: PrismaClient,
  onTripChanged?: (tripId: string) => void,
): Router {
  const router = Router();

  router.post(
    '/trips/:tripId/invitations',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR']),
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Clone the demo trip before inviting collaborators.');
      }
      const input = CreateInvitationSchema.parse(req.body);
      const issued = await issueTripInvitation(
        prisma,
        config,
        auth.user,
        access.trip,
        input.email,
        input.role,
      );
      sendOk(res, issued, 201);
    }),
  );

  router.delete(
    '/trips/:tripId/invitations/:invitationId',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR']),
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const access = getRequiredTripAccess(req);
      const invitationId = req.params.invitationId;
      if (typeof invitationId !== 'string') {
        throw notFound('Invitation not found.');
      }
      await prisma.tripInvitation.updateMany({
        where: { id: invitationId, tripId: access.trip.id },
        data: { status: 'REVOKED' },
      });
      sendOk(res, { revoked: true });
    }),
  );

  router.get(
    '/invitations/:token',
    requireAuth,
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const rawToken = req.params.token;
      if (typeof rawToken !== 'string' || rawToken.length < 16) {
        throw notFound('Invitation not found.');
      }
      const inv = await prisma.tripInvitation.findUnique({
        where: { tokenHash: sha256Hex(rawToken) },
        include: { trip: true, invitedBy: true },
      });
      if (!inv) {
        throw notFound('Invitation link is invalid or was revoked.');
      }
      const expired = inv.expiresAt.getTime() < Date.now();
      sendOk(res, {
        id: inv.id,
        tripId: inv.tripId,
        tripTitle: inv.trip.title,
        destinations: inv.trip.destinations,
        startDate: inv.trip.startDate,
        endDate: inv.trip.endDate,
        role: inv.role,
        invitedByName: inv.invitedBy.displayName,
        status: expired && inv.status === 'PENDING' ? 'EXPIRED' : inv.status,
      });
    }),
  );

  router.post(
    '/invitations/:token/accept',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const rawToken = req.params.token;
      if (typeof rawToken !== 'string') {
        throw notFound('Invitation not found.');
      }
      const tripId = await acceptInvitationToken(prisma, auth.user, rawToken);
      onTripChanged?.(tripId);
      sendOk(res, { tripId });
    }),
  );

  router.post(
    '/invitations/:token/decline',
    requireAuth,
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const rawToken = req.params.token;
      if (typeof rawToken !== 'string' || rawToken.length < 16) {
        throw notFound('Invitation not found.');
      }
      await prisma.tripInvitation.updateMany({
        where: { tokenHash: sha256Hex(rawToken), status: 'PENDING' },
        data: { status: 'DECLINED', respondedAt: new Date() },
      });
      sendOk(res, { declined: true });
    }),
  );

  return router;
}
