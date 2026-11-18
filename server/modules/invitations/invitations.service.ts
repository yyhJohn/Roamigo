import type { PrismaClient, Trip, TripRole, User } from '@prisma/client';
import type { ServerConfig } from '../../config.js';
import { generateRandomToken, sha256Hex } from '../../lib/crypto.js';
import { badRequest, notFound, serviceUnavailable } from '../../lib/errors.js';

export async function issueTripInvitation(
  prisma: PrismaClient | undefined,
  config: ServerConfig,
  inviter: User,
  trip: Trip,
  email: string,
  role: TripRole,
) {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  const rawToken = generateRandomToken(24);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invitation = await prisma.tripInvitation.create({
    data: {
      tripId: trip.id,
      email: normalizedEmail,
      role,
      tokenHash: sha256Hex(rawToken),
      invitedById: inviter.id,
      expiresAt,
    },
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    await prisma.notification.create({
      data: {
        userId: existingUser.id,
        tripId: trip.id,
        type: 'TRIP_INVITE',
        title: `Invited to ${trip.title}`,
        body: `${inviter.displayName} invited you as ${role}.`,
        linkUrl: `/invites/${rawToken}`,
      },
    });
  }

  const origin = config.appOrigin || 'http://127.0.0.1:8080';
  return {
    invitation: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt.toISOString(),
    },
    inviteToken: rawToken,
    inviteUrl: `${origin}/invites/${rawToken}`,
  };
}

export async function acceptInvitationToken(
  prisma: PrismaClient | undefined,
  user: User,
  rawToken: string,
): Promise<string> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  if (rawToken.length < 16) {
    throw notFound('Invitation not found.');
  }
  const inv = await prisma.tripInvitation.findUnique({
    where: { tokenHash: sha256Hex(rawToken) },
  });
  if (!inv || inv.status === 'REVOKED' || inv.status === 'DECLINED') {
    throw badRequest('This invitation is no longer active.');
  }
  if (inv.expiresAt.getTime() < Date.now()) {
    throw badRequest('This invitation has expired.');
  }

  await prisma.$transaction(async (tx) => {
    const existingMember = await tx.tripMember.findUnique({
      where: { tripId_userId: { tripId: inv.tripId, userId: user.id } },
    });
    const member =
      existingMember ??
      (await tx.tripMember.create({
        data: { tripId: inv.tripId, userId: user.id, role: inv.role },
      }));

    if (!existingMember) {
      await tx.travellerPreference.create({
        data: {
          tripId: inv.tripId,
          memberId: member.id,
          displayName: user.displayName,
          budgetMinor: 30000,
          interests: ['culture', 'food'],
        },
      });
    }

    await tx.tripInvitation.update({
      where: { id: inv.id },
      data: { status: 'ACCEPTED', respondedAt: new Date() },
    });
    await tx.trip.update({
      where: { id: inv.tripId },
      data: { version: { increment: 1 } },
    });
  });

  return inv.tripId;
}
