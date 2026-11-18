import { BudgetSummaryBar } from './components/BudgetSummaryBar';
import { ItineraryPanel } from './components/ItineraryPanel';
import { TravellerForm } from './components/TravellerForm';
import { TravellerList } from './components/TravellerList';
import { TripSetupForm } from './components/TripSetupForm';
import { useTripState } from './lib/useTripState';

export function App() {
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-indigo-700">
              Roamigo
            </h1>
            <p className="text-xs font-medium text-slate-500">
              Plan Together, Travel Better.
            </p>
          </div>

          <button
            type="button"
            onClick={resetTrip}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Reset Trip
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {storageWarning && (
          <div
            role="status"
            data-testid="storage-warning"
            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800"
          >
            {storageWarning}
          </div>
        )}

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
      </main>
    </div>
  );
}

export default App;
