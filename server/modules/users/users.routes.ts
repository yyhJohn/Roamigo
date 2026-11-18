import type { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import {
  DeleteAccountSchema,
  UpdateProfileSchema,
} from '../../../src/lib/contracts/user.schemas.js';
import type { ServerConfig } from '../../config.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getRequiredAuth,
  requireAuth,
  SESSION_COOKIE_NAME,
  toAuthUserDto,
} from '../../middleware/auth.js';
import {
  deleteOrAnonymizeUserAccount,
  updateUserProfile,
} from './users.service.js';

export function createUsersRouter(
  config: ServerConfig,
  prisma?: PrismaClient,
): Router {
  const router = Router();

  router.patch(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      const input = UpdateProfileSchema.parse(req.body);
      const updated = await updateUserProfile(prisma, auth.user, input);
      sendOk(res, { user: toAuthUserDto(updated) });
    }),
  );

  router.delete(
    '/me',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getRequiredAuth(req);
      DeleteAccountSchema.parse(req.body);
      await deleteOrAnonymizeUserAccount(prisma, auth.user);
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.nodeEnv === 'production',
        path: '/',
      });
      sendOk(res, { deleted: true });
    }),
  );

  return router;
}
