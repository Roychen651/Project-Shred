// Barrel + the assembled StaticFoodData that lib/domain/smartSwap.ts's
// buildFoodLibrary() takes as a parameter. This is the wiring milestone 2's
// smartSwap.ts deferred — the algorithm was already correct, it just had nowhere
// real to read from yet.

import type { StaticFoodData } from '../domain/smartSwap';
import { SHUMSHUM, CHICKEN_STATION, GOOMBA, KANSAI } from './cibus';
import { HACKS } from './hacks';
import { EATING_OUT_MENU } from './eatingOut';

export const STATIC_FOOD_DATA: StaticFoodData = {
  shumshum: SHUMSHUM,
  chickenStation: CHICKEN_STATION,
  goomba: GOOMBA,
  kansai: KANSAI,
  hacks: HACKS,
  eatingOutMenu: EATING_OUT_MENU,
};

export { INGREDIENT_DB, INGREDIENT_CATEGORIES } from './ingredients';
export { PORTION_UNITS } from './portionUnits';
export { HACKS, HACK_CATEGORIES } from './hacks';
export { EATING_OUT_MENU, EATING_OUT_CATEGORIES } from './eatingOut';
export { SHUMSHUM, CHICKEN_STATION, GOOMBA, KANSAI } from './cibus';
export { WORKOUTS } from './workouts';
