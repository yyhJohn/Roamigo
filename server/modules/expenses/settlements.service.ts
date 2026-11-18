import type { PrismaClient, TripRole } from '@prisma/client';
import {
  forbidden,
  notFound,
  serviceUnavailable,
} from '../../lib/errors.js';
import { recomputeTripSettlementsTx } from './expenses.service.js';

export async function deleteTripExpense(
  prisma: PrismaClient | undefined,
  tripId: string,
  expenseId: string,
  callerUserId: string,
  callerRole: TripRole,
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.findUnique({
      where: { id: expenseId },
      include: { trip: true },
    });
    if (!exp || exp.tripId !== tripId) {
      throw notFound('Expense not found.');
    }
    if (exp.trip.isDemo) {
      throw forbidden('Clone the demo trip before modifying expenses.');
    }
    if (
      callerRole !== 'OWNER' &&
      callerRole !== 'EDITOR' &&
      exp.paidByUserId !== callerUserId
    ) {
      throw forbidden('Only organisers or the payer can delete an expense.');
    }

    await tx.expense.delete({ where: { id: exp.id } });
    await recomputeTripSettlementsTx(tx, tripId, exp.trip.currency);
    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}

export async function updateTripSettlementStatus(
  prisma: PrismaClient | undefined,
  tripId: string,
  settlementId: string,
  status: 'SUGGESTED' | 'MARKED_PAID',
): Promise<void> {
  if (!prisma) throw serviceUnavailable('Database is not configured.');
  await prisma.$transaction(async (tx) => {
    const existing = await tx.settlement.findUnique({
      where: { id: settlementId },
      include: { trip: true },
    });
    if (!existing || existing.tripId !== tripId) {
      throw notFound('Settlement transfer not found.');
    }
    if (existing.trip.isDemo) {
      throw forbidden('Clone the demo trip before updating settlements.');
    }

    await tx.settlement.update({
      where: { id: existing.id },
      data: {
        status,
        settledAt: status === 'MARKED_PAID' ? new Date() : null,
      },
    });

    await recomputeTripSettlementsTx(tx, tripId, existing.trip.currency);
    await tx.trip.update({
      where: { id: tripId },
      data: { version: { increment: 1 } },
    });
  });
}
