import { ArrowRight, CheckCircle2, Trash2 } from 'lucide-react';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { formatMinorCurrency } from '../../lib/domain/money';
import { computeMemberNetBalances } from '../../lib/domain/settlements';
import {
  useDeleteExpenseMutation,
  useUpdateSettlementMutation,
} from '../../lib/useExpenses';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function ExpensesAndSettlementsList({
  detail,
  canMutate,
}: {
  detail: TripDetailDto;
  canMutate: boolean;
}) {
  const { summary, members, expenses, settlements } = detail;
  const deleteMut = useDeleteExpenseMutation(summary.id);
  const settleMut = useUpdateSettlementMutation(summary.id);

  const nameById = new Map(members.map((m) => [m.userId, m.displayName]));

  const netBalances = computeMemberNetBalances(
    members.map((m) => m.userId),
    summary.currency,
    expenses,
    settlements.filter((s) => s.status === 'MARKED_PAID'),
  );

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card
        className="space-y-3 p-4 lg:col-span-5"
        data-testid="settlements-card"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">
            Who Owes Whom (Minimum Transfers)
          </h3>
          <Badge variant="mint">{settlements.length}</Badge>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px]">
          {netBalances.map((b) => (
            <span
              key={b.userId}
              className={`rounded-full border px-2.5 py-0.5 font-semibold ${
                b.netMinor > 0
                  ? 'border-emerald-300 bg-[var(--status-success-bg)] text-[var(--status-success)]'
                  : b.netMinor < 0
                    ? 'border-amber-300 bg-[var(--status-warning-bg)] text-[var(--status-warning)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
              }`}
            >
              {nameById.get(b.userId) ?? 'Member'}:{' '}
              {b.netMinor >= 0 ? '+' : ''}
              {formatMinorCurrency(b.netMinor, summary.currency)}
            </span>
          ))}
        </div>

        {settlements.length === 0 ? (
          <p className="rounded-lg bg-[var(--bg-subtle)] p-3 text-xs text-[var(--text-secondary)]">
            All member balances are settled to 0!
          </p>
        ) : (
          <div className="space-y-2">
            {settlements.map((s) => {
              const isPaid = s.status === 'MARKED_PAID';
              return (
                <div
                  key={s.id}
                  data-testid={`settlement-row-${s.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2.5 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>{nameById.get(s.fromUserId) ?? 'Member'}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span>{nameById.get(s.toUserId) ?? 'Member'}</span>
                    <span className="ml-1 font-display font-extrabold text-[var(--brand-primary)]">
                      {formatMinorCurrency(s.amountMinor, s.currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isPaid ? 'success' : 'warning'}>
                      {isPaid ? 'Paid' : 'Suggested'}
                    </Badge>
                    {canMutate && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        data-testid={`toggle-settlement-${s.id}`}
                        onClick={() =>
                          void settleMut.mutateAsync({
                            settlementId: s.id,
                            status: isPaid ? 'SUGGESTED' : 'MARKED_PAID',
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isPaid ? 'Reopen' : 'Mark Paid'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card
        className="space-y-3 p-4 lg:col-span-7"
        data-testid="expenses-ledger-card"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">
            Shared Expense Ledger
          </h3>
          <Badge variant="outline">{expenses.length} items</Badge>
        </div>

        {expenses.length === 0 ? (
          <p className="rounded-lg bg-[var(--bg-subtle)] p-4 text-center text-xs text-[var(--text-secondary)]">
            No actual expenses logged yet. Estimated itinerary costs remain
            separate until real receipts are added.
          </p>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                data-testid={`expense-row-${exp.id}`}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="mint">{exp.category}</Badge>
                      <Badge variant="outline">{exp.splitMode}</Badge>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        {exp.incurredOn} · Paid by{' '}
                        <strong>
                          {nameById.get(exp.paidByUserId) ?? 'Member'}
                        </strong>
                      </span>
                    </div>
                    <p className="mt-1 font-bold">{exp.title}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-extrabold">
                      {formatMinorCurrency(exp.amountMinor, exp.currency)}
                    </span>
                    {canMutate && (
                      <button
                        type="button"
                        aria-label={`Delete ${exp.title}`}
                        data-testid={`delete-expense-${exp.id}`}
                        onClick={() => void deleteMut.mutateAsync(exp.id)}
                        className="rounded p-1 text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-[var(--text-secondary)]">
                  {exp.splits.map((sp) => (
                    <span
                      key={sp.userId}
                      className="rounded bg-[var(--bg-subtle)] px-2 py-0.5"
                    >
                      {nameById.get(sp.userId) ?? 'Member'}:{' '}
                      {formatMinorCurrency(sp.shareMinor, exp.currency)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
