'use client';

// ProjectShred.artifact.jsx:1519-1535, elevated in Sprint 5 per direct feedback
// that the flat matte cards read as generic/cheap. Genuine glass: translucent
// background (hex + alpha, same pattern already used everywhere else in this
// codebase for accent overlays) + backdrop-blur so content behind actually
// shows through, a soft inner top highlight for real depth, and a layered
// shadow (theme's own elevation shadow plus a second, wider ambient layer).
//
// Kept inside the existing JEWEL/THEME_PRESETS token system rather than
// switching to generic Tailwind slate/zinc + arbitrary bg-white/[0.02]
// utilities — same design language, applied with more depth, not a different
// palette. Opacity is tuned for legibility: low enough to read as glass,
// high enough that body text never fights the page background behind it.
//
// Sprint 11 — a "Stripe/Apple depth" pass raised blur/saturation and added a
// genuine multi-layer shadow (a tight near-shadow for edge definition plus a
// large, soft ambient layer for real elevation, the same two-layer technique
// Stripe's own card components use) and a full inset ring border, not just
// a top highlight, so the glass edge reads as reflecting light all the way
// around, not just at the top.
//
// Sprint 14 — while dark mode was the app's only reachable mode, this went
// all the way to an aggressive frosted-glass look for the dark branch: a
// light frost tint over the blurred background, blur(40px) saturate(200%),
// a bright top highlight, heavy ambient shadow. That branch is UNCHANGED —
// dark mode is still available (see the header toggle), just no longer the
// forced default.
//
// Sprint 15 — light mode is the default again, with reference designs this
// time (warm cream backgrounds, soft off-white cards, crisp editorial
// typography — see tokens.ts's light preset note). Real glassmorphism (heavy
// blur revealing colorful content behind the pane) doesn't read as "premium"
// against a mostly-uniform warm-neutral background — there's nothing
// interesting to blur, so a translucent card there just looks washed out.
// The light branch is rebuilt around what actually reads as premium in that
// register instead: a crisp, nearly-solid warm-white card, a defined (not
// glassy) warm border, and genuine soft elevation from layered shadow — the
// same "real depth via shadow, not haze" approach modern light-mode product
// design (Linear's light theme, Stripe's docs) uses.
import type { ReactNode, CSSProperties } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  accent?: string | null;
}

export function GlassCard({ children, className = '', style = {}, accent }: GlassCardProps) {
  const T = useTheme();
  const a = accent || T.accent;
  const isDark = T.mode === 'dark';

  // Dark: a light frost tint (not the card's own dark hex) — the actual
  // "glass" look, where blurred/saturated content behind shows through a
  // pane rather than just a more-transparent dark chip.
  // Light: crisp and nearly solid — depth comes from shadow, not haze.
  const glassBg = isDark ? 'rgba(255,255,255,0.035)' : `${T.t.card}FA`;
  const innerHighlight = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)';
  // Full-perimeter inset ring — the "1px light-reflection edge" — distinct
  // from the actual border below, which still carries accent color when set.
  const innerRing = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.7)';
  const glassBorder = accent === null
    ? (isDark ? 'rgba(255,255,255,0.15)' : T.t.border)
    : `${a}55`;

  const nearShadow = isDark ? '0 20px 40px -10px rgba(0,0,0,0.8)' : '0 3px 8px -4px rgba(33,28,22,0.08)';
  const ambientShadow = isDark ? '0 40px 80px -28px rgba(0,0,0,0.7)' : '0 24px 48px -20px rgba(33,28,22,0.14)';
  const accentShadow = accent === null ? null : `0 0 48px -8px ${a}${isDark ? '66' : '3d'}`;

  const boxShadow = [
    accentShadow,
    nearShadow,
    ambientShadow,
    T.t.shadowCard,
    `inset 0 1px 0 ${innerHighlight}`,
    `inset 0 0 0 1px ${innerRing}`,
  ].filter(Boolean).join(', ');

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background: glassBg,
        backdropFilter: isDark ? 'blur(40px) saturate(200%)' : 'none',
        WebkitBackdropFilter: isDark ? 'blur(40px) saturate(200%)' : 'none',
        border: `1px solid ${glassBorder}`,
        boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
