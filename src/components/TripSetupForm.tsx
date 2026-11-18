import { useEffect, useState, type FormEvent } from 'react';
import {
  CurrencySchema,
  TripSetupSchema,
  type Currency,
  type TripSetup,
} from '../lib/schemas';
import { extractFieldErrors } from '../lib/validation';
import { FormField } from './FormField';

interface TripSetupFormProps {
  trip: TripSetup;
  onUpdateTrip: (trip: TripSetup) => void;
  onValidityChange: (isValid: boolean) => void;
}

interface TripDraft {
  destinationsText: string;
  startDate: string;
  endDate: string;
  groupSizeText: string;
  currency: Currency;
}

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

function toDraft(trip: TripSetup): TripDraft {
  return {
    destinationsText: trip.destinations.join(', '),
    startDate: trip.startDate,
    endDate: trip.endDate,
    groupSizeText: String(trip.groupSize),
    currency: trip.currency,
  };
}

export function TripSetupForm({
  trip,
  onUpdateTrip,
  onValidityChange,
}: TripSetupFormProps) {
  const [draft, setDraft] = useState<TripDraft>(() => toDraft(trip));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setDraft(toDraft(trip));
    setErrors({});
    onValidityChange(true);
  }, [trip, onValidityChange]);

  function validateAndSync(next: TripDraft) {
    const parsedGroupSize = Number(next.groupSizeText);
    const result = TripSetupSchema.safeParse({
      destinations: next.destinationsText
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean),
      startDate: next.startDate,
      endDate: next.endDate,
      groupSize: Number.isFinite(parsedGroupSize) ? parsedGroupSize : 0,
      currency: next.currency,
    });

    if (!result.success) {
      setErrors(extractFieldErrors(result.error));
      onValidityChange(false);
      return;
    }

    setErrors({});
    onValidityChange(true);
    onUpdateTrip(result.data);
  }

  function updateDraft(patch: Partial<TripDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    validateAndSync(next);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    validateAndSync(draft);
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
        >
          <input
            id="trip-destinations"
            type="text"
            value={draft.destinationsText}
            onChange={(e) => updateDraft({ destinationsText: e.target.value })}
            placeholder="e.g. Barcelona"
            className={INPUT_CLASS}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="trip-start-date"
            label="Start Date"
            error={errors.startDate}
          >
            <input
              id="trip-start-date"
              type="date"
              value={draft.startDate}
              onChange={(e) => updateDraft({ startDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField id="trip-end-date" label="End Date" error={errors.endDate}>
            <input
              id="trip-end-date"
              type="date"
              value={draft.endDate}
              onChange={(e) => updateDraft({ endDate: e.target.value })}
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="trip-group-size"
            label="Group Size"
            error={errors.groupSize}
          >
            <input
              id="trip-group-size"
              type="number"
              min={1}
              max={20}
              value={draft.groupSizeText}
              onChange={(e) => updateDraft({ groupSizeText: e.target.value })}
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
                  updateDraft({ currency: parsed.data });
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
