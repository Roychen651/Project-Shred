'use client';

// ProjectShred.artifact.jsx:5496-5510 (Sprint 15.1) — so the ring's meaning
// doesn't have to be inferred from color alone.
//
// Sprint 17: flat colored dots -> small icon chips (gradient-tinted circle +
// icon), matching the crafted-chip language applied to the ring's own delta
// pill in the same pass — a plain dot read as one of the "generic" elements.

import { Flame } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { ProteinCutIcon } from '@/components/ui/ProteinCutIcon';

export function HeroRingLegend() {
  const T = useTheme();
  return (
    <div className="flex items-center justify-center gap-5 text-xs mb-6" style={{ color: T.t.textDim }}>
      <span className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded-full"
          style={{ width: 20, height: 20, background: `linear-gradient(135deg, color-mix(in srgb, ${T.macro.kcal}, white 25%), ${T.macro.kcal})` }}
        >
          <Flame size={11} color="#07080B" />
        </span>
        טבעת חיצונית · קלוריות
      </span>
      <span className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded-full"
          style={{ width: 20, height: 20, background: `linear-gradient(135deg, color-mix(in srgb, ${T.macro.protein}, white 25%), ${T.macro.protein})` }}
        >
          <ProteinCutIcon size={11} color="#07080B" />
        </span>
        טבעת פנימית · חלבון
      </span>
    </div>
  );
}
