import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Circle,
  GripVertical,
  MapPin,
  Pencil,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import type { WorkspaceActivityDto } from '../../lib/contracts/tripDetail.types';
import { formatMinorCurrency } from '../../lib/domain/money';
import type { Currency } from '../../lib/schemas';
import { Badge } from '../ui/Badge';

interface WorkspaceActivityCardProps {
  activity: WorkspaceActivityDto;
  currency: Currency;
  index: number;
  totalInDay: number;
  isSelected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleIncluded: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDropOnThis: () => void;
}

export function WorkspaceActivityCard({
  activity,
  currency,
  index,
  totalInDay,
  isSelected,
  canEdit,
  onSelect,
  onMoveUp,
  onMoveDown,
  onToggleIncluded,
  onEdit,
  onDelete,
  onDragStart,
  onDropOnThis,
}: WorkspaceActivityCardProps) {
  const upVotes = activity.votes.filter((v) => v.direction === 'UP').length;
  const downVotes = activity.votes.filter((v) => v.direction === 'DOWN').length;
  const hasCoords = activity.lat !== null && activity.lng !== null;

  return (
    <article
      id={`workspace-activity-${activity.id}`}
      data-testid={`workspace-activity-card-${activity.id}`}
      draggable={canEdit}
      onDragStart={onDragStart}
      onDragOver={(e) => {
        if (canEdit) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (canEdit) onDropOnThis();
      }}
      onClick={onSelect}
      className={`rounded-xl border p-3.5 text-xs transition ${
        isSelected
          ? 'border-[var(--brand-primary)] bg-[var(--bg-surface)] ring-2 ring-[var(--brand-accent)]'
          : 'border-[var(--border-default)] bg-[var(--bg-canvas)] hover:border-[var(--brand-primary)]/50'
      } ${activity.included ? '' : 'opacity-60'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {canEdit && (
            <GripVertical
              aria-hidden="true"
              className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-[var(--text-muted)]"
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="mint">{activity.timeSlot}</Badge>
              <Badge variant="outline">{activity.category}</Badge>
              {activity.startTime && (
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  {activity.startTime}
                  {activity.endTime ? `–${activity.endTime}` : ''}
                </span>
              )}
              {activity.decisionStatus === 'LOCKED_IN' && (
                <Badge variant="success">Locked In</Badge>
              )}
            </div>
            <h4 className="mt-1.5 font-display text-sm font-bold text-[var(--text-primary)]">
              {activity.title}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <span className="font-display text-xs font-extrabold">
            {formatMinorCurrency(activity.estimatedCostMinor, currency, {
              est: true,
            })}
          </span>
        </div>
      </div>

      <p className="mt-1.5 leading-relaxed text-[var(--text-secondary)]">
        {activity.description}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid={`focus-map-${activity.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <MapPin
              className={`h-3.5 w-3.5 ${
                hasCoords
                  ? 'text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)]'
              }`}
            />
            {activity.locationName ||
              (hasCoords ? 'Pinned on map' : 'Unmapped stop')}
          </button>

          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <ThumbsUp className="h-3 w-3" /> {upVotes}
            <ThumbsDown className="ml-1 h-3 w-3" /> {downVotes}
          </span>
        </div>

        {canEdit && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Toggle included in itinerary"
              data-testid={`toggle-included-${activity.id}`}
              onClick={onToggleIncluded}
              className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium hover:bg-[var(--bg-subtle)]"
            >
              {activity.included ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--status-success)]" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              )}
              {activity.included ? 'Included' : 'Excluded'}
            </button>
            <button
              type="button"
              aria-label="Move activity up"
              data-testid={`move-up-${activity.id}`}
              disabled={index === 0}
              onClick={onMoveUp}
              className="rounded p-1 hover:bg-[var(--bg-subtle)] disabled:opacity-30"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Move activity down"
              data-testid={`move-down-${activity.id}`}
              disabled={index >= totalInDay - 1}
              onClick={onMoveDown}
              className="rounded p-1 hover:bg-[var(--bg-subtle)] disabled:opacity-30"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Edit activity"
              data-testid={`edit-activity-${activity.id}`}
              onClick={onEdit}
              className="rounded p-1 hover:bg-[var(--bg-subtle)]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Delete activity"
              data-testid={`delete-activity-${activity.id}`}
              onClick={onDelete}
              className="rounded p-1 text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
