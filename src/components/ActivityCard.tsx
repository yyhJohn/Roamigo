import { formatCurrencyEstimate } from '../lib/budget';
import type { Activity, Currency, VoteDirection, VotesMap } from '../lib/schemas';
import { getTravellerVote, tallyActivityVotes } from '../lib/voting';

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
          ? 'border-slate-200 bg-white shadow-xs'
          : 'border-dashed border-slate-300 bg-slate-50 opacity-75'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold capitalize text-indigo-700">
              {activity.timeSlot}
            </span>
            <span
              data-testid={`activity-cost-${activity.id}`}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800"
            >
              Est. {formatCurrencyEstimate(activity.estimatedCostPerPerson, currency)}{' '}
              / person
            </span>
            {!activity.included && (
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Excluded
              </span>
            )}
          </div>

          <h4 className="mt-2 text-base font-semibold text-slate-900">
            {activity.title}
          </h4>
          <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
        </div>

        <button
          type="button"
          aria-pressed={activity.included}
          data-testid={`toggle-include-${activity.id}`}
          onClick={() => onToggleIncluded(activity.id)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activity.included
              ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {activity.included ? 'Exclude' : 'Include'}
        </button>
      </div>

      <div className="mt-3 rounded-lg bg-indigo-50/60 p-3 text-xs text-slate-700">
        <span className="font-semibold text-indigo-900">
          Group balance &amp; compromise:
        </span>{' '}
        {activity.compromiseExplanation}
        {activity.matchedTravellers.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {activity.matchedTravellers.map((name) => (
              <span
                key={name}
                className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-indigo-800 ring-1 ring-indigo-200"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!activeVoterId}
            aria-pressed={currentVote === 'up'}
            data-testid={`vote-up-${activity.id}`}
            onClick={() => onVote(activity.id, 'up')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              currentVote === 'up'
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Upvote</span>
            <span data-testid={`up-count-${activity.id}`}>{tally.upCount}</span>
          </button>

          <button
            type="button"
            disabled={!activeVoterId}
            aria-pressed={currentVote === 'down'}
            data-testid={`vote-down-${activity.id}`}
            onClick={() => onVote(activity.id, 'down')}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              currentVote === 'down'
                ? 'bg-rose-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Downvote</span>
            <span data-testid={`down-count-${activity.id}`}>
              {tally.downCount}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-500">
          <span
            data-testid={`net-score-${activity.id}`}
            className="font-semibold text-slate-700"
          >
            Net score: {tally.netScore >= 0 ? `+${tally.netScore}` : tally.netScore}
          </span>
          {activeVoterName ? ` · Voting as ${activeVoterName}` : ''}
        </p>
      </div>
    </article>
  );
}
