import { create } from 'zustand';
import { THEME_STORAGE_KEY } from '@/lib/theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export { THEME_STORAGE_KEY };

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

/** Apply a preference to <html> (class + native control colors). */
export function applyTheme(pref: ThemePreference) {
  if (typeof document === 'undefined') return;
  const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

interface ThemeState {
  preference: ThemePreference;
  /** The theme actually shown (system resolved). */
  resolved: 'light' | 'dark';
  setPreference: (pref: ThemePreference) => void;
  /** Sync from storage / system; call once on mount. */
  init: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  resolved: 'light',
  setPreference: (preference) => {
    try {
      if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Storage unavailable (private mode): the choice still applies for this visit.
    }
    applyTheme(preference);
    set({ preference, resolved: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
  },
  init: () => {
    const preference = readPreference();
    applyTheme(preference);
    set({ preference, resolved: document.documentElement.classList.contains('dark') ? 'dark' : 'light' });
  },
}));
