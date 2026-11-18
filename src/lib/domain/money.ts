import type { Currency } from '../schemas.js';

const SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

export function assertSafeMinorInt(value: number, label = 'amountMinor'): void {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be a safe integer in minor units (received ${value}).`);
  }
}

export function toMinorUnits(majorAmount: number): number {
  if (!Number.isFinite(majorAmount)) {
    throw new Error('Monetary input must be a finite number.');
  }
  const minor = Math.round(majorAmount * 100);
  assertSafeMinorInt(minor);
  return minor;
}

export function fromMinorUnits(minorAmount: number): number {
  assertSafeMinorInt(minorAmount);
  return minorAmount / 100;
}

export function formatMinorCurrency(
  minorAmount: number,
  currency: Currency,
  options?: { est?: boolean; compactWhole?: boolean },
): string {
  assertSafeMinorInt(minorAmount);
  const negative = minorAmount < 0;
  const absMinor = Math.abs(minorAmount);
  const symbol = SYMBOLS[currency];
  const whole = Math.floor(absMinor / 100);
  const cents = absMinor % 100;
  const digits =
    options?.compactWhole && cents === 0
      ? whole.toLocaleString('en-GB')
      : `${whole.toLocaleString('en-GB')}.${cents.toString().padStart(2, '0')}`;
  const suffix = options?.est ? ' est.' : '';
  return `${negative ? '-' : ''}${symbol}${digits}${suffix}`;
}
