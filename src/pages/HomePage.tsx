import { BudgetSummaryBar } from '../components/BudgetSummaryBar';
import { ItineraryPanel } from '../components/ItineraryPanel';
import { LandingFeaturesFaq } from '../components/landing/LandingFeaturesFaq';
import { LandingHero } from '../components/landing/LandingHero';
import { TopMarketingNav } from '../components/layout/TopMarketingNav';
import { TravellerForm } from '../components/TravellerForm';
import { TravellerList } from '../components/TravellerList';
import { TripSetupForm } from '../components/TripSetupForm';
import { useToast } from '../components/ui/ToastProvider';
import { useTripState } from '../lib/useTripState';

export function HomePage() {
  const { pushToast } = useToast();
  const {
    state,
    tripDraft,
    tripErrors,
    storageWarning,
    activeVoterId,
    setActiveVoterId,
    generationStatus,
    generationError,
    estimatedCostPerPerson,
    activityCounts,
    budgetStatuses,
    updateTripDraft,
    addTraveller,
    updateTravellerBudget,
    removeTraveller,
    toggleActivityIncluded,
    voteOnActivity,
    generateItinerary,
    resetTrip,
  } = useTripState();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <TopMarketingNav onResetSandbox={resetTrip} />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6">
        {storageWarning && (
          <div
            role="status"
            data-testid="storage-warning"
            className="rounded-xl border border-[var(--status-warning)]/40 bg-[var(--status-warning-bg)] px-4 py-3 text-xs font-semibold text-[var(--status-warning)]"
          >
            {storageWarning}
          </div>
        )}

        <section id="instant-sandbox" aria-label="Instant group planner" className="space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
                Instant Group Consensus Planner
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Configure destinations, add travellers, vote on activities, and
                verify deterministic budget alerts right away.
              </p>
            </div>
          </div>

          <BudgetSummaryBar
            currency={tripDraft.currency}
            estimatedCostPerPerson={estimatedCostPerPerson}
            includedCount={activityCounts.included}
            totalCount={activityCounts.total}
            budgetStatuses={budgetStatuses}
            hasItinerary={state.itinerary !== null}
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-5">
              <TripSetupForm
                draft={tripDraft}
                errors={tripErrors}
                onChangeDraft={updateTripDraft}
              />
              <TravellerForm
                currency={tripDraft.currency}
                existingTravellers={state.travellers}
                onAddTraveller={addTraveller}
              />
              <TravellerList
                travellers={state.travellers}
                currency={tripDraft.currency}
                budgetStatuses={budgetStatuses}
                hasItinerary={state.itinerary !== null}
                onRemoveTraveller={removeTraveller}
                onUpdateTravellerBudget={updateTravellerBudget}
              />
            </div>

            <div className="lg:col-span-7">
              <ItineraryPanel
                currency={tripDraft.currency}
                travellers={state.travellers}
                itinerary={state.itinerary}
                votes={state.votes}
                activeVoterId={activeVoterId}
                generationStatus={generationStatus}
                generationError={generationError}
                onSelectVoter={setActiveVoterId}
                onGenerate={generateItinerary}
                onToggleIncluded={toggleActivityIncluded}
                onVote={voteOnActivity}
              />
            </div>
          </div>
        </section>

        <LandingHero
          onPickDestination={(city) => {
            updateTripDraft({ destinationsText: city });
            pushToast(`Set destination to ${city}`, 'success');
          }}
        />

        <LandingFeaturesFaq />
      </main>
    </div>
  );
}
