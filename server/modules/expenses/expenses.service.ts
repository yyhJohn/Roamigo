import type { Currency, Prisma, PrismaClient } from '@prisma/client';
import type {
  CreateExpenseInput,
  UpdateBudgetInput,
} from '../../../src/lib/contracts/expense.schemas.js';
import { computeMinimalSettlements } from '../../../src/lib/domain/settlements.js';
import {
  computeCustomSplits,
  computeEqualSplits,
  computePercentageSplits,
  SplitValidationError,
} from '../../../src/lib/domain/splits.js';
import {
  badRequest,
  forbidden,
  notFound,
  serviceUnavailable,
} from '../../lib/errors.js';

async function recomputeTripSettlementsTx(
  tx: Prisma.TransactionClient,
  tripId: string,
  currency: Currency,
): Promise<void> {
  const [members, expenses, paidSettlements] = await Promise.all([
    tx.tripMember.findMany({ where: { tripId }, select: { userId: true } }),
    tx.expense.findMany({
      where: { tripId },
      include: { splits: true },
    }),
    tx.settlement.findMany({
      where: { tripId, status: 'MARKED_PAID' },
    }),
  ]);

  const suggested = computeMinimalSettlements(
    members.map((m) => m.userId),
    currency,
    expenses.map((e) => ({
      paidByUserId: e.paidByUserId,
      amountMinor: e.amountMinor,
      currency: e.currency,
      splits: e.splits.map((s) => ({
        userId: s.userId,
        shareMinor: s.shareMinor,
      })),
    })),
    paidSettlements.map((s) => ({
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amountMinor: s.amountMinor,
      currency: s.currency,
    })),
  );

  await tx.settlement.deleteMany({
    where: { tripId, status: 'SUGGESTED' },
  });

  if (suggested.length > 0) {
    await tx.settlement.createMany({
      data: suggested.map((t) => ({
        tripId,
        fromUserId: t.fromUserId,
        toUserId: t.toUserId,
        amountMinor: t.amountMinor,
        currency,
        status: 'SUGGESTED',
      })),
    });
  }
}

export async function upsertTripBudget(
  prisma: PrismaClient | undefined,
  tripId: string,
  input: UpdateBudgetInput,
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw notFound('Trip not found.');
  if (trip.isDemo) {
    throw forbidden('Clone the demo trip before updating shared budgets.');
  }

  await prisma.$transaction([
    prisma.budget.upsert({
      where: { tripId },
      create: {
        tripId,
        sharedCapMinor: input.sharedCapMinor,
        accommodationEstMinor: input.accommodationEstMinor,
        transportEstMinor: input.transportEstMinor,
        foodCapMinor: input.foodCapMinor ?? null,
        activitiesCapMinor: input.activitiesCapMinor ?? null,
        notes: input.notes,
      },
      update: {
        sharedCapMinor: input.sharedCapMinor,
        accommodationEstMinor: input.accommodationEstMinor,
        transportEstMinor: input.transportEstMinor,
        foodCapMinor: input.foodCapMinor ?? null,
        activitiesCapMinor: input.activitiesCapMinor ?? null,
        notes: input.notes,
      },
    }),
    prisma.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    }),
  ]);
}

export async function createTripExpense(
  prisma: PrismaClient | undefined,
  tripId: string,
  input: CreateExpenseInput,
): Promise<{ expenseId: string }> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');

  return prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });
    if (!trip) throw notFound('Trip not found.');
    if (trip.isDemo) {
      throw forbidden('Clone the demo trip before logging expenses.');
    }
    if (input.currency && input.currency !== trip.currency) {
      throw badRequest(
        `Single-currency trip invariant: expense currency (${input.currency}) must match trip currency (${trip.currency}).`,
      );
    }

    const memberIds = new Set(trip.members.map((m) => m.userId));
    if (!memberIds.has(input.paidByUserId)) {
      throw badRequest('Payer must be an active member of this trip.');
    }

    let computedSplits;
    try {
      if (input.splitMode === 'EQUAL') {
        const participants =
          input.participantUserIds && input.participantUserIds.length > 0
            ? input.participantUserIds
            : Array.from(memberIds);
        computedSplits = computeEqualSplits(input.amountMinor, participants);
      } else if (input.splitMode === 'CUSTOM') {
        computedSplits = computeCustomSplits(
          input.amountMinor,
          input.customSplits ?? [],
        );
      } else {
        computedSplits = computePercentageSplits(
          input.amountMinor,
          input.percentageSplits ?? [],
        );
      }
    } catch (err) {
      if (err instanceof SplitValidationError) {
        throw badRequest(err.message);
      }
      throw err;
    }

    for (const sp of computedSplits) {
      if (!memberIds.has(sp.userId)) {
        throw badRequest('Every split participant must belong to this trip.');
      }
    }

    const created = await tx.expense.create({
      data: {
        tripId,
        paidByUserId: input.paidByUserId,
        category: input.category,
        title: input.title,
        amountMinor: input.amountMinor,
        currency: trip.currency,
        splitMode: input.splitMode,
        incurredOn: input.incurredOn,
        notes: input.notes,
        splits: {
          create: computedSplits.map((sp) => ({
            userId: sp.userId,
            shareMinor: sp.shareMinor,
            basisPoints: sp.basisPoints,
          })),
        },
      },
    });

    await recomputeTripSettlementsTx(tx, tripId, trip.currency);
    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
    return { expenseId: created.id };
  });
}

export { recomputeTripSettlementsTx };
