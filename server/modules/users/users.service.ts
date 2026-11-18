import type { PrismaClient, User } from '@prisma/client';
import type { UpdateProfileInput } from '../../../src/lib/contracts/user.schemas.js';
import { forbidden, serviceUnavailable } from '../../lib/errors.js';

export async function updateUserProfile(
  prisma: PrismaClient | undefined,
  user: User,
  input: UpdateProfileInput,
): Promise<User> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  return prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: input.displayName,
      avatarColor: input.avatarColor,
      preferredCurrency: input.preferredCurrency,
      preferredLanguage: input.preferredLanguage,
      themePreference: input.themePreference,
      privacyShareEmail: input.privacyShareEmail,
    },
  });
}

export async function deleteOrAnonymizeUserAccount(
  prisma: PrismaClient | undefined,
  user: User,
): Promise<void> {
  if (!prisma) {
    throw serviceUnavailable('Database is not configured.');
  }
  if (user.isDemo) {
    throw forbidden('System demo accounts cannot be deleted.');
  }

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { userId: user.id } });
    await tx.notification.deleteMany({ where: { userId: user.id } });
    await tx.tripInvitation.deleteMany({
      where: { OR: [{ email: user.email }, { invitedById: user.id }] },
    });
    await tx.vote.deleteMany({ where: { userId: user.id } });

    // Remove non-demo trips owned by this user (cascades their private itineraries/expenses)
    await tx.trip.deleteMany({
      where: { ownerId: user.id, isDemo: false },
    });

    // Check if user participated in shared accounting on another organiser's trip
    const sharedRefs = await Promise.all([
      tx.expense.count({ where: { paidByUserId: user.id } }),
      tx.expenseSplit.count({ where: { userId: user.id } }),
      tx.settlement.count({
        where: { OR: [{ fromUserId: user.id }, { toUserId: user.id }] },
      }),
    ]);
    const hasSharedAccounting = sharedRefs.some((count) => count > 0);

    if (!hasSharedAccounting) {
      await tx.tripMember.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
      return;
    }

    // Preserve collaborator ledger balance integrity while scrubbing all PII
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: `deleted-${user.id}@anonymized.roamigo.invalid`,
        displayName: 'Deleted Traveller',
        passwordHash: null,
        googleId: null,
        emailVerifyTokenHash: null,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        privacyShareEmail: false,
        deletedAt: new Date(),
      },
    });
  });
}
