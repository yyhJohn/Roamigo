import crypto from 'node:crypto';
import type {
  PrismaClient,
  Session,
  Trip,
  TripRole,
  User,
} from '@prisma/client';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { AuthUserDto } from '../../src/lib/contracts/auth.schemas.js';
import { sha256Hex } from '../lib/crypto.js';
import {
  csrfInvalid,
  forbidden,
  notFound,
  unauthenticated,
} from '../lib/errors.js';

export const SESSION_COOKIE_NAME = 'roamigo_session';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface AuthContext {
  user: User;
  session: Session;
}

export interface TripAccessContext {
  trip: Trip;
  role: TripRole;
  isDemoReadOnly: boolean;
}

const requestAuthMap = new WeakMap<Request, AuthContext>();
const requestTripMap = new WeakMap<Request, TripAccessContext>();

export function setAuthContext(req: Request, ctx: AuthContext): void {
  requestAuthMap.set(req, ctx);
}

export function getOptionalAuth(req: Request): AuthContext | undefined {
  return requestAuthMap.get(req);
}

export function getRequiredAuth(req: Request): AuthContext {
  const ctx = requestAuthMap.get(req);
  if (!ctx) {
    throw unauthenticated();
  }
  return ctx;
}

export function getRequiredTripAccess(req: Request): TripAccessContext {
  const ctx = requestTripMap.get(req);
  if (!ctx) {
    throw forbidden();
  }
  return ctx;
}

export function toAuthUserDto(user: User): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    preferredCurrency: user.preferredCurrency,
    preferredLanguage: user.preferredLanguage,
    themePreference: user.themePreference,
    privacyShareEmail: user.privacyShareEmail,
    emailVerified: Boolean(user.emailVerifiedAt),
    isDemo: user.isDemo,
  };
}

export function verifyCsrfHeader(req: Request, expectedToken: string): boolean {
  const headerVal = req.headers['x-csrf-token'];
  if (typeof headerVal !== 'string' || headerVal.length === 0) {
    return false;
  }
  const actualBuf = Buffer.from(headerVal, 'utf8');
  const expectedBuf = Buffer.from(expectedToken, 'utf8');
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function createSessionHydrator(prisma?: PrismaClient): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!prisma) {
        next();
        return;
      }
      const rawCookie = req.cookies?.[SESSION_COOKIE_NAME];
      if (typeof rawCookie !== 'string' || rawCookie.length < 16) {
        next();
        return;
      }
      const tokenHash = sha256Hex(rawCookie);
      const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: true },
      });
      if (
        session &&
        session.expiresAt.getTime() > Date.now() &&
        !session.user.deletedAt
      ) {
        setAuthContext(req, { user: session.user, session });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const auth = getOptionalAuth(req);
  if (!auth) {
    next(unauthenticated());
    return;
  }
  if (
    MUTATING_METHODS.has(req.method) &&
    !verifyCsrfHeader(req, auth.session.csrfToken)
  ) {
    next(csrfInvalid());
    return;
  }
  next();
};

export function requireTripRole(
  prisma: PrismaClient | undefined,
  allowedRoles: readonly TripRole[],
  paramName = 'tripId',
): RequestHandler {
  return async (req, _res, next) => {
    try {
      if (!prisma) {
        throw forbidden('Database is not configured.');
      }
      const auth = getRequiredAuth(req);
      const tripId = req.params[paramName];
      if (typeof tripId !== 'string' || !tripId) {
        throw notFound('Trip not found.');
      }
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        include: {
          members: { where: { userId: auth.user.id } },
        },
      });
      if (!trip) {
        throw notFound('Trip not found.');
      }
      const member = trip.members[0];
      if (member) {
        if (!allowedRoles.includes(member.role)) {
          throw forbidden('Your role on this trip does not permit this action.');
        }
        requestTripMap.set(req, {
          trip,
          role: member.role,
          isDemoReadOnly: false,
        });
        next();
        return;
      }
      if (trip.isDemo && req.method === 'GET' && allowedRoles.includes('VIEWER')) {
        requestTripMap.set(req, {
          trip,
          role: 'VIEWER',
          isDemoReadOnly: true,
        });
        next();
        return;
      }
      // Return 403 without leaking internal metadata to non-members (IDOR defense)
      throw forbidden('You do not have access to this trip.');
    } catch (err) {
      next(err);
    }
  };
}
