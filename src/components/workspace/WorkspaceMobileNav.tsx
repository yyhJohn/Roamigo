import { ListTodo, MapPin, Sparkles, Wallet } from 'lucide-react';

export type MobileWorkspaceTab = 'timeline' | 'map' | 'ai' | 'budget';

export function WorkspaceMobileNav({
  mobileTab,
  onSelect,
}: {
  mobileTab: MobileWorkspaceTab;
  onSelect: (tab: MobileWorkspaceTab) => void;
}) {
  return (
    <nav
      aria-label="Mobile workspace view switcher"
      className="mb-4 grid grid-cols-4 gap-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-1 text-xs shadow-xs lg:hidden"
    >
      {(
        [
          ['timeline', 'Plan', ListTodo],
          ['map', 'Map', MapPin],
          ['ai', 'AI', Sparkles],
          ['budget', 'Budget', Wallet],
        ] as const
      ).map(([key, label, Icon]) => (
        <button
          key={key}
          type="button"
          data-testid={`mobile-ws-tab-${key}`}
          onClick={() => onSelect(key)}
          className={`inline-flex items-center justify-center gap-1 rounded-lg py-2 font-semibold transition ${
            mobileTab === key
              ? 'bg-[var(--brand-primary)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </button>
      ))}
    </nav>
  );
}
