import { ArrowUpRight, Wallet } from 'lucide-react';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { formatMinorCurrency } from '../../lib/domain/money';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function WorkspaceBudgetQuickCard({
  detail,
  onOpenFullDashboard,
}: {
  detail: TripDetailDto;
  onOpenFullDashboard?: () => void;
}) {
  const { summary, budget, expenses, settlements } = detail;
  const totalLoggedMinor = expenses.reduce((sum, e) => sum + e.amountMinor, 0);
  const unsettledCount = settlements.filter(
    (s) => s.status === 'SUGGESTED',
  ).length;

  return (
    <Card className="space-y-3 p-4" data-testid="workspace-budget-quick-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[var(--brand-primary)]" />
          <h3 className="font-display text-sm font-bold">Budget & Spend</h3>
        </div>
        <Badge variant="mint">{summary.currency}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2.5">
          <p className="text-[11px] text-[var(--text-secondary)]">
            Planned / Person
          </p>
          <p className="mt-1 font-display text-sm font-extrabold">
            {formatMinorCurrency(
              summary.estimatedPerPersonMinor,
              summary.currency,
              { est: true },
            )}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2.5">
          <p className="text-[11px] text-[var(--text-secondary)]">
            Actual Logged Total
          </p>
          <p className="mt-1 font-display text-sm font-extrabold">
            {formatMinorCurrency(totalLoggedMinor, summary.currency)}
          </p>
        </div>
      </div>

      {budget?.sharedCapMinor != null && (
        <p className="text-xs text-[var(--text-secondary)]">
          Shared group cap:{' '}
          <strong>
            {formatMinorCurrency(budget.sharedCapMinor, summary.currency)}
          </strong>
        </p>
      )}

      <div className="rounded-lg bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-secondary)]">
        {expenses.length} logged expense(s) · {unsettledCount} open settlement
        transfer(s).
      </div>

      {onOpenFullDashboard && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full"
          data-testid="open-full-expenses-btn"
          onClick={onOpenFullDashboard}
        >
          Open Full Expense Splits & Charts
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </Card>
  );
}
