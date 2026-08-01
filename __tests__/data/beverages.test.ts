import { describe, it, expect } from 'vitest';
import { BEVERAGES } from '@/lib/data/beverages';
import { INGREDIENT_DB, INGREDIENT_CATEGORIES } from '@/lib/data/ingredients';
import { ISRAELI_INGREDIENTS } from '@/lib/data/israeli-ingredients';

const VALID_CATEGORIES = new Set(INGREDIENT_CATEGORIES.map((c) => c.id));

describe('BEVERAGES — structural integrity', () => {
  it('has a substantial number of entries', () => {
    expect(BEVERAGES.length).toBeGreaterThanOrEqual(50);
  });

  it('has no duplicate ids within itself', () => {
    const ids = BEVERAGES.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no id collisions with INGREDIENT_DB or ISRAELI_INGREDIENTS', () => {
    const existingIds = new Set([...INGREDIENT_DB, ...ISRAELI_INGREDIENTS].map((i) => i.id));
    for (const ing of BEVERAGES) {
      expect(existingIds.has(ing.id), `${ing.id} collides with an existing ingredient id`).toBe(false);
    }
  });

  it('every id uses the bev- prefix', () => {
    for (const ing of BEVERAGES) {
      expect(ing.id.startsWith('bev-'), `${ing.id} is missing the bev- prefix`).toBe(true);
    }
  });

  it('every entry is category "beverages", has a non-empty name, and finite non-negative raw macros', () => {
    expect(VALID_CATEGORIES.has('beverages')).toBe(true);
    for (const ing of BEVERAGES) {
      expect(ing.category).toBe('beverages');
      expect(ing.name.length, `${ing.id}: empty name`).toBeGreaterThan(0);
      for (const field of ['kcal', 'protein', 'carbs', 'fat'] as const) {
        const v = ing.raw[field];
        expect(Number.isFinite(v), `${ing.id}.raw.${field} is not finite`).toBe(true);
        expect(v, `${ing.id}.raw.${field} is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('no entry ever declares a cooked variant (a drink has no raw/cooked distinction)', () => {
    for (const ing of BEVERAGES) {
      expect(ing.hasCookedVariant).toBe(false);
    }
  });

  it('includes the specifically-reported missing items (coffee/espresso)', () => {
    const names = BEVERAGES.map((i) => i.name);
    expect(names.some((n) => n.includes('אספרסו'))).toBe(true);
    expect(names.some((n) => n.includes('קפה'))).toBe(true);
  });
});
