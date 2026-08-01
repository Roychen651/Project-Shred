'use client';

// ProjectShred.artifact.jsx:2368-2464 (Sprint 4 set logger, Sprint 16
// progressive-overload weight/reps + PR delta). The set-completion circles, the
// weight/reps inputs (committed onBlur, matching the artifact exactly — no
// per-keystroke persistence), and the PR-delta badge logic are unchanged.
//
// Sprint 6 premium upgrade: the artifact's `usePulse()` scale-bump on a tapped
// set circle is now a real framer-motion spring instead of a CSS
// transform-on-inline-style toggle, and the PR badge mounts via
// AnimatePresence + a spring pop-in (keyed on the delta so hitting a new PR
// re-triggers the pop rather than silently updating text in place).
//
// The artifact resynced the weight/reps inputs from `loggedSet` via a
// useEffect keyed on loggedSet.weight/reps — the "reset local state when an
// external prop changes" pattern React's own docs steer away from in favor of
// a remount. WorkoutPanel now keys each row on `${selectedDateKey}-${ex.name}`,
// so switching dates naturally remounts this component with the right
// initial value instead of an effect reaching back to overwrite it.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { roundNum } from '@/lib/domain/util';
import type { ExerciseSet, LastLoggedSet } from '@/lib/domain/workouts';
import type { Exercise } from '@/lib/data/workouts';
import { RestTimer, type ActiveTimer } from './RestTimer';
import { AnimatedTrophy } from '@/components/ui/AnimatedIllustrations';

export interface ExerciseRowProps {
  ex: Exercise;
  isLast: boolean;
  done: number[] | undefined;
  toggleSet: (exerciseName: string, setIndex: number) => void;
  activeTimer: ActiveTimer | null;
  setActiveTimer: (t: ActiveTimer | null) => void;
  loggedSet: ExerciseSet | undefined;
  onLogSet: (exerciseName: string, patch: ExerciseSet) => void;
  lastSet: LastLoggedSet | null;
}

export function ExerciseRow({ ex, isLast, done, toggleSet, activeTimer, setActiveTimer, loggedSet, onLogSet, lastSet }: ExerciseRowProps) {
  const T = useTheme();
  const [pulseIdx, setPulseIdx] = useState<number | null>(null);
  const [weight, setWeight] = useState(loggedSet?.weight?.toString() ?? '');
  const [reps, setReps] = useState(loggedSet?.reps?.toString() ?? '');
  const doneCount = done?.length ?? 0;

  useEffect(() => {
    if (pulseIdx === null) return;
    const t = setTimeout(() => setPulseIdx(null), 350);
    return () => clearTimeout(t);
  }, [pulseIdx]);

  const handleSet = (i: number) => {
    toggleSet(ex.name, i);
    setPulseIdx(i);
  };

  const commitLog = () => {
    if (weight === '' && reps === '') return;
    onLogSet(ex.name, { weight: weight === '' ? undefined : Number(weight), reps: reps === '' ? undefined : Number(reps) });
  };

  const delta = lastSet && weight !== '' ? roundNum(Number(weight) - (lastSet.weight ?? 0)) : null;
  const isPR = delta !== null && delta > 0;

  return (
    <div className="py-3" style={{ borderBottom: isLast ? 'none' : `1px solid ${T.t.border}` }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div>
          <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{ex.name}</span>
          <span className="text-xs mr-2" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
            {ex.sets} × {ex.reps}
          </span>
        </div>
        <RestTimer seconds={ex.rest} id={ex.name} activeTimer={activeTimer} setActiveTimer={setActiveTimer} />
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {Array.from({ length: ex.sets }).map((_, i) => {
          const setDone = done?.includes(i);
          return (
            <motion.button
              key={i}
              onClick={() => handleSet(i)}
              className="flex items-center justify-center rounded-lg"
              animate={{ scale: pulseIdx === i ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              style={{
                width: 30,
                height: 30,
                background: setDone ? T.accent : T.t.chipBg,
                border: `1px solid ${setDone ? T.accent : T.t.border}`,
                color: setDone ? '#07080B' : T.t.textDim,
                boxShadow: setDone ? T.glow(T.accent, 8, '30') : 'none',
              }}
            >
              <span className="text-xs font-bold" style={{ fontFamily: FONT_MONO }}>{i + 1}</span>
            </motion.button>
          );
        })}
        <span className="text-xs mr-1" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{doneCount}/{ex.sets}</span>
      </div>

      {/* Progressive overload: top-set weight/reps + PR delta vs last logged session */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <input
            type="number" inputMode="decimal" placeholder="ק״ג" value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={commitLog}
            className="text-xs text-center rounded-lg outline-none"
            style={{ width: 52, padding: '5px 2px', background: T.t.chipBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
          />
          <span className="text-xs" style={{ color: T.t.textDim }}>ק״ג ×</span>
          <input
            type="number" inputMode="numeric" placeholder="חז׳" value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={commitLog}
            className="text-xs text-center rounded-lg outline-none"
            style={{ width: 46, padding: '5px 2px', background: T.t.chipBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
          />
          <span className="text-xs" style={{ color: T.t.textDim }}>חז׳</span>
        </div>
        {lastSet && (
          <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
            פעם קודמת: {lastSet.weight}ק״ג
          </span>
        )}
        <AnimatePresence mode="popLayout">
          {delta !== null && delta !== 0 && (
            <motion.span
              key={`${ex.name}-${delta}-${isPR}`}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: isPR ? `${T.macro.protein}20` : `${T.macro.fat}20`, color: isPR ? T.macro.protein : T.macro.fat }}
            >
              {/* Sprint 22 — a real pop-in trophy instead of a static emoji,
                  so hitting a new PR actually announces itself. */}
              {isPR && <AnimatedTrophy size={13} color={T.macro.protein} />}
              {isPR ? `+${delta}ק״ג PR` : `${delta}ק״ג`}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
