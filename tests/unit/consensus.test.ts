import { describe, expect, it } from 'vitest';
import {
  computeTripConsensusPercentage,
  evaluateActivityConsensus,
} from '../../src/lib/domain/consensus';

describe('Milestone 7: Group consensus domain logic', () => {
  it('classifies Pending, Unanimous, Majority Disagreement, Contested, Locked In, and Excluded', () => {
    expect(evaluateActivityConsensus([], 3, 'PROPOSED').code).toBe('PENDING');

    expect(
      evaluateActivityConsensus(
        [
          { userId: 'u1', direction: 'UP' },
          { userId: 'u2', direction: 'UP' },
        ],
        3,
        'PROPOSED',
        'u1',
      ),
    ).toMatchObject({
      code: 'UNANIMOUS',
      upCount: 2,
      downCount: 0,
      myVote: 'UP',
    });

    expect(
      evaluateActivityConsensus(
        [
          { userId: 'u1', direction: 'UP' },
          { userId: 'u2', direction: 'UP' },
          { userId: 'u3', direction: 'DOWN' },
        ],
        3,
        'PROPOSED',
      ).code,
    ).toBe('MAJORITY_DISAGREEMENT');

    expect(
      evaluateActivityConsensus(
        [
          { userId: 'u1', direction: 'UP' },
          { userId: 'u2', direction: 'DOWN' },
        ],
        3,
        'PROPOSED',
      ).code,
    ).toBe('CONTESTED');

    expect(evaluateActivityConsensus([], 3, 'LOCKED_IN').code).toBe(
      'LOCKED_IN',
    );
    expect(evaluateActivityConsensus([], 3, 'EXCLUDED').code).toBe('EXCLUDED');
  });

  it('computes trip-level consensus percentage over included activities', () => {
    const res = computeTripConsensusPercentage(
      [
        {
          id: 'd1',
          dayNumber: 1,
          date: '2026-07-01',
          theme: 'Arrival',
          activities: [
            {
              id: 'a1',
              dayId: 'd1',
              stableKey: 'k1',
              sortOrder: 0,
              title: 'Walk',
              description: 'Desc',
              category: 'CULTURE',
              timeSlot: 'MORNING',
              startTime: null,
              endTime: null,
              estimatedCostMinor: 0,
              locationName: null,
              lat: null,
              lng: null,
              coordSource: 'unverified',
              compromiseExplanation: '',
              matchedTravellers: [],
              included: true,
              decisionStatus: 'LOCKED_IN',
              votes: [],
            },
            {
              id: 'a2',
              dayId: 'd1',
              stableKey: 'k2',
              sortOrder: 1,
              title: 'Club',
              description: 'Desc',
              category: 'NIGHTLIFE',
              timeSlot: 'EVENING',
              startTime: null,
              endTime: null,
              estimatedCostMinor: 2000,
              locationName: null,
              lat: null,
              lng: null,
              coordSource: 'unverified',
              compromiseExplanation: '',
              matchedTravellers: [],
              included: true,
              decisionStatus: 'PROPOSED',
              votes: [{ userId: 'u1', direction: 'DOWN' }],
            },
          ],
        },
      ],
      2,
    );
    expect(res).toEqual({ agreedCount: 1, totalIncluded: 2, percentage: 50 });
  });
});
