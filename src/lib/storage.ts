import { PersistedTripStateSchema, type PersistedTripState } from './schemas';

const STORAGE_KEY = 'roamigo:v1:trip';

export interface StorageLoadResult {
  state: PersistedTripState;
  warning: string | null;
}

export interface StorageWriteResult {
  ok: boolean;
  warning: string | null;
}

export function createDefaultTripState(): PersistedTripState {
  const today = new Date();
  const start = new Date(today.getTime() + 14 * 86_400_000);
  const end = new Date(today.getTime() + 17 * 86_400_000);

  return {
    trip: {
      destinations: ['Barcelona'],
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      groupSize: 3,
      currency: 'GBP',
    },
    travellers: [],
    itinerary: null,
    votes: {},
  };
}

export function loadTripState(): StorageLoadResult {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: createDefaultTripState(), warning: null };
    }
    const parsedJson: unknown = JSON.parse(raw);
    const result = PersistedTripStateSchema.safeParse(parsedJson);
    if (!result.success) {
      console.warn('Stored trip data failed validation; resetting to default.');
      return {
        state: createDefaultTripState(),
        warning:
          'Saved trip data was invalid or outdated and was reset to defaults.',
      };
    }
    return { state: result.data, warning: null };
  } catch (err) {
    console.warn('Failed to load trip state from localStorage:', err);
    return {
      state: createDefaultTripState(),
      warning:
        'Could not read saved trip data from browser storage. Starting with a fresh trip.',
    };
  }
}

export function saveTripState(state: PersistedTripState): StorageWriteResult {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return { ok: true, warning: null };
  } catch (err) {
    console.warn('Failed to persist trip state to localStorage:', err);
    return {
      ok: false,
      warning:
        'Unable to save changes to browser storage (storage quota exceeded or blocked). Your current session remains active.',
    };
  }
}

export function clearTripState(): StorageWriteResult {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return { ok: true, warning: null };
  } catch (err) {
    console.warn('Failed to clear trip state from localStorage:', err);
    return {
      ok: false,
      warning: 'Could not clear saved trip data from browser storage.',
    };
  }
}
