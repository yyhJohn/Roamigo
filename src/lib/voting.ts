import type { VoteDirection, VotesMap } from './schemas';

export interface ActivityVoteTally {
  upCount: number;
  downCount: number;
  netScore: number;
}

/**
 * Casts, switches, or toggles off a single traveller's vote on an activity.
 * Guarantees at most one vote per (activityId, travellerId) pair.
 */
export function castVote(
  votes: VotesMap,
  activityId: string,
  travellerId: string,
  direction: VoteDirection,
): VotesMap {
  const existingForActivity = votes[activityId] ?? {};
  const currentVote = existingForActivity[travellerId];
  const nextForActivity: Record<string, VoteDirection> = {
    ...existingForActivity,
  };

  if (currentVote === direction) {
    delete nextForActivity[travellerId];
  } else {
    nextForActivity[travellerId] = direction;
  }

  return {
    ...votes,
    [activityId]: nextForActivity,
  };
}

export function tallyActivityVotes(
  votes: VotesMap,
  activityId: string,
): ActivityVoteTally {
  const activityVotes = votes[activityId] ?? {};
  let upCount = 0;
  let downCount = 0;

  for (const dir of Object.values(activityVotes)) {
    if (dir === 'up') {
      upCount += 1;
    } else if (dir === 'down') {
      downCount += 1;
    }
  }

  return {
    upCount,
    downCount,
    netScore: upCount - downCount,
  };
}

export function getTravellerVote(
  votes: VotesMap,
  activityId: string,
  travellerId: string | null,
): VoteDirection | null {
  if (!travellerId) {
    return null;
  }
  return votes[activityId]?.[travellerId] ?? null;
}
