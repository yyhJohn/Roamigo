import type { Currency } from '../schemas.js';
import { assertSafeMinorInt } from './money.js';

export interface LedgerExpenseRecord {
  paidByUserId: string;
  amountMinor: number;
  currency: Currency;
  splits: readonly { userId: string; shareMinor: number }[];
}

export interface PaidSettlementRecord {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
}

export interface MemberNetBalance {
  userId: string;
  paidMinor: number;
  owedMinor: number;
  settledAdjustmentMinor: number;
  netMinor: number;
}

export interface SuggestedTransfer {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
}

export function assertSingleTripCurrency(
  tripCurrency: Currency,
  expenses: readonly { currency: Currency }[],
): void {
  for (const exp of expenses) {
    if (exp.currency !== tripCurrency) {
      throw new Error(
        `Currency mismatch: trip uses ${tripCurrency} but expense used ${exp.currency}.`,
      );
    }
  }
}

export function computeMemberNetBalances(
  memberUserIds: readonly string[],
  tripCurrency: Currency,
  expenses: readonly LedgerExpenseRecord[],
  paidSettlements: readonly PaidSettlementRecord[] = [],
): MemberNetBalance[] {
  assertSingleTripCurrency(tripCurrency, expenses);
  const map = new Map<string, MemberNetBalance>();

  function ensure(userId: string): MemberNetBalance {
    const existing = map.get(userId);
    if (existing) return existing;
    const fresh: MemberNetBalance = {
      userId,
      paidMinor: 0,
      owedMinor: 0,
      settledAdjustmentMinor: 0,
      netMinor: 0,
    };
    map.set(userId, fresh);
    return fresh;
  }

  for (const id of memberUserIds) ensure(id);

  for (const exp of expenses) {
    assertSafeMinorInt(exp.amountMinor, 'expense.amountMinor');
    const payer = ensure(exp.paidByUserId);
    payer.paidMinor += exp.amountMinor;
    for (const sp of exp.splits) {
      assertSafeMinorInt(sp.shareMinor, 'split.shareMinor');
      const participant = ensure(sp.userId);
      participant.owedMinor += sp.shareMinor;
    }
  }

  for (const paid of paidSettlements) {
    if (paid.currency !== tripCurrency) {
      throw new Error('Settlement currency does not match trip currency.');
    }
    assertSafeMinorInt(paid.amountMinor, 'settlement.amountMinor');
    const sender = ensure(paid.fromUserId);
    const receiver = ensure(paid.toUserId);
    sender.settledAdjustmentMinor += paid.amountMinor;
    receiver.settledAdjustmentMinor -= paid.amountMinor;
  }

  for (const item of map.values()) {
    item.netMinor =
      item.paidMinor - item.owedMinor + item.settledAdjustmentMinor;
  }

  return Array.from(map.values());
}

export function computeMinimalSettlements(
  memberUserIds: readonly string[],
  tripCurrency: Currency,
  expenses: readonly LedgerExpenseRecord[],
  paidSettlements: readonly PaidSettlementRecord[] = [],
): SuggestedTransfer[] {
  const balances = computeMemberNetBalances(
    memberUserIds,
    tripCurrency,
    expenses,
    paidSettlements,
  );

  const creditors = balances
    .filter((b) => b.netMinor > 0)
    .map((b) => ({ userId: b.userId, remaining: b.netMinor }))
    .sort((a, b) =>
      b.remaining !== a.remaining
        ? b.remaining - a.remaining
        : a.userId.localeCompare(b.userId),
    );

  const debtors = balances
    .filter((b) => b.netMinor < 0)
    .map((b) => ({ userId: b.userId, remaining: -b.netMinor }))
    .sort((a, b) =>
      b.remaining !== a.remaining
        ? b.remaining - a.remaining
        : a.userId.localeCompare(b.userId),
    );

  const transfers: SuggestedTransfer[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const cred = creditors[cIdx]!;
    const debt = debtors[dIdx]!;
    const transferMinor = Math.min(cred.remaining, debt.remaining);
    if (transferMinor > 0) {
      transfers.push({
        fromUserId: debt.userId,
        toUserId: cred.userId,
        amountMinor: transferMinor,
      });
    }
    cred.remaining -= transferMinor;
    debt.remaining -= transferMinor;
    if (cred.remaining === 0) cIdx += 1;
    if (debt.remaining === 0) dIdx += 1;
  }

  return transfers;
}
