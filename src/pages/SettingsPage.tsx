import { useState } from 'react';
import { Check, Shield } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { DeleteAccountCard } from '../components/settings/DeleteAccountCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/ToastProvider';
import { ApiClientError } from '../lib/apiClient';
import type { Currency } from '../lib/schemas';
import { type ThemePreference, useThemeStore } from '../lib/theme';
import { useSessionQuery } from '../lib/useAuth';
import { useUpdateProfileMutation } from '../lib/useUserSettings';

const AVATAR_SWATCHES = ['#103D3B', '#1D4ED8', '#0F766E', '#7C3AED', '#B45309', '#BE123C'] as const;
type Lang = 'en' | 'es' | 'fr' | 'de' | 'zh';

export function SettingsPage() {
  const { data: session } = useSessionQuery();
  const user = session?.user;
  const setTheme = useThemeStore((s) => s.setPreference);
  const updateMut = useUpdateProfileMutation();
  const { pushToast } = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? '#103D3B');
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>(user?.preferredCurrency ?? 'GBP');
  const [preferredLanguage, setPreferredLanguage] = useState<Lang>((user?.preferredLanguage as Lang) ?? 'en');
  const [themePreference, setThemePreference] = useState<ThemePreference>((user?.themePreference as ThemePreference) ?? 'system');
  const [privacyShareEmail, setPrivacyShareEmail] = useState(user?.privacyShareEmail ?? false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateMut.mutateAsync({
        displayName, avatarColor, preferredCurrency, preferredLanguage, themePreference, privacyShareEmail,
      });
      setTheme(themePreference);
      pushToast('Saved profile & privacy preferences.', 'success');
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save preferences.');
    }
  }

  return (
    <AppShell
      title="Account & Privacy Settings"
      subtitle="Manage your traveller identity, default currency, theme, and collaborator visibility."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="p-5" data-testid="profile-settings-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-default)] pb-4">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: avatarColor }}
                className="flex h-11 w-11 items-center justify-center rounded-full font-display text-base font-extrabold text-white"
              >
                {displayName.slice(0, 1).toUpperCase() || 'R'}
              </div>
              <div>
                <p className="font-display text-sm font-bold">{user.email}</p>
                <Badge variant={user.emailVerified ? 'success' : 'outline'}>
                  {user.emailVerified ? 'Verified Email' : 'Email Account'}
                </Badge>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => void handleSave(e)} className="mt-4 space-y-4 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="font-semibold">Display Name</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={60}
                  data-testid="settings-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold">Default Currency</span>
                <select
                  data-testid="settings-currency"
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value as Currency)}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
                >
                  <option value="GBP">GBP (£) — British Pound</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="USD">USD ($) — US Dollar</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold">Interface Language</span>
                <select
                  data-testid="settings-language"
                  value={preferredLanguage}
                  onChange={(e) =>
                    setPreferredLanguage(
                      e.target.value as 'en' | 'es' | 'fr' | 'de' | 'zh',
                    )
                  }
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="font-semibold">Theme Preference</span>
                <select
                  data-testid="settings-theme"
                  value={themePreference}
                  onChange={(e) =>
                    setThemePreference(e.target.value as ThemePreference)
                  }
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-canvas)] px-3 py-2"
                >
                  <option value="light">Light (Soft Ivory)</option>
                  <option value="dark">Dark (Deep Forest)</option>
                  <option value="system">Match System</option>
                </select>
              </label>
            </div>

            <div>
              <span className="block font-semibold">Avatar Accent Colour</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {AVATAR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    aria-label={`Select colour ${hex}`}
                    onClick={() => setAvatarColor(hex)}
                    style={{ backgroundColor: hex }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white ring-offset-2 focus:ring-2"
                  >
                    {avatarColor.toUpperCase() === hex && (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] p-3">
              <input
                type="checkbox"
                data-testid="settings-share-email"
                checked={privacyShareEmail}
                onChange={(e) => setPrivacyShareEmail(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Shield className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                  Share my email address with non-owner trip collaborators
                </span>
                <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                  When unchecked, only trip owners and you can see your email in
                  member rosters and JSON/CSV exports.
                </p>
              </div>
            </label>

            {error && (
              <p role="alert" className="font-semibold text-[var(--status-error)]">
                {error}
              </p>
            )}

            <Button
              type="submit"
              data-testid="save-settings-btn"
              disabled={updateMut.isPending}
            >
              Save Settings
            </Button>
          </form>
        </Card>

        <DeleteAccountCard isDemo={user.isDemo} />
      </div>
    </AppShell>
  );
}
