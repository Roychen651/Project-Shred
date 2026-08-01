'use client';

// Sprint 35 — a compact, icon-driven replacement for the concatenated
// "12ח 36פ 4ש" Hebrew-letter macro line that every logged-item/dish row in
// the app (day log, quick-log preview, restaurant matrix) still rendered —
// a direct complaint, pointed at with a literal example of how it reads
// ("משעמם. 12ח 36פ 4ש"). Letters-as-units read as a garbled acronym at a
// glance; one small glyph per macro, each already tied to its established
// color (T.macro.*) elsewhere in the app (MacroReadout, MacroStatTiles),
// reads instantly without translating letters in your head first.
//
// Deliberately NOT MacroReadout (PlateComposerSheetBody, Sprint 33) — that's
// four boxed hero tiles sized for a single "selected ingredient" panel. This
// is the inline, single-line variant meant to sit under a row's title,
// where several rows stack per screen and boxed tiles would be far too tall.

import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';

export interface MacroLineProps {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Optional leading label (e.g. a portion amount: "200 גרם") before the icons. */
  prefix?: string;
  className?: string;
}

export function MacroLine({ kcal, protein, carbs, fat, prefix, className }: MacroLineProps) {
  const T = useTheme();
  const stats: [typeof Flame, number, string][] = [
    [Flame, kcal, T.macro.kcal],
    [Beef, protein, T.macro.protein],
    [Wheat, carbs, T.macro.carbs],
    [Droplet, fat, T.macro.fat],
  ];
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className || ''}`} style={{ fontFamily: FONT_MONO }}>
      {prefix && <span className="text-[11px] font-semibold" style={{ color: T.t.textDim }}>{prefix}</span>}
      <div className="flex items-center gap-2">
        {stats.map(([Icon, value, color], i) => (
          <span key={i} className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: T.t.textSecondary }}>
            <Icon size={11} color={color} />
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}
