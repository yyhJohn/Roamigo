import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
import { PersistedTripStateSchema } from '../../lib/schemas';
import { useImportLocalMutation } from '../../lib/useTrips';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';

function readValidSandboxTrip() {
  try {
    const raw = window.localStorage.getItem('roamigo:v1:trip');
    if (!raw) return null;
    const json: unknown = JSON.parse(raw);
    const parsed = PersistedTripStateSchema.safeParse(json);
    if (!parsed.success) return null;
    if (parsed.data.travellers.length === 0 && !parsed.data.itinerary) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function SandboxImportBanner() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const importMutation = useImportLocalMutation();
  const [sandboxState, setSandboxState] = useState(() => readValidSandboxTrip());

  if (!sandboxState) {
    return null;
  }

  async function handleImport() {
    if (!sandboxState) return;
    try {
      const res = await importMutation.mutateAsync(sandboxState);
      window.localStorage.removeItem('roamigo:v1:trip');
      setSandboxState(null);
      pushToast('Imported your sandbox trip into your account!', 'success');
      navigate(`/trips/${res.tripId}`);
    } catch {
      pushToast('Could not import local trip data.', 'error');
    }
  }

  return (
    <div
      data-testid="sandbox-import-banner"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--brand-primary)]/30 bg-[var(--bg-subtle)] p-4"
    >
      <div className="flex items-start gap-3">
        <UploadCloud className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-primary)]" />
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Unsaved Instant Sandbox trip detected (
            {sandboxState.trip.destinations.join(', ')})
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Import your {sandboxState.travellers.length} traveller profile(s)
            and itinerary into PostgreSQL to collaborate, share links, and track
            expenses.
          </p>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        data-testid="import-sandbox-btn"
        disabled={importMutation.isPending}
        onClick={() => void handleImport()}
      >
        {importMutation.isPending ? 'Importing…' : 'Import to My Trips'}
      </Button>
    </div>
  );
}
