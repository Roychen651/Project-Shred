import { describe, it, expect } from 'vitest';
import { scoreDayLog, heatColor, buildWeeklyReport, type MacroColorSet, type DayLog } from '@/lib/domain/analytics';
import type { ComputedTargets } from '@/lib/domain/targets';

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
