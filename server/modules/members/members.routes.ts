import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { UpdateMemberRoleSchema } from '../../../src/lib/contracts/trip.schemas.js';
import {
  badRequest,
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

export function createMembersRouter(prisma?: PrismaClient): Router {
  const router = Router();

  router.patch(
    '/trips/:tripId/members/:memberId',
    requireAuth,
    requireTripRole(prisma, ['OWNER']),
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Cannot modify roles on the public demo trip.');
      }
      const memberId = req.params.memberId;
      if (typeof memberId !== 'string') {
        throw notFound('Member not found.');
      }
      const { role } = UpdateMemberRoleSchema.parse(req.body);

      const target = await prisma.tripMember.findFirst({
        where: { id: memberId, tripId: access.trip.id },
      });
      if (!target) {
        throw notFound('Trip member not found.');
      }

      if (target.userId === auth.user.id && role !== 'OWNER') {
        throw badRequest(
          'Transfer ownership to another member before stepping down as Owner.',
        );
      }

      await prisma.$transaction(async (tx) => {
        if (role === 'OWNER' && target.userId !== auth.user.id) {
          await tx.tripMember.update({
            where: {
              tripId_userId: { tripId: access.trip.id, userId: auth.user.id },
            },
            data: { role: 'EDITOR' },
          });
          await tx.trip.update({
            where: { id: access.trip.id },
            data: { ownerId: target.userId, version: { increment: 1 } },
          });
        } else {
          await tx.trip.update({
            where: { id: access.trip.id },
            data: { version: { increment: 1 } },
          });
        }

        await tx.tripMember.update({
          where: { id: target.id },
          data: { role },
        });

        await tx.auditLog.create({
          data: {
            tripId: access.trip.id,
            actorUserId: auth.user.id,
            action: 'MEMBER_ROLE_CHANGED',
            targetType: 'TripMember',
            targetId: target.id,
            metadataJson: { newRole: role },
          },
        });
      });

      sendOk(res, { updated: true });
    }),
  );

  router.delete(
    '/trips/:tripId/members/:memberId',
    requireAuth,
    requireTripRole(prisma, ['OWNER', 'EDITOR', 'MEMBER', 'VIEWER']),
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const auth = getRequiredAuth(req);
      const access = getRequiredTripAccess(req);
      if (access.trip.isDemo) {
        throw forbidden('Cannot remove members from the public demo trip.');
      }
      const memberId = req.params.memberId;
      if (typeof memberId !== 'string') {
        throw notFound('Member not found.');
      }
      const target = await prisma.tripMember.findFirst({
        where: { id: memberId, tripId: access.trip.id },
      });
      if (!target) {
        throw notFound('Trip member not found.');
      }
      if (target.role === 'OWNER') {
        throw badRequest('Trip Owner cannot be removed without transferring ownership.');
      }
      const isSelf = target.userId === auth.user.id;
      if (!isSelf && access.role !== 'OWNER') {
        throw forbidden('Only the trip Owner can remove other members.');
      }

      await prisma.$transaction(async (tx) => {
        await tx.tripMember.delete({ where: { id: target.id } });
        await tx.trip.update({
          where: { id: access.trip.id },
          data: { version: { increment: 1 } },
        });
      });

      sendOk(res, { removed: true });
    }),
  );

  return router;
}
