import { ArrowRight, CheckCircle2, MapPin, Scale, Users } from 'lucide-react';
import { CURATED_DESTINATIONS } from '../../lib/destinations';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface LandingHeroProps {
  onPickDestination: (city: string) => void;
}

export function LandingHero({ onPickDestination }: LandingHeroProps) {
  return (
    <div className="space-y-12">
      <section
        aria-label="Roamigo hero"
        className="grid grid-cols-1 items-center gap-8 pt-2 lg:grid-cols-12"
      >
        <div className="space-y-5 lg:col-span-7">
          <Badge variant="mint" className="px-3 py-1">
            Collaborative Group Travel Planning
          </Badge>
          <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-[var(--text-primary)] sm:text-5xl">
            Less Arguing,
            <br />
            More Wandering.
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
            Stop losing holiday plans in endless group chats. Reconcile
            different personal budgets, generate balanced day-by-day AI
            itineraries, vote transparently, and keep every estimated cost clear.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button asChild size="lg">
              <a href="#instant-sandbox">
                Plan a Group Trip
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <a href="#destinations">Browse Destinations</a>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden p-4 lg:col-span-5">
          <div className="relative h-44 overflow-hidden rounded-xl bg-[#103D3B]">
            <img
              src={CURATED_DESTINATIONS[0].imageUrl}
              alt="Barcelona coastline and architecture"
              loading="eager"
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#103D3B]/90 via-[#103D3B]/35 to-transparent p-4 flex flex-col justify-end text-white">
              <span className="text-xs font-semibold text-[#A7F3CF]">
                Example Group Scenario · 4 Days
              </span>
              <span className="font-display text-lg font-bold">
                Barcelona Spring Escape
              </span>
              <span className="text-xs opacity-90">
                Alice (£200) · Bob (£300) · Charlie (£500)
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-xs">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                Transparent Budget &amp; Vote Consensus
              </p>
              <p className="text-[var(--text-secondary)]">
                Deterministic math highlights overages immediately
              </p>
            </div>
            <Badge variant="success">Est. Pricing</Badge>
          </div>
        </Card>
      </section>

      <section id="destinations" aria-label="Featured destinations" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">
              Destination Inspiration
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Select a city to prefill the instant group planner below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CURATED_DESTINATIONS.map((dest) => (
            <Card key={dest.slug} className="flex flex-col overflow-hidden">
              <div className="relative h-32 bg-[#103D3B]">
                <img
                  src={dest.imageUrl}
                  alt={`${dest.city}, ${dest.country}`}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span className="absolute right-2 bottom-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] text-white">
                  Photo: {dest.photographer}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-base font-bold">
                      {dest.city}
                    </h3>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {dest.country}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {dest.tagline}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--border-default)] pt-3 text-xs">
                  <span className="tabular-nums font-semibold">
                    From £{dest.estBudgetGbp} est. / {dest.recommendedDays}d
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onPickDestination(dest.city);
                      document
                        .getElementById('instant-sandbox')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-[var(--brand-primary)] hover:underline"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Use City
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="how-it-works" aria-label="How Roamigo works" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-4">
          <Users className="h-5 w-5 text-[var(--brand-primary)]" />
          <h3 className="font-display mt-2 text-sm font-bold">
            1. Add Individual Caps &amp; Vibes
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Every traveller sets their own realistic budget, interests, and pace
            preferences without pressure.
          </p>
        </Card>
        <Card className="p-4">
          <Scale className="h-5 w-5 text-[var(--brand-primary)]" />
          <h3 className="font-display mt-2 text-sm font-bold">
            2. Generate Balanced AI Options
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Structured itinerary proposals explain how conflicting group wishes
            are balanced across each day.
          </p>
        </Card>
        <Card className="p-4">
          <CheckCircle2 className="h-5 w-5 text-[var(--brand-primary)]" />
          <h3 className="font-display mt-2 text-sm font-bold">
            3. Vote &amp; Track Deterministic Costs
          </h3>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Upvote, downvote, or exclude activities and see immediate per-person
            estimates and budget alerts.
          </p>
        </Card>
      </section>
    </div>
  );
}
