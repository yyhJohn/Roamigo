import type { PrismaClient } from '@prisma/client';
import { Router, type Response } from 'express';
import {
  ForgotPasswordInputSchema,
  LoginInputSchema,
  RegisterInputSchema,
  ResetPasswordInputSchema,
  VerifyEmailInputSchema,
  type AuthSessionDto,
} from '../../../src/lib/contracts/auth.schemas.js';
import type { ServerConfig } from '../../config.js';
import { sha256Hex } from '../../lib/crypto.js';
import { badRequest, serviceUnavailable } from '../../lib/errors.js';
import { asyncHandler, sendOk } from '../../lib/http.js';
import {
  getOptionalAuth,
  requireAuth,
  SESSION_COOKIE_NAME,
  toAuthUserDto,
} from '../../middleware/auth.js';
import { createScopedRateLimiter } from '../../middleware/security.js';
import {
  loginUser,
  registerUser,
  type IssuedSession,
} from './auth.service.js';
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from './passwordReset.service.js';

function writeSessionCookie(
  res: Response,
  rawToken: string,
  config: ServerConfig,
): void {
  const maxAgeMs = (config.sessionTtlDays ?? 14) * 24 * 60 * 60 * 1000;
  res.cookie(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/',
    maxAge: maxAgeMs,
  });
}

function clearSessionCookie(res: Response, config: ServerConfig): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: '/',
  });
}

function toSessionResponse(
  issued: IssuedSession,
  config: ServerConfig,
): AuthSessionDto {
  return {
    authenticated: true,
    user: toAuthUserDto(issued.user),
    csrfToken: issued.session.csrfToken,
    oauthGoogleEnabled: Boolean(config.googleClientId),
    smtpEnabled: Boolean(config.smtpHost),
  };
}

export function createAuthRouter(
  config: ServerConfig,
  prisma?: PrismaClient,
): Router {
  const router = Router();
  const authLimiter = createScopedRateLimiter(config, 15, 60_000);

  router.get(
    '/me',
    asyncHandler(async (req, res) => {
      const auth = getOptionalAuth(req);
      const payload: AuthSessionDto = auth
        ? {
            authenticated: true,
            user: toAuthUserDto(auth.user),
            csrfToken: auth.session.csrfToken,
            oauthGoogleEnabled: Boolean(config.googleClientId),
            smtpEnabled: Boolean(config.smtpHost),
          }
        : {
            authenticated: false,
            user: null,
            csrfToken: null,
            oauthGoogleEnabled: Boolean(config.googleClientId),
            smtpEnabled: Boolean(config.smtpHost),
          };
      sendOk(res, payload);
    }),
  );

  router.post(
    '/register',
    authLimiter,
    asyncHandler(async (req, res) => {
      const input = RegisterInputSchema.parse(req.body);
      const issued = await registerUser(prisma, config, input, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      writeSessionCookie(res, issued.rawSessionToken, config);
      sendOk(
        res,
        {
          ...toSessionResponse(issued, config),
          ...(issued.devVerifyToken
            ? { devVerifyToken: issued.devVerifyToken }
            : {}),
        },
        201,
      );
    }),
  );

  router.post(
    '/login',
    authLimiter,
    asyncHandler(async (req, res) => {
      const input = LoginInputSchema.parse(req.body);
      const issued = await loginUser(prisma, config, input, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      writeSessionCookie(res, issued.rawSessionToken, config);
      sendOk(res, toSessionResponse(issued, config));
    }),
  );

  router.post(
    '/logout',
    requireAuth,
    asyncHandler(async (req, res) => {
      const auth = getOptionalAuth(req);
      if (auth && prisma) {
        await prisma.session
          .delete({ where: { id: auth.session.id } })
          .catch(() => undefined);
      }
      clearSessionCookie(res, config);
      sendOk(res, { loggedOut: true });
    }),
  );

  router.post(
    '/forgot-password',
    authLimiter,
    asyncHandler(async (req, res) => {
      const input = ForgotPasswordInputSchema.parse(req.body);
      const out = await requestPasswordReset(prisma, config, input);
      sendOk(res, out);
    }),
  );

  router.post(
    '/reset-password',
    authLimiter,
    asyncHandler(async (req, res) => {
      const input = ResetPasswordInputSchema.parse(req.body);
      const issued = await resetPasswordWithToken(prisma, config, input, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      writeSessionCookie(res, issued.rawSessionToken, config);
      sendOk(res, toSessionResponse(issued, config));
    }),
  );

  router.post(
    '/verify-email',
    authLimiter,
    asyncHandler(async (req, res) => {
      if (!prisma) {
        throw serviceUnavailable('Database is not configured.');
      }
      const { token } = VerifyEmailInputSchema.parse(req.body);
      const user = await prisma.user.findUnique({
        where: { emailVerifyTokenHash: sha256Hex(token) },
      });
      if (!user) {
        throw badRequest('Invalid or already-used verification token.');
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date(), emailVerifyTokenHash: null },
      });
      sendOk(res, { verified: true });
    }),
  );

  router.get('/google/status', (_req, res) => {
    sendOk(res, {
      enabled: Boolean(config.googleClientId),
      reason: config.googleClientId
        ? 'Google OAuth configured'
        : 'GOOGLE_CLIENT_ID is not configured on this server; use email & password sign-in.',
    });
  });

  return router;
}
