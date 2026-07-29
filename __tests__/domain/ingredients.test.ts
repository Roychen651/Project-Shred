import { describe, it, expect } from 'vitest';
import { getPer100, getIngredientMacros, type Ingredient } from '@/lib/domain/ingredients';

// Fixture matches INGREDIENT_DB's actual חזה עוף entry (artifact:432).
const chickenBreast: Ingredient = {
  id: 'chicken-breast', name: 'חזה עוף', category: 'protein',
  hasCookedVariant: true, cookedFactor: 0.75,
  raw: { kcal: 120, protein: 22.5, carbs: 0, fat: 2.6 },
};

const schnitzel: Ingredient = {
  id: 'schnitzel', name: 'שניצל עוף', category: 'protein',
  hasCookedVariant: false,
  raw: { kcal: 260, protein: 18, carbs: 15, fat: 14 },
};

describe('getPer100 — cooked values are derived, never hand-typed twice', () => {
  it('raw state returns the raw values unchanged', () => {
    expect(getPer100(chickenBreast, 'raw')).toEqual({ kcal: 120, protein: 22.5, carbs: 0, fat: 2.6 });
  });

  it('cooked state divides raw by the cookedFactor (weight loss on cooking → factor < 1 → higher per-100g values)', () => {
    // 120/0.75 = 160; 22.5/0.75 = 30; 0/0.75 = 0; 2.6/0.75 = 3.4666...
    const cooked = getPer100(chickenBreast, 'cooked');
    expect(cooked.kcal).toBe(160);
    expect(cooked.protein).toBe(30);
    expect(cooked.carbs).toBe(0);
    expect(cooked.fat).toBeCloseTo(3.466666, 5);
  });

  it('requesting "cooked" on a single-state ingredient silently falls back to raw (not an error)', () => {
    expect(getPer100(schnitzel, 'cooked')).toEqual(schnitzel.raw);
  });
});

describe('getIngredientMacros — scales getPer100 by grams/100', () => {
  it('cooked chicken breast at 150g', () => {
    // per100 cooked: kcal160, protein30, fat 2.6/0.75*1.5 = 5.2 exactly (2.6 * 2)
    const macros = getIngredientMacros(chickenBreast, 'cooked', 150);
    expect(macros).toEqual({ kcal: 240, protein: 45, carbs: 0, fat: 5.2 });
  });

  it('raw chicken breast at 200g', () => {
    const macros = getIngredientMacros(chickenBreast, 'raw', 200);
    expect(macros).toEqual({ kcal: 240, protein: 45, carbs: 0, fat: 5.2 });
  });

  it('grams=0 yields all-zero macros, not NaN or division error', () => {
    expect(getIngredientMacros(chickenBreast, 'raw', 0)).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
