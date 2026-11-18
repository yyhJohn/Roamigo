import type { FormEvent } from 'react';
import { CurrencySchema } from '../lib/schemas';
import type { TripDraft } from '../lib/tripDraft';
import { FormField } from './FormField';

interface TripSetupFormProps {
  draft: TripDraft;
  errors: Record<string, string>;
  onChangeDraft: (patch: Partial<TripDraft>) => void;
}

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

export function TripSetupForm({
  draft,
  errors,
  onChangeDraft,
}: TripSetupFormProps) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onChangeDraft({});
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">1. Trip Setup</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter candidate destinations, travel dates, and group size.
      </p>

      <div className="mt-4 space-y-3">
        <FormField
          id="trip-destinations"
          label="Destination(s) (comma-separated)"
          error={errors.destinations}
          errorTestId="error-trip-destinations"
        >
          <input
            id="trip-destinations"
            type="text"
            value={draft.destinationsText}
            onChange={(e) => onChangeDraft({ destinationsText: e.target.value })}
            placeholder="e.g. Barcelona"
            className={INPUT_CLASS}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="trip-start-date"
            label="Start Date"
            error={errors.startDate}
            errorTestId="error-trip-start-date"
          >
            <input
              id="trip-start-date"
              type="date"
              value={draft.startDate}
              onChange={(e) => onChangeDraft({ startDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField
            id="trip-end-date"
            label="End Date"
            error={errors.endDate}
            errorTestId="error-trip-end-date"
          >
            <input
              id="trip-end-date"
              type="date"
              value={draft.endDate}
              onChange={(e) => onChangeDraft({ endDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="trip-group-size"
            label="Group Size"
            error={errors.groupSize}
            errorTestId="error-trip-group-size"
          >
            <input
              id="trip-group-size"
              type="number"
              min={1}
              max={20}
              value={draft.groupSizeText}
              onChange={(e) => onChangeDraft({ groupSizeText: e.target.value })}
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField id="trip-currency" label="Currency">
            <select
              id="trip-currency"
              value={draft.currency}
              onChange={(e) => {
                const parsed = CurrencySchema.safeParse(e.target.value);
                if (parsed.success) {
                  onChangeDraft({ currency: parsed.data });
                }
              }}
              className={`${INPUT_CLASS} bg-white`}
            >
              <option value="GBP">GBP (£)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </FormField>
        </div>
      </div>
    </form>
  );
}
