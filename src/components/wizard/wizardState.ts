import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { toMinorUnits } from '../../lib/domain/money';
import type { Currency } from '../../lib/schemas';

export interface WizardFormState {
  title: string;
  destinationsText: string;
  departureCity: string;
  startDate: string;
  endDate: string;
  groupSize: number;
  currency: Currency;
  personalBudgetMajor: string;
  sharedCapMajor: string;
  accommodationPref:
    | 'hostel'
    | 'budget-hotel'
    | 'mid-range'
    | 'boutique'
    | 'apartment';
  transportPref:
    | 'public-transit'
    | 'walking'
    | 'rail'
    | 'rental-car'
    | 'mixed';
  interests: string[];
  pace: 'relaxed' | 'balanced' | 'packed';
  dietaryOrAccess: string;
  notes: string;
}

export const STEP_TITLES = [
  'Destinations & Trip Title',
  'Departure City',
  'Travel Dates',
  'Group Size',
  'Currency & Budgets',
  'Accommodation Style',
  'Transport Preference',
  'Travel Interests',
  'Pace & Accessibility',
  'Review & Launch Workspace',
] as const;

export function createInitialWizardForm(): WizardFormState {
  const start = new Date(Date.now() + 14 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  const end = new Date(Date.now() + 17 * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return {
    title: 'Barcelona Friends Escape',
    destinationsText: 'Barcelona',
    departureCity: 'London',
    startDate: start,
    endDate: end,
    groupSize: 3,
    currency: 'GBP',
    personalBudgetMajor: '300',
    sharedCapMajor: '900',
    accommodationPref: 'mid-range',
    transportPref: 'public-transit',
    interests: ['museums', 'tapas & dining'],
    pace: 'balanced',
    dietaryOrAccess: '',
    notes: '',
  };
}

export function hydrateWizardForm(existing: TripDetailDto): WizardFormState {
  const myPref = existing.preferences[0];
  return {
    title: existing.summary.title,
    destinationsText: existing.summary.destinations.join(', '),
    departureCity: existing.summary.departureCity,
    startDate: existing.summary.startDate,
    endDate: existing.summary.endDate,
    groupSize: existing.summary.groupSize,
    currency: existing.summary.currency,
    personalBudgetMajor: String((myPref?.budgetMinor ?? 30000) / 100),
    sharedCapMajor: existing.budget?.sharedCapMinor
      ? String(existing.budget.sharedCapMinor / 100)
      : '',
    accommodationPref:
      (myPref?.accommodationPref as WizardFormState['accommodationPref']) ??
      'mid-range',
    transportPref:
      (myPref?.transportPref as WizardFormState['transportPref']) ??
      'public-transit',
    interests: myPref?.interests ?? ['museums'],
    pace: (myPref?.pace as WizardFormState['pace']) ?? 'balanced',
    dietaryOrAccess: myPref?.dietaryOrAccess ?? '',
    notes: myPref?.notes ?? '',
  };
}

export function buildWizardCandidate(
  form: WizardFormState,
  step: number,
  finalize: boolean,
) {
  const destinations = form.destinationsText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const budgetNum = Number(form.personalBudgetMajor);
  const sharedNum = form.sharedCapMajor.trim()
    ? Number(form.sharedCapMajor)
    : null;

  return {
    title: form.title,
    destinations,
    departureCity: form.departureCity,
    startDate: form.startDate,
    endDate: form.endDate,
    groupSize: form.groupSize,
    currency: form.currency,
    personalBudgetMinor: Number.isFinite(budgetNum)
      ? toMinorUnits(budgetNum)
      : 0,
    sharedCapMinor:
      sharedNum !== null && Number.isFinite(sharedNum)
        ? toMinorUnits(sharedNum)
        : null,
    accommodationPref: form.accommodationPref,
    transportPref: form.transportPref,
    interests: form.interests,
    pace: form.pace,
    dietaryOrAccess: form.dietaryOrAccess,
    notes: form.notes,
    wizardStep: step,
    finalize,
  };
}
