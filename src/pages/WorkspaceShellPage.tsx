import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layers, Sparkles } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { ModalDialog } from '../components/ui/ModalDialog';
import { useToast } from '../components/ui/ToastProvider';
import { formatCurrencyEstimate } from '../lib/budget';
import { useTripState } from '../lib/useTripState';

export function WorkspaceShellPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { pushToast } = useToast();
  const { state, tripDraft, estimatedCostPerPerson, activityCounts } =
    useTripState();

  return (
    <AppShell
      title="Roamigo Workspace Shell"
      subtitle={`Active Draft: ${tripDraft.destinationsText || 'Untitled Trip'} · ${tripDraft.currency}`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Layers className="h-3.5 w-3.5" />
            Design Tokens
          </Button>
          <Button asChild size="sm">
            <Link to="/">
              <ArrowLeft className="h-3.5 w-3.5" />
              Open Planner
            </Link>
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active Trip Snapshot</CardTitle>
            <CardDescription>
              Synchronised with current browser trip draft
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Destination</span>
              <span className="font-semibold">
                {tripDraft.destinationsText || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Travellers</span>
              <Badge variant="mint">{state.travellers.length} added</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deterministic Cost Summary</CardTitle>
            <CardDescription>Estimated per-person total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-display tabular-nums text-2xl font-extrabold">
              {state.itinerary
                ? `${formatCurrencyEstimate(estimatedCostPerPerson, tripDraft.currency)} est.`
                : 'No itinerary yet'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {activityCounts.included} of {activityCounts.total} activities
              included
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interactive Feedback Check</CardTitle>
            <CardDescription>
              Accessible Radix dialogs &amp; live toasts
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                pushToast('Workspace notification verified', 'success')
              }
            >
              <Sparkles className="h-3.5 w-3.5" />
              Test Toast
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDialogOpen(true)}
            >
              Inspect Tokens
            </Button>
          </CardContent>
        </Card>
      </div>

      <ModalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Roamigo Design System Tokens"
        description="Semantic Forest Teal (#103D3B), Fresh Mint (#A7F3CF), and Soft Ivory (#F7F9F6) surfaces with Light & Dark parity."
      >
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-[#103D3B] p-3 font-semibold text-white">
            Forest Teal · #103D3B
          </div>
          <div className="rounded-lg bg-[#A7F3CF] p-3 font-semibold text-[#103D3B]">
            Fresh Mint · #A7F3CF
          </div>
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 font-semibold">
            Semantic Canvas
          </div>
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 font-semibold">
            Semantic Surface
          </div>
        </div>
      </ModalDialog>
    </AppShell>
  );
}
