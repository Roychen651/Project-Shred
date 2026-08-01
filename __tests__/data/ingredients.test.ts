import { describe, it, expect } from 'vitest';
import { INGREDIENT_DB, INGREDIENT_CATEGORIES } from '@/lib/data/ingredients';
import { getIngredientMacros } from '@/lib/domain/ingredients';

const VALID_CATEGORIES = new Set(INGREDIENT_CATEGORIES.map((c) => c.id));

describe('INGREDIENT_DB — structural integrity', () => {
  it('has exactly 279 entries, matching CLAUDE.md\'s Sprint 15.24 count', () => {
    expect(INGREDIENT_DB).toHaveLength(279);
  });

  it('has no duplicate ids', () => {
    const ids = INGREDIENT_DB.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a valid category, a non-empty Hebrew name, and finite raw macros', () => {
    for (const ing of INGREDIENT_DB) {
      expect(VALID_CATEGORIES.has(ing.category), `${ing.id}: invalid category "${ing.category}"`).toBe(true);
      expect(ing.name.length, `${ing.id}: empty name`).toBeGreaterThan(0);
      for (const field of ['kcal', 'protein', 'carbs', 'fat'] as const) {
        const v = ing.raw[field];
        expect(Number.isFinite(v), `${ing.id}.raw.${field} is not finite`).toBe(true);
        expect(v, `${ing.id}.raw.${field} is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('every cooked-variant ingredient has a positive cookedFactor (schema-required, custom_ingredients_cooked_factor_required)', () => {
    for (const ing of INGREDIENT_DB) {
      if (ing.hasCookedVariant) {
        expect(ing.cookedFactor, `${ing.id} has hasCookedVariant but no cookedFactor`).toBeDefined();
        expect(ing.cookedFactor).toBeGreaterThan(0);
      }
    }
  });

  it('cookedFactor stays within the documented plausible range (0.6-3.0)', () => {
    // Meat/fish lose water (~0.7-0.85), grains absorb it (~2.2-3.0) — a factor
    // wildly outside this band would indicate a transcription slip, not real food.
    for (const ing of INGREDIENT_DB) {
      if (ing.hasCookedVariant) {
        expect(ing.cookedFactor).toBeGreaterThanOrEqual(0.6);
        expect(ing.cookedFactor).toBeLessThanOrEqual(3.0);
      }
    }
  });
});

describe('INGREDIENT_DB — spot-checks against the artifact source', () => {
  it('חזה עוף (chicken-breast): the exact fixture used in domain/ingredients.test.ts', () => {
    const chicken = INGREDIENT_DB.find((i) => i.id === 'chicken-breast');
    expect(chicken).toMatchObject({ name: 'חזה עוף', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 120, protein: 22.5, carbs: 0, fat: 2.6 } });
  });

  it('שמן זית (olive-oil): pure fat, 884 kcal/100g', () => {
    const oliveOil = INGREDIENT_DB.find((i) => i.id === 'olive-oil');
    expect(oliveOil?.raw).toEqual({ kcal: 884, protein: 0, carbs: 0, fat: 100 });
  });

  it('בננה (banana): single-state fruit', () => {
    const banana = INGREDIENT_DB.find((i) => i.id === 'banana');
    expect(banana).toMatchObject({ category: 'fruit', hasCookedVariant: false, raw: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 } });
  });

  it('אורז בסמטי (rice-basmati): grain with cookedFactor > 1 (absorbs water)', () => {
    const rice = INGREDIENT_DB.find((i) => i.id === 'rice-basmati');
    expect(rice).toMatchObject({ hasCookedVariant: true, cookedFactor: 2.6, raw: { kcal: 356, protein: 7.5, carbs: 78, fat: 0.6 } });
    // end-to-end through the real domain function, not just the raw fixture
    expect(getIngredientMacros(rice!, 'cooked', 150)).toEqual({ kcal: 205, protein: 4.3, carbs: 45, fat: 0.3 });
  });

  it('the newest (Sprint 15.24 round-4) addition is present: כמון (cumin)', () => {
    expect(INGREDIENT_DB.find((i) => i.id === 'cumin')).toMatchObject({ category: 'condiments', raw: { kcal: 375, protein: 18, carbs: 44, fat: 22 } });
  });
});

describe('INGREDIENT_CATEGORIES', () => {
  it('has all 8 categories (7 from Sprint 15.6 + beverages from Sprint 29)', () => {
    expect(INGREDIENT_CATEGORIES.map((c) => c.id).sort()).toEqual(
      ['beverages', 'carb', 'condiments', 'dairy_snacks', 'fat', 'fruit', 'protein', 'veg'].sort()
    );
  });

  it('every category used in INGREDIENT_DB is declared', () => {
    const usedCategories = new Set(INGREDIENT_DB.map((i) => i.category));
    for (const cat of usedCategories) {
      expect(VALID_CATEGORIES.has(cat)).toBe(true);
    }
  });
});
