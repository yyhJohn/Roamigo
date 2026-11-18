import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Save } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/ToastProvider';
import { WizardStepEarly } from '../components/wizard/WizardStepEarly';
import { WizardStepLate } from '../components/wizard/WizardStepLate';
import {
  buildWizardCandidate,
  createInitialWizardForm,
  hydrateWizardForm,
  STEP_TITLES,
  type WizardFormState,
} from '../components/wizard/wizardState';
import { ApiClientError } from '../lib/apiClient';
import { WizardTripPayloadSchema } from '../lib/contracts/trip.schemas';
import { useSaveWizardMutation, useTripDetailQuery } from '../lib/useTrips';

export function CreateTripWizardPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { data: existing } = useTripDetailQuery(tripId);
  const saveMutation = useSaveWizardMutation(tripId);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardFormState>(createInitialWizardForm);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing && !hydrated) {
      setStep(Math.min(10, Math.max(1, existing.summary.wizardStep || 1)));
      setForm(hydrateWizardForm(existing));
      setHydrated(true);
    }
  }, [existing, hydrated]);

  function onPatch(patch: Partial<WizardFormState>) {
    setError(null);
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function persistTrip(finalize: boolean) {
    setError(null);
    const candidate = buildWizardCandidate(form, step, finalize);
    const parsed = WizardTripPayloadSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? 'Please review your trip inputs.',
      );
      return;
    }

    try {
      const res = await saveMutation.mutateAsync(parsed.data);
      if (finalize) {
        pushToast('Trip workspace created!', 'success');
        navigate(`/trips/${res.tripId}`);
      } else {
        pushToast(`Saved draft at Step ${step}/10`, 'info');
        navigate('/trips');
      }
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Failed to save trip.',
      );
    }
  }

  return (
    <AppShell
      title="Create Group Trip"
      subtitle={`Step ${step} of 10 — ${STEP_TITLES[step - 1]}`}
      headerActions={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          data-testid="wizard-save-draft-btn"
          disabled={saveMutation.isPending}
          onClick={() => void persistTrip(false)}
        >
          <Save className="h-3.5 w-3.5" />
          Save Draft & Exit
        </Button>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div aria-label="Wizard progress" className="grid grid-cols-10 gap-1.5">
          {STEP_TITLES.map((label, idx) => (
            <button
              key={label}
              type="button"
              aria-label={`Step ${idx + 1}: ${label}`}
              onClick={() => setStep(idx + 1)}
              className={`h-2 rounded-full transition-colors ${
                idx + 1 <= step
                  ? 'bg-[var(--brand-primary)]'
                  : 'bg-[var(--border-default)]'
              }`}
            />
          ))}
        </div>

        <Card className="space-y-6 p-6">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[var(--text-secondary)] uppercase">
              Step {step} of 10
            </p>
            <h2
              data-testid="wizard-step-heading"
              className="font-display mt-1 text-xl font-bold"
            >
              {STEP_TITLES[step - 1]}
            </h2>
          </div>

          {step <= 5 ? (
            <WizardStepEarly step={step} form={form} onPatch={onPatch} />
          ) : (
            <WizardStepLate step={step} form={form} onPatch={onPatch} />
          )}

          {error && (
            <p
              role="alert"
              data-testid="wizard-error"
              className="rounded-lg border border-red-300 bg-[var(--status-danger-bg)] px-3 py-2 text-xs font-medium text-[var(--status-danger)]"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
            <Button
              type="button"
              variant="secondary"
              data-testid="wizard-back-btn"
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < 10 ? (
              <Button
                type="button"
                data-testid="wizard-next-btn"
                onClick={() => setStep((s) => Math.min(10, s + 1))}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                data-testid="wizard-finish-btn"
                disabled={saveMutation.isPending}
                onClick={() => void persistTrip(true)}
              >
                <Check className="h-4 w-4" />
                {saveMutation.isPending
                  ? 'Creating…'
                  : 'Launch Trip Workspace'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
