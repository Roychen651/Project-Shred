import { describe, it, expect } from 'vitest';
import { scoreDayLog, heatColor, buildWeeklyReport, buildDailyLog, buildHeatmapColumns, type MacroColorSet, type DayLog, type DayMetaLike } from '@/lib/domain/analytics';
import type { ComputedTargets } from '@/lib/domain/targets';
import type { LoggedItem } from '@/lib/domain/items';

describe('scoreDayLog', () => {
  const targets = { label: 'יום מנוחה', kcal: 2330, protein: 168, fat: 59, carbs: 282 };

  it('returns null for no log', () => {
    expect(scoreDayLog(null, targets)).toBeNull();
    expect(scoreDayLog(undefined, targets)).toBeNull();
  });

  it('scores 100 for an exact match', () => {
    expect(scoreDayLog({ kcal: 2330, protein: 168 }, targets)).toBe(100);
  });

  it('caps protein ratio at 1 (over-hitting protein does not boost the score)', () => {
    expect(scoreDayLog({ kcal: 2330, protein: 300 }, targets)).toBe(100);
  });

  it('half protein, exact calories → 75', () => {
    // proteinRatio 0.5, kcalRatio 1 → (0.5*0.5 + 1*0.5)*100 = 75
    expect(scoreDayLog({ kcal: 2330, protein: 84 }, targets)).toBe(75);
  });
});

describe('heatColor', () => {
  const macro: MacroColorSet = { kcal: '#BRONZE', protein: '#JADE', carbs: '#STEEL', fat: '#PLUM' };

  it('buckets by the exact thresholds: >=90 jade, >=75 bronze, else plum', () => {
    expect(heatColor(100, macro)).toBe('#JADE');
    expect(heatColor(90, macro)).toBe('#JADE');
    expect(heatColor(89, macro)).toBe('#BRONZE');
    expect(heatColor(75, macro)).toBe('#BRONZE');
    expect(heatColor(74, macro)).toBe('#PLUM');
    expect(heatColor(0, macro)).toBe('#PLUM');
  });

  it('returns null for an unlogged day (null or undefined score)', () => {
    expect(heatColor(null, macro)).toBeNull();
    expect(heatColor(undefined, macro)).toBeNull();
  });
});

describe('buildWeeklyReport', () => {
  const computed: ComputedTargets = {
    bmr: 1769, tdee: 2742,
    rest: { label: 'יום מנוחה', kcal: 2330, protein: 168, fat: 59, carbs: 282 },
    training: { label: 'יום אימון', kcal: 2630, protein: 168, fat: 59, carbs: 357 },
  };

  it('matches hand-computed golden values over a mixed 7-day window', () => {
    const today = new Date(2026, 6, 26); // 2026-07-26
    const dailyLogs: Record<string, DayLog> = {
      '2026-07-26': { kcal: 2330, protein: 168, workoutDone: true },
      '2026-07-25': { kcal: 2000, protein: 150, workoutDone: false },
      '2026-07-20': { kcal: 2600, protein: 170, workoutDone: true }, // outside the 7-day window, must be excluded
    };
    // Re-key the 2026-07-20 entry into the actual 7-day window (…-21..-26 plus today)
    // so it's exercised: use 2026-07-21 instead, which the window (26,25,24,23,22,21,20) does include.
    dailyLogs['2026-07-21'] = dailyLogs['2026-07-20'];
    delete dailyLogs['2026-07-20'];

    const metricEntries = [
      { date: '2026-07-01', weight: 86, waist: 105 },
      { date: '2026-07-26', weight: 84, waist: 103 },
    ];

    const report = buildWeeklyReport(dailyLogs, metricEntries, computed, today);

    // log26 (training, exact-ish): score 94; log25 (rest): score 88; log21 (training): score 99
    // avg = round((94+88+99)/3) = round(93.667) = 94
    expect(report.avgCompliance).toBe(94);
    // avgProtein = round((168+150+170)/3) = round(162.667) = 163
    expect(report.avgProtein).toBe(163);
    expect(report.workoutDays).toBe(2);
    expect(report.loggedDays).toBe(3);
    expect(report.weightDelta).toBe(-2);
    expect(report.waistDelta).toBe(-2);
  });

  it('handles an entirely empty week without dividing by zero', () => {
    const report = buildWeeklyReport({}, [], computed, new Date(2026, 6, 26));
    expect(report).toEqual({ avgCompliance: 0, avgProtein: 0, workoutDays: 0, weightDelta: 0, waistDelta: 0, loggedDays: 0 });
  });
});

