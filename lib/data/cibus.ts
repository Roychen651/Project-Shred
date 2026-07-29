// The four built-in Cibus restaurants. ProjectShred.artifact.jsx:220-261 (Sprint 2).
// Fixed/hardcoded by deliberate scope decision (Sprint 11): these four stay as
// reference examples; only newly-created custom restaurants get an editable
// 3-part-formula. Transcribed verbatim.
//
// Shaped to satisfy lib/domain/smartSwap.ts's ShumshumData/ChickenStationData/
// GoombaData/KansaiData exactly, closing the deferred wiring from milestone 2 —
// buildFoodLibrary() can now be called with real data instead of a test fixture.

import type { ShumshumData, ChickenStationData, GoombaData, KansaiData } from '../domain/smartSwap';

export const SHUMSHUM: ShumshumData = {
  veg: [
    { id: 'salad', name: 'סלט ירקות חתוך', kcal: 60, protein: 2, fat: 2, carbs: 10 },
    { id: 'grilled', name: 'ירקות מוקפצים בזית', kcal: 90, protein: 2, fat: 6, carbs: 9 },
  ],
  protein: [
    { id: 'meatballs', name: 'כדורי דגים / עוף', kcal: 190, protein: 26, fat: 8, carbs: 3 },
    { id: 'shawarma', name: 'שווארמה עוף', kcal: 230, protein: 24, fat: 14, carbs: 2 },
  ],
  carb: [
    { id: 'rice', name: 'אורז (3-4 כפות)', kcal: 110, protein: 2, fat: 1, carbs: 24 },
    { id: 'puree', name: 'פירה תפו״א', kcal: 130, protein: 2, fat: 4, carbs: 22 },
  ],
};

export const CHICKEN_STATION: ChickenStationData = {
  protein: [
    { id: 'grilled', name: 'חזה עוף גריל', kcal: 200, protein: 40, fat: 5, carbs: 0 },
    { id: 'pergiet', name: 'פרגית', kcal: 240, protein: 28, fat: 14, carbs: 0 },
    { id: 'schnitzel', name: 'שניצל אפוי', kcal: 260, protein: 30, fat: 12, carbs: 10 },
  ],
  carb: [
    { id: 'potato', name: 'תפו״א אפוי', kcal: 140, protein: 3, fat: 0, carbs: 32 },
    { id: 'rice', name: 'אורז', kcal: 150, protein: 3, fat: 1, carbs: 33 },
  ],
  veg: { id: 'veg', name: 'שעועית ירוקה / אנטיפסטי', kcal: 70, protein: 2, fat: 4, carbs: 6 },
};

export const GOOMBA: GoombaData = [
  { id: 'pasta', name: 'פסטה בולונז', kcal: 650, protein: 30, fat: 20, carbs: 75 },
  { id: 'chicken', name: 'עוף גריל + סלט ירוק', kcal: 380, protein: 42, fat: 12, carbs: 15 },
];

export const KANSAI: KansaiData = {
  protein: [
    { id: 'salmon', name: 'סלמון', kcal: 250, protein: 28, fat: 14, carbs: 0 },
    { id: 'chicken', name: 'עוף', kcal: 210, protein: 32, fat: 6, carbs: 0 },
  ],
  rice: { kcal: 150, protein: 3, fat: 0, carbs: 33 },
  veg: { kcal: 50, protein: 2, fat: 0, carbs: 8 },
  sauce: { kcal: 20, protein: 0, fat: 0, carbs: 3 },
};
