import { useMemo } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import type { TripDetailDto } from '../../lib/contracts/tripDetail.types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { type PinnedStop, useMapLibreRoute } from './useMapLibreRoute';

interface TripMapPanelProps {
  detail: TripDetailDto;
  selectedDayNumber: number | null;
  onSelectDay: (dayNumber: number | null) => void;
  selectedActivityId: string | null;
  onSelectActivity: (activityId: string) => void;
}

export function TripMapPanel({
  detail,
  selectedDayNumber,
  onSelectDay,
  selectedActivityId,
  onSelectActivity,
}: TripMapPanelProps) {
  const { pins, unmappedCount } = useMemo(() => {
    const out: PinnedStop[] = [];
    let unmapped = 0;
    let seq = 1;
    for (const day of detail.itinerary?.days ?? []) {
      if (selectedDayNumber !== null && day.dayNumber !== selectedDayNumber) {
        continue;
      }
      for (const act of day.activities) {
        if (!act.included) continue;
        if (act.lat !== null && act.lng !== null) {
          out.push({
            id: act.id,
            orderLabel: `${seq}`,
            dayNumber: day.dayNumber,
            title: act.title,
            locationName: act.locationName,
            lat: act.lat,
            lng: act.lng,
            coordSource: act.coordSource,
          });
          seq += 1;
        } else {
          unmapped += 1;
        }
      }
    }
    return { pins: out, unmappedCount: unmapped };
  }, [detail.itinerary, selectedDayNumber]);

  const { containerRef, webglReady, fitAllPins } = useMapLibreRoute(
    pins,
    selectedActivityId,
    onSelectActivity,
  );

  return (
    <Card className="space-y-3 p-4" data-testid="workspace-map-panel">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-[var(--brand-primary)]" />
          <h3 className="font-display text-sm font-bold">Destination Map</h3>
          <Badge variant="mint">{pins.length} pinned</Badge>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          data-testid="map-fit-bounds-btn"
          disabled={pins.length === 0}
          onClick={fitAllPins}
        >
          <LocateFixed className="h-3.5 w-3.5" /> Fit Route
        </Button>
      </div>

      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => onSelectDay(null)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            selectedDayNumber === null
              ? 'bg-[var(--brand-primary)] text-white'
              : 'bg-[var(--bg-subtle)]'
          }`}
        >
          All Days
        </button>
        {detail.itinerary?.days.map((d) => (
          <button
            key={d.id}
            type="button"
            data-testid={`map-filter-day-${d.dayNumber}`}
            onClick={() => onSelectDay(d.dayNumber)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              selectedDayNumber === d.dayNumber
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--bg-subtle)]'
            }`}
          >
            D{d.dayNumber}
          </button>
        ))}
      </div>

      <div
        ref={containerRef}
        data-testid="maplibre-canvas-container"
        className="h-72 w-full overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-subtle)]"
      >
        {!webglReady && (
          <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[var(--text-secondary)]">
            Interactive vector canvas requires browser WebGL; use the verified
            stop directory below to inspect coordinates.
          </div>
        )}
      </div>

      <div className="max-h-44 space-y-1.5 overflow-y-auto">
        {pins.map((pin) => (
          <button
            key={pin.id}
            type="button"
            data-testid={`map-pin-list-${pin.id}`}
            onClick={() => {
              onSelectActivity(pin.id);
              document
                .getElementById(`workspace-activity-${pin.id}`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }}
            className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
              selectedActivityId === pin.id
                ? 'border-[var(--brand-primary)] bg-[var(--bg-subtle)] font-semibold'
                : 'border-[var(--border-default)] bg-[var(--bg-canvas)]'
            }`}
          >
            <span className="truncate pr-2">
              <strong className="mr-1.5">#{pin.orderLabel}</strong>
              {pin.title}
            </span>
            <span className="shrink-0 text-[10px] text-[var(--text-secondary)]">
              {pin.lat.toFixed(3)}, {pin.lng.toFixed(3)} ({pin.coordSource})
            </span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
        <span>
          {unmappedCount > 0
            ? `${unmappedCount} stop(s) without verified coordinates`
            : 'All included stops have verified coordinates'}
        </span>
        <span>© OpenStreetMap · OpenFreeMap</span>
      </div>
    </Card>
  );
}
