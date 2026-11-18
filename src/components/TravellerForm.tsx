import { useState, type FormEvent } from 'react';
import {
  TravellerInputSchema,
  type Currency,
  type Traveller,
  type TravellerInput,
} from '../lib/schemas';
import { extractFieldErrors, parseBudgetInput } from '../lib/validation';
import { FormField } from './FormField';

interface TravellerFormProps {
  currency: Currency;
  existingTravellers: Traveller[];
  onAddTraveller: (input: TravellerInput) => void;
}

const INPUT_CLASS =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

export function TravellerForm({
  currency,
  existingTravellers,
  onAddTraveller,
}: TravellerFormProps) {
  const [name, setName] = useState('');
  const [budgetText, setBudgetText] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [preferences, setPreferences] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const budgetResult = parseBudgetInput(budgetText);
    const interests = interestsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const result = TravellerInputSchema.safeParse({
      name,
      budget: budgetResult.ok ? budgetResult.value : NaN,
      interests,
      preferences,
    });

    const nextErrors = result.success ? {} : extractFieldErrors(result.error);
    if (!budgetResult.ok) {
      nextErrors.budget = budgetResult.error;
    }

    const normalizedName = name.trim().toLowerCase();
    if (
      normalizedName &&
      existingTravellers.some(
        (t) => t.name.trim().toLowerCase() === normalizedName,
      )
    ) {
      nextErrors.name = 'A traveller with this name already exists.';
    }

    if (Object.keys(nextErrors).length > 0 || !result.success) {
      setErrors(nextErrors);
      return;
    }

    onAddTraveller(result.data);
    setName('');
    setBudgetText('');
    setInterestsText('');
    setPreferences('');
    setErrors({});
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Add traveller"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-slate-900">2. Add Traveller</h2>
      <p className="mt-1 text-sm text-slate-500">
        Include each friend&apos;s individual budget and interests.
      </p>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="traveller-name"
            label="Name"
            error={errors.name}
            errorTestId="error-traveller-name"
          >
            <input
              id="traveller-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice"
              className={INPUT_CLASS}
            />
          </FormField>

          <FormField
            id="traveller-budget"
            label={`Individual Budget (${currency})`}
            error={errors.budget}
            errorTestId="error-traveller-budget"
          >
            <input
              id="traveller-budget"
              type="number"
              min={1}
              step="any"
              value={budgetText}
              onChange={(e) => setBudgetText(e.target.value)}
              placeholder="e.g. 200"
              className={INPUT_CLASS}
            />
          </FormField>
        </div>

        <FormField
          id="traveller-interests"
          label="Interests (comma-separated)"
          error={errors.interests}
          errorTestId="error-traveller-interests"
        >
          <input
            id="traveller-interests"
            type="text"
            value={interestsText}
            onChange={(e) => setInterestsText(e.target.value)}
            placeholder="e.g. museums, culture"
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          id="traveller-preferences"
          label="Notes & Preferences (optional)"
          error={errors.preferences}
          errorTestId="error-traveller-preferences"
        >
          <input
            id="traveller-preferences"
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g. Relaxed pace, walkable neighbourhoods"
            className={INPUT_CLASS}
          />
        </FormField>

        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Add Traveller
        </button>
      </div>
    </form>
  );
}
