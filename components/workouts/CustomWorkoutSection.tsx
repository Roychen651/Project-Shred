'use client';

// Sprint 28 — bento list of the person's own saved workouts, sitting below
// the built-in A/B tracker rather than merged into it: WorkoutDayKey (the
// built-in A1/B1/A2/B2 union in lib/data/workouts.ts) is a fixed type used
// throughout WorkoutPanel/the store's exerciseLogs keying, and widening it to
// accept arbitrary custom workout ids would be a much larger structural
// change than "add a builder + a list" — a deliberate scope boundary, the
// same kind already documented for custom Restaurants/Hacks staying separate
// from the four built-in ones (Sprint 11).

import { Dumbbell, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import { Eyebrow } from '@/components/ui/Eyebrow';
import type { CustomWorkout } from '@/lib/domain/workouts';

export interface CustomWorkoutSectionProps {
  workouts: CustomWorkout[];
  onStart: (workout: CustomWorkout) => void;
  onEdit: (workout: CustomWorkout) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export function CustomWorkoutSection({ workouts, onStart, onEdit, onDelete, onCreate }: CustomWorkoutSectionProps) {
  const T = useTheme();
  return (
    <div className="mt-3">
      <Eyebrow color={T.accent}>ARENA 04B · CUSTOM</Eyebrow>
      <h3 className="text-lg font-bold mb-3" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>האימונים שלי</h3>
      <div className="grid grid-cols-2 gap-3">
        {workouts.map((w) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative flex flex-col justify-between gap-3 p-4 rounded-[32px]"
            style={{ background: `${T.accent}10`, border: `1px solid ${T.accent}22`, minHeight: 130 }}
          >
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => onStart(w)} className="text-right flex-1">
              <Dumbbell size={22} color={T.accent} />
              <div className="text-sm font-bold mt-2" style={{ color: T.t.textPrimary }}>{w.name}</div>
              <div className="text-[10px] uppercase font-light mt-0.5" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{w.exercises.length} תרגילים</div>
            </motion.button>
            <div className="flex gap-1.5">
              <button onClick={() => onEdit(w)} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }} aria-label="ערוך אימון">
                <Pencil size={12} color={T.t.textSecondary} />
              </button>
              <button onClick={() => onDelete(w.id)} className="p-1.5 rounded-lg" style={{ background: `${T.macro.fat}18` }} aria-label="מחק אימון">
                <Trash2 size={12} color={T.macro.fat} />
              </button>
            </div>
          </motion.div>
        ))}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onCreate}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-[32px]"
          style={{ background: T.t.chipBg, border: `1px dashed ${T.t.border}`, minHeight: 130 }}
        >
          <Plus size={20} color={T.accent} />
          <span className="text-xs font-bold" style={{ color: T.t.textSecondary }}>אימון חדש</span>
        </motion.button>
      </div>
    </div>
  );
}
