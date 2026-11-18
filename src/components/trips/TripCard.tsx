import { Link } from 'react-router-dom';
import { Archive, Calendar, Copy, Trash2, Users } from 'lucide-react';
import type { TripSummaryDto } from '../../lib/contracts/trip.schemas';
import { CURATED_DESTINATIONS } from '../../lib/destinations';
import { formatMinorCurrency } from '../../lib/domain/money';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TripCardProps {
  trip: TripSummaryDto;
  onClone: (tripId: string) => void;
  onArchive: (tripId: string) => void;
  onDelete: (tripId: string) => void;
}

export function TripCard({
  trip,
  onClone,
  onArchive,
  onDelete,
}: TripCardProps) {
  const cover =
    CURATED_DESTINATIONS.find((d) => d.slug === trip.coverImageKey) ??
    CURATED_DESTINATIONS[0]!;

  return (
    <Card
      data-testid={`trip-card-${trip.id}`}
      className="flex flex-col overflow-hidden"
    >
      <div className="relative h-40 overflow-hidden bg-[#103D3B]">
        <img
          src={cover.imageUrl}
          alt={trip.destinations.join(', ')}
          loading="lazy"
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {trip.isDemo && <Badge variant="mint">Demo Trip</Badge>}
          <Badge variant={trip.status === 'DRAFT' ? 'warning' : 'default'}>
            {trip.status}
          </Badge>
          <Badge variant="default">{trip.myRole}</Badge>
        </div>
        <div className="absolute right-3 bottom-3 left-3 text-white">
          <p className="text-xs font-medium text-emerald-100">
            {trip.destinations.join(' · ')}
          </p>
          <h3 className="font-display truncate text-lg font-bold">
            {trip.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between space-y-4 p-4">
        <div className="space-y-2.5 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {trip.startDate} → {trip.endDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {trip.memberCount}/{trip.groupSize}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex -space-x-1.5">
              {trip.membersPreview.map((m) => (
                <span
                  key={m.memberId}
                  title={`${m.displayName} (${m.role})`}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--bg-surface)] text-[10px] font-bold text-white"
                  style={{ backgroundColor: m.avatarColor }}
                >
                  {m.displayName.slice(0, 1).toUpperCase()}
                </span>
              ))}
            </div>
            <span className="font-semibold text-[var(--text-primary)]">
              {trip.hasItinerary
                ? formatMinorCurrency(
                    trip.estimatedPerPersonMinor,
                    trip.currency,
                    { est: true },
                  )
                : trip.status === 'DRAFT'
                  ? `Step ${trip.wizardStep}/10`
                  : 'No itinerary yet'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-3">
          {trip.status === 'DRAFT' && !trip.isDemo ? (
            <Link
              to={`/trips/${trip.id}/wizard`}
              data-testid={`resume-wizard-${trip.id}`}
              className="inline-flex items-center rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-on-primary)]"
            >
              Resume Draft
            </Link>
          ) : (
            <Link
              to={`/trips/${trip.id}`}
              data-testid={`open-trip-${trip.id}`}
              className="inline-flex items-center rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-on-primary)]"
            >
              Open Workspace
            </Link>
          )}

          <div className="flex items-center gap-1">
            {trip.isDemo && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                data-testid="clone-demo-btn"
                onClick={() => onClone(trip.id)}
              >
                <Copy className="h-3.5 w-3.5" />
                Clone
              </Button>
            )}
            {!trip.isDemo && trip.myRole === 'OWNER' && (
              <>
                {trip.status !== 'ARCHIVED' && (
                  <button
                    type="button"
                    aria-label={`Archive ${trip.title}`}
                    onClick={() => onArchive(trip.id)}
                    className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Delete ${trip.title}`}
                  onClick={() => onDelete(trip.id)}
                  className="rounded-lg p-1.5 text-[var(--status-danger)] hover:bg-[var(--status-danger-bg)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
