'use client';

// ProjectShred.artifact.jsx:2466-2537 (Sprint 4 A/B workout tracker, Sprint 16
// progressive overload). Ported into the Workouts tab (Sprint 14's IA) with the
// Sprint 5 glass/glow visual language layered on top.
//
// Set-completion state (`log`) is intentionally ephemeral, local component
// state — exactly like the artifact. Only weight/reps are persisted
// (`exerciseLogs`, one entry per date+exercise). Checking off "did set 3"
// isn't meaningful to remember across a reload the way "what weight did I
// lift" is; this mirrors the original design, not a corner cut in the port.

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, JEWEL } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { AnimatedPulsingDumbbell } from '@/components/ui/AnimatedIllustrations';
import { WORKOUTS, type WorkoutDayKey } from '@/lib/data/workouts';
import { getLastLoggedSet, type ExerciseLogsByDate, type ExerciseSet } from '@/lib/domain/workouts';
import { ExerciseRow } from './ExerciseRow';
import type { ActiveTimer } from './RestTimer';

// Power (A1/B1) vs Volume (A2/B2) day coloring stays fixed regardless of the
// user's accent choice — see CLAUDE.md's Known Simplifications ("Power/Volume
// workout-day colors... stay fixed across accent changes"). lib/data/workouts.ts
// deliberately carries no `color` field (colors are a UI concern, not domain
// data), so it's resolved here from the same JEWEL tokens everything else uses.
function dayKeyColor(mode: 'dark' | 'light', key: WorkoutDayKey): string {
  return key === 'A1' || key === 'B1' ? JEWEL[mode].petrol : JEWEL[mode].plum;
}

export interface WorkoutPanelProps {
  exerciseLogs: ExerciseLogsByDate;
  selectedDateKey: string;
  onWorkoutActivity: (done: boolean, dayKey: WorkoutDayKey) => void;
  onLogSet: (exerciseName: string, patch: ExerciseSet) => void;
}

export function WorkoutPanel({ exerciseLogs, selectedDateKey, onWorkoutActivity, onLogSet }: WorkoutPanelProps) {
  const T = useTheme();
  const [dayKey, setDayKey] = useState<WorkoutDayKey>('A1');
  const [log, setLog] = useState<Record<string, number[]>>({});
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  // Sprint 16's setTimeout-driven countdown: one active timer, decremented
  // once per second while it's running. The zero-out transition happens
  // inside the timeout callback itself (not as a synchronous setState at the
  // top of the effect body) so there's no cascading-render lint violation —
  // same end behavior, one fewer intermediate render at the last tick.
  useEffect(() => {
    if (!activeTimer) return;
    const t = setTimeout(() => {
      setActiveTimer((cur) => {
        if (!cur) return null;
        const nextSeconds = cur.secondsLeft - 1;
        return nextSeconds <= 0 ? null : { ...cur, secondsLeft: nextSeconds };
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [activeTimer]);

  const workout = WORKOUTS[dayKey];
  const color = dayKeyColor(T.mode, dayKey);

  // NOTE: onWorkoutActivity (a call into the Zustand store, a different
  // component's state) must NOT run inside setLog's functional updater —
  // React can invoke that updater during render, and calling another
  // component's setState from there throws "Cannot update a component while
  // rendering a different component." Computing `updated` from the current
  // `log` closure and calling setLog/onWorkoutActivity directly in this event
  // handler (not inside a setState callback) avoids that entirely.
  const toggleSet = (exName: string, i: number) => {
    const key = `${dayKey}-${exName}`;
    const cur = log[key] || [];
    const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
    const updated = { ...log, [key]: next };
    const anyDone = Object.values(updated).some((arr) => arr.length > 0);
    setLog(updated);
    onWorkoutActivity(anyDone, dayKey);
  };

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = workout.exercises.reduce((a, e) => a + (log[`${dayKey}-${e.name}`]?.length || 0), 0);

  return (
    <GlassCard className={T.spacing.card} accent={color}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow color={color}>ARENA 04 · TRAINING</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מעקב אימוני A/B עליון-תחתון</h3>
        </div>
        {/* Sprint 22 — a continuously-alive header icon instead of a static
            glyph: a real heartbeat-style pulse, the literal "still training"
            cue for a screen whose whole purpose is tracking exertion. */}
        <AnimatedPulsingDumbbell size={30} color={color} />
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        {(Object.keys(WORKOUTS) as WorkoutDayKey[]).map((k) => {
          const active = dayKey === k;
          const c = dayKeyColor(T.mode, k);
          return (
            <button
              key={k}
              onClick={() => { setDayKey(k); setActiveTimer(null); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
              style={{
                background: active ? c : T.t.chipBg,
                color: active ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${active ? c : T.t.border}`,
                boxShadow: active ? T.glow(c, 10, '35') : 'none',
              }}
            >
              {k}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color }}>{workout.label}</span>
        <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{doneSets}/{totalSets} סטים הושלמו</span>
      </div>

      <div>
        {workout.exercises.map((ex, i) => (
          <ExerciseRow
            key={`${selectedDateKey}-${ex.name}`}
            ex={ex}
            isLast={i === workout.exercises.length - 1}
            done={log[`${dayKey}-${ex.name}`]}
            toggleSet={toggleSet}
            activeTimer={activeTimer}
            setActiveTimer={setActiveTimer}
            loggedSet={exerciseLogs?.[selectedDateKey]?.[ex.name]}
            lastSet={getLastLoggedSet(exerciseLogs || {}, ex.name, selectedDateKey)}
            onLogSet={onLogSet}
          />
        ))}
      </div>
    </GlassCard>
  );
}
