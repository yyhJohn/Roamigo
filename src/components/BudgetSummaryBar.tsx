import { formatCurrencyEstimate, type TravellerBudgetStatus } from '../lib/budget';
import type { Currency } from '../lib/schemas';
import { Badge } from './ui/Badge';

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
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Estimated Cost / Person
            </p>
            <p
              data-testid="estimated-cost-per-person"
              className="font-display tabular-nums text-2xl font-extrabold text-[var(--text-primary)]"
            >
              {hasItinerary
                ? `${formatCurrencyEstimate(estimatedCostPerPerson, currency)} est.`
                : '—'}
            </p>
          </div>

          {hasItinerary && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Included Activities
              </p>
              <p
                data-testid="included-activities-count"
                className="tabular-nums text-lg font-bold text-[var(--text-primary)]"
              >
                {includedCount} / {totalCount}
              </p>
            </div>
          )}
        </div>

        <div>
          {budgetStatuses.length === 0 ? (
            <Badge variant="default">Add travellers to track budgets</Badge>
          ) : exceeded.length > 0 ? (
            <div
              role="alert"
              data-testid="budget-warning-banner"
              className="rounded-lg border border-[var(--status-error)]/30 bg-[var(--status-error-bg)] px-3.5 py-2 text-xs font-medium text-[var(--status-error)]"
            >
              <span className="font-bold">
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
            <Badge
              data-testid="budget-ok-badge"
              variant="success"
              className="px-3 py-1.5"
            >
              All {budgetStatuses.length}{' '}
              {budgetStatuses.length === 1 ? 'traveller' : 'travellers'} within
              budget
            </Badge>
          )}
        </div>
      </div>
    </section>
  );
}
