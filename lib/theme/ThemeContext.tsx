'use client';

// ThemeContext. ProjectShred.artifact.jsx:66-127 (Sprint 7) — "every component
// reads `const T = useTheme()` instead of importing a hardcoded color object."
// This is the single structural change that makes live theme/accent/density
// switching possible without prop-drilling through every component.

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  THEME_PRESETS, DENSITY_PRESETS, DEFAULT_THEME_SETTINGS,
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
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_THEME_SETTINGS.mode);
  const [accentKey, setAccentKey] = useState<AccentKey>(DEFAULT_THEME_SETTINGS.accentKey);
  const [density, setDensity] = useState<Density>(DEFAULT_THEME_SETTINGS.density);
  const [feedback, setFeedback] = useState(DEFAULT_THEME_SETTINGS.feedback);

  const value = useMemo<ShredTheme>(() => ({
    mode, accentKey, density, feedback,
    accent: getAccentHex(mode, accentKey),
    t: THEME_PRESETS[mode],
    macro: getMacroColors(mode),
    spacing: DENSITY_PRESETS[density],
    glow,
    setMode, setAccentKey, setDensity, setFeedback,
  }), [mode, accentKey, density, feedback]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
