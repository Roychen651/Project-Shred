import { describe, it, expect } from 'vitest';
import { computeProfileTargets } from '@/lib/domain/targets';
import { applyTargetOverride } from '@/lib/domain/targetOverride';

// Base: DEFAULT_PROFILES.mine golden values, same as targets.test.ts —
// rest: 2330 kcal / 168p / 59f / 282c, training: 2630 / 168p / 59f / 357c.
const BASE = computeProfileTargets({ weight: 84, height: 171, age: 29, activity: 'office', goal: 'moderate' });

describe('applyTargetOverride', () => {
  it('returns the computed targets unchanged when override is null/undefined/empty', () => {
    expect(applyTargetOverride(BASE, null)).toEqual(BASE);
    expect(applyTargetOverride(BASE, undefined)).toEqual(BASE);
    expect(applyTargetOverride(BASE, {})).toEqual(BASE);
  });

  it('overriding kcal alone re-derives carbs as the remainder and preserves protein/fat', () => {
    const result = applyTargetOverride(BASE, { kcal: 2000 });
    // carbs = round((2000 - 168*4 - 59*9) / 4) = round((2000-672-531)/4) = round(797/4) = round(199.25) = 199
    expect(result.rest).toEqual({ label: 'יום מנוחה', kcal: 2000, protein: 168, fat: 59, carbs: 199 });
  });

  it('overriding protein alone re-derives carbs and keeps kcal/fat fixed', () => {
    const result = applyTargetOverride(BASE, { protein: 200 });
    // carbs = round((2330 - 200*4 - 59*9)/4) = round((2330-800-531)/4) = round(999/4) = round(249.75) = 250
    expect(result.rest).toEqual({ label: 'יום מנוחה', kcal: 2330, protein: 200, fat: 59, carbs: 250 });
  });

  it('overriding fat alone re-derives carbs and keeps kcal/protein fixed', () => {
    const result = applyTargetOverride(BASE, { fat: 70 });
    // carbs = round((2330 - 168*4 - 70*9)/4) = round((2330-672-630)/4) = round(1028/4) = 257
    expect(result.rest).toEqual({ label: 'יום מנוחה', kcal: 2330, protein: 168, fat: 70, carbs: 257 });
  });

  it('the training day is derived from the OVERRIDDEN rest values, preserving the exact +300kcal/+75g refeed delta', () => {
    const result = applyTargetOverride(BASE, { kcal: 2000, protein: 180 });
    expect(result.training.kcal).toBe(result.rest.kcal + 300);
    expect(result.training.carbs).toBe(result.rest.carbs + 75);
    expect(result.training.protein).toBe(result.rest.protein);
    expect(result.training.fat).toBe(result.rest.fat);
  });

  it('carbs never go negative even if protein/fat overrides exceed the calorie budget', () => {
    const result = applyTargetOverride(BASE, { kcal: 500, protein: 300, fat: 100 });
    expect(result.rest.carbs).toBe(0);
  });

  it('bmr/tdee pass through unchanged — an override never touches the science explainer numbers', () => {
    const result = applyTargetOverride(BASE, { kcal: 1800 });
    expect(result.bmr).toBe(BASE.bmr);
    expect(result.tdee).toBe(BASE.tdee);
  });

  it('combining all three overrides at once is consistent with applying them individually', () => {
    const result = applyTargetOverride(BASE, { kcal: 2100, protein: 190, fat: 65 });
    const expectedCarbs = Math.round((2100 - 190 * 4 - 65 * 9) / 4);
    expect(result.rest).toEqual({ label: 'יום מנוחה', kcal: 2100, protein: 190, fat: 65, carbs: expectedCarbs });
  });
});
