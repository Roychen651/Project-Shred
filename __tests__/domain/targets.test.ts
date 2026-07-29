import { describe, it, expect } from 'vitest';
import { computeProfileTargets } from '@/lib/domain/targets';

// Golden values hand-verified against the exact Mifflin-St Jeor chain in
// ProjectShred.artifact.jsx:1090-1117, using the artifact's own two seeded
// profiles (DEFAULT_PROFILES). Every intermediate is written out so a future
// change to the formula shows exactly where the drift is.
describe('computeProfileTargets — golden values', () => {
  it('DEFAULT_PROFILES.mine: 29y / 84kg / 171cm / office / moderate', () => {
    // BMR = 10*84 + 6.25*171 - 5*29 + 5 = 840 + 1068.75 - 145 + 5 = 1768.75
    // TDEE = 1768.75 * 1.55 = 2741.5625
    // restKcal = round(2741.5625 * 0.85) = round(2330.328125) = 2330
    // protein = round(84*2.0) = 168; fat = round(84*0.7) = round(58.8) = 59
    // restCarbKcal = 2330 - 672 - 531 = 1127; restCarbs = round(1127/4) = round(281.75) = 282
    const result = computeProfileTargets({ weight: 84, height: 171, age: 29, activity: 'office', goal: 'moderate' });
    expect(result).toEqual({
      bmr: 1769,
      tdee: 2742,
      rest: { label: 'יום מנוחה', kcal: 2330, protein: 168, fat: 59, carbs: 282 },
      training: { label: 'יום אימון', kcal: 2630, protein: 168, fat: 59, carbs: 357 },
    });
  });

  it('DEFAULT_PROFILES.guest: 30y / 78kg / 175cm / sedentary / maintain', () => {
    // BMR = 780 + 1093.75 - 150 + 5 = 1728.75
    // TDEE = 1728.75 * 1.2 = 2074.5
    // restKcal = round(2074.5 * 1.0) = 2075 (JS Math.round ties toward +Infinity)
    // protein = round(78*2.0) = 156; fat = round(78*0.7) = round(54.6) = 55
    // restCarbKcal = 2075 - 624 - 495 = 956; restCarbs = round(956/4) = 239 (exact)
    const result = computeProfileTargets({ weight: 78, height: 175, age: 30, activity: 'sedentary', goal: 'maintain' });
    expect(result).toEqual({
      bmr: 1729,
      tdee: 2075,
      rest: { label: 'יום מנוחה', kcal: 2075, protein: 156, fat: 55, carbs: 239 },
      training: { label: 'יום אימון', kcal: 2375, protein: 156, fat: 55, carbs: 314 },
    });
  });

  it('the training-day refeed delta is always exactly +300kcal / +75g carbs', () => {
    const profiles = [
      { weight: 84, height: 171, age: 29, activity: 'office' as const, goal: 'moderate' as const },
      { weight: 60, height: 160, age: 22, activity: 'veryActive' as const, goal: 'aggressive' as const },
      { weight: 100, height: 190, age: 45, activity: 'sedentary' as const, goal: 'bulk' as const },
    ];
    for (const p of profiles) {
      const r = computeProfileTargets(p);
      expect(r.training.kcal - r.rest.kcal).toBe(300);
      expect(r.training.carbs - r.rest.carbs).toBe(75);
      expect(r.training.protein).toBe(r.rest.protein);
      expect(r.training.fat).toBe(r.rest.fat);
    }
  });

  it('degrades to zero rather than NaN when fields are missing (custom-profile seed guard)', () => {
    const result = computeProfileTargets({});
    expect(Number.isNaN(result.bmr)).toBe(false);
    expect(Number.isNaN(result.tdee)).toBe(false);
    // BMR = 0+0-0+5 = 5, still a valid finite number, not NaN/Infinity
    expect(result.bmr).toBe(5);
  });

  it('accepts string-typed numeric fields, matching Number(x) || 0 coercion', () => {
    const asStrings = computeProfileTargets({ weight: '84', height: '171', age: '29', activity: 'office', goal: 'moderate' });
    const asNumbers = computeProfileTargets({ weight: 84, height: 171, age: 29, activity: 'office', goal: 'moderate' });
    expect(asStrings).toEqual(asNumbers);
  });
});
