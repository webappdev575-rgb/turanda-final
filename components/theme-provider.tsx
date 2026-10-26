'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with 'light' so the first client render matches the server
  // HTML (the inline head script has already applied the dark class, so there
  // is no visual flash); the saved preference is synced right after hydration.
  const [theme, setThemeState] = useState<Theme>('light');

  const applyTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('turanda-theme', t); } catch { /* Keep the in-memory preference. */ }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('turanda-theme') as Theme | null;
      const resolved: Theme = stored === 'dark' || stored === 'light'
        ? stored
        : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (resolved !== theme) setThemeState(resolved);
    } catch {
      // ignore storage errors (private mode etc.)
    }
  }, [theme]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, applyTheme]);

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
