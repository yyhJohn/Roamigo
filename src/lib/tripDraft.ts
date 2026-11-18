import { TripSetupSchema, type Currency, type TripSetup } from './schemas';
import { extractFieldErrors } from './validation';

export interface TripDraft {
  destinationsText: string;
  startDate: string;
  endDate: string;
  groupSizeText: string;
  currency: Currency;
}

export function toTripDraft(trip: TripSetup): TripDraft {
  return {
    destinationsText: trip.destinations.join(', '),
    startDate: trip.startDate,
    endDate: trip.endDate,
    groupSizeText: String(trip.groupSize),
    currency: trip.currency,
  };
}

export type TripDraftValidation =
  | { ok: true; trip: TripSetup; errors: Record<string, string> }
  | { ok: false; errors: Record<string, string> };

export function validateTripDraft(draft: TripDraft): TripDraftValidation {
  const parsedGroupSize = Number(draft.groupSizeText);
  const result = TripSetupSchema.safeParse({
    destinations: draft.destinationsText
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean),
    startDate: draft.startDate,
    endDate: draft.endDate,
    groupSize: Number.isFinite(parsedGroupSize) ? parsedGroupSize : 0,
    currency: draft.currency,
  });

  if (!result.success) {
    return { ok: false, errors: extractFieldErrors(result.error) };
  }

  return { ok: true, trip: result.data, errors: {} };
}
