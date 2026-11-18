import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiClientError, apiRequest } from '../../lib/apiClient';
import type { StagedAiProposalDto } from '../../lib/contracts/ai.schemas';
import { useToast } from '../ui/ToastProvider';

export function useAiAssistant(tripId: string) {
  const qc = useQueryClient();
  const { pushToast } = useToast();
  const abortRef = useRef<AbortController | null>(null);

  const [instruction, setInstruction] = useState('');
  const [busyMode, setBusyMode] = useState<
    'generate' | 'propose' | 'apply' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<StagedAiProposalDto | null>(null);

  function cancelPending() {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusyMode(null);
  }

  async function handleGenerateFull() {
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusyMode('generate');
    try {
      const out = await apiRequest<{ versionNumber: number }>(
        `/api/trips/${tripId}/itinerary/generate`,
        { method: 'POST', signal: ctrl.signal },
      );
      await qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
      await qc.invalidateQueries({ queryKey: ['trips', 'list'] });
      pushToast(`Generated itinerary Version ${out.versionNumber}!`, 'success');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'AI itinerary generation failed.',
      );
    } finally {
      setBusyMode(null);
    }
  }

  async function handlePropose(e?: React.FormEvent) {
    e?.preventDefault();
    if (!instruction.trim()) return;
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusyMode('propose');
    try {
      const out = await apiRequest<{ proposal: StagedAiProposalDto }>(
        `/api/trips/${tripId}/ai/propose`,
        {
          method: 'POST',
          body: { instruction: instruction.trim() },
          signal: ctrl.signal,
        },
      );
      setProposal(out.proposal);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Could not generate AI proposal.',
      );
    } finally {
      setBusyMode(null);
    }
  }

  async function handleConfirmApply() {
    if (!proposal) return;
    setBusyMode('apply');
    setError(null);
    try {
      const out = await apiRequest<{ versionNumber: number }>(
        `/api/trips/${tripId}/ai/apply`,
        {
          method: 'POST',
          body: { summary: proposal.summary, days: proposal.days },
        },
      );
      setProposal(null);
      setInstruction('');
      await qc.invalidateQueries({ queryKey: ['trips', 'detail', tripId] });
      pushToast(
        `Applied AI changes as Version ${out.versionNumber}!`,
        'success',
      );
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Failed to apply proposal.',
      );
    } finally {
      setBusyMode(null);
    }
  }

  return {
    instruction,
    setInstruction,
    busyMode,
    error,
    proposal,
    setProposal,
    cancelPending,
    handleGenerateFull,
    handlePropose,
    handleConfirmApply,
  };
}
