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
// around, not just at the top. What this deliberately did NOT do: drop the
// background down to the requested ~0.02-0.05 alpha (near-fully-transparent)
// — that's the exact "glassmorphism-by-default" look Sprint 7's original
// Design Quality Pass moved away from after direct feedback that it read as
// generic AI output, and at that opacity light-mode cards would barely be
// distinguishable from the page behind them. The compromise: noticeably more
// depth and reflection than before, while staying legible and on the
// project's own established brand rather than reverting a documented,
// deliberate decision.

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

  // Sprint 13: dark-mode alpha nudged down (B8 -> AA, ~67% opaque) so the
  // brightened ambient blobs behind the card (see page.tsx) actually read
  // through the glass instead of the card reading as a near-opaque patch on
  // top of them — the two changes only work together.
  const glassBg = isDark ? `${T.t.card}AA` : `${T.t.card}F0`; // ~67% dark / ~94% light
  const innerHighlight = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.75)';
  // Full-perimeter inset ring — the "1px light-reflection edge" — distinct
  // from the actual border below, which still carries accent color when set.
  const innerRing = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.55)';
  const glassBorder = accent === null
    ? (isDark ? 'rgba(255,255,255,0.13)' : T.t.border)
    : `${a}45`;

  const nearShadow = isDark ? '0 6px 14px -8px rgba(0,0,0,0.55)' : '0 4px 10px -6px rgba(36,31,26,0.12)';
  const ambientShadow = isDark ? '0 32px 64px -24px rgba(0,0,0,0.6)' : '0 28px 56px -22px rgba(36,31,26,0.16)';
  const accentShadow = accent === null ? null : `0 18px 40px -20px ${a}50`;

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
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: `1px solid ${glassBorder}`,
        boxShadow,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
