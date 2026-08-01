// Design tokens. ProjectShred.artifact.jsx:18-127 (the Design Quality Pass, post-
// Sprint 8). Transcribed verbatim — every hex value, font stack, and preset below
// is copied unchanged. This is explicitly NOT generic Tailwind color/font output;
// see CLAUDE.md's Design System section for why each choice was made.

// ---------------------------------------------------------------------------
// Typography — a real pairing, not "Heebo everywhere". Heebo is the neutral,
// highly-legible body face. IBM Plex Sans Hebrew — NOT JetBrains Mono, which
// has zero Hebrew glyph coverage and silently broke mixed Hebrew/numeral text
// (Sprint 15.14) — is reserved for every number in the app, with tabular
// figures so columns of digits align.
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
//
// Sprint 16: FONT_DISPLAY switched from Frank Ruhl Libre (a serif) to Rubik —
// a heavy-weight, geometric, rounded Hebrew-native sans. This directly reverses
// the original "Design Quality Pass" rationale for the serif pairing (see
// CLAUDE.md's Design System section) — that was a deliberate response to
// looking "too generic-AI-sans-everywhere" at the time. The new reference
// direction (health/wearable apps like Nixtio's Biosora) explicitly wants the
// opposite register: big, bold, black-weight sans numerals and headings, no
// serif anywhere. Per direct user feedback with visual references, that call
// stands — same reasoning discipline as the Sprint 14→15 dark/light reversal,
// documented here rather than silently overwritten.
export const FONT_DISPLAY = "var(--font-display), 'Rubik', 'Heebo', sans-serif";
export const FONT_BODY = "var(--font-body), 'Heebo', 'Segoe UI', sans-serif";
export const FONT_MONO = "var(--font-mono), 'IBM Plex Sans Hebrew', 'Heebo', sans-serif";

// Sprint 34 — a single shared shape system for the header/date-navigator
// control row (theme toggle, settings, profile switcher, training/rest
// segmented control, date-navigator arrows + label). Direct feedback: these
// pills/circles had each accreted their own height and radius over separate
// sprints (rounded-xl/rounded-2xl/rounded-lg all mixed together, 36-38-40px
// heights depending on padding vs. a fixed size) and visibly didn't line up
// on one baseline or share one "shape language." CONTROL_HEIGHT is the one
// height every control in that row now uses (icon buttons are exactly
// square at this size; pill controls use it as a fixed height so their
// padding can vary without the row's baseline drifting), and CONTROL_RADIUS
// is `rounded-full` everywhere — a true stadium/circle shape reads as more
// deliberately "custom" than an arbitrary intermediate radius, and it's the
// one radius value that looks identical on both a square icon button and a
// wide pill.
export const CONTROL_HEIGHT = 40;
export const CONTROL_RADIUS = 9999;

// Restrained elevation, not neon ambient glow: small radius blur, low opacity,
// used sparingly (active/selected states, the tour spotlight) rather than on
// every interactive element.
export function glow(hex: string, size = 10, alpha = '38'): string {
  return `0 0 ${size}px ${hex}${alpha}`;
}

