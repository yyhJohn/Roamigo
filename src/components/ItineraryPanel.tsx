import type {
  Currency,
  Itinerary,
  Traveller,
  VoteDirection,
  VotesMap,
} from '../lib/schemas';
import type { GenerationStatus } from '../lib/useTripState';
import { ActivityCard } from './ActivityCard';

interface ItineraryPanelProps {
  currency: Currency;
  travellers: Traveller[];
  itinerary: Itinerary | null;
  votes: VotesMap;
  activeVoterId: string | null;
  generationStatus: GenerationStatus;
  generationError: string | null;
  onSelectVoter: (travellerId: string) => void;
  onGenerate: () => void;
  onToggleIncluded: (activityId: string) => void;
  onVote: (activityId: string, direction: VoteDirection) => void;
}

export function ItineraryPanel({
  currency,
  travellers,
  itinerary,
  votes,
  activeVoterId,
  generationStatus,
  generationError,
  onSelectVoter,
  onGenerate,
  onToggleIncluded,
  onVote,
}: ItineraryPanelProps) {
  const isLoading = generationStatus === 'loading';
  const activeVoterName =
    travellers.find((t) => t.id === activeVoterId)?.name ?? null;

  return (
    <section
      aria-label="Shared itinerary"
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            3. Shared AI Itinerary &amp; Voting
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Generate a balanced day-by-day plan, vote on activities, and adjust
            inclusions.
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading}
          aria-busy={isLoading}
          data-testid="generate-itinerary-btn"
          onClick={onGenerate}
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Generating Itinerary...' : 'Generate Itinerary'}
        </button>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          data-testid="itinerary-loading"
          className="mt-4 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-800"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <span>
            Balancing group budgets and interests with Gemini. This may take a
            few seconds...
          </span>
        </div>
      )}

      {generationStatus === 'error' && generationError && (
        <div
          role="alert"
          data-testid="itinerary-error"
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <p className="font-semibold">Unable to generate itinerary</p>
          <p className="mt-1">{generationError}</p>
          <button
            type="button"
            onClick={onGenerate}
            className="mt-3 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
          >
            Try Again
          </button>
        </div>
      )}

      {!itinerary && !isLoading && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            No itinerary generated yet.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Add your trip setup and travellers, then click{' '}
            <span className="font-semibold">Generate Itinerary</span>.
          </p>
        </div>
      )}

      {itinerary && (
        <div className="mt-5 space-y-5" data-testid="itinerary-content">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {itinerary.chosenDestination}
              </h3>
              <span className="text-xs text-slate-500">
                Generated {new Date(itinerary.generatedAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-700">{itinerary.overview}</p>
            <p className="mt-2 text-xs text-indigo-900">
              <span className="font-semibold">Group compromise summary:</span>{' '}
              {itinerary.compromiseSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <label
              htmlFor="active-voter-select"
              className="text-sm font-medium text-slate-700"
            >
              Voting as:
            </label>
            {travellers.length === 0 ? (
              <span className="text-xs text-slate-500">
                Add a traveller to vote on activities
              </span>
            ) : (
              <select
                id="active-voter-select"
                data-testid="active-voter-select"
                value={activeVoterId ?? ''}
                onChange={(e) => onSelectVoter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {travellers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-6">
            {itinerary.days.map((day) => (
              <div
                key={day.dayNumber}
                data-testid={`itinerary-day-${day.dayNumber}`}
                className="space-y-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2">
                  <h3 className="text-base font-bold text-slate-900">
                    Day {day.dayNumber}: {day.theme}
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    {day.date}
                  </span>
                </div>
                <div className="space-y-3">
                  {day.activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      currency={currency}
                      votes={votes}
                      activeVoterId={activeVoterId}
                      activeVoterName={activeVoterName}
                      onToggleIncluded={onToggleIncluded}
                      onVote={onVote}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
