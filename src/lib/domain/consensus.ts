import type {
  WorkspaceDayDto,
  WorkspaceVoteDto,
} from '../contracts/tripDetail.types.js';

export type ConsensusCode =
  | 'LOCKED_IN'
  | 'EXCLUDED'
  | 'UNANIMOUS'
  | 'MAJORITY_DISAGREEMENT'
  | 'CONTESTED'
  | 'IN_PROGRESS'
  | 'PENDING';

export type ConsensusBadgeVariant =
  | 'default'
  | 'mint'
  | 'success'
  | 'warning'
  | 'danger'
  | 'outline';

export interface ActivityConsensusSummary {
  code: ConsensusCode;
  label: string;
  badgeVariant: ConsensusBadgeVariant;
  upCount: number;
  downCount: number;
  myVote: 'UP' | 'DOWN' | null;
}

export function evaluateActivityConsensus(
  votes: readonly WorkspaceVoteDto[],
  memberCount: number,
  decisionStatus: 'PROPOSED' | 'LOCKED_IN' | 'EXCLUDED',
  viewerUserId?: string,
): ActivityConsensusSummary {
  const upCount = votes.filter((v) => v.direction === 'UP').length;
  const downCount = votes.filter((v) => v.direction === 'DOWN').length;
  const myVote =
    (viewerUserId && votes.find((v) => v.userId === viewerUserId)?.direction) ||
    null;

  if (decisionStatus === 'LOCKED_IN') {
    return {
      code: 'LOCKED_IN',
      label: 'Locked In',
      badgeVariant: 'success',
      upCount,
      downCount,
      myVote,
    };
  }
  if (decisionStatus === 'EXCLUDED') {
    return {
      code: 'EXCLUDED',
      label: 'Excluded',
      badgeVariant: 'danger',
      upCount,
      downCount,
      myVote,
    };
  }

  const total = upCount + downCount;
  if (total === 0) {
    return {
      code: 'PENDING',
      label: 'Awaiting Votes',
      badgeVariant: 'outline',
      upCount,
      downCount,
      myVote,
    };
  }

  const quorum = Math.max(1, Math.ceil(memberCount / 2));
  if (upCount > 0 && downCount === 0 && upCount >= quorum) {
    return {
      code: 'UNANIMOUS',
      label: 'Unanimous',
      badgeVariant: 'success',
      upCount,
      downCount,
      myVote,
    };
  }

  if (upCount > downCount && downCount > 0) {
    return {
      code: 'MAJORITY_DISAGREEMENT',
      label: 'Majority — Disagreement Flagged',
      badgeVariant: 'warning',
      upCount,
      downCount,
      myVote,
    };
  }

  if (downCount >= upCount && downCount > 0) {
    return {
      code: 'CONTESTED',
      label: 'Contested',
      badgeVariant: 'danger',
      upCount,
      downCount,
      myVote,
    };
  }

  return {
    code: 'IN_PROGRESS',
    label: 'Votes In Progress',
    badgeVariant: 'mint',
    upCount,
    downCount,
    myVote,
  };
}

export function computeTripConsensusPercentage(
  days: readonly WorkspaceDayDto[],
  memberCount: number,
): { agreedCount: number; totalIncluded: number; percentage: number } {
  let agreedCount = 0;
  let totalIncluded = 0;
  for (const day of days) {
    for (const act of day.activities) {
      if (!act.included) continue;
      totalIncluded += 1;
      const summary = evaluateActivityConsensus(
        act.votes,
        memberCount,
        act.decisionStatus,
      );
      if (summary.code === 'LOCKED_IN' || summary.code === 'UNANIMOUS') {
        agreedCount += 1;
      }
    }
  }
  const percentage =
    totalIncluded === 0 ? 100 : Math.round((agreedCount / totalIncluded) * 100);
  return { agreedCount, totalIncluded, percentage };
}
