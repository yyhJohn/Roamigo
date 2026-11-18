import { ThumbsDown, ThumbsUp } from 'lucide-react';
import { formatCurrencyEstimate } from '../lib/budget';
import type { Activity, Currency, VoteDirection, VotesMap } from '../lib/schemas';
import { getTravellerVote, tallyActivityVotes } from '../lib/voting';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

interface ActivityCardProps {
  activity: Activity;
  currency: Currency;
  votes: VotesMap;
  activeVoterId: string | null;
  activeVoterName: string | null;
  onToggleIncluded: (activityId: string) => void;
  onVote: (activityId: string, direction: VoteDirection) => void;
}

export function ActivityCard({
  activity,
  currency,
  votes,
  activeVoterId,
  activeVoterName,
  onToggleIncluded,
  onVote,
}: ActivityCardProps) {
  const tally = tallyActivityVotes(votes, activity.id);
  const currentVote = getTravellerVote(votes, activity.id, activeVoterId);

  return (
    <article
      data-testid={`activity-card-${activity.id}`}
      className={`rounded-xl border p-4 transition ${
        activity.included
          ? 'border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs'
          : 'border-dashed border-[var(--border-strong)] bg-[var(--bg-canvas)] opacity-75'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="mint" className="capitalize">
              {activity.timeSlot}
            </Badge>
            <Badge
              data-testid={`activity-cost-${activity.id}`}
              variant="outline"
              className="tabular-nums"
            >
              Est. {formatCurrencyEstimate(activity.estimatedCostPerPerson, currency)}{' '}
              / person
            </Badge>
            {!activity.included && <Badge variant="warning">Excluded</Badge>}
          </div>

          <h4 className="font-display mt-2 text-base font-bold text-[var(--text-primary)]">
            {activity.title}
          </h4>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {activity.description}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant={activity.included ? 'secondary' : 'primary'}
          aria-pressed={activity.included}
          data-testid={`toggle-include-${activity.id}`}
          onClick={() => onToggleIncluded(activity.id)}
        >
          {activity.included ? 'Exclude' : 'Include'}
        </Button>
      </div>

      <div className="mt-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 text-xs text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">
          Group balance &amp; compromise:
        </span>{' '}
        {activity.compromiseExplanation}
        {activity.matchedTravellers.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activity.matchedTravellers.map((name) => (
              <Badge key={name} variant="outline">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!activeVoterId}
            aria-pressed={currentVote === 'up'}
            data-testid={`vote-up-${activity.id}`}
            onClick={() => onVote(activity.id, 'up')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              currentVote === 'up'
                ? 'bg-[var(--status-success)] text-white'
                : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Upvote</span>
            <span data-testid={`up-count-${activity.id}`} className="tabular-nums">
              {tally.upCount}
            </span>
          </button>

          <button
            type="button"
            disabled={!activeVoterId}
            aria-pressed={currentVote === 'down'}
            data-testid={`vote-down-${activity.id}`}
            onClick={() => onVote(activity.id, 'down')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              currentVote === 'down'
                ? 'bg-[var(--status-error)] text-white'
                : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]'
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>Downvote</span>
            <span
              data-testid={`down-count-${activity.id}`}
              className="tabular-nums"
            >
              {tally.downCount}
            </span>
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)]">
          <span
            data-testid={`net-score-${activity.id}`}
            className="tabular-nums font-semibold text-[var(--text-primary)]"
          >
            Net score: {tally.netScore >= 0 ? `+${tally.netScore}` : tally.netScore}
          </span>
          {activeVoterName ? ` · Voting as ${activeVoterName}` : ''}
        </p>
      </div>
    </article>
  );
}
