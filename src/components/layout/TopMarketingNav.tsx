import { Link } from 'react-router-dom';
import { Compass, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { RoamigoLogo } from '../ui/RoamigoLogo';
import { ThemeToggle } from './ThemeToggle';

interface TopMarketingNavProps {
  onResetSandbox?: () => void;
  rightSlot?: React.ReactNode;
}

export function TopMarketingNav({
  onResetSandbox,
  rightSlot,
}: TopMarketingNavProps) {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
        <Link to="/" className="rounded-lg">
          <RoamigoLogo showTagline />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2 py-1 text-xs font-semibold md:flex"
        >
          <a
            href="#instant-sandbox"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-primary)] px-3 py-1 text-[var(--brand-on-primary)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Instant Planner
          </a>
          <a
            href="#destinations"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Compass className="h-3.5 w-3.5" />
            Destinations
          </a>
          <a
            href="#how-it-works"
            className="rounded-full px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            How It Works
          </a>
          <Link
            to="/workspace-preview"
            className="rounded-full px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            App Shell
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {rightSlot}
          {onResetSandbox && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onResetSandbox}
            >
              Reset Trip
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
