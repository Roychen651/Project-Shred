import { describe, it, expect } from 'vitest';
import { ISRAELI_INGREDIENTS } from '@/lib/data/israeli-ingredients';
import { INGREDIENT_DB, INGREDIENT_CATEGORIES } from '@/lib/data/ingredients';

const VALID_CATEGORIES = new Set(INGREDIENT_CATEGORIES.map((c) => c.id));

describe('ISRAELI_INGREDIENTS — structural integrity', () => {
  it('has at least 100 entries', () => {
    expect(ISRAELI_INGREDIENTS.length).toBeGreaterThanOrEqual(100);
  });

  it('has no duplicate ids within itself', () => {
    const ids = ISRAELI_INGREDIENTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has no id collisions with the existing INGREDIENT_DB', () => {
    const existingIds = new Set(INGREDIENT_DB.map((i) => i.id));
    for (const ing of ISRAELI_INGREDIENTS) {
      expect(existingIds.has(ing.id), `${ing.id} collides with an existing INGREDIENT_DB id`).toBe(false);
    }
  });

  it('every id uses the il- prefix, so future collisions are structurally impossible', () => {
    for (const ing of ISRAELI_INGREDIENTS) {
      expect(ing.id.startsWith('il-'), `${ing.id} is missing the il- prefix`).toBe(true);
    }
  });

  it('every entry has a valid category, a non-empty Hebrew name, and finite non-negative raw macros', () => {
    for (const ing of ISRAELI_INGREDIENTS) {
      expect(VALID_CATEGORIES.has(ing.category), `${ing.id}: invalid category "${ing.category}"`).toBe(true);
      expect(ing.name.length, `${ing.id}: empty name`).toBeGreaterThan(0);
      for (const field of ['kcal', 'protein', 'carbs', 'fat'] as const) {
        const v = ing.raw[field];
        expect(Number.isFinite(v), `${ing.id}.raw.${field} is not finite`).toBe(true);
        expect(v, `${ing.id}.raw.${field} is negative`).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('no entry name references a specific real brand (spot-checks the generic-only boundary)', () => {
    // Not exhaustive — a deliberate spot-check for the most likely brand names to
    // leak in, matching the explicit "generic, not branded" scope of this file.
    const brandNames = ['דנונה', 'תנובה', 'עלית', 'אסם', 'שטראוס', 'מולר', 'יופלייט', 'גולדה', 'אחלה', 'סברה', 'ברמן', 'אנג\'ל'];
    for (const ing of ISRAELI_INGREDIENTS) {
      for (const brand of brandNames) {
        expect(ing.name.includes(brand), `${ing.id} ("${ing.name}") references brand "${brand}"`).toBe(false);
      }
    }
  });

  it('every cooked-variant entry has a plausible positive cookedFactor (0.6-3.0)', () => {
    for (const ing of ISRAELI_INGREDIENTS) {
      if (ing.hasCookedVariant) {
        expect(ing.cookedFactor).toBeGreaterThan(0);
        expect(ing.cookedFactor).toBeGreaterThanOrEqual(0.6);
        expect(ing.cookedFactor).toBeLessThanOrEqual(3.0);
      }
    }
  });
});
