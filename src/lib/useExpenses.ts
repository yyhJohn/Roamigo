import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type {
  CreateExpenseInput,
  UpdateBudgetInput,
} from './contracts/expense.schemas';

function invalidateTrip(qc: ReturnType<typeof useQueryClient>, tripId: string) {
  void qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
  void qc.invalidateQueries({ queryKey: ['trips', 'list'] });
}

export function useUpdateBudgetMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBudgetInput) =>
      apiRequest<{ updated: boolean }>(`/api/trips/${tripId}/budget`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useCreateExpenseMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) =>
      apiRequest<{ expenseId: string }>(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useDeleteExpenseMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) =>
      apiRequest<{ deleted: boolean }>(
        `/api/trips/${tripId}/expenses/${expenseId}`,
        { method: 'DELETE' },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}

export function useUpdateSettlementMutation(tripId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      settlementId,
      status,
    }: {
      settlementId: string;
      status: 'SUGGESTED' | 'MARKED_PAID';
    }) =>
      apiRequest<{ status: string }>(
        `/api/trips/${tripId}/settlements/${settlementId}`,
        { method: 'PATCH', body: { status } },
      ),
    onSuccess: () => invalidateTrip(qc, tripId),
  });
}
