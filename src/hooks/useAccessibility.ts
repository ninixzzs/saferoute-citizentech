import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontSizeScale = 'sm' | 'md' | 'lg' | 'xl';

const STORAGE_THEME_KEY = 'saferoute_theme_mode';
const STORAGE_FONT_KEY = 'saferoute_font_scale';
const STORAGE_CONTRAST_KEY = 'saferoute_high_contrast';

const FONT_PX_MAP: Record<FontSizeScale, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
  xl: '20px',
};

export function useAccessibility() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem(STORAGE_THEME_KEY) as ThemeMode | null;
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
  });

  const [fontSize, setFontSize] = useState<FontSizeScale>(() => {
    if (typeof window === 'undefined') return 'md';
    const saved = localStorage.getItem(STORAGE_FONT_KEY) as FontSizeScale | null;
    return saved && FONT_PX_MAP[saved] ? saved : 'md';
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_CONTRAST_KEY) === 'true';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Listen to device/OS color scheme changes live
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);

    setSystemPrefersDark(media.matches);
    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : themeMode;

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_THEME_KEY, themeMode);
  }, [themeMode, resolvedTheme]);

  // Apply font size scale to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = FONT_PX_MAP[fontSize];
    root.dataset.fontScale = fontSize;
    localStorage.setItem(STORAGE_FONT_KEY, fontSize);
  }, [fontSize]);

  // Apply high contrast class
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem(STORAGE_CONTRAST_KEY, String(highContrast));
  }, [highContrast]);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      if (prev === 'sm') return 'md';
      if (prev === 'md') return 'lg';
      if (prev === 'lg') return 'xl';
      return 'xl';
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      if (prev === 'xl') return 'lg';
      if (prev === 'lg') return 'md';
      if (prev === 'md') return 'sm';
      return 'sm';
    });
  }, []);

  const resetAccessibility = useCallback(() => {
    setThemeMode('system');
    setFontSize('md');
    setHighContrast(false);
  }, []);

  return {
    themeMode,
    setThemeMode,
    resolvedTheme,
    fontSize,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    highContrast,
    setHighContrast,
    resetAccessibility,
  };
}
