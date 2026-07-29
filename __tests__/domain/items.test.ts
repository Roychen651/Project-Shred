import { describe, it, expect } from 'vitest';
import { makeLoggedItem, scaleLoggedItem, sumItems, type LoggedItem } from '@/lib/domain/items';

describe('makeLoggedItem', () => {
  it('rounds base macros the same way scaleLoggedItem later expects', () => {
    const item = makeLoggedItem({
      dateKey: '2026-07-20', slotId: 'lunch', name: 'Test',
      calories: 500.4, protein: 40.06, carbs: 50.02, fats: 10.04, source: 'cibus',
    });
    expect(item.id).toMatch(/^log-/);
    expect(item.dateKey).toBe('2026-07-20');
    expect(item.slotId).toBe('lunch');
    expect(item.grams).toBe(100);
    expect(item.isCompleted).toBe(true);
    expect(item.source).toBe('cibus');
    // Math.round(500.4) = 500; roundNum(40.06) = 40.1; roundNum(50.02) = 50; roundNum(10.04) = 10
    expect(item.baseCalories).toBe(500);
    expect(item.baseProtein).toBe(40.1);
    expect(item.baseCarbs).toBe(50);
    expect(item.baseFats).toBe(10);
  });

  it('defaults source to manual and isCompleted to true', () => {
    const item = makeLoggedItem({ dateKey: '2026-07-20', slotId: 'dinner', name: 'X', calories: 100, protein: 10, carbs: 10, fats: 5 });
    expect(item.source).toBe('manual');
    expect(item.isCompleted).toBe(true);
  });
});

describe('scaleLoggedItem — grams as a portion index, not a weight', () => {
  it('scales every macro by grams/100', () => {
    const item: LoggedItem = {
      id: 'log-x', dateKey: '2026-07-20', slotId: 'lunch', name: 'Test',
      baseCalories: 500, baseProtein: 40.1, baseCarbs: 50, baseFats: 10,
      grams: 150, isCompleted: true, source: 'cibus',
    };
    const scaled = scaleLoggedItem(item);
    // factor = 1.5. protein: roundNum(40.1*1.5) = roundNum(60.15) = 60.2 (601.5 rounds up)
    expect(scaled).toEqual({ calories: 750, protein: 60.2, carbs: 75, fats: 15 });
  });

  it('grams=100 is a no-op (the "as originally logged" baseline)', () => {
    const item: LoggedItem = {
      id: 'log-x', dateKey: '2026-07-20', slotId: 'lunch', name: 'Test',
      baseCalories: 500, baseProtein: 40.1, baseCarbs: 50, baseFats: 10,
      grams: 100, isCompleted: true, source: 'cibus',
    };
    expect(scaleLoggedItem(item)).toEqual({ calories: 500, protein: 40.1, carbs: 50, fats: 10 });
  });
});

describe('sumItems — must match supabase daily_totals view exactly', () => {
  // Same fixture as supabase/tests/01_schema_test.sql's daily_totals test, so the
  // two layers are asserted against the same numbers.
  it('excludes uncompleted items and scales completed ones by their portion index', () => {
    const items: LoggedItem[] = [
      { id: 'a', dateKey: 'd', slotId: 'lunch', name: 'A', baseCalories: 500, baseProtein: 40, baseCarbs: 50, baseFats: 10, grams: 100, isCompleted: true, source: 'cibus' },
      { id: 'b', dateKey: 'd', slotId: 'dinner', name: 'B', baseCalories: 300, baseProtein: 25, baseCarbs: 30, baseFats: 8, grams: 150, isCompleted: true, source: 'plate' },
      { id: 'c', dateKey: 'd', slotId: 'dinner', name: 'C', baseCalories: 900, baseProtein: 90, baseCarbs: 90, baseFats: 30, grams: 100, isCompleted: false, source: 'hack' },
    ];
    const totals = sumItems(items);
    expect(totals.kcal).toBe(950); // 500 + 450, C excluded
    expect(totals.protein).toBe(77.5); // 40 + 37.5
    expect(totals.kcal).not.toBe(1850); // the bug a plain SUM(...) would produce
  });

  it('returns all-zero totals for an empty day', () => {
    expect(sumItems([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
