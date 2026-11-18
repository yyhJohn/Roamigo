import { useCallback, useEffect, useState } from 'react';
import { generateItineraryApi } from './api';
import {
  calculateEstimatedCostPerPerson,
  countIncludedActivities,
  evaluateTravellerBudgets,
} from './budget';
import {
  TripSetupSchema,
  type Itinerary,
  type PersistedTripState,
  type Traveller,
  type TravellerInput,
  type TripSetup,
  type VoteDirection,
} from './schemas';
import {
  clearTripState,
  createDefaultTripState,
  loadTripState,
  saveTripState,
} from './storage';
import { castVote } from './voting';

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export function useTripState() {
  const [initialLoad] = useState(() => loadTripState());
  const [state, setState] = useState<PersistedTripState>(initialLoad.state);
  const [storageWarning, setStorageWarning] = useState<string | null>(
    initialLoad.warning,
  );
  const [isTripFormValid, setIsTripFormValid] = useState(true);
  const [activeVoterId, setActiveVoterId] = useState<string | null>(
    () => initialLoad.state.travellers[0]?.id ?? null,
  );
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const ok = saveTripState(state);
    if (!ok) {
      setStorageWarning('Changes could not be saved to browser storage.');
    }
  }, [state]);

  useEffect(() => {
    if (state.travellers.length === 0) {
      setActiveVoterId(null);
      return;
    }
    const stillExists = state.travellers.some((t) => t.id === activeVoterId);
    if (!stillExists) {
      setActiveVoterId(state.travellers[0]?.id ?? null);
    }
  }, [state.travellers, activeVoterId]);

  const updateTrip = useCallback((trip: TripSetup) => {
    setState((prev) => ({ ...prev, trip }));
  }, []);

  const addTraveller = useCallback((input: TravellerInput) => {
    const newTraveller: Traveller = { ...input, id: crypto.randomUUID() };
    setState((prev) => ({
      ...prev,
      travellers: [...prev.travellers, newTraveller],
    }));
    setActiveVoterId((prev) => prev ?? newTraveller.id);
  }, []);

  const updateTravellerBudget = useCallback(
    (travellerId: string, budget: number) => {
      setState((prev) => ({
        ...prev,
        travellers: prev.travellers.map((t) =>
          t.id === travellerId ? { ...t, budget } : t,
        ),
      }));
    },
    [],
  );

  const removeTraveller = useCallback((travellerId: string) => {
    setState((prev) => ({
      ...prev,
      travellers: prev.travellers.filter((t) => t.id !== travellerId),
      votes: Object.fromEntries(
        Object.entries(prev.votes).map(([actId, byTraveller]) => {
          const rest = { ...byTraveller };
          delete rest[travellerId];
          return [actId, rest];
        }),
      ),
    }));
  }, []);

  const toggleActivityIncluded = useCallback((activityId: string) => {
    setState((prev) => {
      if (!prev.itinerary) return prev;
      const nextItinerary: Itinerary = {
        ...prev.itinerary,
        days: prev.itinerary.days.map((day) => ({
          ...day,
          activities: day.activities.map((act) =>
            act.id === activityId ? { ...act, included: !act.included } : act,
          ),
        })),
      };
      return { ...prev, itinerary: nextItinerary };
    });
  }, []);

  const voteOnActivity = useCallback(
    (activityId: string, direction: VoteDirection) => {
      if (!activeVoterId) return;
      setState((prev) => ({
        ...prev,
        votes: castVote(prev.votes, activityId, activeVoterId, direction),
      }));
    },
    [activeVoterId],
  );

  const generateItinerary = useCallback(async () => {
    if (generationStatus === 'loading') return;
    const tripCheck = TripSetupSchema.safeParse(state.trip);
    if (!isTripFormValid || !tripCheck.success) {
      setGenerationStatus('error');
      setGenerationError('Fix the trip setup errors before generating.');
      return;
    }
    if (state.travellers.length === 0) {
      setGenerationStatus('error');
      setGenerationError('Add at least one traveller before generating.');
      return;
    }

    setGenerationStatus('loading');
    setGenerationError(null);
    try {
      const itinerary = await generateItineraryApi({
        trip: tripCheck.data,
        travellers: state.travellers,
      });
      setState((prev) => ({ ...prev, itinerary, votes: {} }));
      setGenerationStatus('success');
    } catch (err) {
      setGenerationStatus('error');
      setGenerationError(
        err instanceof Error ? err.message : 'Failed to generate itinerary.',
      );
    }
  }, [generationStatus, isTripFormValid, state.trip, state.travellers]);

  const resetTrip = useCallback(() => {
    clearTripState();
    setState(createDefaultTripState());
    setIsTripFormValid(true);
    setStorageWarning(null);
    setGenerationStatus('idle');
    setGenerationError(null);
  }, []);

  const estimatedCostPerPerson = state.itinerary
    ? calculateEstimatedCostPerPerson(state.itinerary.days)
    : 0;
  const activityCounts = state.itinerary
    ? countIncludedActivities(state.itinerary.days)
    : { included: 0, total: 0 };
  const budgetStatuses = evaluateTravellerBudgets(
    state.travellers,
    estimatedCostPerPerson,
  );

  return {
    state,
    storageWarning,
    activeVoterId,
    setActiveVoterId,
    setIsTripFormValid,
    generationStatus,
    generationError,
    estimatedCostPerPerson,
    activityCounts,
    budgetStatuses,
    updateTrip,
    addTraveller,
    updateTravellerBudget,
    removeTraveller,
    toggleActivityIncluded,
    voteOnActivity,
    generateItinerary,
    resetTrip,
  };
}
