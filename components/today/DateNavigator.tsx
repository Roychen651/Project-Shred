'use client';

// Sprint 26 — a real, reported gap: `store.selectedDateKey`/`setSelectedDateKey`
// and the domain functions that make date math safe (shiftDateKey, dateKey,
// formatHebrewDate — all already ported, tested, and pinned against the
// Sprint 15.2 timezone regression) have existed since the store was built, but
// no component in this ported app ever exposed them. There was no way to see
// or navigate to any day other than today. This closes that gap directly:
// < previous | tappable date label | next >, plus a 14-day quick-jump strip
// and a "back to today" pill once you've navigated away.
//
// The prev/next arrows and the picker strip both use plain left-to-right
// spatial ordering (earlier = left, later = right) regardless of the app's
// RTL text direction — the same convention ComplianceHeatmap already
// documents for exactly this reason (calendar/temporal grids read
// chronologically, not by prose direction).

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO, FONT_DISPLAY, CONTROL_HEIGHT, CONTROL_RADIUS } from '@/lib/theme/tokens';
import { dateKey, shiftDateKey, formatHebrewDate, formatShortDate } from '@/lib/domain/dates';

export interface DateNavigatorProps {
  selectedDateKey: string;
  onChange: (dateKey: string) => void;
}

const tapSpring = { type: 'spring' as const, stiffness: 420, damping: 22 };

export function DateNavigator({ selectedDateKey, onChange }: DateNavigatorProps) {
  const T = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const today = dateKey(new Date());
  const isToday = selectedDateKey === today;
  const strip = Array.from({ length: 14 }, (_, i) => shiftDateKey(today, i - 10));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-2 w-full">
        <motion.button
          onClick={() => onChange(shiftDateKey(selectedDateKey, -1))}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          transition={tapSpring}
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: CONTROL_HEIGHT, height: CONTROL_HEIGHT, borderRadius: CONTROL_RADIUS, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
          aria-label="יום קודם"
        >
          <ChevronLeft size={16} color={T.t.textSecondary} />
        </motion.button>

        <motion.button
          onClick={() => setPickerOpen((v) => !v)}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.01 }}
          transition={tapSpring}
          className="flex-1 flex items-center justify-center gap-1.5 min-w-0"
          style={{ height: CONTROL_HEIGHT, borderRadius: CONTROL_RADIUS, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
          aria-label="בחירת תאריך"
        >
          <CalendarIcon size={13} color={T.t.textDim} />
          <span className="text-sm font-bold truncate" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>
            {formatHebrewDate(selectedDateKey)}
          </span>
          {!isToday && (
            <span className="text-[10px]" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>({formatShortDate(selectedDateKey)})</span>
          )}
        </motion.button>

        <motion.button
          onClick={() => onChange(shiftDateKey(selectedDateKey, 1))}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.06 }}
          transition={tapSpring}
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: CONTROL_HEIGHT, height: CONTROL_HEIGHT, borderRadius: CONTROL_RADIUS, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
          aria-label="יום הבא"
        >
          <ChevronRight size={16} color={T.t.textSecondary} />
        </motion.button>
      </div>

      <AnimatePresence>
        {!isToday && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={tapSpring}
            className="flex justify-center overflow-hidden"
          >
            <motion.button
              onClick={() => onChange(today)}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              transition={tapSpring}
              className="mt-2 px-3 text-xs font-bold"
              style={{ height: CONTROL_HEIGHT - 12, borderRadius: CONTROL_RADIUS, background: `${T.accent}18`, color: T.accent }}
            >
              חזרה להיום
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div dir="ltr" className="flex gap-2 overflow-x-auto py-3 mt-1">
              {strip.map((dk) => {
                const active = dk === selectedDateKey;
                const isTodayCell = dk === today;
                return (
                  <button
                    key={dk}
                    onClick={() => { onChange(dk); setPickerOpen(false); }}
                    className="flex flex-col items-center justify-center flex-shrink-0 rounded-2xl gap-0.5"
                    style={{
                      width: 46,
                      height: 54,
                      background: active ? T.accent : T.t.chipBg,
                      color: active ? '#07080B' : T.t.textSecondary,
                      border: `1px solid ${active ? T.accent : isTodayCell ? `${T.accent}60` : T.t.border}`,
                    }}
                  >
                    <span className="text-[10px] font-bold" style={{ fontFamily: FONT_MONO }}>{formatShortDate(dk)}</span>
                    {isTodayCell && !active && (
                      <span className="rounded-full" style={{ width: 4, height: 4, background: T.accent }} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
