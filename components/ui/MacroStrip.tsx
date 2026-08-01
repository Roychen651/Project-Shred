'use client';

// ProjectShred.artifact.jsx:1813-1823.

import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { roundNum } from '@/lib/domain/util';
import type { MacroTotals } from '@/lib/domain/items';

// Every caller sums several already-rounded per-item macro values together
// (e.g. QuickLogSheetBody's/PlateComposerSheetBody's `.reduce()` totals) —
// adding decimals in JS doesn't stay clean (0.2 + 3.2 can render as
// "3.4000000000000004"), and this is the one place all of those totals are
// actually displayed, so it's rounded once here rather than trusting every
// caller to re-round its own sum.
export function MacroStrip({ totals }: { totals: MacroTotals }) {
  const T = useTheme();
  return (
    <div className="flex items-center gap-4 flex-wrap text-sm" style={{ fontFamily: FONT_MONO }}>
      <span className="font-bold" style={{ color: T.t.textPrimary }}>{Math.round(totals.kcal)} קל׳</span>
      <span style={{ color: T.macro.protein }}>ח {roundNum(totals.protein)}g</span>
      <span style={{ color: T.macro.carbs }}>פ {roundNum(totals.carbs)}g</span>
      <span style={{ color: T.macro.fat }}>ש {roundNum(totals.fat)}g</span>
    </div>
  );
}
