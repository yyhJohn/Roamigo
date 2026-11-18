import type { PrismaClient, Session, User } from '@prisma/client';
import type {
  LoginInput,
  RegisterInput,
} from '../../../src/lib/contracts/auth.schemas.js';
import type { ServerConfig } from '../../config.js';
import {
  generateRandomToken,
  hashPassword,
  sha256Hex,
  verifyPassword,
} from '../../lib/crypto.js';
import {
  conflict,
  serviceUnavailable,
  unauthenticated,
} from '../../lib/errors.js';

const AVATAR_PALETTE = [
  '#103D3B',
  '#0F766E',
  '#1D4ED8',
  '#7C3AED',
  '#B45309',
  '#BE123C',
] as const;

let dummyHashPromise: Promise<string> | undefined;
function getDummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword('roamigo-timing-equalizer-password-001');
  }
  return dummyHashPromise;
}

export interface IssuedSession {
  user: User;
  session: Session;
  rawSessionToken: string;
}

function buildExpiry(ttlDays = 14): Date {
  return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
}

export async function createSessionForUser(
  prisma: PrismaClient,
  user: User,
  config: ServerConfig,
  meta?: { ip?: string; userAgent?: string },
): Promise<IssuedSession> {
  const rawSessionToken = generateRandomToken(32);
  const csrfToken = generateRandomToken(24);
  const session = await prisma.session.create({
    data: {
      tokenHash: sha256Hex(rawSessionToken),
      csrfToken,
      userId: user.id,
      ipHash: meta?.ip ? sha256Hex(meta.ip) : null,
      userAgent: meta?.userAgent ? meta.userAgent.slice(0, 200) : null,
      expiresAt: buildExpiry(config.sessionTtlDays),
    },
  });
  return { user, session, rawSessionToken };
}

export async function registerUser(
  prisma: PrismaClient | undefined,
  config: ServerConfig,
  input: RegisterInput,
  meta?: { ip?: string; userAgent?: string },
): Promise<IssuedSession & { devVerifyToken?: string }> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing && !existing.deletedAt) {
    throw conflict('An account with this email address already exists.');
  }

  const passwordHash = await hashPassword(input.password);
  const rawVerifyToken = generateRandomToken(24);
  const avatarColor =
    AVATAR_PALETTE[normalizedEmail.length % AVATAR_PALETTE.length] ?? '#103D3B';

  const user = await prisma.$transaction(async (tx) => {
    const created = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: {
            passwordHash,
            displayName: input.displayName.trim(),
            preferredCurrency: input.preferredCurrency,
            avatarColor,
            deletedAt: null,
            emailVerifiedAt: null,
            emailVerifyTokenHash: sha256Hex(rawVerifyToken),
          },
        })
      : await tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            displayName: input.displayName.trim(),
            preferredCurrency: input.preferredCurrency,
            avatarColor,
            emailVerifyTokenHash: sha256Hex(rawVerifyToken),
          },
        });

    await tx.auditLog.create({
      data: {
        actorUserId: created.id,
        action: 'USER_REGISTERED',
        targetType: 'User',
        targetId: created.id,
      },
    });
    return created;
  });

  const issued = await createSessionForUser(prisma, user, config, meta);
  return {
    ...issued,
    ...(config.nodeEnv !== 'production'
      ? { devVerifyToken: rawVerifyToken }
      : {}),
  };
}

export async function loginUser(
  prisma: PrismaClient | undefined,
  config: ServerConfig,
  input: LoginInput,
  meta?: { ip?: string; userAgent?: string },
): Promise<IssuedSession> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || user.deletedAt || !user.passwordHash) {
    const dummyHash = await getDummyPasswordHash();
    await verifyPassword(input.password, dummyHash);
    throw unauthenticated('Invalid email or password.');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw unauthenticated('Invalid email or password.');
  }

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: 'USER_LOGGED_IN',
      targetType: 'User',
      targetId: user.id,
    },
  });

  return createSessionForUser(prisma, user, config, meta);
}
