'use client';

// ProjectShred.artifact.jsx:1813-1823.

import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import type { MacroTotals } from '@/lib/domain/items';

export function MacroStrip({ totals }: { totals: MacroTotals }) {
  const T = useTheme();
  return (
    <div className="flex items-center gap-4 flex-wrap text-sm" style={{ fontFamily: FONT_MONO }}>
      <span className="font-bold" style={{ color: T.t.textPrimary }}>{totals.kcal} קל׳</span>
      <span style={{ color: T.macro.protein }}>ח {totals.protein}g</span>
      <span style={{ color: T.macro.carbs }}>פ {totals.carbs}g</span>
      <span style={{ color: T.macro.fat }}>ש {totals.fat}g</span>
    </div>
  );
}
