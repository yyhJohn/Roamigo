import { Ban, Lock, ThumbsDown, ThumbsUp, Undo2 } from 'lucide-react';
import type { WorkspaceActivityDto } from '../../lib/contracts/tripDetail.types';
import { evaluateActivityConsensus } from '../../lib/domain/consensus';
import {
  useCastVoteMutation,
  useRetractVoteMutation,
  useSetActivityDecisionMutation,
} from '../../lib/useWorkspaceVotes';
import { Badge } from '../ui/Badge';

interface ActivityVotingBarProps {
  tripId: string;
  activity: WorkspaceActivityDto;
  memberCount: number;
  viewerUserId: string | undefined;
  canVote: boolean;
  canEdit: boolean;
}

export function ActivityVotingBar({
  tripId,
  activity,
  memberCount,
  viewerUserId,
  canVote,
  canEdit,
}: ActivityVotingBarProps) {
  const castMut = useCastVoteMutation(tripId);
  const retractMut = useRetractVoteMutation(tripId);
  const decisionMut = useSetActivityDecisionMutation(tripId);

  const consensus = evaluateActivityConsensus(
    activity.votes,
    memberCount,
    activity.decisionStatus,
    viewerUserId,
  );

  function toggleVote(dir: 'UP' | 'DOWN') {
    if (!canVote) return;
    if (consensus.myVote === dir) {
      void retractMut.mutateAsync(activity.id);
    } else {
      void castMut.mutateAsync({ activityId: activity.id, direction: dir });
    }
  }

  return (
    <div
      className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-label={`Vote up ${activity.title}`}
          aria-pressed={consensus.myVote === 'UP'}
          data-testid={`vote-up-${activity.id}`}
          disabled={!canVote || castMut.isPending || retractMut.isPending}
          onClick={() => toggleVote('UP')}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition disabled:opacity-50 ${
            consensus.myVote === 'UP'
              ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
              : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)]'
          }`}
        >
          <ThumbsUp className="h-3 w-3" />
          <span data-testid={`up-count-${activity.id}`}>
            {consensus.upCount}
          </span>
        </button>

        <button
          type="button"
          aria-label={`Vote down ${activity.title}`}
          aria-pressed={consensus.myVote === 'DOWN'}
          data-testid={`vote-down-${activity.id}`}
          disabled={!canVote || castMut.isPending || retractMut.isPending}
          onClick={() => toggleVote('DOWN')}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition disabled:opacity-50 ${
            consensus.myVote === 'DOWN'
              ? 'border-[var(--status-danger)] bg-[var(--status-danger)] text-white'
              : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--status-danger)]'
          }`}
        >
          <ThumbsDown className="h-3 w-3" />
          <span data-testid={`down-count-${activity.id}`}>
            {consensus.downCount}
          </span>
        </button>

        <Badge
          variant={consensus.badgeVariant}
          data-testid={`consensus-badge-${activity.id}`}
        >
          {consensus.label}
        </Badge>
      </div>

      {canEdit && (
        <div className="flex items-center gap-1">
          {activity.decisionStatus !== 'LOCKED_IN' ? (
            <button
              type="button"
              data-testid={`lock-in-${activity.id}`}
              onClick={() =>
                void decisionMut.mutateAsync({
                  activityId: activity.id,
                  decisionStatus: 'LOCKED_IN',
                })
              }
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold text-[var(--status-success)] hover:bg-[var(--bg-subtle)]"
            >
              <Lock className="h-3 w-3" /> Lock In
            </button>
          ) : (
            <button
              type="button"
              data-testid={`reopen-${activity.id}`}
              onClick={() =>
                void decisionMut.mutateAsync({
                  activityId: activity.id,
                  decisionStatus: 'PROPOSED',
                })
              }
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <Undo2 className="h-3 w-3" /> Unlock
            </button>
          )}
          {activity.decisionStatus !== 'EXCLUDED' && (
            <button
              type="button"
              data-testid={`exclude-decision-${activity.id}`}
              onClick={() =>
                void decisionMut.mutateAsync({
                  activityId: activity.id,
                  decisionStatus: 'EXCLUDED',
                })
              }
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
            >
              <Ban className="h-3 w-3" /> Exclude
            </button>
          )}
        </div>
      )}
    </div>
  );
}
