import { useState } from 'react';
import { AlertTriangle, CalendarPlus } from 'lucide-react';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { computeTripConsensusPercentage } from '../../lib/domain/consensus';
import { formatMinorCurrency } from '../../lib/domain/money';
import { useAddDayMutation } from '../../lib/useWorkspaceActivities';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useToast } from '../ui/ToastProvider';
import { TravellerProfilesCard } from './TravellerProfilesCard';

interface WorkspaceLeftRailProps {
  detail: TripDetailDto;
  selectedDayNumber: number | null;
  onSelectDay: (dayNumber: number | null) => void;
  canEdit: boolean;
}

export function WorkspaceLeftRail({
  detail,
  selectedDayNumber,
  onSelectDay,
  canEdit,
}: WorkspaceLeftRailProps) {
  const { summary, itinerary, preferences } = detail;
  const addDayMutation = useAddDayMutation(summary.id);
  const { pushToast } = useToast();
  const [addingDay, setAddingDay] = useState(false);
  const [newDayDate, setNewDayDate] = useState(summary.startDate);
  const [newDayTheme, setNewDayTheme] = useState('');

  const overBudgetProfiles = preferences.filter(
    (p) => summary.estimatedPerPersonMinor > p.budgetMinor,
  );
  const consensusPulse = computeTripConsensusPercentage(
    itinerary?.days ?? [],
    detail.members.length,
  );

  async function handleCreateDay(e: React.FormEvent) {
    e.preventDefault();
    if (!newDayTheme.trim()) return;
    const res = await addDayMutation.mutateAsync({
      date: newDayDate,
      theme: newDayTheme.trim(),
    });
    setNewDayTheme('');
    setAddingDay(false);
    onSelectDay(res.dayNumber);
    pushToast(`Added Day ${res.dayNumber} to itinerary!`, 'success');
  }

  return (
    <div className="space-y-4" data-testid="workspace-left-rail">
      <Card className="space-y-2.5 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Day Navigator
          </h2>
          {canEdit && (
            <button
              type="button"
              data-testid="open-add-day-btn"
              onClick={() => setAddingDay((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-primary)] hover:underline"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Add Day
            </button>
          )}
        </div>

        {addingDay && canEdit && (
          <form
            onSubmit={(e) => void handleCreateDay(e)}
            className="space-y-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2.5 text-xs"
          >
            <input
              type="date"
              aria-label="New day date"
              value={newDayDate}
              onChange={(e) => setNewDayDate(e.target.value)}
              className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1"
              required
            />
            <input
              type="text"
              aria-label="New day theme"
              data-testid="new-day-theme-input"
              placeholder="e.g. Coastal Neighbourhoods"
              value={newDayTheme}
              onChange={(e) => setNewDayTheme(e.target.value)}
              className="w-full rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1"
              required
            />
            <div className="flex gap-1.5">
              <Button type="submit" size="sm" data-testid="confirm-add-day-btn">
                Save Day
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAddingDay(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectDay(null)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
              selectedDayNumber === null
                ? 'bg-[var(--brand-primary)] text-white'
                : 'hover:bg-[var(--bg-subtle)]'
            }`}
          >
            <span>All Days</span>
            <span>{itinerary?.days.length ?? 0}d</span>
          </button>

          {itinerary?.days.map((day) => {
            const dayEst = day.activities
              .filter((a) => a.included)
              .reduce((acc, a) => acc + a.estimatedCostMinor, 0);
            const active = selectedDayNumber === day.dayNumber;
            return (
              <button
                key={day.id}
                type="button"
                data-testid={`nav-day-${day.dayNumber}`}
                onClick={() => onSelectDay(day.dayNumber)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                  active
                    ? 'bg-[var(--brand-primary)] text-white font-semibold'
                    : 'hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <span className="truncate pr-2">
                  Day {day.dayNumber} · {day.theme}
                </span>
                <span className="shrink-0 text-[11px] opacity-85">
                  {formatMinorCurrency(dayEst, summary.currency)}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-2.5 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-secondary)]">
            Group Agreement
          </span>
          <span
            data-testid="trip-consensus-pct"
            className="font-display font-extrabold text-[var(--brand-primary)]"
          >
            {consensusPulse.percentage}% ({consensusPulse.agreedCount}/
            {consensusPulse.totalIncluded})
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Est. Itinerary / Person
          </span>
          <span className="font-display text-sm font-extrabold">
            {formatMinorCurrency(
              summary.estimatedPerPersonMinor,
              summary.currency,
              { est: true },
            )}
          </span>
        </div>
        {overBudgetProfiles.length > 0 ? (
          <div className="flex items-start gap-2 rounded-lg bg-[var(--status-warning-bg)] p-2.5 text-[11px] text-[var(--status-warning)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Exceeds cap for{' '}
              {overBudgetProfiles.map((p) => p.displayName).join(', ')}.
            </span>
          </div>
        ) : (
          <Badge variant="success">Within all traveller caps</Badge>
        )}
      </Card>

      <TravellerProfilesCard
        preferences={preferences}
        currency={summary.currency}
      />
    </div>
  );
}
