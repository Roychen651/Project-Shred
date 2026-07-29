'use client';

// ProjectShred.artifact.jsx:5496-5510 (Sprint 15.1) — so the ring's meaning
// doesn't have to be inferred from color alone.

import { useTheme } from '@/lib/theme/ThemeContext';

export function HeroRingLegend() {
  const T = useTheme();
  return (
    <div className="flex items-center justify-center gap-5 text-xs mb-6" style={{ color: T.t.textDim }}>
      <span className="flex items-center gap-1.5">
        <span className="rounded-full" style={{ width: 9, height: 9, background: T.macro.kcal }} />
        טבעת חיצונית · קלוריות
      </span>
      <span className="flex items-center gap-1.5">
        <span className="rounded-full" style={{ width: 9, height: 9, background: T.macro.protein }} />
        טבעת פנימית · חלבון
      </span>
    </div>
  );
}
