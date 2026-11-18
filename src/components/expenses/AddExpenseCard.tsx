import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ApiClientError } from '../../lib/apiClient';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { toMinorUnits } from '../../lib/domain/money';
import { useCreateExpenseMutation } from '../../lib/useExpenses';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/ToastProvider';
import { ExpenseSplitInputs } from './ExpenseSplitInputs';

const CATEGORIES = [
  'FOOD', 'ACCOMMODATION', 'TRANSPORT', 'ACTIVITIES', 'TICKETS', 'SHARED', 'OTHER',
] as const;

export function AddExpenseCard({
  detail,
  canLogExpense,
}: {
  detail: TripDetailDto;
  canLogExpense: boolean;
}) {
  const { summary, members } = detail;
  const createMut = useCreateExpenseMutation(summary.id);
  const { pushToast } = useToast();

  const [title, setTitle] = useState('');
  const [majorAmount, setMajorAmount] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('FOOD');
  const [paidByUserId, setPaidByUserId] = useState(members[0]?.userId ?? '');
  const [incurredOn, setIncurredOn] = useState(summary.startDate);
  const [splitMode, setSplitMode] = useState<'EQUAL' | 'CUSTOM' | 'PERCENTAGE'>('EQUAL');
  const [selectedIds, setSelectedIds] = useState<string[]>(members.map((m) => m.userId));
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [percentShares, setPercentShares] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  if (!canLogExpense) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedMajor = Number(majorAmount);
    if (!Number.isFinite(parsedMajor) || parsedMajor <= 0) {
      setError('Enter an expense amount greater than 0.');
      return;
    }
    const amountMinor = toMinorUnits(parsedMajor);

    try {
      await createMut.mutateAsync({
        paidByUserId: paidByUserId || members[0]!.userId,
        category,
        title: title.trim(),
        amountMinor,
        splitMode,
        incurredOn,
        notes: '',
        ...(splitMode === 'EQUAL' ? { participantUserIds: selectedIds } : {}),
        ...(splitMode === 'CUSTOM'
          ? { customSplits: members.map((m) => ({ userId: m.userId, shareMinor: toMinorUnits(Number(customShares[m.userId] || '0')) })) }
          : {}),
        ...(splitMode === 'PERCENTAGE'
          ? { percentageSplits: members.map((m) => ({ userId: m.userId, basisPoints: Math.round(Number(percentShares[m.userId] || '0') * 100) })) }
          : {}),
      });
      setTitle('');
      setMajorAmount('');
      pushToast('Expense logged and settlements updated!', 'success');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save expense split.');
    }
  }

  return (
    <Card className="space-y-3 p-4" data-testid="add-expense-card">
      <h3 className="font-display text-sm font-bold">Log Shared Expense</h3>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 text-xs">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            required
            minLength={2}
            data-testid="expense-title-input"
            placeholder="e.g. Tapas dinner at El Born"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 lg:col-span-2"
          />
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            data-testid="expense-amount-input"
            placeholder={`Amount (${summary.currency})`}
            value={majorAmount}
            onChange={(e) => setMajorAmount(e.target.value)}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
          />
          <select
            aria-label="Expense category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof CATEGORIES)[number])
            }
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-2"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            aria-label="Expense date"
            value={incurredOn}
            onChange={(e) => setIncurredOn(e.target.value)}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-2"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="font-semibold">Paid by:</label>
            <select
              aria-label="Paid by member"
              data-testid="expense-payer-select"
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName}
                </option>
              ))}
            </select>

            <label className="ml-2 font-semibold">Split:</label>
            {(['EQUAL', 'CUSTOM', 'PERCENTAGE'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                data-testid={`split-mode-${mode}`}
                onClick={() => setSplitMode(mode)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  splitMode === mode
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'bg-[var(--bg-subtle)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            type="submit"
            size="sm"
            data-testid="submit-expense-btn"
            disabled={createMut.isPending}
          >
            <Plus className="h-3.5 w-3.5" /> Add Expense
          </Button>
        </div>

        <ExpenseSplitInputs
          members={members}
          splitMode={splitMode}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          customShares={customShares}
          setCustomShares={setCustomShares}
          percentShares={percentShares}
          setPercentShares={setPercentShares}
        />

        {error && (
          <p
            role="alert"
            data-testid="expense-form-error"
            className="font-medium text-[var(--status-danger)]"
          >
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
