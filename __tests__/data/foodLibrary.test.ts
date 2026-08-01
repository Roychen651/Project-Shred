import { describe, it, expect } from 'vitest';
import { STATIC_FOOD_DATA } from '@/lib/data';
import { buildFoodLibrary, findBestMatches } from '@/lib/domain/smartSwap';

// Closes the wiring milestone 2's smartSwap.ts deliberately deferred: this is
// the real STATIC_FOOD_DATA (built from the actual ported Restaurant Matrix/
// Hacks/Eating-Out data), not a synthetic fixture, run through the unchanged
// algorithm.
describe('buildFoodLibrary — wired to the real reference data', () => {
  it('enumerates a non-trivial library with no custom restaurants/hacks', () => {
    const lib = buildFoodLibrary([], [], STATIC_FOOD_DATA);
    // Shumshum: 2 veg x 2 protein x 2 carb = 8. Chicken Station: 3 protein x 2 carb = 6.
    // Goomba: 2. Kansai: 2 protein = 2. Hacks: 64. Eating out: 79 (Sprint 32).
    expect(lib.length).toBe(8 + 6 + 2 + 2 + 64 + 79);
  });

  it('every library entry has finite, non-negative macros', () => {
    const lib = buildFoodLibrary([], [], STATIC_FOOD_DATA);
    for (const item of lib) {
      for (const field of ['kcal', 'protein', 'carbs', 'fat'] as const) {
        expect(Number.isFinite(item[field]), `${item.id}.${field}`).toBe(true);
        expect(item[field]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('findBestMatches returns sensible, closely-scored results against the real library', () => {
    // A realistic "end of day, need ~450kcal / 35g protein" gap.
    const lib = buildFoodLibrary([], [], STATIC_FOOD_DATA);
    const matches = findBestMatches(lib, 450, 35, 3);
    expect(matches).toHaveLength(3);
    // Results should be sorted ascending by match score.
    expect(matches[0].matchScore).toBeLessThanOrEqual(matches[1].matchScore);
    expect(matches[1].matchScore).toBeLessThanOrEqual(matches[2].matchScore);
  });

  it('a custom restaurant and a custom hack are folded in alongside the built-ins', () => {
    const customHack = { id: 'ch1', name: 'My Recipe', kcal: 300, protein: 25, carbs: 20, fat: 10 };
    const customRestaurant = {
      id: 'r1', name: 'My Place', type: 'simple' as const,
      dishes: [{ id: 'd1', name: 'Dish', kcal: 500, protein: 40, carbs: 30, fat: 15 }],
      plateOptions: { veg: [], protein: [], carb: [] },
    };
    const lib = buildFoodLibrary([customRestaurant], [customHack], STATIC_FOOD_DATA);
    expect(lib.find((i) => i.id === 'hack-ch1')).toBeDefined();
    expect(lib.find((i) => i.id === 'custom-r1-d1')).toBeDefined();
  });
});
