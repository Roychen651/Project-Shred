// Design tokens. ProjectShred.artifact.jsx:18-127 (the Design Quality Pass, post-
// Sprint 8). Transcribed verbatim — every hex value, font stack, and preset below
// is copied unchanged. This is explicitly NOT generic Tailwind color/font output;
// see CLAUDE.md's Design System section for why each choice was made.

// ---------------------------------------------------------------------------
// Typography — a real pairing, not "Heebo everywhere". Frank Ruhl Libre is a
// serif purpose-built for Hebrew+Latin (Israeli editorial design), used for
// headings only. Heebo is the neutral, highly-legible body face. IBM Plex Sans
// Hebrew — NOT JetBrains Mono, which has zero Hebrew glyph coverage and silently
// broke mixed Hebrew/numeral text (Sprint 15.14) — is reserved for every number
// in the app, with tabular figures so columns of digits align.
//
// Sprint 7: the artifact loaded these via a plain `<link>` to the Google Fonts
// CSS API (GOOGLE_FONTS_IMPORT, now removed). That's a real third-party runtime
// request — it can be slow, render-blocking, or silently dropped by an ad/
// tracker blocker, a strict corporate proxy, or a flaky connection, any of
// which falls back to the browser's default sans-serif with no visible error.
// `next/font/google` self-hosts the exact same font files at build time (no
// runtime request to Google at all) and exposes them as CSS custom properties
// via `variable` in app/layout.tsx; FONT_DISPLAY/FONT_BODY/FONT_MONO below
// reference those variables first, with the original family-name fallback
// chain kept after them for any environment where the variable isn't defined
// (e.g. a component rendered outside the root layout in a test).
// ---------------------------------------------------------------------------
export const FONT_DISPLAY = "var(--font-display), 'Frank Ruhl Libre', 'Heebo', serif";
export const FONT_BODY = "var(--font-body), 'Heebo', 'Segoe UI', sans-serif";
export const FONT_MONO = "var(--font-mono), 'IBM Plex Sans Hebrew', 'Heebo', sans-serif";

// Restrained elevation, not neon ambient glow: small radius blur, low opacity,
// used sparingly (active/selected states, the tour spotlight) rather than on
// every interactive element.
export function glow(hex: string, size = 10, alpha = '38'): string {
  return `0 0 ${size}px ${hex}${alpha}`;
}

// ---------------------------------------------------------------------------
// Color — derived, desaturated jewel tones, deliberately NOT stock Tailwind
// emerald/cyan/violet/amber (the literal generic-AI tell this app started with).
// Each has a slightly deeper dark-surface shade and a slightly richer light-
// surface shade — standard practice: pull saturation/lightness down a touch on
// dark backgrounds (where saturated hues read as neon), up a touch on light ones
// (for contrast).
// ---------------------------------------------------------------------------
export type ThemeMode = 'dark' | 'light';
export type JewelKey = 'jade' | 'bronze' | 'steel' | 'plum' | 'petrol';

export const JEWEL: Record<ThemeMode, Record<JewelKey, string>> = {
  dark: { jade: '#3F8D6E', bronze: '#CE8027', steel: '#548BB6', plum: '#9064AF', petrol: '#3E8B98' },
  light: { jade: '#307E5F', bronze: '#B8701E', steel: '#3A77A6', plum: '#7D49A2', petrol: '#2E7C8A' },
};

