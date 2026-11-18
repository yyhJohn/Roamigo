import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type {
  CreateActivityInput,
  CreateManualDayInput,
  PlaceCandidateDto,
  ReorderActivityInput,
  UpdateActivityInput,
} from './contracts/activity.schemas';

function invalidateTrip(qc: ReturnType<typeof useQueryClient>, tripId: string) {
  void qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
  void qc.invalidateQueries({ queryKey: ['trips', 'list'] });
}

export function useAddDayMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateManualDayInput) =>
      apiRequest<{ dayId: string; dayNumber: number }>(
        `/api/trips/${tripId}/days`,
        { method: 'POST', body: input },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useCreateActivityMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateActivityInput) =>
      apiRequest<{ activityId: string }>(`/api/trips/${tripId}/activities`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useUpdateActivityMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      activityId,
      patch,
    }: {
      activityId: string;
      patch: UpdateActivityInput;
    }) =>
      apiRequest<{ updated: boolean }>(
        `/api/trips/${tripId}/activities/${activityId}`,
        { method: 'PATCH', body: patch },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useDeleteActivityMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      apiRequest<{ deleted: boolean }>(
        `/api/trips/${tripId}/activities/${activityId}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useReorderActivityMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReorderActivityInput) =>
      apiRequest<{ reordered: boolean }>(
        `/api/trips/${tripId}/activities/reorder`,
        { method: 'POST', body: input },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useSearchMapPlacesQuery(
  tripId: string,
  query: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['maps', 'search', tripId, query],
    enabled,
    queryFn: () =>
      apiRequest<{ provider: string; places: PlaceCandidateDto[] }>(
        `/api/trips/${tripId}/maps/search?q=${encodeURIComponent(query)}`,
      ),
  });
}
