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
// Sprint 14 — dark mode is now the app's permanent, only-reachable mode (see
// ThemeContext.tsx/shred-store.ts: the light/dark toggle is gone and
// hydration can no longer set mode to 'light'). With light-mode legibility
// no longer a live constraint, the dark branch below goes all the way to
// the aggressive frosted-glass look that was previously moderated for that
// reason: a much lighter, near-white-tinted translucent fill (not the
// card's own dark hex at low alpha — a literal light frost over whatever's
// blurred behind it, matching genuine Apple-style frosted glass), blur(40px)
// saturate(200%), a distinctly bright top highlight, and a heavier ambient
// shadow. The `light` branch is left as it was (a dead code path now, but
// harmless to keep — see the file-level note in ThemeContext.tsx on why
// THEME_PRESETS.light wasn't deleted outright).
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
  const glassBg = isDark ? 'rgba(255,255,255,0.035)' : `${T.t.card}F0`;
  const innerHighlight = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)';
  // Full-perimeter inset ring — the "1px light-reflection edge" — distinct
  // from the actual border below, which still carries accent color when set.
  const innerRing = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)';
  const glassBorder = accent === null
    ? (isDark ? 'rgba(255,255,255,0.15)' : T.t.border)
    : `${a}55`;

  const nearShadow = isDark ? '0 20px 40px -10px rgba(0,0,0,0.8)' : '0 4px 10px -6px rgba(36,31,26,0.12)';
  const ambientShadow = isDark ? '0 40px 80px -28px rgba(0,0,0,0.7)' : '0 28px 56px -22px rgba(36,31,26,0.16)';
  const accentShadow = accent === null ? null : `0 0 48px -8px ${a}66`;

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
        backdropFilter: isDark ? 'blur(40px) saturate(200%)' : 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: isDark ? 'blur(40px) saturate(200%)' : 'blur(28px) saturate(180%)',
        border: `1px solid ${glassBorder}`,
        boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
