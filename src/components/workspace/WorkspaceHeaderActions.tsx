import { Copy, LayoutGrid, Share2, Wallet } from 'lucide-react';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { WorkspaceExportMenu } from './WorkspaceExportMenu';

export type WorkspaceMode = 'itinerary' | 'expenses';

interface WorkspaceHeaderActionsProps {
  detail: TripDetailDto;
  mode: WorkspaceMode;
  onChangeMode: (mode: WorkspaceMode) => void;
  connected: boolean;
  onlineCount: number;
  isReadOnlyDemo: boolean;
  onCloneDemo: () => void;
  onOpenMembers: () => void;
}

export function WorkspaceHeaderActions({
  detail,
  mode,
  onChangeMode,
  connected,
  onlineCount,
  isReadOnlyDemo,
  onCloneDemo,
  onOpenMembers,
}: WorkspaceHeaderActionsProps) {
  const { summary } = detail;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-0.5 text-xs">
        <button
          type="button"
          data-testid="ws-mode-itinerary"
          onClick={() => onChangeMode('itinerary')}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
            mode === 'itinerary'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5" /> Itinerary
        </button>
        <button
          type="button"
          data-testid="ws-mode-expenses"
          onClick={() => onChangeMode('expenses')}
          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold ${
            mode === 'expenses'
              ? 'bg-[var(--brand-primary)] text-white'
              : 'text-[var(--text-secondary)]'
          }`}
        >
          <Wallet className="h-3.5 w-3.5" /> Budgets & Splits
        </button>
      </div>

      <Badge
        variant={connected ? 'mint' : 'outline'}
        data-testid="realtime-status-badge"
      >
        {connected ? `Live (${onlineCount} online)` : 'Reconnecting'} · v
        {summary.version}
      </Badge>

      {isReadOnlyDemo && (
        <Button
          type="button"
          size="sm"
          data-testid="workspace-clone-demo-btn"
          onClick={onCloneDemo}
        >
          <Copy className="h-3.5 w-3.5" /> Clone Editable Copy
        </Button>
      )}
      <WorkspaceExportMenu tripId={summary.id} />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        data-testid="open-members-modal-btn"
        onClick={onOpenMembers}
      >
        <Share2 className="h-3.5 w-3.5" /> Members ({detail.members.length})
      </Button>
    </div>
  );
}
