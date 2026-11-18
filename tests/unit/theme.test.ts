import { afterEach, describe, expect, it, vi } from 'vitest';
import { cn } from '../../src/lib/cn';
import { applyThemeToDom, resolveIsDark, useThemeStore } from '../../src/lib/theme';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('design system theme & cn utilities', () => {
  it('merges conditional Tailwind class names cleanly', () => {
    const conditionalHidden = '';
    expect(cn('px-3 py-2', conditionalHidden, 'px-5')).toBe('py-2 px-5');
  });

  it('toggles light and dark mode on documentElement and persists preference', () => {
    const store = new Map<string, string>();
    const classSet = new Set<string>();

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => {
          store.set(k, v);
        },
      },
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal('document', {
      documentElement: {
        classList: {
          toggle: (cls: string, force?: boolean) => {
            if (force) classSet.add(cls);
            else classSet.delete(cls);
          },
          contains: (cls: string) => classSet.has(cls),
        },
      },
    });

    useThemeStore.getState().setPreference('light');
    expect(resolveIsDark('light')).toBe(false);
    expect(classSet.has('dark')).toBe(false);

    useThemeStore.getState().toggleLightDark();
    expect(useThemeStore.getState().preference).toBe('dark');
    expect(classSet.has('dark')).toBe(true);
    expect(store.get('roamigo:theme')).toBe('dark');

    applyThemeToDom('light');
    expect(classSet.has('dark')).toBe(false);
  });
});
