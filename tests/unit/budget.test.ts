import { describe, expect, it } from 'vitest';
import {
  calculateEstimatedCostPerPerson,
  countIncludedActivities,
  evaluateTravellerBudgets,
  formatCurrencyEstimate,
} from '../../src/lib/budget';
import type { ItineraryDay, Traveller } from '../../src/lib/schemas';

const SAMPLE_DAYS: ItineraryDay[] = [
  {
    dayNumber: 1,
    date: '2026-12-01',
    theme: 'Art & Tapas',
    activities: [
      {
        id: 'd1-a1',
        title: 'Picasso Museum',
        description: 'Morning gallery tour',
        timeSlot: 'morning',
        estimatedCostPerPerson: 35,
        compromiseExplanation: 'Fits Alice culture goal',
        matchedTravellers: ['Alice'],
        included: true,
      },
      {
        id: 'd1-a2',
        title: 'Tapas & Wine Crawl',
        description: 'Evening food walk',
        timeSlot: 'evening',
        estimatedCostPerPerson: 95.5,
        compromiseExplanation: 'Fits Bob food & nightlife',
        matchedTravellers: ['Bob'],
        included: true,
      },
    ],
  },
  {
    dayNumber: 2,
    date: '2026-12-02',
    theme: 'Montjuic Outdoors',
    activities: [
      {
        id: 'd2-a1',
        title: 'Coastal Kayak Excursion',
        description: 'Guided sea kayaking',
        timeSlot: 'afternoon',
        estimatedCostPerPerson: 120,
        compromiseExplanation: 'Fits Charlie outdoor adventure',
        matchedTravellers: ['Charlie'],
        included: false,
      },
    ],
  },
];

describe('budget calculations', () => {
  it('sums only included activities for per-person cost', () => {
    expect(calculateEstimatedCostPerPerson(SAMPLE_DAYS)).toBe(130.5);
    expect(countIncludedActivities(SAMPLE_DAYS)).toEqual({
      included: 2,
      total: 3,
    });
  });

  it('recalculates when all activities are included or excluded', () => {
    const allIncluded = SAMPLE_DAYS.map((day) => ({
      ...day,
      activities: day.activities.map((a) => ({ ...a, included: true })),
    }));
    expect(calculateEstimatedCostPerPerson(allIncluded)).toBe(250.5);

    const allExcluded = SAMPLE_DAYS.map((day) => ({
      ...day,
      activities: day.activities.map((a) => ({ ...a, included: false })),
    }));
    expect(calculateEstimatedCostPerPerson(allExcluded)).toBe(0);
  });

  it('detects exceeded individual traveller budgets and exact boundaries', () => {
    const travellers: Traveller[] = [
      {
        id: 'alice',
        name: 'Alice',
        budget: 200,
        interests: ['museums'],
        preferences: '',
      },
      {
        id: 'bob',
        name: 'Bob',
        budget: 250.5,
        interests: ['food'],
        preferences: '',
      },
    ];

    const statuses = evaluateTravellerBudgets(travellers, 250.5);
    expect(statuses[0]).toMatchObject({
      travellerName: 'Alice',
      isExceeded: true,
      overageAmount: 50.5,
      remaining: -50.5,
    });
    expect(statuses[1]).toMatchObject({
      travellerName: 'Bob',
      isExceeded: false,
      overageAmount: 0,
      remaining: 0,
    });
  });

  it('formats consistent currency estimates', () => {
    expect(formatCurrencyEstimate(200, 'GBP')).toBe('£200');
    expect(formatCurrencyEstimate(95.5, 'GBP')).toBe('£95.50');
    expect(formatCurrencyEstimate(45, 'EUR')).toBe('€45');
  });
});
