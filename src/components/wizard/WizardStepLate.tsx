import type { WizardFormState } from './wizardState';

const INTEREST_OPTIONS = [
  'museums',
  'architecture',
  'street food',
  'tapas & dining',
  'nightlife',
  'hiking & coast',
  'kayaking',
  'markets',
  'coffee culture',
  'photography',
  'live music',
  'budget sightseeing',
] as const;

const ACC_OPTIONS = [
  { id: 'hostel', label: 'Social Hostel', desc: 'Lowest cost, shared dorms or private rooms' },
  { id: 'budget-hotel', label: 'Budget Hotel', desc: 'Clean private rooms near transit' },
  { id: 'mid-range', label: 'Mid-Range Hotel', desc: 'Balanced comfort & central location' },
  { id: 'apartment', label: 'Shared Apartment', desc: 'Group kitchen & living space' },
  { id: 'boutique', label: 'Boutique Stay', desc: 'Design-led neighbourhood property' },
] as const;

const TRANS_OPTIONS = [
  { id: 'public-transit', label: 'Metro & Bus' },
  { id: 'walking', label: 'Walk-First' },
  { id: 'rail', label: 'Regional Rail' },
  { id: 'rental-car', label: 'Shared Rental Car' },
  { id: 'mixed', label: 'Flexible Mix' },
] as const;

export function WizardStepLate({
  step,
  form,
  onPatch,
}: {
  step: number;
  form: WizardFormState;
  onPatch: (patch: Partial<WizardFormState>) => void;
}) {
  if (step === 6) {
    return (
      <div className="grid gap-2.5 sm:grid-cols-2">
        {ACC_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPatch({ accommodationPref: opt.id })}
            className={`rounded-xl border p-3 text-left transition-colors ${
              form.accommodationPref === opt.id
                ? 'border-[var(--brand-primary)] bg-[var(--bg-subtle)]'
                : 'border-[var(--border-default)] bg-[var(--bg-canvas)]'
            }`}
          >
            <p className="text-xs font-bold">{opt.label}</p>
            <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{opt.desc}</p>
          </button>
        ))}
      </div>
    );
  }

  if (step === 7) {
    return (
      <div className="flex flex-wrap gap-2">
        {TRANS_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPatch({ transportPref: opt.id })}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              form.transportPref === opt.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary)]'
                : 'border-[var(--border-default)] bg-[var(--bg-canvas)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (step === 8) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-[var(--text-secondary)]">
          Pick one or more interests for consensus matching:
        </p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((tag) => {
            const active = form.interests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                data-testid={`interest-chip-${tag}`}
                onClick={() =>
                  onPatch({
                    interests: active
                      ? form.interests.filter((t) => t !== tag)
                      : [...form.interests, tag],
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  active
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-canvas)]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 9) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {(['relaxed', 'balanced', 'packed'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPatch({ pace: p })}
              className={`flex-1 rounded-lg border py-2 text-xs font-semibold capitalize ${
                form.pace === p
                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-canvas)]'
              }`}
            >
              {p} pace
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="wiz-diet" className="block text-xs font-semibold">
            Dietary or step-free accessibility needs
          </label>
          <input
            id="wiz-diet"
            type="text"
            value={form.dietaryOrAccess}
            onChange={(e) => onPatch({ dietaryOrAccess: e.target.value })}
            placeholder="Vegetarian options, avoid steep stairs…"
            className="mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <dl className="grid gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-4 text-xs sm:grid-cols-2">
      <div>
        <dt className="text-[var(--text-secondary)]">Trip & Destinations</dt>
        <dd className="font-bold">{form.title} — {form.destinationsText}</dd>
      </div>
      <div>
        <dt className="text-[var(--text-secondary)]">Dates & Group</dt>
        <dd className="font-bold">{form.startDate} → {form.endDate} ({form.groupSize} travellers)</dd>
      </div>
      <div>
        <dt className="text-[var(--text-secondary)]">Budget & Currency</dt>
        <dd className="font-bold">{form.currency} {form.personalBudgetMajor} personal cap</dd>
      </div>
      <div>
        <dt className="text-[var(--text-secondary)]">Style & Interests</dt>
        <dd className="font-bold">{form.accommodationPref} · {form.pace} · {form.interests.join(', ') || 'None selected'}</dd>
      </div>
    </dl>
  );
}
