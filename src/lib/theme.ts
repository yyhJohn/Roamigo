import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'roamigo:theme';

function readStoredTheme(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') {
      return raw;
    }
  } catch (err) {
    console.warn('Unable to read theme preference from localStorage:', err);
  }
  return 'light';
}

export function resolveIsDark(pref: ThemePreference): boolean {
  if (pref === 'dark') return true;
  if (pref === 'light') return false;
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyThemeToDom(pref: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const isDark = resolveIsDark(pref);
  document.documentElement.classList.toggle('dark', isDark);
}

interface ThemeStore {
  preference: ThemePreference;
  setPreference: (next: ThemePreference) => void;
  toggleLightDark: () => void;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  preference: readStoredTheme(),
  setPreference: (next) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (err) {
      console.warn('Unable to persist theme preference:', err);
    }
    applyThemeToDom(next);
    set({ preference: next });
  },
  toggleLightDark: () => {
    const current = resolveIsDark(get().preference) ? 'dark' : 'light';
    const next: ThemePreference = current === 'dark' ? 'light' : 'dark';
    get().setPreference(next);
  },
}));
