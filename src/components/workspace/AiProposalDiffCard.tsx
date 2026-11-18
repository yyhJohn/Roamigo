import { Check, X } from 'lucide-react';
import type { StagedAiProposalDto } from '../../lib/contracts/ai.schemas';
import type { Currency } from '../../lib/schemas';
import { formatMinorCurrency } from '../../lib/domain/money';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AiProposalDiffCardProps {
  proposal: StagedAiProposalDto;
  currency: Currency;
  canApply: boolean;
  applying: boolean;
  onConfirmApply: () => void;
  onDiscard: () => void;
}

export function AiProposalDiffCard({
  proposal,
  currency,
  canApply,
  applying,
  onConfirmApply,
  onDiscard,
}: AiProposalDiffCardProps) {
  return (
    <div
      data-testid="ai-diff-preview"
      className="space-y-3 rounded-xl border border-[var(--brand-primary)]/40 bg-[var(--bg-subtle)] p-3.5 text-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <Badge variant="mint">Staged Before / After Preview</Badge>
        <span className="font-bold">
          {formatMinorCurrency(
            proposal.budgetImpact.beforePerPersonMinor,
            currency,
            { est: true },
          )}{' '}
          →{' '}
          {formatMinorCurrency(
            proposal.budgetImpact.afterPerPersonMinor,
            currency,
            { est: true },
          )}
        </span>
      </div>
      <p className="font-semibold">{proposal.summary}</p>
      <p className="text-[11px] text-[var(--text-secondary)]">
        {proposal.reasoning}
      </p>

      <ul className="space-y-1.5">
        {proposal.changes.map((c) => (
          <li
            key={`${c.dayNumber}-${c.stableKey}`}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5"
          >
            <span className="font-bold">
              Day {c.dayNumber} [{c.changeType}]:{' '}
            </span>
            {c.beforeTitle && (
              <span className="line-through opacity-70">{c.beforeTitle} </span>
            )}
            {c.afterTitle && <span>→ {c.afterTitle}</span>}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 pt-1">
        {canApply && (
          <Button
            type="button"
            size="sm"
            data-testid="ai-apply-confirm-btn"
            disabled={applying}
            onClick={onConfirmApply}
          >
            <Check className="h-3.5 w-3.5" />
            Apply Changes
          </Button>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-testid="ai-discard-btn"
          onClick={onDiscard}
        >
          <X className="h-3.5 w-3.5" />
          Discard
        </Button>
      </div>
    </div>
  );
}
