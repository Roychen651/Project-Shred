'use client';

// Sprint 45 — a real calendar month view, not another horizontal strip. The
// existing 14-day picker strip in DateNavigator (today ±10/+3) is fine for
// "jump a few days either way" but was the app's only date-navigation
// surface — genuinely insufficient for reaching, say, three months back, a
// real gap this closes: a true Sunday-first (יום ראשון first column, per
// the explicit request) 4-6 row month grid with prev/next month paging and
// a compliance heat-dot per day, reusing the exact scoring pipeline
// ComplianceHeatmap already established (buildDailyLog → scoreDayLog →
// heatColor) rather than inventing a second one. Sits alongside the 14-day
// strip as an alternate view, not a replacement — the strip is still the
// faster path for "yesterday/tomorrow," this is for real long-range jumps.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import { dateKey, buildMonthGrid, formatHebrewMonthYear } from '@/lib/domain/dates';
import { buildDailyLog, scoreDayLog, heatColor, type DayMetaLike } from '@/lib/domain/analytics';
import type { LoggedItem } from '@/lib/domain/items';
import type { ComputedTargets } from '@/lib/domain/targets';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

// Sunday-first, matching buildMonthGrid's own Sunday-anchored weeks.
const DAY_HEADERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

export interface CalendarMonthViewProps {
  selectedDateKey: string;
  onChange: (dateKey: string) => void;
  itemsByDate: Record<string, LoggedItem[]>;
  dayMeta: Record<string, DayMetaLike>;
  computed: ComputedTargets;
}

export function CalendarMonthView({ selectedDateKey, onChange, itemsByDate, dayMeta, computed }: CalendarMonthViewProps) {
  const T = useTheme();
  const [sel] = selectedDateKey.split('-').map(Number);
  const initial = new Date(sel, Number(selectedDateKey.split('-')[1]) - 1, 1);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const today = dateKey(new Date());
  const grid = buildMonthGrid(viewYear, viewMonth);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const scoreFor = (key: string): number | null => {
    const log = buildDailyLog(itemsByDate[key], dayMeta[key]);
    if (!log) return null;
    return scoreDayLog(log, log.workoutDone ? computed.training : computed.rest);
  };

  return (
    <div dir="ltr" className="flex flex-col gap-2.5 mt-1">
      <div className="flex items-center justify-between" dir="rtl">
        <motion.button
          onClick={() => shiftMonth(-1)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          transition={tapSpring}
          className="flex items-center justify-center rounded-full"
          style={{ width: 30, height: 30, background: T.t.chipBg, border: `1px solid ${T.t.border}` }}
          aria-label="חודש קודם"
        >
          <ChevronRight size={14} color={T.t.textSecondary} />
        </motion.button>
        <span className="text-sm font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>
          {formatHebrewMonthYear(viewYear, viewMonth)}
        </span>
        <motion.button
          onClick={() => shiftMonth(1)}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          transition={tapSpring}
          className="flex items-center justify-center rounded-full"
          style={{ width: 30, height: 30, background: T.t.chipBg, border: `1px solid ${T.t.border}` }}
          aria-label="חודש הבא"
        >
          <ChevronLeft size={14} color={T.t.textSecondary} />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="text-center text-[10px] font-bold" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
            {h}
          </div>
        ))}
        {grid.flat().map((cell) => {
          const active = cell.key === selectedDateKey;
          const isToday = cell.key === today;
          const score = cell.inMonth ? scoreFor(cell.key) : null;
          const dotColor = heatColor(score, T.macro);
          return (
            <motion.button
              key={cell.key}
              onClick={() => onChange(cell.key)}
              whileTap={{ scale: 0.9 }}
              whileHover={cell.inMonth ? { scale: 1.06 } : undefined}
              transition={tapSpring}
              disabled={!cell.inMonth}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl"
              style={{
                aspectRatio: '1',
                background: active ? T.accent : T.t.chipBg,
                color: active ? '#07080B' : cell.inMonth ? T.t.textPrimary : T.t.textDim,
                border: `1px solid ${active ? T.accent : isToday ? `${T.accent}60` : T.t.border}`,
                opacity: cell.inMonth ? 1 : 0.35,
              }}
            >
              <span className="text-xs font-semibold" style={{ fontFamily: FONT_MONO }}>{cell.dayNum}</span>
              <span
                className="rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: dotColor || 'transparent',
                  boxShadow: dotColor ? `0 0 4px ${dotColor}` : 'none',
                }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
