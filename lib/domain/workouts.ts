// Progressive-overload PR lookup. ProjectShred.artifact.jsx:883-889 (Sprint 16).

export interface ExerciseSet {
  weight?: number;
  reps?: number;
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
