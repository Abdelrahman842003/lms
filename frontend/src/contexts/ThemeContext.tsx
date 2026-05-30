'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read from localStorage or default to system
    const storedTheme = localStorage.getItem('neetaq-theme') as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
    } else {
      setThemeState('system');
    }
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('neetaq-theme', newTheme);
  };

  const getActiveTheme = (t: Theme): 'dark' | 'light' => {
    if (t === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark'; // Fallback for SSR
    }
    return t;
  };

  const toggleTheme = () => {
    const active = getActiveTheme(theme);
    setTheme(active === 'dark' ? 'light' : 'dark');
  };

  // Sync theme changes with DOM on mount and updates
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    const activeTheme = getActiveTheme(theme);
    
    root.setAttribute('data-theme', activeTheme);
    if (activeTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Listen for system theme changes if theme is 'system'
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newActiveTheme = e.matches ? 'dark' : 'light';
        root.setAttribute('data-theme', newActiveTheme);
        if (newActiveTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
