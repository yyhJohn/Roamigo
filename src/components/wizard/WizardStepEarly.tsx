import { CURATED_DESTINATIONS } from '../../lib/destinations';
import type { Currency } from '../../lib/schemas';
import type { WizardFormState } from './wizardState';

const INPUT_CLS =
  'mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm';

export function WizardStepEarly({
  step,
  form,
  onPatch,
}: {
  step: number;
  form: WizardFormState;
  onPatch: (patch: Partial<WizardFormState>) => void;
}) {
  if (step === 1) {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="wiz-title" className="block text-xs font-semibold">
            Trip name
          </label>
          <input
            id="wiz-title"
            type="text"
            value={form.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            placeholder="Spring Break in Iberia"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label htmlFor="wiz-dest" className="block text-xs font-semibold">
            Candidate destinations (comma-separated)
          </label>
          <input
            id="wiz-dest"
            type="text"
            value={form.destinationsText}
            onChange={(e) => onPatch({ destinationsText: e.target.value })}
            placeholder="Barcelona, Lisbon"
            className={INPUT_CLS}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CURATED_DESTINATIONS.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() =>
                  onPatch({
                    destinationsText: d.city,
                    title: form.title || `${d.city} Group Escape`,
                  })
                }
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-semibold hover:border-[var(--brand-primary)]"
              >
                + {d.city}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div>
        <label htmlFor="wiz-departure" className="block text-xs font-semibold">
          Primary departure city or airport
        </label>
        <input
          id="wiz-departure"
          type="text"
          value={form.departureCity}
          onChange={(e) => onPatch({ departureCity: e.target.value })}
          placeholder="London, Manchester, or Remote"
          className={INPUT_CLS}
        />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="wiz-start" className="block text-xs font-semibold">
            Start date
          </label>
          <input
            id="wiz-start"
            type="date"
            value={form.startDate}
            onChange={(e) => onPatch({ startDate: e.target.value })}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label htmlFor="wiz-end" className="block text-xs font-semibold">
            Return date
          </label>
          <input
            id="wiz-end"
            type="date"
            value={form.endDate}
            onChange={(e) => onPatch({ endDate: e.target.value })}
            className={INPUT_CLS}
          />
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <label htmlFor="wiz-group" className="block text-xs font-semibold">
          Expected group size (1–20 travellers)
        </label>
        <input
          id="wiz-group"
          type="number"
          min={1}
          max={20}
          value={form.groupSize}
          onChange={(e) =>
            onPatch({ groupSize: Math.max(1, Number(e.target.value) || 1) })
          }
          className={INPUT_CLS}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label htmlFor="wiz-currency" className="block text-xs font-semibold">
          Trip currency
        </label>
        <select
          id="wiz-currency"
          value={form.currency}
          onChange={(e) => onPatch({ currency: e.target.value as Currency })}
          className={INPUT_CLS}
        >
          <option value="GBP">GBP (£)</option>
          <option value="EUR">EUR (€)</option>
          <option value="USD">USD ($)</option>
        </select>
      </div>
      <div>
        <label htmlFor="wiz-budget" className="block text-xs font-semibold">
          Your personal cap ({form.currency})
        </label>
        <input
          id="wiz-budget"
          type="number"
          min={1}
          value={form.personalBudgetMajor}
          onChange={(e) => onPatch({ personalBudgetMajor: e.target.value })}
          className={INPUT_CLS}
        />
      </div>
      <div>
        <label htmlFor="wiz-shared-cap" className="block text-xs font-semibold">
          Optional group cap ({form.currency})
        </label>
        <input
          id="wiz-shared-cap"
          type="number"
          min={0}
          value={form.sharedCapMajor}
          onChange={(e) => onPatch({ sharedCapMajor: e.target.value })}
          placeholder="e.g. 1200"
          className={INPUT_CLS}
        />
      </div>
    </div>
  );
}
