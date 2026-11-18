import { useEffect, useState } from 'react';
import type { PlaceCandidateDto } from '../../lib/contracts/activity.schemas';
import type { WorkspaceActivityDto } from '../../lib/contracts/tripDetail.types';
import { fromMinorUnits, toMinorUnits } from '../../lib/domain/money';
import type { Currency } from '../../lib/schemas';
import {
  useCreateActivityMutation,
  useSearchMapPlacesQuery,
  useUpdateActivityMutation,
} from '../../lib/useWorkspaceActivities';
import { Button } from '../ui/Button';
import { ModalDialog } from '../ui/ModalDialog';
import { useToast } from '../ui/ToastProvider';
import {
  ACTIVITY_CATEGORIES,
  ACTIVITY_SLOTS,
  ActivityFormFields,
} from './ActivityFormFields';

interface ActivityFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  currency: Currency;
  dayId: string | null;
  editingActivity: WorkspaceActivityDto | null;
}

export function ActivityFormModal({
  open,
  onOpenChange,
  tripId,
  currency,
  dayId,
  editingActivity,
}: ActivityFormModalProps) {
  const { pushToast } = useToast();
  const createMut = useCreateActivityMutation(tripId);
  const updateMut = useUpdateActivityMutation(tripId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] =
    useState<(typeof ACTIVITY_CATEGORIES)[number]>('CULTURE');
  const [timeSlot, setTimeSlot] =
    useState<(typeof ACTIVITY_SLOTS)[number]>('MORNING');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [majorCost, setMajorCost] = useState('0');
  const [locationName, setLocationName] = useState('');
  const [pickedPlace, setPickedPlace] = useState<PlaceCandidateDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPickedPlace(null);
    if (editingActivity) {
      setTitle(editingActivity.title);
      setDescription(editingActivity.description);
      setCategory(editingActivity.category);
      setTimeSlot(editingActivity.timeSlot);
      setStartTime(editingActivity.startTime ?? '');
      setEndTime(editingActivity.endTime ?? '');
      setMajorCost(String(fromMinorUnits(editingActivity.estimatedCostMinor)));
      setLocationName(editingActivity.locationName ?? '');
    } else {
      setTitle('');
      setDescription('');
      setCategory('CULTURE');
      setTimeSlot('MORNING');
      setStartTime('');
      setEndTime('');
      setMajorCost('0');
      setLocationName('');
    }
  }, [open, editingActivity]);

  const placesQuery = useSearchMapPlacesQuery(
    tripId,
    locationName,
    open && locationName.trim().length >= 2,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsedMajor = Number(majorCost || '0');
    if (!Number.isFinite(parsedMajor) || parsedMajor < 0) {
      setError('Estimated cost must be zero or positive.');
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      timeSlot,
      startTime: startTime.trim() || null,
      endTime: endTime.trim() || null,
      estimatedCostMinor: toMinorUnits(parsedMajor),
      locationName: locationName.trim() || null,
      ...(pickedPlace
        ? {
            lat: pickedPlace.lat,
            lng: pickedPlace.lng,
            coordSource: pickedPlace.coordSource,
          }
        : {}),
    };

    try {
      if (editingActivity) {
        await updateMut.mutateAsync({
          activityId: editingActivity.id,
          patch: payload,
        });
        pushToast('Activity updated.', 'success');
      } else if (dayId) {
        await createMut.mutateAsync({ dayId, ...payload, included: true });
        pushToast('Activity added to itinerary!', 'success');
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save activity.');
    }
  }

  return (
    <ModalDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editingActivity ? 'Edit Activity' : 'Add Manual Activity'}
      description="All costs are stored as per-person estimates in minor units."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 text-xs">
        <ActivityFormFields
          currency={currency}
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          category={category}
          setCategory={setCategory}
          timeSlot={timeSlot}
          setTimeSlot={setTimeSlot}
          startTime={startTime}
          setStartTime={setStartTime}
          endTime={endTime}
          setEndTime={setEndTime}
          majorCost={majorCost}
          setMajorCost={setMajorCost}
          locationName={locationName}
          onLocationChange={(v) => {
            setLocationName(v);
            setPickedPlace(null);
          }}
          suggestions={placesQuery.data?.places ?? []}
          onPickPlace={(p) => {
            setLocationName(p.name);
            setPickedPlace(p);
          }}
        />

        {error && (
          <p role="alert" className="text-[var(--status-danger)]">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            data-testid="save-activity-btn"
            disabled={createMut.isPending || updateMut.isPending}
          >
            {editingActivity ? 'Save Changes' : 'Add Activity'}
          </Button>
        </div>
      </form>
    </ModalDialog>
  );
}
