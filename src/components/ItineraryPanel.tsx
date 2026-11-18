import { Sparkles } from 'lucide-react';
import type {
  Currency,
  Itinerary,
  Traveller,
  VoteDirection,
  VotesMap,
} from '../lib/schemas';
import type { GenerationStatus } from '../lib/useTripState';
import { ActivityCard } from './ActivityCard';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import { Skeleton } from './ui/Skeleton';

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
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
            3. Shared AI Itinerary &amp; Voting
          </h2>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
            Generate a balanced day-by-day plan, vote on activities, and adjust
            inclusions.
          </p>
        </div>

        <Button
          type="button"
          disabled={isLoading}
          aria-busy={isLoading}
          data-testid="generate-itinerary-btn"
          onClick={onGenerate}
        >
          <Sparkles className="h-4 w-4" />
          {isLoading ? 'Generating Itinerary...' : 'Generate Itinerary'}
        </Button>
      </div>

      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          data-testid="itinerary-loading"
          className="mt-4 space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4"
        >
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Balancing group budgets and interests. This may take a few seconds...
          </p>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {generationStatus === 'error' && generationError && (
        <div
          role="alert"
          data-testid="itinerary-error"
          className="mt-4 rounded-xl border border-[var(--status-error)]/30 bg-[var(--status-error-bg)] p-4 text-xs text-[var(--status-error)]"
        >
          <p className="font-bold">Unable to generate itinerary</p>
          <p className="mt-1">{generationError}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onGenerate}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      )}

      {!itinerary && !isLoading && (
        <EmptyState
          className="mt-5"
          icon={<Sparkles className="h-5 w-5" />}
          title="No itinerary generated yet"
          description="Add your trip setup and travellers on the left, then click Generate Itinerary to create a balanced day-by-day plan."
        />
      )}

      {itinerary && (
        <div className="mt-5 space-y-5" data-testid="itinerary-content">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
                {itinerary.chosenDestination}
              </h3>
              <span className="text-xs text-[var(--text-secondary)]">
                Generated {new Date(itinerary.generatedAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-primary)]">
              {itinerary.overview}
            </p>
            <p className="mt-2 text-xs text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">
                Group compromise summary:
              </span>{' '}
              {itinerary.compromiseSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-4 py-3">
            <label
              htmlFor="active-voter-select"
              className="text-xs font-semibold text-[var(--text-primary)]"
            >
              Voting as:
            </label>
            {travellers.length === 0 ? (
              <span className="text-xs text-[var(--text-secondary)]">
                Add a traveller to vote on activities
              </span>
            ) : (
              <select
                id="active-voter-select"
                data-testid="active-voter-select"
                value={activeVoterId ?? ''}
                onChange={(e) => onSelectVoter(e.target.value)}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
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
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-default)] pb-2">
                  <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                    Day {day.dayNumber}: {day.theme}
                  </h3>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
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
