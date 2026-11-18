import { describe, expect, it } from 'vitest';
import {
  castVote,
  getTravellerVote,
  tallyActivityVotes,
} from '../../src/lib/voting';
import type { VotesMap } from '../../src/lib/schemas';

describe('voting calculations & duplicate-vote prevention', () => {
  it('tallies upvotes from multiple distinct travellers', () => {
    let votes: VotesMap = {};
    votes = castVote(votes, 'act-1', 'alice', 'up');
    votes = castVote(votes, 'act-1', 'bob', 'up');

    expect(tallyActivityVotes(votes, 'act-1')).toEqual({
      upCount: 2,
      downCount: 0,
      netScore: 2,
    });
  });

  it('prevents duplicate votes when switching direction or clicking same direction', () => {
    let votes: VotesMap = {};
    votes = castVote(votes, 'act-1', 'alice', 'up');
    expect(getTravellerVote(votes, 'act-1', 'alice')).toBe('up');

    // Switch Alice's vote from up to down (must not leave stale upvote)
    votes = castVote(votes, 'act-1', 'alice', 'down');
    expect(getTravellerVote(votes, 'act-1', 'alice')).toBe('down');
    expect(tallyActivityVotes(votes, 'act-1')).toEqual({
      upCount: 0,
      downCount: 1,
      netScore: -1,
    });

    // Clicking down again toggles vote off
    votes = castVote(votes, 'act-1', 'alice', 'down');
    expect(getTravellerVote(votes, 'act-1', 'alice')).toBeNull();
    expect(tallyActivityVotes(votes, 'act-1')).toEqual({
      upCount: 0,
      downCount: 0,
      netScore: 0,
    });
  });
});
