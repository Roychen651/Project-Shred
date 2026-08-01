'use client';

// Sprint 28 — running a saved custom workout reuses ExerciseRow directly
// (it already takes a generic `Exercise`-shaped object, not anything tied to
// the built-in A1/B1/A2/B2 system), so weight/reps entry, the rest timer,
// and the real "+2.5kg PR" delta badge all work for custom exercises exactly
// like they do for the built-in ones — `getLastLoggedSet`/`logExerciseSet`
// are keyed purely by exercise name (lib/domain/workouts.ts), never by which
// workout the name came from. `store.setWorkoutActivity` also takes a plain
// `string | null` for its day-key argument (broader than the built-in
// `WorkoutDayKey` union WorkoutPanel itself uses), so a custom workout's own
// id can mark the day as trained without needing a fake built-in day key.

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { getLastLoggedSet, type CustomWorkout, type ExerciseLogsByDate, type ExerciseSet } from '@/lib/domain/workouts';
import { ExerciseRow } from './ExerciseRow';
import type { ActiveTimer } from './RestTimer';

export interface CustomWorkoutRunnerSheetBodyProps {
  workout: CustomWorkout;
  exerciseLogs: ExerciseLogsByDate;
  selectedDateKey: string;
  onWorkoutActivity: (done: boolean) => void;
  onLogSet: (exerciseName: string, patch: ExerciseSet) => void;
}

export function CustomWorkoutRunnerSheetBody({ workout, exerciseLogs, selectedDateKey, onWorkoutActivity, onLogSet }: CustomWorkoutRunnerSheetBodyProps) {
  const T = useTheme();
  const [log, setLog] = useState<Record<string, number[]>>({});
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);

  useEffect(() => {
    if (!activeTimer) return;
    const t = setTimeout(() => {
      setActiveTimer((cur) => {
        if (!cur) return null;
        const next = cur.secondsLeft - 1;
        return next <= 0 ? null : { ...cur, secondsLeft: next };
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [activeTimer]);

  const toggleSet = (exName: string, i: number) => {
    const cur = log[exName] || [];
    const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
    const updated = { ...log, [exName]: next };
    const anyDone = Object.values(updated).some((arr) => arr.length > 0);
    setLog(updated);
    onWorkoutActivity(anyDone);
  };

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = workout.exercises.reduce((a, e) => a + (log[e.name]?.length || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{workout.name}</span>
        <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{doneSets}/{totalSets} סטים הושלמו</span>
      </div>
      <div>
        {workout.exercises.map((ex, i) => (
          <ExerciseRow
            key={`${selectedDateKey}-${ex.name}`}
            ex={ex}
            isLast={i === workout.exercises.length - 1}
            done={log[ex.name]}
            toggleSet={toggleSet}
            activeTimer={activeTimer}
            setActiveTimer={setActiveTimer}
            loggedSet={exerciseLogs?.[selectedDateKey]?.[ex.name]}
            lastSet={getLastLoggedSet(exerciseLogs || {}, ex.name, selectedDateKey)}
            onLogSet={onLogSet}
          />
        ))}
      </div>
    </div>
  );
}
