import { describe, expect, it } from 'vitest';
import {
  ItinerarySchema,
  TravellerInputSchema,
  TripSetupSchema,
} from '../../src/lib/schemas';
import { parseBudgetInput } from '../../src/lib/validation';

describe('TripSetupSchema', () => {
  it('accepts valid trip setup', () => {
    const res = TripSetupSchema.safeParse({
      destinations: ['Barcelona'],
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      groupSize: 3,
      currency: 'GBP',
    });
    expect(res.success).toBe(true);
  });

  it('rejects empty destinations and end date before start date', () => {
    const res = TripSetupSchema.safeParse({
      destinations: [],
      startDate: '2026-12-05',
      endDate: '2026-12-03',
      groupSize: 3,
      currency: 'GBP',
    });
    expect(res.success).toBe(false);
  });
});

describe('TravellerInputSchema', () => {
  it('accepts valid traveller input', () => {
    const res = TravellerInputSchema.safeParse({
      name: 'Alice',
      budget: 200,
      interests: ['museums', 'culture'],
      preferences: 'Walkable areas',
    });
    expect(res.success).toBe(true);
  });

  it('rejects missing name, zero/negative budget, NaN budget, and 200-char name', () => {
    expect(
      TravellerInputSchema.safeParse({
        name: '   ',
        budget: 200,
        interests: ['food'],
        preferences: '',
      }).success,
    ).toBe(false);

    expect(
      TravellerInputSchema.safeParse({
        name: 'Bob',
        budget: -50,
        interests: ['food'],
        preferences: '',
      }).success,
    ).toBe(false);

    expect(
      TravellerInputSchema.safeParse({
        name: 'Bob',
        budget: 0,
        interests: ['food'],
        preferences: '',
      }).success,
    ).toBe(false);

    expect(
      TravellerInputSchema.safeParse({
        name: 'Bob',
        budget: Number.NaN,
        interests: ['food'],
        preferences: '',
      }).success,
    ).toBe(false);

    expect(
      TravellerInputSchema.safeParse({
        name: 'A'.repeat(200),
        budget: 200,
        interests: ['food'],
        preferences: '',
      }).success,
    ).toBe(false);
  });
});

describe('ItinerarySchema (malformed AI response validation)', () => {
  it('rejects malformed or incomplete AI itinerary JSON', () => {
    const missingDays = ItinerarySchema.safeParse({
      chosenDestination: 'Barcelona',
      overview: 'Great trip',
      compromiseSummary: 'Balanced',
      days: [],
      generatedAt: '2026-11-18T14:00:00Z',
    });
    expect(missingDays.success).toBe(false);

    const negativeCost = ItinerarySchema.safeParse({
      chosenDestination: 'Barcelona',
      overview: 'Great trip',
      compromiseSummary: 'Balanced',
      generatedAt: '2026-11-18T14:00:00Z',
      days: [
        {
          dayNumber: 1,
          date: '2026-12-01',
          theme: 'Arrival',
          activities: [
            {
              id: 'd1-a1',
              title: 'Museum',
              description: 'Visit art museum',
              timeSlot: 'morning',
              estimatedCostPerPerson: -10,
              compromiseExplanation: 'Matches Alice',
              matchedTravellers: ['Alice'],
              included: true,
            },
          ],
        },
      ],
    });
    expect(negativeCost.success).toBe(false);
  });
});

describe('parseBudgetInput', () => {
  it('parses valid positive numbers and rejects empty or non-positive values', () => {
    expect(parseBudgetInput('250')).toEqual({ ok: true, value: 250 });
    expect(parseBudgetInput('')).toMatchObject({ ok: false });
    expect(parseBudgetInput('-10')).toMatchObject({ ok: false });
    expect(parseBudgetInput('0')).toMatchObject({ ok: false });
  });
});
