import type { TripMemberPreviewDto } from '../../lib/contracts/trip.schemas';

interface ExpenseSplitInputsProps {
  members: TripMemberPreviewDto[];
  splitMode: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE';
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  customShares: Record<string, string>;
  setCustomShares: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  percentShares: Record<string, string>;
  setPercentShares: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}

export function ExpenseSplitInputs({
  members,
  splitMode,
  selectedIds,
  setSelectedIds,
  customShares,
  setCustomShares,
  percentShares,
  setPercentShares,
}: ExpenseSplitInputsProps) {
  if (splitMode === 'EQUAL') {
    return (
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const checked = selectedIds.includes(m.userId);
          return (
            <label
              key={m.userId}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  setSelectedIds((prev) =>
                    checked
                      ? prev.filter((id) => id !== m.userId)
                      : [...prev, m.userId],
                  )
                }
              />
              {m.displayName}
            </label>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {members.map((m) => (
        <label
          key={m.userId}
          className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5"
        >
          <span className="truncate font-medium">{m.displayName}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            data-testid={`split-share-${m.userId}`}
            placeholder={splitMode === 'CUSTOM' ? '0.00' : '%'}
            value={
              splitMode === 'CUSTOM'
                ? (customShares[m.userId] ?? '')
                : (percentShares[m.userId] ?? '')
            }
            onChange={(e) =>
              splitMode === 'CUSTOM'
                ? setCustomShares((p) => ({ ...p, [m.userId]: e.target.value }))
                : setPercentShares((p) => ({
                    ...p,
                    [m.userId]: e.target.value,
                  }))
            }
            className="w-20 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-right"
          />
        </label>
      ))}
    </div>
  );
}
