import type { Currency, ItineraryDay, Traveller } from './schemas';

export interface TravellerBudgetStatus {
  travellerId: string;
  travellerName: string;
  budget: number;
  estimatedCostPerPerson: number;
  remaining: number;
  isExceeded: boolean;
  overageAmount: number;
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

export function formatCurrencyEstimate(
  amount: number,
  currency: Currency,
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const rounded = Math.round(amount * 100) / 100;
  const formatted = Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(2);
  return `${symbol}${formatted}`;
}

export function calculateEstimatedCostPerPerson(days: ItineraryDay[]): number {
  let total = 0;
  for (const day of days) {
    for (const activity of day.activities) {
      if (activity.included) {
        total += activity.estimatedCostPerPerson;
      }
    }
  }
  return Math.round(total * 100) / 100;
}

export function countIncludedActivities(days: ItineraryDay[]): {
  included: number;
  total: number;
} {
  let included = 0;
  let total = 0;
  for (const day of days) {
    for (const activity of day.activities) {
      total += 1;
      if (activity.included) {
        included += 1;
      }
    }
  }
  return { included, total };
}

export function evaluateTravellerBudgets(
  travellers: Traveller[],
  estimatedCostPerPerson: number,
): TravellerBudgetStatus[] {
  return travellers.map((traveller) => {
    const remaining =
      Math.round((traveller.budget - estimatedCostPerPerson) * 100) / 100;
    const isExceeded = estimatedCostPerPerson > traveller.budget;
    const overageAmount = isExceeded
      ? Math.round((estimatedCostPerPerson - traveller.budget) * 100) / 100
      : 0;
    return {
      travellerId: traveller.id,
      travellerName: traveller.name,
      budget: traveller.budget,
      estimatedCostPerPerson,
      remaining,
      isExceeded,
      overageAmount,
    };
  });
}
