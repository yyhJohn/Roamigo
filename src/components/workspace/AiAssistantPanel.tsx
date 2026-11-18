import { RotateCcw, Sparkles, Wand2 } from 'lucide-react';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AiProposalDiffCard } from './AiProposalDiffCard';
import { useAiAssistant } from './useAiAssistant';

const QUICK_PROMPTS = [
  'Reduce Day 2 spend by £25 per person',
  'Add a vegetarian-friendly local market lunch',
  'Make Day 1 morning pace more relaxed',
] as const;

export function AiAssistantPanel({ detail }: { detail: TripDetailDto }) {
  const {
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
  } = useAiAssistant(detail.summary.id);

  const isReadOnlyDemo = detail.summary.isDemo || detail.isDemoReadOnly;
  const canApply =
    !isReadOnlyDemo &&
    (detail.summary.myRole === 'OWNER' || detail.summary.myRole === 'EDITOR');
  const canPropose = !isReadOnlyDemo && detail.summary.myRole !== 'VIEWER';

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
          <h3 className="font-display text-sm font-bold">AI Travel Assistant</h3>
        </div>
        {canApply && (
          <Button
            type="button"
            size="sm"
            variant={detail.itinerary ? 'secondary' : 'primary'}
            data-testid="workspace-ai-generate-btn"
            disabled={busyMode !== null}
            onClick={() => void handleGenerateFull()}
          >
            <Wand2 className="h-3.5 w-3.5" />
            {detail.itinerary ? 'Regenerate Plan' : 'Generate AI Itinerary'}
          </Button>
        )}
      </div>

      {isReadOnlyDemo && (
        <p className="rounded-lg bg-[var(--bg-subtle)] p-2.5 text-xs text-[var(--text-secondary)]">
          Clone this demo trip to generate new AI versions or propose assistant
          edits.
        </p>
      )}

      {detail.itinerary && canPropose && (
        <form onSubmit={(e) => void handlePropose(e)} className="space-y-2.5">
          <textarea
            rows={2}
            aria-label="Ask AI assistant to refine itinerary"
            data-testid="ai-assist-input"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="e.g. Swap Day 2 morning for a lower-cost viewpoint walk…"
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-2.5 text-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInstruction(q)}
                className="rounded-full border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[11px] hover:border-[var(--brand-primary)]"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              data-testid="ai-propose-btn"
              disabled={busyMode !== null || instruction.trim().length < 4}
            >
              Preview Changes
            </Button>
            {busyMode && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="ai-cancel-btn"
                onClick={cancelPending}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}

      {error && (
        <div
          role="alert"
          data-testid="workspace-ai-error"
          className="flex items-center justify-between gap-2 rounded-lg border border-red-300 bg-[var(--status-danger-bg)] p-2.5 text-xs text-[var(--status-danger)]"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() =>
              void (instruction.trim() ? handlePropose() : handleGenerateFull())
            }
            className="inline-flex shrink-0 items-center gap-1 font-semibold underline"
          >
            <RotateCcw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}

      {proposal && (
        <AiProposalDiffCard
          proposal={proposal}
          currency={detail.summary.currency}
          canApply={canApply}
          applying={busyMode === 'apply'}
          onConfirmApply={() => void handleConfirmApply()}
          onDiscard={() => setProposal(null)}
        />
      )}
    </Card>
  );
}
