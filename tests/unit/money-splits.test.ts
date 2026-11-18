import { describe, expect, it } from 'vitest';
import {
  assertSafeMinorInt,
  formatMinorCurrency,
  fromMinorUnits,
  toMinorUnits,
} from '../../src/lib/domain/money';
import {
  assertSingleTripCurrency,
  computeMemberNetBalances,
  computeMinimalSettlements,
} from '../../src/lib/domain/settlements';
import {
  computeCustomSplits,
  computeEqualSplits,
  computePercentageSplits,
  SplitValidationError,
} from '../../src/lib/domain/splits';

describe('Milestone 8: Deterministic integer minor-unit money, splits & settlements', () => {
  it('converts and formats minor units strictly without floating-point drift', () => {
    expect(toMinorUnits(19.99)).toBe(1999);
    expect(toMinorUnits(0.1 + 0.2)).toBe(30);
    expect(fromMinorUnits(1999)).toBe(19.99);
    expect(formatMinorCurrency(3334, 'GBP')).toBe('£33.34');
    expect(formatMinorCurrency(12500, 'EUR', { est: true })).toBe('€125.00 est.');
    expect(formatMinorCurrency(-450, 'USD')).toBe('-$4.50');
    expect(() => assertSafeMinorInt(12.5)).toThrow(/safe integer/);
  });

  it('distributes remainder pennies deterministically in EQUAL splits (£100.00 / 3)', () => {
    const shares = computeEqualSplits(10_000, ['user-c', 'user-a', 'user-b']);
    expect(shares).toEqual([
      { userId: 'user-c', shareMinor: 3333, basisPoints: null },
      { userId: 'user-a', shareMinor: 3334, basisPoints: null },
      { userId: 'user-b', shareMinor: 3333, basisPoints: null },
    ]);
    const sum = shares.reduce((acc, s) => acc + s.shareMinor, 0);
    expect(sum).toBe(10_000);
  });

  it('validates CUSTOM splits sum to the exact minor-unit total', () => {
    expect(() =>
      computeCustomSplits(5000, [
        { userId: 'u1', shareMinor: 2500 },
        { userId: 'u2', shareMinor: 2499 },
      ]),
    ).toThrow(SplitValidationError);

    const valid = computeCustomSplits(5000, [
      { userId: 'u1', shareMinor: 3000 },
      { userId: 'u2', shareMinor: 2000 },
      { userId: 'u3', shareMinor: 0 },
    ]);
    expect(valid).toEqual([
      { userId: 'u1', shareMinor: 3000, basisPoints: null },
      { userId: 'u2', shareMinor: 2000, basisPoints: null },
    ]);
  });

  it('allocates PERCENTAGE splits via BigInt Hamilton largest remainder (10000 bp)', () => {
    expect(() =>
      computePercentageSplits(10_000, [
        { userId: 'u1', basisPoints: 5000 },
        { userId: 'u2', basisPoints: 4999 },
      ]),
    ).toThrow(SplitValidationError);

    const splits = computePercentageSplits(10_000, [
      { userId: 'u-b', basisPoints: 3333 },
      { userId: 'u-a', basisPoints: 3334 },
      { userId: 'u-c', basisPoints: 3333 },
    ]);
    const total = splits.reduce((acc, s) => acc + s.shareMinor, 0);
    expect(total).toBe(10_000);
    expect(splits.find((s) => s.userId === 'u-a')?.shareMinor).toBe(3334);
  });

  it('enforces single-currency invariant and simplifies circular/chain debts to minimal transfers', () => {
    expect(() =>
      assertSingleTripCurrency('GBP', [{ currency: 'GBP' }, { currency: 'EUR' }]),
    ).toThrow(/Currency mismatch/);

    // Alice pays £60 for Alice+Ben+Cara (each £20). Ben pays £30 for Ben+Cara (each £15).
    // Net: Alice = +60 - 20 = +40; Ben = +30 - 35 = -5; Cara = 0 - 35 = -35. Sum = 0.
    const members = ['alice', 'ben', 'cara'];
    const expenses = [
      {
        paidByUserId: 'alice',
        amountMinor: 6000,
        currency: 'GBP' as const,
        splits: [
          { userId: 'alice', shareMinor: 2000 },
          { userId: 'ben', shareMinor: 2000 },
          { userId: 'cara', shareMinor: 2000 },
        ],
      },
      {
        paidByUserId: 'ben',
        amountMinor: 3000,
        currency: 'GBP' as const,
        splits: [
          { userId: 'ben', shareMinor: 1500 },
          { userId: 'cara', shareMinor: 1500 },
        ],
      },
    ];

    const balances = computeMemberNetBalances(members, 'GBP', expenses);
    expect(balances.reduce((acc, b) => acc + b.netMinor, 0)).toBe(0);

    const transfers = computeMinimalSettlements(members, 'GBP', expenses);
    expect(transfers).toEqual([
      { fromUserId: 'cara', toUserId: 'alice', amountMinor: 3500 },
      { fromUserId: 'ben', toUserId: 'alice', amountMinor: 500 },
    ]);

    // Once Cara marks £35.00 paid to Alice, only Ben -> Alice (£5.00) remains!
    const afterCaraPaid = computeMinimalSettlements(members, 'GBP', expenses, [
      { fromUserId: 'cara', toUserId: 'alice', amountMinor: 3500, currency: 'GBP' },
    ]);
    expect(afterCaraPaid).toEqual([
      { fromUserId: 'ben', toUserId: 'alice', amountMinor: 500 },
    ]);
  });
});
