import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, MapPin, Share2, Sparkles, Wallet } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { TripMembersModal } from '../components/trips/TripMembersModal';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import { AiAssistantPanel } from '../components/workspace/AiAssistantPanel';
import { TripMapPanel } from '../components/workspace/TripMapPanel';
import { WorkspaceBudgetQuickCard } from '../components/workspace/WorkspaceBudgetQuickCard';
import { WorkspaceLeftRail } from '../components/workspace/WorkspaceLeftRail';
import {
  type MobileWorkspaceTab,
  WorkspaceMobileNav,
} from '../components/workspace/WorkspaceMobileNav';
import { WorkspaceTimeline } from '../components/workspace/WorkspaceTimeline';
import { useCloneTripMutation, useTripDetailQuery } from '../lib/useTrips';

type RightTab = 'map' | 'ai' | 'budget';

export function TripWorkspacePage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { data: detail, isLoading, error } = useTripDetailQuery(tripId);
  const cloneMutation = useCloneTripMutation();

  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(
    null,
  );
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
  );
  const [rightTab, setRightTab] = useState<RightTab>('map');
  const [mobileTab, setMobileTab] = useState<MobileWorkspaceTab>('timeline');

  if (isLoading) {
    return (
      <AppShell title="Loading Trip Workspace…">
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

  const { summary } = detail;
  const isReadOnlyDemo = summary.isDemo || detail.isDemoReadOnly;
  const canEdit =
    !isReadOnlyDemo &&
    (summary.myRole === 'OWNER' || summary.myRole === 'EDITOR');

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
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Sync v{summary.version}</Badge>
          {isReadOnlyDemo && (
            <Button
              type="button"
              size="sm"
              data-testid="workspace-clone-demo-btn"
              onClick={() => void handleCloneDemo()}
            >
              <Copy className="h-3.5 w-3.5" /> Clone Editable Copy
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            data-testid="open-members-modal-btn"
            onClick={() => setMembersOpen(true)}
          >
            <Share2 className="h-3.5 w-3.5" /> Members ({detail.members.length})
          </Button>
        </div>
      }
    >
      <WorkspaceMobileNav mobileTab={mobileTab} onSelect={setMobileTab} />

      <div className="grid gap-5 pb-16 lg:grid-cols-12 lg:pb-0">
        <div
          className={`min-w-0 lg:col-span-3 ${
            mobileTab === 'timeline' ? 'block' : 'hidden lg:block'
          }`}
        >
          <WorkspaceLeftRail
            detail={detail}
            selectedDayNumber={selectedDayNumber}
            onSelectDay={setSelectedDayNumber}
            canEdit={canEdit}
          />
        </div>

        <div
          className={`min-w-0 lg:col-span-5 ${
            mobileTab === 'timeline' ? 'block' : 'hidden lg:block'
          }`}
        >
          <WorkspaceTimeline
            detail={detail}
            selectedDayNumber={selectedDayNumber}
            selectedActivityId={selectedActivityId}
            onSelectActivity={(id) => {
              setSelectedActivityId(id);
              setRightTab('map');
            }}
            canEdit={canEdit}
          />
        </div>

        <div
          className={`min-w-0 space-y-3 lg:col-span-4 ${
            mobileTab !== 'timeline' ? 'block' : 'hidden lg:block'
          }`}
        >
          <div
            role="tablist"
            aria-label="Workspace context panel"
            className="hidden grid-cols-3 gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 text-xs lg:grid"
          >
            {(
              [
                ['map', 'Map', MapPin],
                ['ai', 'AI Assistant', Sparkles],
                ['budget', 'Budget', Wallet],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={rightTab === key}
                data-testid={`right-tab-${key}`}
                onClick={() => setRightTab(key)}
                className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-semibold transition ${
                  rightTab === key
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {(mobileTab === 'map' ||
            (mobileTab === 'timeline' && rightTab === 'map')) && (
            <TripMapPanel
              detail={detail}
              selectedDayNumber={selectedDayNumber}
              onSelectDay={setSelectedDayNumber}
              selectedActivityId={selectedActivityId}
              onSelectActivity={setSelectedActivityId}
            />
          )}

          {(mobileTab === 'ai' ||
            (mobileTab === 'timeline' && rightTab === 'ai')) && (
            <AiAssistantPanel detail={detail} />
          )}

          {(mobileTab === 'budget' ||
            (mobileTab === 'timeline' && rightTab === 'budget')) && (
            <WorkspaceBudgetQuickCard detail={detail} />
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
