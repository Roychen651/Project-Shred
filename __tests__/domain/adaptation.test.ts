import { describe, it, expect } from 'vitest';
import { analyzeMetabolicAdaptation } from '@/lib/domain/adaptation';
import type { MetricEntry } from '@/lib/domain/analytics';

const TODAY = new Date(2026, 6, 30); // 2026-07-30, matching this session's "currentDate"

describe('analyzeMetabolicAdaptation', () => {
  it('returns null for a "maintain" goal — a flat trend is the goal, not a problem', () => {
    const entries: MetricEntry[] = [
      { date: '2026-07-10', weight: 80 },
      { date: '2026-07-25', weight: 80 },
    ];
    expect(analyzeMetabolicAdaptation(entries, 'maintain', TODAY)).toBeNull();
  });

  it('reports insufficient_data with fewer than two weighted entries in the window', () => {
    const entries: MetricEntry[] = [{ date: '2026-07-25', weight: 80 }];
    const result = analyzeMetabolicAdaptation(entries, 'aggressive', TODAY);
    expect(result!.status).toBe('insufficient_data');
    expect(result!.weeklyDeltaKg).toBe(0);
    expect(result!.suggestedKcalAdjustment).toBe(0);
  });

  it('ignores entries with no weight (waist-only) when checking for insufficient data', () => {
    const entries: MetricEntry[] = [
      { date: '2026-07-10', waist: 90 },
      { date: '2026-07-25', weight: 80 },
    ];
    expect(analyzeMetabolicAdaptation(entries, 'aggressive', TODAY)!.status).toBe('insufficient_data');
  });

  it('ignores entries outside the 21-day window entirely', () => {
    const entries: MetricEntry[] = [
      { date: '2026-06-01', weight: 85 }, // way outside the window — should not count
      { date: '2026-07-20', weight: 80 },
      { date: '2026-07-29', weight: 80 },
    ];
    // Only 2026-07-20..07-29 fall inside the 21-day window (cutoff 2026-07-09),
    // spanning 9 days — under MIN_SPAN_DAYS (10), so still insufficient_data.
    expect(analyzeMetabolicAdaptation(entries, 'aggressive', TODAY)!.status).toBe('insufficient_data');
  });

  it('flags a plateau on an aggressive cut when weight barely moved over 3 weeks', () => {
    const entries: MetricEntry[] = [
      { date: '2026-07-09', weight: 80.0 },
      { date: '2026-07-30', weight: 79.9 }, // -0.1kg over 21 days
    ];
    const result = analyzeMetabolicAdaptation(entries, 'aggressive', TODAY)!;
    expect(result.status).toBe('plateau_cut');
    // -0.1kg / (21/7 weeks) = -0.0333.../week, rounded to -0.03
    expect(result.weeklyDeltaKg).toBeCloseTo(-0.03, 2);
    expect(result.suggestedKcalAdjustment).toBe(-150);
    expect(result.message).toContain('הסתגלות מטבולית');
  });

  it('does NOT flag a plateau on an aggressive cut when weight is dropping fast enough', () => {
    const entries: MetricEntry[] = [
      { date: '2026-07-09', weight: 82 },
      { date: '2026-07-30', weight: 80 }, // -2kg over 21 days ≈ -0.67kg/week
    ];
    const result = analyzeMetabolicAdaptation(entries, 'aggressive', TODAY)!;
    expect(result.status).toBe('on_track');
    expect(result.suggestedKcalAdjustment).toBe(0);
  });

  it('uses a gentler stall threshold for a moderate cut than an aggressive one', () => {
    // -0.15kg/week: stalls an aggressive cut (threshold -0.2) but NOT a moderate one (threshold -0.1)... wait, -0.15 > -0.2 is true (stall) and -0.15 > -0.1 is false (not stall). Let's verify both directions explicitly below.
    const entries: MetricEntry[] = [
      { date: '2026-07-09', weight: 80.0 },
      { date: '2026-07-30', weight: 79.55 }, // -0.45kg over 21 days ≈ -0.15kg/week
    ];
    const aggressive = analyzeMetabolicAdaptation(entries, 'aggressive', TODAY)!;
    const moderate = analyzeMetabolicAdaptation(entries, 'moderate', TODAY)!;
    expect(aggressive.status).toBe('plateau_cut'); // -0.15 > -0.2 threshold -> stalled
    expect(moderate.status).toBe('on_track'); // -0.15 <= -0.1 threshold -> still fine
  });

  it('flags a plateau on a bulk goal when weight is not increasing', () => {
    const entries: MetricEntry[] = [
      { date: '2026-07-09', weight: 75.0 },
      { date: '2026-07-30', weight: 75.05 }, // essentially flat over 21 days
    ];
    const result = analyzeMetabolicAdaptation(entries, 'bulk', TODAY)!;
    expect(result.status).toBe('plateau_bulk');
    expect(result.suggestedKcalAdjustment).toBe(150);
  });

  it('does NOT flag a plateau on a bulk goal when weight is climbing', () => {
    const entries: MetricEntry[] = [
      { date: '2026-07-09', weight: 75.0 },
      { date: '2026-07-30', weight: 76.0 }, // +1kg over 21 days ≈ +0.33kg/week
    ];
    const result = analyzeMetabolicAdaptation(entries, 'bulk', TODAY)!;
    expect(result.status).toBe('on_track');
    expect(result.suggestedKcalAdjustment).toBe(0);
  });

  it('uses only entries within the window even when older entries exist, for the delta calculation', () => {
    const entries: MetricEntry[] = [
      { date: '2026-05-01', weight: 90 }, // ancient, must not affect the window's delta
      { date: '2026-07-10', weight: 80.0 },
      { date: '2026-07-29', weight: 79.9 },
    ];
    const result = analyzeMetabolicAdaptation(entries, 'aggressive', TODAY)!;
    // Should compute from 07-10 -> 07-29 (19 days), not from 05-01.
    expect(result.status).toBe('plateau_cut');
  });

  it('is unaffected by entry array order (sorts internally)', () => {
    const entries: MetricEntry[] = [
      { date: '2026-07-30', weight: 80 },
      { date: '2026-07-09', weight: 82 },
    ];
    const result = analyzeMetabolicAdaptation(entries, 'aggressive', TODAY)!;
    expect(result.status).toBe('on_track');
    expect(result.weeklyDeltaKg).toBeLessThan(0);
  });
});
