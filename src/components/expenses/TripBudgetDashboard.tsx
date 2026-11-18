import { useState } from 'react';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import {
  formatMinorCurrency,
  fromMinorUnits,
  toMinorUnits,
} from '../../lib/domain/money';
import { useUpdateBudgetMutation } from '../../lib/useExpenses';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/ToastProvider';
import { AddExpenseCard } from './AddExpenseCard';
import { BudgetAnalyticsCharts } from './BudgetAnalyticsCharts';
import { ExpensesAndSettlementsList } from './ExpensesAndSettlementsList';

export function TripBudgetDashboard({
  detail,
  canEditBudget,
  canLogExpense,
}: {
  detail: TripDetailDto;
  canEditBudget: boolean;
  canLogExpense: boolean;
}) {
  const { summary, budget, expenses, members } = detail;
  const updateBudgetMut = useUpdateBudgetMutation(summary.id);
  const { pushToast } = useToast();

  const [sharedCapInput, setSharedCapInput] = useState(
    budget?.sharedCapMinor != null
      ? String(fromMinorUnits(budget.sharedCapMinor))
      : '',
  );

  const memberCount = Math.max(1, members.length);
  const plannedGroupEstMinor = summary.estimatedPerPersonMinor * memberCount;
  const actualTotalMinor = expenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const sharedCapMinor = budget?.sharedCapMinor ?? null;
  const remainingMinor =
    sharedCapMinor !== null ? sharedCapMinor - actualTotalMinor : null;

  async function handleSaveBudget(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = sharedCapInput.trim();
    const capMinor = trimmed ? toMinorUnits(Number(trimmed)) : null;
    await updateBudgetMut.mutateAsync({
      sharedCapMinor: capMinor,
      accommodationEstMinor: budget?.accommodationEstMinor ?? 0,
      transportEstMinor: budget?.transportEstMinor ?? 0,
      foodCapMinor: budget?.foodCapMinor ?? null,
      activitiesCapMinor: budget?.activitiesCapMinor ?? null,
      notes: budget?.notes ?? '',
    });
    pushToast('Updated shared group budget cap.', 'success');
  }

  return (
    <div className="space-y-5" data-testid="trip-budget-dashboard">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Shared Group Budget Cap
          </p>
          <p className="mt-1 font-display text-lg font-extrabold">
            {sharedCapMinor !== null
              ? formatMinorCurrency(sharedCapMinor, summary.currency)
              : 'No cap set'}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Planned Itinerary Total ({memberCount}p)
          </p>
          <p className="mt-1 font-display text-lg font-extrabold">
            {formatMinorCurrency(plannedGroupEstMinor, summary.currency, {
              est: true,
            })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Actual Logged Expenses
          </p>
          <p
            data-testid="actual-logged-total"
            className="mt-1 font-display text-lg font-extrabold text-[var(--brand-primary)]"
          >
            {formatMinorCurrency(actualTotalMinor, summary.currency)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Remaining Shared Budget
          </p>
          <p
            className={`mt-1 font-display text-lg font-extrabold ${
              remainingMinor !== null && remainingMinor < 0
                ? 'text-[var(--status-danger)]'
                : ''
            }`}
          >
            {remainingMinor !== null
              ? formatMinorCurrency(remainingMinor, summary.currency)
              : '—'}
          </p>
        </Card>
      </div>

      {canEditBudget && (
        <Card className="p-4">
          <form
            onSubmit={(e) => void handleSaveBudget(e)}
            className="flex flex-wrap items-center gap-3 text-xs"
          >
            <label className="font-semibold">
              Update Shared Group Cap ({summary.currency}):
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              data-testid="shared-cap-input"
              value={sharedCapInput}
              onChange={(e) => setSharedCapInput(e.target.value)}
              placeholder="e.g. 1200.00"
              className="w-40 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-1.5"
            />
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              data-testid="save-shared-cap-btn"
              disabled={updateBudgetMut.isPending}
            >
              Save Cap
            </Button>
          </form>
        </Card>
      )}

      <BudgetAnalyticsCharts detail={detail} />
      <AddExpenseCard detail={detail} canLogExpense={canLogExpense} />
      <ExpensesAndSettlementsList detail={detail} canMutate={canLogExpense} />
    </div>
  );
}
