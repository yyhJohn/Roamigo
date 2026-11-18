import { assertSafeMinorInt } from './money.js';

export class SplitValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SplitValidationError';
  }
}

export interface ComputedSplitShare {
  userId: string;
  shareMinor: number;
  basisPoints: number | null;
}

export function computeEqualSplits(
  amountMinor: number,
  participantUserIds: readonly string[],
): ComputedSplitShare[] {
  assertSafeMinorInt(amountMinor, 'amountMinor');
  if (amountMinor <= 0) {
    throw new SplitValidationError('Expense amount must be greater than zero.');
  }
  const uniqueIds = Array.from(new Set(participantUserIds));
  if (uniqueIds.length === 0) {
    throw new SplitValidationError('Select at least one participant for split.');
  }

  const n = uniqueIds.length;
  const baseShare = Math.floor(amountMinor / n);
  const remainder = amountMinor % n;

  // Deterministic lexicographical tie-breaker so remainder pennies never drift
  const sortedForRemainder = [...uniqueIds].sort((a, b) => a.localeCompare(b));
  const bonusSet = new Set(sortedForRemainder.slice(0, remainder));

  return uniqueIds.map((userId) => ({
    userId,
    shareMinor: baseShare + (bonusSet.has(userId) ? 1 : 0),
    basisPoints: null,
  }));
}

export function computeCustomSplits(
  amountMinor: number,
  entries: readonly { userId: string; shareMinor: number }[],
): ComputedSplitShare[] {
  assertSafeMinorInt(amountMinor, 'amountMinor');
  if (amountMinor <= 0) {
    throw new SplitValidationError('Expense amount must be greater than zero.');
  }
  if (entries.length === 0) {
    throw new SplitValidationError('Provide at least one custom split share.');
  }

  const seen = new Set<string>();
  let sum = 0;
  const out: ComputedSplitShare[] = [];

  for (const entry of entries) {
    assertSafeMinorInt(entry.shareMinor, 'shareMinor');
    if (entry.shareMinor < 0) {
      throw new SplitValidationError('Individual split shares cannot be negative.');
    }
    if (seen.has(entry.userId)) {
      throw new SplitValidationError('Duplicate participant in custom splits.');
    }
    seen.add(entry.userId);
    sum += entry.shareMinor;
    if (entry.shareMinor > 0) {
      out.push({
        userId: entry.userId,
        shareMinor: entry.shareMinor,
        basisPoints: null,
      });
    }
  }

  if (sum !== amountMinor) {
    throw new SplitValidationError(
      `Custom splits sum (${sum}) must equal exact expense total (${amountMinor}) in minor units.`,
    );
  }
  return out;
}

export function computePercentageSplits(
  amountMinor: number,
  entries: readonly { userId: string; basisPoints: number }[],
): ComputedSplitShare[] {
  assertSafeMinorInt(amountMinor, 'amountMinor');
  if (amountMinor <= 0) {
    throw new SplitValidationError('Expense amount must be greater than zero.');
  }
  if (entries.length === 0) {
    throw new SplitValidationError('Provide percentage shares summing to 100%.');
  }

  const seen = new Set<string>();
  let totalBp = 0;
  for (const entry of entries) {
    assertSafeMinorInt(entry.basisPoints, 'basisPoints');
    if (entry.basisPoints < 0 || entry.basisPoints > 10_000) {
      throw new SplitValidationError('Basis points must be between 0 and 10000.');
    }
    if (seen.has(entry.userId)) {
      throw new SplitValidationError('Duplicate participant in percentage splits.');
    }
    seen.add(entry.userId);
    totalBp += entry.basisPoints;
  }

  if (totalBp !== 10_000) {
    throw new SplitValidationError(
      `Percentage splits must total 10000 basis points (100.00%); received ${totalBp}.`,
    );
  }

  // Hamilton / Largest Remainder method using BigInt to avoid overflow
  const amountBig = BigInt(amountMinor);
  const provisional = entries
    .filter((e) => e.basisPoints > 0)
    .map((e) => {
      const prod = amountBig * BigInt(e.basisPoints);
      const floorVal = Number(prod / 10_000n);
      const remVal = Number(prod % 10_000n);
      return {
        userId: e.userId,
        basisPoints: e.basisPoints,
        shareMinor: floorVal,
        remainder: remVal,
      };
    });

  const allocated = provisional.reduce((acc, p) => acc + p.shareMinor, 0);
  const leftover = amountMinor - allocated;

  const ranked = [...provisional].sort((a, b) =>
    b.remainder !== a.remainder
      ? b.remainder - a.remainder
      : a.userId.localeCompare(b.userId),
  );
  for (let i = 0; i < leftover; i += 1) {
    ranked[i]!.shareMinor += 1;
  }

  return provisional.map((p) => ({
    userId: p.userId,
    shareMinor: p.shareMinor,
    basisPoints: p.basisPoints,
  }));
}
