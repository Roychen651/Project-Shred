'use client';

// ProjectShred.artifact.jsx:1537-1547.

import type { ReactNode } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  const T = useTheme();
  return (
    <span
      className="text-xs font-semibold uppercase inline-block mb-2"
      style={{ color: color || T.accent, letterSpacing: '0.08em', fontFamily: FONT_MONO }}
    >
      {children}
    </span>
  );
}