// Sprint 18 — the shared "tactile 3D button" treatment: a top-lit gradient
// (light tint -> a darker shade of the same hue, not flat color-to-color)
// plus a bright inner top border, the classic combination that makes a flat
// button read as a pressable physical surface rather than a color swatch.
// Centralized here rather than re-typed at every call site (login/signup/
// forgot-password/reset-password's submit buttons all use this identically).
export function tactileGradient(hex: string): { background: string; borderTop: string; boxShadow: string } {
  return {
    background: `linear-gradient(135deg, color-mix(in srgb, ${hex}, white 20%), color-mix(in srgb, ${hex}, black 15%))`,
    borderTop: '1px solid rgba(255,255,255,0.3)',
    boxShadow: `0 4px 14px -4px ${hex}70`,
  };
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

// Sprint 18 — "Doomsday" pass to a genuine Linear/Vercel-grade dark register,
// per direct, explicit, technically-specified feedback (the earlier #07070A
// warm-obsidian compromise was called out plainly as still reading muddy).
// Base pushed the rest of the way to near-true black (#050505 — still just
// short of literal #000 for the same reason as before: pure black reads as
// an unstyled void, not a designed surface); surfaces are now flat near-black
// (#0A0A0A/#0E0E0E) rather than the old plum-tinted charcoal; borders and
// input fills move to translucent white (rgba(255,255,255,0.1) /
// rgba(255,255,255,0.03)) instead of opaque hex, which is what actually
// produces the "hairline edge over black glass" look this register is after;
// text goes to genuinely near-white. This branch is UNCHANGED by Sprint 21's
// light-mode reactivation below — dark mode is still fully available via the
// header toggle, just no longer the forced-only default.
export const THEME_PRESETS: Record<ThemeMode, ThemePreset> = {
  dark: {
    bg: '#050505',
    bgGrad: 'radial-gradient(ellipse 140% 90% at 50% -15%, #0D0D10 0%, #050505 55%)',
    card: '#0A0A0A',
    cardSolid: '#0A0A0A',
    cardBorder: 'rgba(255,255,255,0.1)',
    elevated: '#111111',
    border: 'rgba(255,255,255,0.1)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.65)',
    textDim: 'rgba(255,255,255,0.4)',
    inputBg: 'rgba(255,255,255,0.03)',
    chipBg: 'rgba(255,255,255,0.05)',
    popover: '#0A0A0A',
    modalBg: '#0A0A0A',
    overlayBg: 'rgba(0,0,0,0.85)',
    shadowCard: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px -18px rgba(0,0,0,0.9)',
    dropdownShadow: '0 30px 60px -10px rgba(0,0,0,0.8)',
    modalShadowExtra: '0 30px 60px -10px rgba(0,0,0,0.8)',
  },
  // Sprint 15 — light mode is the default again (Sprint 14's dark-mode lock
  // was reverted after direct feedback with reference designs: warm cream/
  // oat backgrounds, soft off-white cards, editorial typography, generous
  // whitespace — "more professional and mature" than the neon-dark direction).
  // Deepened from the previous alabaster (#FBF9F6/#FFFFFF) toward a genuine
  // warm cream (#F7F1E7) with a barely-off-white card (#FFFEFB, not stark
  // #FFFFFF) — pure white cards on a near-white page read as flat/generic;
  // a whisper of warmth on both, still clearly distinct from each other,
  // reads as considered instead of default. Shadow deepened slightly too —
  // "mature" needs real, soft elevation, not a hairline.
  //
  // Sprint 21 — reactivated (see the Sprint 21 note on THEME_PRESETS above
  // and shred-store.ts) after being unreachable-but-kept since Sprint 18.
  // These values themselves were never touched while dark-only — everything
  // built in Sprints 18-20 (GlassCard's smoked glass, TiltCard's glare,
  // the mesh-gradient blobs, the placeholder color) was written assuming
  // permanent dark mode, so those got audited and fixed for light mode as
  // part of this reactivation rather than assumed to already work.
  light: {
    bg: '#F7F1E7',
    bgGrad: 'radial-gradient(ellipse 130% 80% at 50% -10%, #FFFDF9 0%, #F7F1E7 55%)',
    card: '#FFFEFB',
    cardSolid: '#FFFEFB',
    cardBorder: '#E4DAC8',
    elevated: '#F1E9D9',
    border: '#E4DAC8',
    textPrimary: '#211C16',
    textSecondary: '#655A48',
    textDim: '#9C8F76',
    inputBg: '#F1E9D9',
    chipBg: '#F1E9D9',
    popover: '#FFFEFB',
    modalBg: '#FFFEFB',
    overlayBg: 'rgba(33,28,22,0.55)',
    shadowCard: '0 2px 4px rgba(33,28,22,0.05), 0 16px 36px -20px rgba(33,28,22,0.24)',
    dropdownShadow: '0 20px 45px -16px rgba(33,28,22,0.22)',
    modalShadowExtra: '0 30px 70px -24px rgba(33,28,22,0.26)',
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