export interface MacroColors {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

// Fixed regardless of accent — these encode data meaning (which macro is which),
// not brand identity. Recoloring them on accent change would hurt readability.
export function getMacroColors(mode: ThemeMode): MacroColors {
  const j = JEWEL[mode];
  return { kcal: j.bronze, protein: j.jade, carbs: j.steel, fat: j.plum };
}

export type AccentKey = 'emerald' | 'cyan' | 'violet' | 'gold';

export const ACCENT_META: Record<AccentKey, { label: string; emoji: string; key: JewelKey }> = {
  emerald: { label: 'Jade', emoji: '🟢', key: 'jade' },
  cyan: { label: 'Petrol', emoji: '🔷', key: 'petrol' },
  violet: { label: 'Plum', emoji: '🟣', key: 'plum' },
  gold: { label: 'Bronze', emoji: '🟡', key: 'bronze' },
};

export function getAccentHex(mode: ThemeMode, accentKey: AccentKey): string {
  return JEWEL[mode][ACCENT_META[accentKey].key];
}

export const ACCENT_PRESETS: Record<AccentKey, { hex: string; label: string; emoji: string }> = {
  emerald: { hex: JEWEL.dark.jade, label: 'Jade', emoji: '🟢' },
  cyan: { hex: JEWEL.dark.petrol, label: 'Petrol', emoji: '🔷' },
  violet: { hex: JEWEL.dark.plum, label: 'Plum', emoji: '🟣' },
  gold: { hex: JEWEL.dark.bronze, label: 'Bronze', emoji: '🟡' },
};

// ---------------------------------------------------------------------------
// Neutrals — warm-tinted, never pure black/white. Dark base is a warm charcoal
// (not cool blue-black); light base is a warm alabaster (not cool slate). Both
// share the same warm temperature so dark/light read as one system.
// ---------------------------------------------------------------------------
export interface ThemePreset {
  bg: string;
  bgGrad: string;
  card: string;
  cardSolid: string;
  cardBorder: string;
  elevated: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textDim: string;
  inputBg: string;
  chipBg: string;
  popover: string;
  modalBg: string;
  overlayBg: string;
  shadowCard: string;
  dropdownShadow: string;
  modalShadowExtra: string;
}

// Sprint 14 — dark mode is now permanent (see ThemeContext.tsx), so its base
// went deeper toward genuine obsidian (#07070A, close to the requested
// #050505 but not literal flat black — pure #000 reads as a rendering
// error/unstyled void rather than a designed surface, the same reason the
// original Design Quality Pass avoided pure black to begin with) rather than
// the previous warm-charcoal compromise, which was tuned to also work as a
// *light-mode-adjacent* dark theme. That constraint is gone.
export const THEME_PRESETS: Record<ThemeMode, ThemePreset> = {
  dark: {
    bg: '#07070A',
    bgGrad: 'radial-gradient(ellipse 140% 90% at 50% -15%, #15121C 0%, #07070A 55%)',
    card: '#100E14',
    cardSolid: '#100E14',
    cardBorder: '#24202E',
    elevated: '#191621',
    border: '#24202E',
    textPrimary: '#F5F3F8',
    textSecondary: '#B0ABC0',
    textDim: '#726C82',
    inputBg: '#100E14',
    chipBg: '#161320',
    popover: '#161320',
    modalBg: '#0F0D14',
    overlayBg: 'rgba(4,3,8,0.82)',
    shadowCard: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -18px rgba(0,0,0,0.85)',
    dropdownShadow: '0 20px 45px -16px rgba(0,0,0,0.8)',
    modalShadowExtra: '0 30px 70px -24px rgba(0,0,0,0.9)',
  },
  light: {
    bg: '#FBF9F6',
    bgGrad: 'radial-gradient(ellipse 130% 80% at 50% -10%, #FFFFFF 0%, #FBF9F6 55%)',
    card: '#FFFFFF',
    cardSolid: '#FFFFFF',
    cardBorder: '#E9E2D8',
    elevated: '#F6F1EA',
    border: '#E9E2D8',
    textPrimary: '#241F1A',
    textSecondary: '#6B6154',
    textDim: '#A69C8D',
    inputBg: '#F6F1EA',
    chipBg: '#F6F1EA',
    popover: '#FFFFFF',
    modalBg: '#FFFFFF',
    overlayBg: 'rgba(36,31,26,0.52)',
    shadowCard: '0 1px 2px rgba(36,31,26,0.04), 0 10px 28px -18px rgba(36,31,26,0.18)',
    dropdownShadow: '0 20px 45px -16px rgba(36,31,26,0.18)',
    modalShadowExtra: '0 30px 70px -24px rgba(36,31,26,0.22)',
  },
};

export type Density = 'comfortable' | 'compact';

export interface DensityPreset {
  label: string;
  section: string;
  card: string;
  cardSm: string;
  gap: string;
  ring: number;
  timelineGap: string;
  showDetail: boolean;
}

export const DENSITY_PRESETS: Record<Density, DensityPreset> = {
  comfortable: { label: 'מרווח', section: 'mb-8', card: 'p-5', cardSm: 'p-4', gap: 'gap-4', ring: 108, timelineGap: 'gap-4', showDetail: true },
  compact: { label: 'מרוכז', section: 'mb-4', card: 'p-3', cardSm: 'p-3', gap: 'gap-2', ring: 80, timelineGap: 'gap-2', showDetail: false },
};

export const DEFAULT_THEME_SETTINGS = {
  mode: 'dark' as ThemeMode,
  accentKey: 'emerald' as AccentKey,
  density: 'comfortable' as Density,
  feedback: true,
};
