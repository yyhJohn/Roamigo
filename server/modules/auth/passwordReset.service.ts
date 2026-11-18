import type { PrismaClient } from '@prisma/client';
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
} from '../../../src/lib/contracts/auth.schemas.js';
import type { ServerConfig } from '../../config.js';
import {
  generateRandomToken,
  hashPassword,
  sha256Hex,
} from '../../lib/crypto.js';
import { badRequest, serviceUnavailable } from '../../lib/errors.js';
import { createSessionForUser, type IssuedSession } from './auth.service.js';

export async function requestPasswordReset(
  prisma: PrismaClient | undefined,
  config: ServerConfig,
  input: ForgotPasswordInput,
): Promise<{ message: string; devResetToken?: string; devResetUrl?: string }> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  const genericMessage =
    'If an account matches that email, password reset instructions have been prepared.';

  if (!user || user.deletedAt) {
    return { message: genericMessage };
  }

  const rawToken = generateRandomToken(24);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetTokenHash: sha256Hex(rawToken),
      passwordResetExpiresAt: expiresAt,
    },
  });

  if (config.nodeEnv !== 'production' && !config.smtpHost) {
    const origin = config.appOrigin || 'http://127.0.0.1:8080';
    return {
      message: genericMessage,
      devResetToken: rawToken,
      devResetUrl: `${origin}/auth/reset-password?token=${rawToken}`,
    };
  }
  return { message: genericMessage };
}

export async function resetPasswordWithToken(
  prisma: PrismaClient | undefined,
  config: ServerConfig,
  input: ResetPasswordInput,
  meta?: { ip?: string; userAgent?: string },
): Promise<IssuedSession> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const tokenHash = sha256Hex(input.token.trim());
  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: tokenHash },
  });

  if (
    !user ||
    user.deletedAt ||
    !user.passwordResetExpiresAt ||
    user.passwordResetExpiresAt.getTime() < Date.now()
  ) {
    throw badRequest('This password reset link is invalid or has expired.');
  }

  const passwordHash = await hashPassword(input.newPassword);
  const updated = await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId: user.id } });
    return tx.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });
  });

  return createSessionForUser(prisma, updated, config, meta);
}
