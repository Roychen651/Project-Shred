// Progressive-overload PR lookup. ProjectShred.artifact.jsx:883-889 (Sprint 16).
//
// Sprint 28 — CustomWorkout/CustomWorkoutExercise added for the custom
// workout builder. `CustomWorkoutExercise` is deliberately a strict copy of
// the existing `Exercise` shape (lib/data/workouts.ts: name/sets/reps/rest)
// rather than a reference to an EXERCISE_DB id — a saved workout must stay
// valid even if the reference database changes later, and `ExerciseRow`
// already expects exactly this shape, so no adapter is needed to render it.

export interface ExerciseSet {
  weight?: number;
  reps?: number;
}

export interface CustomWorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  rest: number;
}

export interface CustomWorkout {
  id: string;
  name: string;
  exercises: CustomWorkoutExercise[];
}

export type ExerciseLogsByDate = Record<string, Record<string, ExerciseSet>>;

export interface LastLoggedSet extends ExerciseSet {
  date: string;
}

// Scans backward through dates strictly before `currentDateKey` for the most
// recent session where this exercise had a logged weight — powers the
// "+2.5kg PR" delta badge. A date with an entry but no `weight` doesn't count.
export function getLastLoggedSet(
  exerciseLogs: ExerciseLogsByDate,
  exerciseName: string,
  currentDateKey: string
): LastLoggedSet | null {
  const dates = Object.keys(exerciseLogs)
    .filter((d) => d < currentDateKey && exerciseLogs[d]?.[exerciseName]?.weight)
    .sort()
    .reverse();
  if (!dates.length) return null;
  return { date: dates[0], ...exerciseLogs[dates[0]][exerciseName] };
}
