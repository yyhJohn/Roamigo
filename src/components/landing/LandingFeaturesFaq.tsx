import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Lock,
  Map,
  ReceiptText,
  Sparkles,
  Users2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RoamigoLogo } from '../ui/RoamigoLogo';

const CAPABILITIES = [
  {
    icon: Users2,
    title: 'Role-Based Group Workspaces',
    body: 'Invite friends as Editors, Members, or Viewers via secure links with real-time Socket.IO room presence.',
  },
  {
    icon: Sparkles,
    title: 'Staged Before/After AI Previews',
    body: 'Ask the AI assistant to rebalance rainy-day or low-budget plans and inspect exact diffs before applying.',
  },
  {
    icon: Map,
    title: 'Interactive MapLibre Route Context',
    body: 'Inspect verified landmark pins by day without hidden coordinates—unmatched venues stay transparently labelled.',
  },
  {
    icon: ReceiptText,
    title: 'Penny-Exact Splits & Settlements',
    body: 'Split shared receipts equally, by custom amounts, or by basis-point percentages using integer minor-unit math.',
  },
  {
    icon: Calendar,
    title: 'Portable Exports (.ics, .csv, .json, PDF)',
    body: 'Export calendar schedules, formula-safe expense spreadsheets, JSON backups, and clean printable itineraries.',
  },
  {
    icon: Lock,
    title: 'Privacy-First Account Controls',
    body: 'HttpOnly session cookies, email visibility controls for non-owners, and one-step permanent account deletion.',
  },
] as const;

const FAQS = [
  {
    q: 'Are itinerary activity prices live ticket quotes or estimates?',
    a: 'All AI and manual itinerary costs are clearly marked "est." and kept strictly separate from actual logged group receipts.',
  },
  {
    q: 'How does Roamigo avoid rounding errors when splitting group bills?',
    a: 'Every budget, expense, and settlement is stored and calculated in integer minor units (pence/cents) with deterministic remainder rules—never floating-point or AI arithmetic.',
  },
  {
    q: 'Can AI assistant suggestions overwrite our group votes without permission?',
    a: 'Never. Every assistant refinement opens a staged Before/After diff card showing added, modified, or removed stops and exact per-person cost delta before an organiser confirms.',
  },
  {
    q: 'Do my friends have to create accounts to try Roamigo?',
    a: 'You can test group consensus immediately in the Instant Sandbox above, and import or create full persistent multi-member workspaces whenever your group is ready.',
  },
] as const;

export function LandingFeaturesFaq() {
  return (
    <div className="space-y-12 pt-4">
      <section
        id="capabilities"
        aria-label="Full platform capabilities"
        className="space-y-4"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">
              Built for Real Group Trips—From First Idea to Final Settlement
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Upgrade from the instant sandbox to persistent multi-user
              workspaces at any time.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/auth/register">
              Create Free Workspace <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <Card key={title} className="space-y-2 p-4">
              <div className="inline-flex rounded-lg bg-[var(--brand-accent)]/40 p-2 text-[var(--brand-primary)]">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-display text-sm font-bold">{title}</h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section id="faq" aria-label="Frequently asked questions" className="space-y-4">
        <h2 className="font-display text-xl font-bold">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {FAQS.map((item) => (
            <Card key={item.q} className="space-y-1.5 p-4">
              <h3 className="font-display text-sm font-bold">{item.q}</h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {item.a}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-default)] py-6 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-3">
          <RoamigoLogo compact />
          <span>Roamigo — Less Arguing, More Wandering.</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 font-medium">
          <Link to="/auth/login" className="hover:text-[var(--text-primary)]">
            Sign In
          </Link>
          <Link to="/auth/register" className="hover:text-[var(--text-primary)]">
            Create Account
          </Link>
          <Link to="/trips" className="hover:text-[var(--text-primary)]">
            My Trips
          </Link>
        </div>
      </footer>
    </div>
  );
}
