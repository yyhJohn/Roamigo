import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type {
  TripRoleValue,
  TripSummaryDto,
  WizardTripPayload,
} from './contracts/trip.schemas';
import type { TripDetailDto } from './contracts/tripDetail.types';

export function useTripsListQuery(params: {
  filter: string;
  search: string;
  sort: string;
}) {
  const qs = new URLSearchParams({
    filter: params.filter,
    ...(params.search.trim() ? { search: params.search.trim() } : {}),
    sort: params.sort,
  });
  return useQuery({
    queryKey: ['trips', 'list', params],
    queryFn: () =>
      apiRequest<{ trips: TripSummaryDto[] }>(`/api/trips?${qs.toString()}`),
  });
}

export function useTripDetailQuery(tripId: string | undefined) {
  return useQuery({
    queryKey: ['trips', 'detail', tripId],
    enabled: Boolean(tripId),
    queryFn: () => apiRequest<TripDetailDto>(`/api/trips/${tripId}`),
  });
}

export function useSaveWizardMutation(existingTripId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WizardTripPayload) =>
      existingTripId
        ? apiRequest<{ tripId: string }>(`/api/trips/${existingTripId}/wizard`, {
            method: 'PUT',
            body: payload,
          })
        : apiRequest<{ tripId: string }>('/api/trips', {
            method: 'POST',
            body: payload,
          }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['trips'] });
      void qc.invalidateQueries({ queryKey: ['trips', 'detail', res.tripId] });
    },
  });
}

export function useImportLocalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rawState: unknown) =>
      apiRequest<{ tripId: string }>('/api/trips/import-local', {
        method: 'POST',
        body: rawState,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useCloneTripMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) =>
      apiRequest<{ tripId: string }>(`/api/trips/${tripId}/clone`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useArchiveTripMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) =>
      apiRequest<{ archived: boolean }>(`/api/trips/${tripId}/archive`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useDeleteTripMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) =>
      apiRequest<{ deleted: boolean }>(`/api/trips/${tripId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useCreateInvitationMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: 'EDITOR' | 'MEMBER' | 'VIEWER' }) =>
      apiRequest<{
        inviteToken: string;
        inviteUrl: string;
      }>(`/api/trips/${tripId}/invitations`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
    },
  });
}

export function useUpdateMemberRoleMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { memberId: string; role: TripRoleValue }) =>
      apiRequest<{ updated: boolean }>(
        `/api/trips/${tripId}/members/${input.memberId}`,
        {
          method: 'PATCH',
          body: { role: input.role },
        },
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
    },
  });
}
