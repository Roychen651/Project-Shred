// Raw/cooked ingredient conversion. ProjectShred.artifact.jsx:420-817 (Sprint 13).
//
// Exactly one set of numbers is ever stored per ingredient — the RAW 100g values —
// plus a cookedFactor (cooked-weight ÷ raw-weight for an identical starting
// quantity). Cooked-basis values are always DERIVED, never hand-typed twice, so
// raw and cooked can never drift out of sync with each other.

import { roundNum } from './util';

export type IngredientCategory = 'protein' | 'carb' | 'fat' | 'veg' | 'fruit' | 'dairy_snacks' | 'condiments';
export type IngredientState = 'raw' | 'cooked';

export interface Macros100 {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// A discriminated union rather than an optional `cookedFactor?: number` — it lets
// TypeScript narrow `ingredient.cookedFactor` to a definite `number` inside the
// `hasCookedVariant` branch below with no runtime guard, so getPer100() stays
// byte-for-byte the same branch the artifact takes (no extra fallback condition
// that would silently change behavior for data the schema already guarantees
// is well-formed — see custom_ingredients_cooked_factor_required in migration 0001).
interface IngredientBase {
  id: string;
  name: string;
  category: IngredientCategory;
  raw: Macros100;
}
export type Ingredient =
  | (IngredientBase & { hasCookedVariant: true; cookedFactor: number })
  | (IngredientBase & { hasCookedVariant: false });

// If `state` is 'cooked' but the ingredient has no cooked variant, the raw values
// are returned unchanged — this is the artifact's own fallback behavior, not an
// error case (most ingredients, e.g. eggs or oils, are single-state).
export function getPer100(ingredient: Ingredient, state: IngredientState): Macros100 {
  if (state === 'cooked' && ingredient.hasCookedVariant) {
    const f = ingredient.cookedFactor;
    return {
      kcal: ingredient.raw.kcal / f,
      protein: ingredient.raw.protein / f,
      carbs: ingredient.raw.carbs / f,
      fat: ingredient.raw.fat / f,
    };
  }
  return ingredient.raw;
}

// Structural, not a store import (lib/domain must not depend on lib/store —
// the store depends on the domain layer, never the reverse). Matches the
// shape of shred-store.ts's CustomIngredient exactly; category is widened to
// `string` there because it round-trips through a DB check-constraint rather
// than this file's IngredientCategory union, so it's narrowed defensively
// here instead of trusted blindly.
export interface CustomIngredientLike {
  id: string;
  name: string;
  category: string;
  hasCookedVariant: boolean;
  cookedFactor?: number;
  raw: Macros100;
}

const VALID_CATEGORIES = new Set<IngredientCategory>(['protein', 'carb', 'fat', 'veg', 'fruit', 'dairy_snacks', 'condiments']);

// A saved custom ingredient is always single-state (see CLAUDE.md — a
// packaged product's label already reflects how it's normally weighed), so
// this always returns the `hasCookedVariant: false` branch regardless of
// what was stored — matching the artifact's own custom-ingredient behavior.
export function customIngredientToIngredient(ci: CustomIngredientLike): Ingredient {
  return {
    id: ci.id,
    name: ci.name,
    category: VALID_CATEGORIES.has(ci.category as IngredientCategory) ? (ci.category as IngredientCategory) : 'protein',
    hasCookedVariant: false,
    raw: ci.raw,
  };
}

export function getIngredientMacros(ingredient: Ingredient, state: IngredientState, grams: number): Macros100 {
  const per100 = getPer100(ingredient, state);
  const factor = grams / 100;
  return {
    kcal: Math.round(per100.kcal * factor),
    protein: roundNum(per100.protein * factor),
    carbs: roundNum(per100.carbs * factor),
    fat: roundNum(per100.fat * factor),
  };
}
