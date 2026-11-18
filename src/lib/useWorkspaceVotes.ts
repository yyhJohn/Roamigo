import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';

function invalidateTrip(qc: ReturnType<typeof useQueryClient>, tripId: string) {
  void qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
  void qc.invalidateQueries({ queryKey: ['trips', 'list'] });
}

export function useCastVoteMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      direction,
    }: {
      activityId: string;
      direction: 'UP' | 'DOWN';
    }) =>
      apiRequest<{ voted: boolean; direction: 'UP' | 'DOWN' }>(
        `/api/trips/${tripId}/activities/${activityId}/vote`,
        { method: 'PUT', body: { direction } },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useRetractVoteMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      apiRequest<{ retracted: boolean }>(
        `/api/trips/${tripId}/activities/${activityId}/vote`,
        { method: 'DELETE' },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useSetActivityDecisionMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      decisionStatus,
    }: {
      activityId: string;
      decisionStatus: 'PROPOSED' | 'LOCKED_IN' | 'EXCLUDED';
    }) =>
      apiRequest<{ decisionStatus: string }>(
        `/api/trips/${tripId}/activities/${activityId}/decision`,
        { method: 'PATCH', body: { decisionStatus } },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}
