'use client';

// ProjectShred.artifact.jsx:1519-1535. accent === null renders a neutral card
// (plain border, theme shadow); any other value (or omitted, defaulting to the
// current theme accent) renders an accent-tinted border/glow.

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
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${className}`}
      style={{
        background: T.t.card,
        border: `1.5px solid ${accent === null ? T.t.border : `${a}40`}`,
        boxShadow: accent === null ? T.t.shadowCard : `0 8px 24px -14px ${a}30`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
