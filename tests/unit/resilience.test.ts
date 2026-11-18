import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, generateItineraryApi } from '../../src/lib/api';
import {
  createDefaultTripState,
  loadTripState,
  saveTripState,
} from '../../src/lib/storage';
import { toTripDraft, validateTripDraft } from '../../src/lib/tripDraft';

const VALID_REQUEST = {
  trip: {
    destinations: ['Barcelona'],
    startDate: '2026-12-01',
    endDate: '2026-12-03',
    groupSize: 3,
    currency: 'GBP' as const,
  },
  travellers: [
    {
      id: 'alice',
      name: 'Alice',
      budget: 200,
      interests: ['museums'],
      preferences: '',
    },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('tripDraft single-source-of-truth validation', () => {
  it('flags empty destinations and inverted dates while round-tripping valid trips', () => {
    const draft = toTripDraft(VALID_REQUEST.trip);
    expect(validateTripDraft(draft)).toMatchObject({
      ok: true,
      trip: VALID_REQUEST.trip,
    });

    const invalidDest = validateTripDraft({ ...draft, destinationsText: '  ' });
    expect(invalidDest.ok).toBe(false);
    expect(invalidDest.errors.destinations).toBeDefined();

    const invalidDates = validateTripDraft({
      ...draft,
      startDate: '2026-12-10',
      endDate: '2026-12-03',
    });
    expect(invalidDates.ok).toBe(false);
    expect(invalidDates.errors.endDate).toBeDefined();
  });
});

describe('storage.ts explicit error handling', () => {
  it('surfaces warning and logs when localStorage contains corrupted JSON', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => '{invalid-json',
        setItem: () => {},
        removeItem: () => {},
      },
    });

    const res = loadTripState();
    expect(res.warning).toContain('Could not read saved trip data');
    expect(res.state.trip.destinations).toEqual(['Barcelona']);
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('surfaces warning when localStorage fails schema validation', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => JSON.stringify({ trip: { destinations: [] } }),
        setItem: () => {},
        removeItem: () => {},
      },
    });

    const res = loadTripState();
    expect(res.warning).toContain('invalid or outdated');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it('returns actionable failure result when saveTripState hits quota error', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {},
      },
    });

    const write = saveTripState(createDefaultTripState());
    expect(write.ok).toBe(false);
    expect(write.warning).toContain('Unable to save changes');
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('api.ts explicit error handling', () => {
  it('throws actionable ApiRequestError on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('ECONNREFUSED')),
    );

    await expect(generateItineraryApi(VALID_REQUEST)).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 0,
      message: expect.stringContaining('Your inputs are preserved'),
    });
  });

  it('throws explicit non-JSON ApiRequestError when proxy returns HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<html>502 Bad Gateway</html>', { status: 502 }),
      ),
    );

    await expect(generateItineraryApi(VALID_REQUEST)).rejects.toMatchObject({
      name: 'ApiRequestError',
      status: 502,
      message: expect.stringContaining('non-JSON response (HTTP 502)'),
    });
  });

  it('rejects off-schema itinerary payload with 502 ApiRequestError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ itinerary: { days: [] } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    await expect(generateItineraryApi(VALID_REQUEST)).rejects.toBeInstanceOf(
      ApiRequestError,
    );
  });
});
