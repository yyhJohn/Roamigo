import { useState } from 'react';
import {
  formatCurrencyEstimate,
  type TravellerBudgetStatus,
} from '../lib/budget';
import type { Currency, Traveller } from '../lib/schemas';
import { parseBudgetInput } from '../lib/validation';

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
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          Group Travellers ({travellers.length})
        </h2>
      </div>

      {travellers.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
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
                className={`rounded-lg border p-3.5 ${
                  isExceeded
                    ? 'border-rose-300 bg-rose-50/60'
                    : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900 break-words">
                        {traveller.name}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                        Budget:{' '}
                        {formatCurrencyEstimate(traveller.budget, currency)}
                      </span>
                      {hasItinerary && status && (
                        <span
                          data-testid={`traveller-budget-status-${traveller.name}`}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isExceeded
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isExceeded
                            ? `Over budget by ${formatCurrencyEstimate(status.overageAmount, currency)} est.`
                            : 'Within budget'}
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">
                        Interests:
                      </span>{' '}
                      {traveller.interests.join(', ')}
                    </p>
                    {traveller.preferences && (
                      <p className="mt-0.5 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">
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
                          className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => saveEdit(traveller.id)}
                          className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setBudgetError(null);
                          }}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        {budgetError && (
                          <p role="alert" className="w-full text-xs text-rose-600">
                            {budgetError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1.5">
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(traveller)}
                        aria-label={`Edit budget for ${traveller.name}`}
                        className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit budget
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveTraveller(traveller.id)}
                      aria-label={`Remove ${traveller.name}`}
                      className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Remove
                    </button>
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
