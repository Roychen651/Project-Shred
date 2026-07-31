'use client';

// ThemeContext. ProjectShred.artifact.jsx:66-127 (Sprint 7) — "every component
// reads `const T = useTheme()` instead of importing a hardcoded color object."
// This is the single structural change that makes live theme/accent/density
// switching possible without prop-drilling through every component.
//
// Sprint 9: this used to hold its own independent useState for mode/accentKey/
// density/feedback — a real, previously-undiagnosed bug, since shred-store.ts
// ALSO had mode/accentKey/density/feedback fields with setters that nothing
// ever called. Two disconnected copies of "the current theme" existed; the
// one actually driving the UI was never the one Sprint 8/9's sync layer could
// see or persist. Now the store is the only copy — this file is a thin
// derived-values wrapper around it, so theme preferences round-trip through
// hydrateFromServer/supabaseSync exactly like everything else in user_settings.
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useShredStore } from '@/lib/store/shred-store';
import {
  THEME_PRESETS, DENSITY_PRESETS,
  getAccentHex, getMacroColors, glow,
  type ThemeMode, type AccentKey, type Density, type ThemePreset, type DensityPreset, type MacroColors,
} from './tokens';

export interface ShredTheme {
  mode: ThemeMode;
  accentKey: AccentKey;
  density: Density;
  feedback: boolean;
  accent: string;
  t: ThemePreset;
  macro: MacroColors;
  spacing: DensityPreset;
  glow: typeof glow;
  setMode: (mode: ThemeMode) => void;
  setAccentKey: (key: AccentKey) => void;
  setDensity: (density: Density) => void;
  setFeedback: (on: boolean) => void;
}

const ThemeContext = createContext<ShredTheme | null>(null);

export function useTheme(): ShredTheme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme() must be called inside <ThemeProvider>');
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useShredStore((s) => s.mode);
  const accentKey = useShredStore((s) => s.accentKey);
  const density = useShredStore((s) => s.density);
  const feedback = useShredStore((s) => s.feedback);
  const setMode = useShredStore((s) => s.setMode);
  const setAccentKey = useShredStore((s) => s.setAccentKey);
  const setDensity = useShredStore((s) => s.setDensity);
  const setFeedback = useShredStore((s) => s.setFeedback);

  const accent = getAccentHex(mode, accentKey);

  // Sprint 18 — exposes the live accent as a CSS custom property so plain
  // globals.css rules (the real :focus glow on every input, app-wide — see
  // that file) can react to accent changes without needing useTheme() at the
  // point of each rule. React inline styles can't target :focus/::placeholder
  // at all, so this is the one place that bridge has to exist.
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-hex', accent);
  }, [accent]);

  const value = useMemo<ShredTheme>(() => ({
    mode, accentKey, density, feedback,
    accent,
    t: THEME_PRESETS[mode],
    macro: getMacroColors(mode),
    spacing: DENSITY_PRESETS[density],
    glow,
    setMode, setAccentKey, setDensity, setFeedback,
  }), [mode, accentKey, density, feedback, accent, setMode, setAccentKey, setDensity, setFeedback]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
