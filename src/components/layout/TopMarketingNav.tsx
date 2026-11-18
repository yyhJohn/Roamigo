import { Link } from 'react-router-dom';
import { Compass, FolderKanban, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useLogoutMutation, useSessionQuery } from '../../lib/useAuth';
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
  const { data: session } = useSessionQuery();
  const logoutMutation = useLogoutMutation();
  const user = session?.authenticated ? session.user : null;

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
            to="/trips"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <FolderKanban className="h-3.5 w-3.5" />
            My Trips
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
          {user ? (
            <>
              <Link
                to="/trips"
                data-testid="nav-my-trips"
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)]"
              >
                <span
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: user.avatarColor }}
                >
                  {user.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.displayName}</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-testid="nav-logout-btn"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                data-testid="nav-login-link"
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Link>
              <Link
                to="/auth/register"
                data-testid="nav-register-link"
                className="inline-flex items-center rounded-lg bg-[var(--brand-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-on-primary)]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
