import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Plus, Search } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { SandboxImportBanner } from '../components/trips/SandboxImportBanner';
import { TripCard } from '../components/trips/TripCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import {
  useArchiveTripMutation,
  useCloneTripMutation,
  useDeleteTripMutation,
  useTripsListQuery,
} from '../lib/useTrips';

const FILTERS = [
  { id: 'all', label: 'All Trips' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'shared', label: 'Shared with Me' },
  { id: 'past', label: 'Past' },
  { id: 'archived', label: 'Archived' },
] as const;

export function TripsDashboardPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('updatedAt');

  const { data, isLoading } = useTripsListQuery({ filter, search, sort });
  const cloneMutation = useCloneTripMutation();
  const archiveMutation = useArchiveTripMutation();
  const deleteMutation = useDeleteTripMutation();

  const trips = data?.trips ?? [];

  async function handleClone(tripId: string) {
    try {
      const res = await cloneMutation.mutateAsync(tripId);
      pushToast('Cloned trip into your account!', 'success');
      navigate(`/trips/${res.tripId}`);
    } catch {
      pushToast('Could not clone trip.', 'error');
    }
  }

  return (
    <AppShell
      title="My Trips"
      subtitle="Collaborative group trips, drafts, and shared workspaces"
      headerActions={
        <Link
          to="/trips/new"
          data-testid="create-trip-cta"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--brand-on-primary)]"
        >
          <Plus className="h-4 w-4" />
          New Trip
        </Link>
      }
    >
      <div className="space-y-6">
        <SandboxImportBanner />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            aria-label="Trip status filters"
            className="flex flex-wrap gap-1.5"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                data-testid={`filter-tab-${f.id}`}
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f.id
                    ? 'bg-[var(--brand-primary)] text-[var(--brand-on-primary)]'
                    : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="search"
                aria-label="Search trips"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search destination or title…"
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 pr-3 pl-8 text-xs"
              />
            </div>
            <select
              aria-label="Sort trips"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs"
            >
              <option value="updatedAt">Recently updated</option>
              <option value="startDate">Soonest departure</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<Compass className="h-6 w-6" />}
            title="No matching trips yet"
            description="Start our guided 10-step wizard to align destinations, budgets, pace, and interests with your group."
            action={
              <Button
                type="button"
                onClick={() => navigate('/trips/new')}
              >
                Plan Your First Trip
              </Button>
            }
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onClone={(id) => void handleClone(id)}
                onArchive={(id) => archiveMutation.mutate(id)}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
