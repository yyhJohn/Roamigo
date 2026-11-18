import { MapPin } from 'lucide-react';
import type { PlaceCandidateDto } from '../../lib/contracts/activity.schemas';
import type { Currency } from '../../lib/schemas';

export const ACTIVITY_CATEGORIES = [
  'CULTURE',
  'FOOD',
  'OUTDOORS',
  'NIGHTLIFE',
  'TRANSIT',
  'LODGING',
  'SHOPPING',
  'OTHER',
] as const;

export const ACTIVITY_SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'] as const;

interface ActivityFormFieldsProps {
  currency: Currency;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: (typeof ACTIVITY_CATEGORIES)[number];
  setCategory: (v: (typeof ACTIVITY_CATEGORIES)[number]) => void;
  timeSlot: (typeof ACTIVITY_SLOTS)[number];
  setTimeSlot: (v: (typeof ACTIVITY_SLOTS)[number]) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  majorCost: string;
  setMajorCost: (v: string) => void;
  locationName: string;
  onLocationChange: (v: string) => void;
  suggestions: PlaceCandidateDto[];
  onPickPlace: (p: PlaceCandidateDto) => void;
}

export function ActivityFormFields(props: ActivityFormFieldsProps) {
  return (
    <>
      <div>
        <label className="mb-1 block font-semibold">Title</label>
        <input
          type="text"
          required
          minLength={2}
          data-testid="activity-title-input"
          value={props.title}
          onChange={(e) => props.setTitle(e.target.value)}
          placeholder="e.g. Sunset Picnic at Bunkers del Carmel"
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block font-semibold">Description</label>
        <textarea
          rows={2}
          required
          minLength={3}
          data-testid="activity-description-input"
          value={props.description}
          onChange={(e) => props.setDescription(e.target.value)}
          placeholder="Notes, booking tips, or meeting point…"
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block font-semibold">Category</label>
          <select
            aria-label="Activity category"
            value={props.category}
            onChange={(e) =>
              props.setCategory(
                e.target.value as (typeof ACTIVITY_CATEGORIES)[number],
              )
            }
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-2"
          >
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-semibold">Time Slot</label>
          <select
            aria-label="Activity time slot"
            value={props.timeSlot}
            onChange={(e) =>
              props.setTimeSlot(
                e.target.value as (typeof ACTIVITY_SLOTS)[number],
              )
            }
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-2"
          >
            {ACTIVITY_SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-semibold">
            Est. Cost ({props.currency})
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            data-testid="activity-cost-input"
            value={props.majorCost}
            onChange={(e) => props.setMajorCost(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block font-semibold">Start (optional)</label>
          <input
            type="time"
            aria-label="Start time"
            value={props.startTime}
            onChange={(e) => props.setStartTime(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1.5"
          />
        </div>
        <div>
          <label className="mb-1 block font-semibold">End (optional)</label>
          <input
            type="time"
            aria-label="End time"
            value={props.endTime}
            onChange={(e) => props.setEndTime(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1.5"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block font-semibold">
          Location (auto-links verified landmark pin when matched)
        </label>
        <input
          type="text"
          data-testid="activity-location-input"
          value={props.locationName}
          onChange={(e) => props.onLocationChange(e.target.value)}
          placeholder="Search e.g. Sagrada Família, Park Güell…"
          className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
        />
        {props.suggestions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {props.suggestions.slice(0, 4).map((p) => (
              <button
                key={`${p.name}-${p.lat}`}
                type="button"
                onClick={() => props.onPickPlace(p)}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-subtle)] px-2.5 py-1 text-[11px] hover:border-[var(--brand-primary)]"
              >
                <MapPin className="h-3 w-3 text-[var(--brand-primary)]" />
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
