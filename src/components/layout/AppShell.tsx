import { useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Home,
  LogOut,
  PlusCircle,
  Settings,
  Wallet,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useLogoutMutation, useSessionQuery } from '../../lib/useAuth';
import { RoamigoLogo } from '../ui/RoamigoLogo';
import { ThemeToggle } from './ThemeToggle';

export interface ShellNavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const DEFAULT_ITEMS: ShellNavItem[] = [
  { to: '/trips', label: 'My Trips', icon: <FolderKanban className="h-4 w-4" /> },
  {
    to: '/trips/new',
    label: 'Create Trip',
    icon: <PlusCircle className="h-4 w-4" />,
  },
  { to: '/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  { to: '/', label: 'Public Landing', icon: <Home className="h-4 w-4" /> },
];

interface AppShellProps {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
  navItems?: ShellNavItem[];
  children: ReactNode;
}

export function AppShell({
  title,
  subtitle,
  headerActions,
  navItems = DEFAULT_ITEMS,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = useSessionQuery();
  const logoutMutation = useLogoutMutation();
  const user = session?.authenticated ? session.user : null;

  async function handleSignOut() {
    navigate('/', { replace: true });
    await logoutMutation.mutateAsync();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-canvas)] text-[var(--text-primary)] md:flex-row">
      <aside
        aria-label="Workspace sidebar"
        className={cn(
          'no-print hidden shrink-0 flex-col justify-between border-r border-[var(--border-default)] bg-[var(--bg-surface)] p-3 transition-all md:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-2 px-1">
            <Link to="/trips">
              <RoamigoLogo compact={collapsed} />
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-[var(--brand-primary)] text-[var(--brand-on-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]',
                  )}
                >
                  {item.icon}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-[var(--border-default)] pt-3">
          {user && !collapsed && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--bg-canvas)] px-2.5 py-2">
              <div className="min-w-0">
                <p
                  data-testid="shell-user-name"
                  className="truncate text-xs font-semibold"
                >
                  {user.displayName}
                </p>
                <p className="truncate text-[11px] text-[var(--text-secondary)]">
                  {user.preferredCurrency}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                aria-label="Sign out"
                data-testid="shell-logout-btn"
                className="rounded-md p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            {!collapsed && (
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Appearance
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="no-print sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/95 px-4 py-3.5 backdrop-blur-xs sm:px-6">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <Link to="/trips">
                <RoamigoLogo compact />
              </Link>
            </div>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <ThemeToggle />
            </div>
            {headerActions}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>

      <nav
        aria-label="Mobile bottom navigation"
        className="no-print fixed right-0 bottom-0 left-0 z-30 grid grid-cols-5 border-t border-[var(--border-default)] bg-[var(--bg-surface)] py-1.5 text-center text-[11px] font-semibold md:hidden"
      >
        <Link to="/" className="flex flex-col items-center gap-0.5 py-1 text-[var(--text-secondary)]">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <Link to="/trips" className="flex flex-col items-center gap-0.5 py-1 text-[var(--brand-primary)]">
          <FolderKanban className="h-4 w-4" />
          <span>Trips</span>
        </Link>
        <Link to="/trips/new" className="flex flex-col items-center gap-0.5 py-1 text-[var(--text-secondary)]">
          <CalendarRange className="h-4 w-4" />
          <span>Create</span>
        </Link>
        <Link to="/trips" className="flex flex-col items-center gap-0.5 py-1 text-[var(--text-secondary)]">
          <Wallet className="h-4 w-4" />
          <span>Budgets</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center gap-0.5 py-1 text-[var(--text-secondary)]">
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
