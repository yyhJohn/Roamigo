import { useState } from 'react';
import { CalendarPlus, Plus } from 'lucide-react';
import type {
  TripDetailDto,
  WorkspaceActivityDto,
} from '../../lib/contracts/tripDetail.types';
import { formatMinorCurrency } from '../../lib/domain/money';
import { useSessionQuery } from '../../lib/useAuth';
import {
  useAddDayMutation,
  useDeleteActivityMutation,
  useReorderActivityMutation,
  useUpdateActivityMutation,
} from '../../lib/useWorkspaceActivities';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ActivityFormModal } from './ActivityFormModal';
import { WorkspaceActivityCard } from './WorkspaceActivityCard';

interface WorkspaceTimelineProps {
  detail: TripDetailDto;
  selectedDayNumber: number | null;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
  canVote: boolean;
  canEdit: boolean;
}

export function WorkspaceTimeline({
  detail,
  selectedDayNumber,
  selectedActivityId,
  onSelectActivity,
  canVote,
  canEdit,
}: WorkspaceTimelineProps) {
  const { summary, itinerary } = detail;
  const sessionQuery = useSessionQuery();
  const viewerUserId = sessionQuery.data?.user?.id;
  const addDayMut = useAddDayMutation(summary.id);
  const updateMut = useUpdateActivityMutation(summary.id);
  const deleteMut = useDeleteActivityMutation(summary.id);
  const reorderMut = useReorderActivityMutation(summary.id);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDayId, setModalDayId] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] =
    useState<WorkspaceActivityDto | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const visibleDays =
    itinerary?.days.filter(
      (d) => selectedDayNumber === null || d.dayNumber === selectedDayNumber,
    ) ?? [];

  return (
    <div className="space-y-4" data-testid="workspace-timeline">
      {itinerary ? (
        <>
          <Card className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge variant="mint">
                Itinerary v{itinerary.versionNumber} · {itinerary.source}
              </Badge>
              <span className="font-display text-xs font-bold">
                {formatMinorCurrency(
                  summary.estimatedPerPersonMinor,
                  summary.currency,
                  { est: true },
                )}{' '}
                / traveller
              </span>
            </div>
            <p className="text-sm font-medium">{itinerary.overview}</p>
            <p className="text-xs text-[var(--text-secondary)]">
              {itinerary.compromiseSummary}
            </p>
          </Card>

          {visibleDays.map((day) => (
            <Card
              key={day.id}
              data-testid={`timeline-day-${day.dayNumber}`}
              className="space-y-3 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold">
                    Day {day.dayNumber} · {day.theme}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {day.date} · {day.activities.length} stops
                  </p>
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    data-testid={`add-activity-day-${day.dayNumber}`}
                    onClick={() => {
                      setEditingActivity(null);
                      setModalDayId(day.id);
                      setModalOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Activity
                  </Button>
                )}
              </div>

              {day.activities.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border-default)] p-4 text-center text-xs text-[var(--text-secondary)]">
                  No activities on Day {day.dayNumber} yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {day.activities.map((act, idx) => (
                    <WorkspaceActivityCard
                      key={act.id}
                      tripId={summary.id}
                      activity={act}
                      currency={summary.currency}
                      memberCount={detail.members.length}
                      viewerUserId={viewerUserId}
                      index={idx}
                      totalInDay={day.activities.length}
                      isSelected={selectedActivityId === act.id}
                      canVote={canVote}
                      canEdit={canEdit}
                      onSelect={() => onSelectActivity(act.id)}
                      onMoveUp={() =>
                        void reorderMut.mutateAsync({ activityId: act.id, direction: 'UP' })
                      }
                      onMoveDown={() =>
                        void reorderMut.mutateAsync({ activityId: act.id, direction: 'DOWN' })
                      }
                      onToggleIncluded={() =>
                        void updateMut.mutateAsync({ activityId: act.id, patch: { included: !act.included } })
                      }
                      onEdit={() => {
                        setEditingActivity(act);
                        setModalDayId(day.id);
                        setModalOpen(true);
                      }}
                      onDelete={() => void deleteMut.mutateAsync(act.id)}
                      onDragStart={() => setDraggedId(act.id)}
                      onDropOnThis={() => {
                        if (draggedId && draggedId !== act.id) {
                          void reorderMut.mutateAsync({
                            activityId: draggedId,
                            targetDayId: day.id,
                            targetIndex: idx,
                          });
                        }
                        setDraggedId(null);
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>
          ))}
        </>
      ) : (
        <EmptyState
          title="Ready to build your group itinerary"
          description="Generate a balanced AI itinerary in the AI Assistant panel, or start adding Day 1 stops manually."
          action={
            canEdit ? (
              <Button
                type="button"
                size="sm"
                data-testid="bootstrap-manual-day-btn"
                onClick={() =>
                  void addDayMut.mutateAsync({
                    date: summary.startDate,
                    theme: `${summary.destinations[0] ?? 'Trip'} Exploration`,
                  })
                }
              >
                <CalendarPlus className="h-4 w-4" /> Start Manual Day 1
              </Button>
            ) : undefined
          }
        />
      )}

      <ActivityFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        tripId={summary.id}
        currency={summary.currency}
        dayId={modalDayId}
        editingActivity={editingActivity}
      />
    </div>
  );
}
