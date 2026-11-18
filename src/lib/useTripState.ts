import { useCallback, useEffect, useState } from 'react';
import { generateItineraryApi } from './api';
import {
  calculateEstimatedCostPerPerson,
  countIncludedActivities,
  evaluateTravellerBudgets,
} from './budget';
import type {
  Itinerary,
  PersistedTripState,
  Traveller,
  TravellerInput,
  VoteDirection,
} from './schemas';
import {
  clearTripState,
  createDefaultTripState,
  loadTripState,
  saveTripState,
} from './storage';
import { toTripDraft, validateTripDraft, type TripDraft } from './tripDraft';
import { castVote } from './voting';

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export function useTripState() {
  const [initialLoad] = useState(() => loadTripState());
  const [state, setState] = useState<PersistedTripState>(initialLoad.state);
  const [tripDraft, setTripDraft] = useState<TripDraft>(() =>
    toTripDraft(initialLoad.state.trip),
  );
  const [tripErrors, setTripErrors] = useState<Record<string, string>>({});
  const [storageWarning, setStorageWarning] = useState<string | null>(
    initialLoad.warning,
  );
  const [activeVoterId, setActiveVoterId] = useState<string | null>(
    () => initialLoad.state.travellers[0]?.id ?? null,
  );
  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    const writeResult = saveTripState(state);
    if (!writeResult.ok) {
      setStorageWarning(writeResult.warning);
    }
  }, [state]);

  useEffect(() => {
    if (state.travellers.length === 0) {
      setActiveVoterId(null);
      return;
    }
    if (!state.travellers.some((t) => t.id === activeVoterId)) {
      setActiveVoterId(state.travellers[0]?.id ?? null);
    }
  }, [state.travellers, activeVoterId]);

  const updateTripDraft = useCallback((patch: Partial<TripDraft>) => {
    setTripDraft((prevDraft) => {
      const nextDraft = { ...prevDraft, ...patch };
      const check = validateTripDraft(nextDraft);
      setTripErrors(check.errors);
      if (check.ok) {
        setState((prevState) => ({ ...prevState, trip: check.trip }));
      }
      return nextDraft;
    });
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
    const check = validateTripDraft(tripDraft);
    setTripErrors(check.errors);
    if (!check.ok) {
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
        trip: check.trip,
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
  }, [generationStatus, tripDraft, state.travellers]);

  const resetTrip = useCallback(() => {
    const clearResult = clearTripState();
    const defaultState = createDefaultTripState();
    setState(defaultState);
    setTripDraft(toTripDraft(defaultState.trip));
    setTripErrors({});
    setStorageWarning(clearResult.warning);
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
  };
}
