import { Moon, Sun } from 'lucide-react';
import { resolveIsDark, useThemeStore } from '../../lib/theme';

export function ThemeToggle() {
  const preference = useThemeStore((s) => s.preference);
  const toggleLightDark = useThemeStore((s) => s.toggleLightDark);
  const isDark = resolveIsDark(preference);

  return (
    <button
      type="button"
      onClick={toggleLightDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="theme-toggle-btn"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
