import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { RoamigoLogo } from '../components/ui/RoamigoLogo';
import { formatMinorCurrency } from '../lib/domain/money';
import { useTripDetailQuery } from '../lib/useTrips';

export function TripPrintPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const { data: detail, isLoading } = useTripDetailQuery(tripId);

  if (isLoading) {
    return <div className="p-8 text-sm">Preparing printable itinerary…</div>;
  }
  if (!detail) {
    return <div className="p-8 text-sm">Trip unavailable.</div>;
  }

  const { summary, members, itinerary, expenses, settlements } = detail;
  const nameById = new Map(members.map((m) => [m.userId, m.displayName]));
  const actualSpentMinor = expenses.reduce((s, e) => s + e.amountMinor, 0);

  return (
    <div
      className="min-h-screen bg-white text-[#17302D]"
      data-testid="trip-print-view"
    >
      <div className="no-print sticky top-0 z-20 flex items-center justify-between border-b border-[#E2E8E4] bg-[#F7F9F6] px-6 py-3">
        <Button asChild variant="secondary" size="sm">
          <Link to={`/trips/${summary.id}`}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Workspace
          </Link>
        </Button>
        <Button
          type="button"
          size="sm"
          data-testid="trigger-window-print-btn"
          onClick={() => window.print()}
        >
          <Printer className="h-3.5 w-3.5" /> Print / Save as PDF
        </Button>
      </div>

      <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E2E8E4] pb-5">
          <div>
            <RoamigoLogo />
            <h1 className="font-display mt-3 text-2xl font-extrabold">
              {summary.title}
            </h1>
            <p className="text-xs text-[#526375]">
              {summary.destinations.join(' · ')} · {summary.startDate} →{' '}
              {summary.endDate} · Version {summary.version}
            </p>
          </div>
          <div className="text-right text-xs">
            <p className="font-semibold">
              Est. Per Traveller:{' '}
              {formatMinorCurrency(
                summary.estimatedPerPersonMinor,
                summary.currency,
                { est: true },
              )}
            </p>
            <p className="text-[#526375]">
              Logged Shared Expenses:{' '}
              {formatMinorCurrency(actualSpentMinor, summary.currency)}
            </p>
            <p className="mt-1 text-[#526375]">
              Travellers: {members.map((m) => m.displayName).join(', ')}
            </p>
          </div>
        </header>

        {itinerary ? (
          <section className="space-y-4">
            <Card className="border-[#E2E8E4] bg-[#F7F9F6] p-4 text-xs">
              <p className="font-semibold">{itinerary.overview}</p>
              <p className="mt-1 text-[#526375]">
                Group Compromise: {itinerary.compromiseSummary}
              </p>
            </Card>

            {itinerary.days.map((day) => (
              <div key={day.id} className="space-y-2 break-inside-avoid">
                <h2 className="font-display border-b border-[#E2E8E4] pb-1 text-base font-bold">
                  Day {day.dayNumber} ({day.date}) — {day.theme}
                </h2>
                <div className="space-y-2">
                  {day.activities
                    .filter((a) => a.included)
                    .map((act) => (
                      <div
                        key={act.id}
                        className="rounded-lg border border-[#E2E8E4] p-3 text-xs"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-bold">
                            [{act.timeSlot}] {act.title}
                          </span>
                          <span className="font-semibold">
                            {formatMinorCurrency(
                              act.estimatedCostMinor,
                              summary.currency,
                              { est: true },
                            )}
                          </span>
                        </div>
                        <p className="mt-1 text-[#526375]">{act.description}</p>
                        {act.locationName && (
                          <p className="mt-0.5 text-[11px] text-[#526375]">
                            Location: {act.locationName}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <p className="text-xs text-[#526375]">No itinerary generated yet.</p>
        )}

        {settlements.length > 0 && (
          <section className="space-y-2 break-inside-avoid pt-2">
            <h2 className="font-display border-b border-[#E2E8E4] pb-1 text-base font-bold">
              Settlement Summary
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {settlements.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-[#E2E8E4] px-3 py-2 text-xs"
                >
                  <span>
                    {nameById.get(s.fromUserId) ?? 'Member'} →{' '}
                    {nameById.get(s.toUserId) ?? 'Member'}:{' '}
                    <strong>
                      {formatMinorCurrency(s.amountMinor, s.currency)}
                    </strong>
                  </span>
                  <Badge variant={s.status === 'MARKED_PAID' ? 'success' : 'outline'}>
                    {s.status === 'MARKED_PAID' ? 'Paid' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
