import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Share2, Users } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { TripMembersModal } from '../components/trips/TripMembersModal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { formatMinorCurrency } from '../lib/domain/money';
import { useCloneTripMutation, useTripDetailQuery } from '../lib/useTrips';

export function TripOverviewPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { data: detail, isLoading, error } = useTripDetailQuery(tripId);
  const cloneMutation = useCloneTripMutation();
  const [membersOpen, setMembersOpen] = useState(false);

  if (isLoading) {
    return (
      <AppShell title="Loading Trip…">
        <Skeleton className="h-80" />
      </AppShell>
    );
  }

  if (error || !detail) {
    return (
      <AppShell title="Trip Not Accessible">
        <Card className="p-6 text-sm text-[var(--status-danger)]">
          You do not have access to this trip or it no longer exists.
        </Card>
      </AppShell>
    );
  }

  const { summary, itinerary, preferences } = detail;

  async function handleCloneDemo() {
    const res = await cloneMutation.mutateAsync(summary.id);
    pushToast('Cloned editable copy to your account!', 'success');
    navigate(`/trips/${res.tripId}`);
  }

  return (
    <AppShell
      title={summary.title}
      subtitle={`${summary.destinations.join(' · ')} · ${summary.startDate} → ${summary.endDate}`}
      headerActions={
        <div className="flex items-center gap-2">
          {detail.isDemoReadOnly && (
            <Button
              type="button"
              size="sm"
              data-testid="workspace-clone-demo-btn"
              onClick={() => void handleCloneDemo()}
            >
              <Copy className="h-3.5 w-3.5" />
              Clone Editable Copy
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="open-members-modal-btn"
            onClick={() => setMembersOpen(true)}
          >
            <Share2 className="h-3.5 w-3.5" />
            Members & Invite ({detail.members.length})
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Card className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold">
                Traveller Preferences
              </h2>
              <Badge variant="mint">
                <Users className="mr-1 h-3 w-3" />
                {preferences.length} profiles
              </Badge>
            </div>
            {preferences.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 text-xs"
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{p.displayName}</span>
                  <span>
                    {formatMinorCurrency(p.budgetMinor, summary.currency)} cap
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  {p.accommodationPref} · {p.pace} · {p.interests.join(', ')}
                </p>
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-8">
          {itinerary ? (
            <>
              <Card className="space-y-2 p-5">
                <div className="flex items-center justify-between">
                  <Badge variant="mint">
                    Version {itinerary.versionNumber} ({itinerary.source})
                  </Badge>
                  <span className="text-xs font-bold">
                    {formatMinorCurrency(
                      summary.estimatedPerPersonMinor,
                      summary.currency,
                      { est: true },
                    )}{' '}
                    / person
                  </span>
                </div>
                <p className="text-sm font-medium">{itinerary.overview}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {itinerary.compromiseSummary}
                </p>
              </Card>

              {itinerary.days.map((day) => (
                <Card key={day.id} className="space-y-3 p-5">
                  <h3 className="font-display text-base font-bold">
                    Day {day.dayNumber} ({day.date}) — {day.theme}
                  </h3>
                  <div className="space-y-2.5">
                    {day.activities.map((act) => (
                      <div
                        key={act.id}
                        className="flex items-start justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3 text-xs"
                      >
                        <div>
                          <p className="font-bold">{act.title}</p>
                          <p className="mt-0.5 text-[var(--text-secondary)]">
                            {act.description}
                          </p>
                        </div>
                        <span className="shrink-0 font-semibold">
                          {formatMinorCurrency(
                            act.estimatedCostMinor,
                            summary.currency,
                            { est: true },
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </>
          ) : (
            <Card className="p-6 text-sm text-[var(--text-secondary)]">
              Trip setup saved! Ready for AI itinerary generation and manual
              activity planning.
            </Card>
          )}
        </div>
      </div>

      <TripMembersModal
        open={membersOpen}
        onOpenChange={setMembersOpen}
        detail={detail}
      />
    </AppShell>
  );
}