function item(overrides: Partial<LoggedItem> = {}): LoggedItem {
  return {
    id: 'i1', dateKey: '2026-07-20', slotId: 'lunch', name: 'Test',
    baseCalories: 500, baseProtein: 40, baseCarbs: 50, baseFats: 10,
    grams: 100, isCompleted: true, source: 'manual',
    ...overrides,
  };
}

const emptyMeta: DayMetaLike = { workoutDone: false, workoutDay: null, manualKcal: null, manualProtein: null, manualCarbs: null, manualFat: null };

describe('buildDailyLog — mirrors the daily_log SQL view (supabase/migrations/0003)', () => {
  it('returns null for a date with neither items nor meta (genuinely unlogged)', () => {
    expect(buildDailyLog(undefined, undefined)).toBeNull();
    expect(buildDailyLog([], undefined)).toBeNull();
  });

  it('derives totals from completed items via sumItems when there is no manual override', () => {
    const log = buildDailyLog([item({ isCompleted: true }), item({ id: 'i2', isCompleted: false, baseCalories: 999 })], undefined);
    // sumItems skips the incomplete item entirely — only the first counts.
    expect(log).toEqual({ kcal: 500, protein: 40, carbs: 50, fat: 10, workoutDone: false, workoutDay: null });
  });

  it('a manual override wins over the derived sum, field by field', () => {
    const meta: DayMetaLike = { ...emptyMeta, manualKcal: 1800, workoutDone: true, workoutDay: 'A1' };
    const log = buildDailyLog([item()], meta);
    expect(log).toEqual({ kcal: 1800, protein: 40, carbs: 50, fat: 10, workoutDone: true, workoutDay: 'A1' });
  });

  it('a workout-only day (meta but no items) still produces a real entry, all-zero macros', () => {
    const meta: DayMetaLike = { ...emptyMeta, workoutDone: true, workoutDay: 'B1' };
    expect(buildDailyLog(undefined, meta)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0, workoutDone: true, workoutDay: 'B1' });
  });
});

describe('buildHeatmapColumns', () => {
  const computed: ComputedTargets = {
    bmr: 1769, tdee: 2742,
    rest: { label: 'יום מנוחה', kcal: 2330, protein: 168, fat: 59, carbs: 282 },
    training: { label: 'יום אימון', kcal: 2630, protein: 168, fat: 59, carbs: 357 },
  };

  it('produces `weeks` columns of 7 cells each, sequential (not calendar-aligned)', () => {
    const columns = buildHeatmapColumns({}, computed, 6, new Date(2026, 6, 26));
    expect(columns).toHaveLength(6);
    columns.forEach((col) => expect(col).toHaveLength(7));
    expect(columns[5][6].key).toBe('2026-07-26'); // last cell is "today"
    expect(columns[0][0].key).toBe('2026-06-15'); // first cell is 41 days before today
  });

  it('scores each cell against training or rest targets based on that day\'s log', () => {
    const columns = buildHeatmapColumns({ '2026-07-26': { kcal: 2630, protein: 168, workoutDone: true } }, computed, 1, new Date(2026, 6, 26));
    const todayCell = columns[0][6];
    expect(todayCell.log?.workoutDone).toBe(true);
    expect(todayCell.score).toBe(100);
  });

  it('a genuinely unlogged day has a null log and null score, not a zeroed-out one', () => {
    const columns = buildHeatmapColumns({}, computed, 1, new Date(2026, 6, 26));
    expect(columns[0][6].log).toBeNull();
    expect(columns[0][6].score).toBeNull();
  });
});
