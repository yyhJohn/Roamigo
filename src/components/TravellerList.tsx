import { useState } from 'react';
import {
  formatCurrencyEstimate,
  type TravellerBudgetStatus,
} from '../lib/budget';
import type { Currency, Traveller } from '../lib/schemas';
import { parseBudgetInput } from '../lib/validation';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface TravellerListProps {
  travellers: Traveller[];
  currency: Currency;
  budgetStatuses: TravellerBudgetStatus[];
  hasItinerary: boolean;
  onRemoveTraveller: (travellerId: string) => void;
  onUpdateTravellerBudget: (travellerId: string, budget: number) => void;
}

export function TravellerList({
  travellers,
  currency,
  budgetStatuses,
  hasItinerary,
  onRemoveTraveller,
  onUpdateTravellerBudget,
}: TravellerListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const statusById = new Map(budgetStatuses.map((s) => [s.travellerId, s]));

  function startEdit(traveller: Traveller) {
    setEditingId(traveller.id);
    setBudgetDraft(String(traveller.budget));
    setBudgetError(null);
  }

  function saveEdit(travellerId: string) {
    const check = parseBudgetInput(budgetDraft);
    if (!check.ok) {
      setBudgetError(check.error);
      return;
    }
    onUpdateTravellerBudget(travellerId, check.value);
    setEditingId(null);
    setBudgetError(null);
  }

  return (
    <section
      aria-label="Traveller list"
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
          Group Travellers ({travellers.length})
        </h2>
      </div>

      {travellers.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--text-secondary)]">
          No travellers added yet. Add friends above to balance budgets and
          interests.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {travellers.map((traveller) => {
            const status = statusById.get(traveller.id);
            const isExceeded = Boolean(hasItinerary && status?.isExceeded);
            const isEditing = editingId === traveller.id;

            return (
              <li
                key={traveller.id}
                data-testid={`traveller-card-${traveller.name}`}
                className={`rounded-xl border p-3.5 ${
                  isExceeded
                    ? 'border-[var(--status-error)]/40 bg-[var(--status-error-bg)]/40'
                    : 'border-[var(--border-default)] bg-[var(--bg-canvas)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-[var(--text-primary)] break-words">
                        {traveller.name}
                      </span>
                      <Badge variant="outline" className="tabular-nums">
                        Budget:{' '}
                        {formatCurrencyEstimate(traveller.budget, currency)}
                      </Badge>
                      {hasItinerary && status && (
                        <Badge
                          data-testid={`traveller-budget-status-${traveller.name}`}
                          variant={isExceeded ? 'danger' : 'success'}
                          className="tabular-nums"
                        >
                          {isExceeded
                            ? `Over budget by ${formatCurrencyEstimate(status.overageAmount, currency)} est.`
                            : 'Within budget'}
                        </Badge>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-[var(--text-secondary)]">
                      <span className="font-semibold text-[var(--text-primary)]">
                        Interests:
                      </span>{' '}
                      {traveller.interests.join(', ')}
                    </p>
                    {traveller.preferences && (
                      <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">
                          Notes:
                        </span>{' '}
                        {traveller.preferences}
                      </p>
                    )}

                    {isEditing && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          aria-label={`Edit budget for ${traveller.name}`}
                          value={budgetDraft}
                          onChange={(e) => setBudgetDraft(e.target.value)}
                          className="w-28 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-primary)]"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => saveEdit(traveller.id)}
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setBudgetError(null);
                          }}
                        >
                          Cancel
                        </Button>
                        {budgetError && (
                          <p
                            role="alert"
                            className="w-full text-xs text-[var(--status-error)]"
                          >
                            {budgetError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => startEdit(traveller)}
                        aria-label={`Edit budget for ${traveller.name}`}
                      >
                        Edit budget
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => onRemoveTraveller(traveller.id)}
                      aria-label={`Remove ${traveller.name}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
