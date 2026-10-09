import { useEffect, useState } from 'react';

export type Theme = 'light' | 'auto' | 'dark';

const STORAGE_KEY = 'filament-tracker:theme'; // also read in index.html, before the app starts

const load = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
};

/** Light, dark or automatic (follows the device), kept on this device. Like the "ik leer lezen" app. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(load);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      if (theme === 'auto') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // No storage (e.g. private browsing): the choice lasts until the page closes
    }
  }, [theme]);

  return { theme, setTheme };
}
