import { formatCurrencyEstimate, type TravellerBudgetStatus } from '../lib/budget';
import type { Currency } from '../lib/schemas';

interface BudgetSummaryBarProps {
  currency: Currency;
  estimatedCostPerPerson: number;
  includedCount: number;
  totalCount: number;
  budgetStatuses: TravellerBudgetStatus[];
  hasItinerary: boolean;
}

export function BudgetSummaryBar({
  currency,
  estimatedCostPerPerson,
  includedCount,
  totalCount,
  budgetStatuses,
  hasItinerary,
}: BudgetSummaryBarProps) {
  const exceeded = budgetStatuses.filter((b) => b.isExceeded);

  return (
    <section
      aria-label="Group budget summary"
      aria-live="polite"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Estimated Cost / Person
            </p>
            <p
              data-testid="estimated-cost-per-person"
              className="text-2xl font-bold text-slate-900"
            >
              {hasItinerary
                ? `${formatCurrencyEstimate(estimatedCostPerPerson, currency)} est.`
                : '—'}
            </p>
          </div>

          {hasItinerary && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Included Activities
              </p>
              <p
                data-testid="included-activities-count"
                className="text-lg font-semibold text-slate-800"
              >
                {includedCount} / {totalCount}
              </p>
            </div>
          )}
        </div>

        <div>
          {budgetStatuses.length === 0 ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Add travellers to track budgets
            </span>
          ) : exceeded.length > 0 ? (
            <div
              role="alert"
              data-testid="budget-warning-banner"
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
            >
              <span className="font-semibold">
                {exceeded.length}{' '}
                {exceeded.length === 1 ? 'traveller is' : 'travellers are'} over
                budget:
              </span>{' '}
              {exceeded
                .map(
                  (e) =>
                    `${e.travellerName} (+${formatCurrencyEstimate(e.overageAmount, currency)} est.)`,
                )
                .join(', ')}
            </div>
          ) : (
            <span
              data-testid="budget-ok-badge"
              className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
            >
              All {budgetStatuses.length}{' '}
              {budgetStatuses.length === 1 ? 'traveller' : 'travellers'} within
              budget
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
