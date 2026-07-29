import { describe, it, expect } from 'vitest';
import { getLastLoggedSet, type ExerciseLogsByDate } from '@/lib/domain/workouts';

const logs: ExerciseLogsByDate = {
  '2026-07-10': { 'סקוואט גב': { weight: 100, reps: 5 } },
  '2026-07-15': { 'סקוואט גב': { weight: 105, reps: 5 } },
  '2026-07-20': { 'סקוואט גב': { weight: 110, reps: 5 }, 'לחיצת חזה': { weight: 0, reps: 5 } },
};

describe('getLastLoggedSet — powers the PR delta badge', () => {
  it('finds the most recent prior date with a logged weight', () => {
    expect(getLastLoggedSet(logs, 'סקוואט גב', '2026-07-20')).toEqual({ date: '2026-07-15', weight: 105, reps: 5 });
  });

  it('scans further back when the immediately-prior date has no entry for the exercise', () => {
    expect(getLastLoggedSet(logs, 'סקוואט גב', '2026-07-25')).toEqual({ date: '2026-07-20', weight: 110, reps: 5 });
  });

  it('returns null when nothing prior exists', () => {
    expect(getLastLoggedSet(logs, 'סקוואט גב', '2026-07-10')).toBeNull();
    expect(getLastLoggedSet(logs, 'סקוואט גב', '2026-01-01')).toBeNull();
  });

  it('returns null for an exercise never logged at all', () => {
    expect(getLastLoggedSet(logs, 'מתח', '2026-07-25')).toBeNull();
  });

  it('a falsy weight (0) does not count as "logged"', () => {
    expect(getLastLoggedSet(logs, 'לחיצת חזה', '2026-07-25')).toBeNull();
  });
});
