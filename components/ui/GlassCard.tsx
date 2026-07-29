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

  const glassBg = isDark ? `${T.t.card}B8` : `${T.t.card}F0`; // ~72% dark / ~94% light
  const innerHighlight = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const glassBorder = accent === null
    ? (isDark ? 'rgba(255,255,255,0.09)' : T.t.border)
    : `${a}45`;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        background: glassBg,
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: `1px solid ${glassBorder}`,
        boxShadow: accent === null
          ? `${T.t.shadowCard}, inset 0 1px 0 ${innerHighlight}`
          : `0 14px 36px -18px ${a}45, ${T.t.shadowCard}, inset 0 1px 0 ${innerHighlight}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
