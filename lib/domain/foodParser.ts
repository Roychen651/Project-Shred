// Free-text quick-log parser. ProjectShred.artifact.jsx:1119-1201 (Sprint 9).
//
// 100% client-side heuristic — no network call, no external NLP service. Scans
// for known food keywords, then inspects a small window immediately before each
// match for a quantity ("200 גרם") and a window immediately after for trailing
// Hebrew size adjectives (קטנה/גדולה/חצי — adjectives follow the noun in Hebrew,
// e.g. "במבה קטנה", which is why the "after" window is checked, not just "before").
//
// FOOD_DB is small (19 items) and exists only to support this parser — unlike
// INGREDIENT_DB/HACKS/EATING_OUT_MENU (deferred to milestone 3's lib/data/), it
// ships alongside the algorithm that consumes it.

import { roundNum, genId } from './util';

type FoodDbEntry =
  | { keywords: string[]; label: string; type: 'per100g'; defaultGrams: number; kcal: number; protein: number; carbs: number; fat: number }
  | { keywords: string[]; label: string; type: 'perUnit'; kcal: number; protein: number; carbs: number; fat: number };

export const FOOD_DB: FoodDbEntry[] = [
  { keywords: ['חזה עוף', 'עוף בגריל', 'עוף אפוי'], label: 'חזה עוף', type: 'per100g', defaultGrams: 150, kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { keywords: ['שווארמה'], label: 'שווארמה עוף', type: 'per100g', defaultGrams: 150, kcal: 195, protein: 24, carbs: 2, fat: 10 },
  { keywords: ['שניצל'], label: 'שניצל', type: 'per100g', defaultGrams: 150, kcal: 210, protein: 22, carbs: 9, fat: 10 },
  { keywords: ['אורז'], label: 'אורז מבושל', type: 'per100g', defaultGrams: 150, kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { keywords: ['פסטה', 'ספגטי'], label: 'פסטה מבושלת', type: 'per100g', defaultGrams: 200, kcal: 158, protein: 5.8, carbs: 31, fat: 0.9 },
  { keywords: ['תפוח אדמה', 'תפו"א', 'תפוא'], label: 'תפוח אדמה אפוי', type: 'per100g', defaultGrams: 180, kcal: 93, protein: 2.5, carbs: 21, fat: 0.1 },
  { keywords: ['סלמון'], label: 'סלמון', type: 'per100g', defaultGrams: 150, kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { keywords: ['טונה'], label: 'טונה משומרת', type: 'per100g', defaultGrams: 100, kcal: 116, protein: 26, carbs: 0, fat: 1 },
  { keywords: ['פסטרמה'], label: 'פסטרמה', type: 'per100g', defaultGrams: 50, kcal: 180, protein: 32, carbs: 2, fat: 6 },
  { keywords: ['גבינה 9%', 'גבינה'], label: 'גבינה 9%', type: 'per100g', defaultGrams: 30, kcal: 150, protein: 12, carbs: 4, fat: 9 },
  { keywords: ['יוגורט'], label: 'יוגורט יווני 5%', type: 'per100g', defaultGrams: 150, kcal: 97, protein: 8, carbs: 5, fat: 5 },
  { keywords: ['ביצה', 'ביצים'], label: 'ביצה', type: 'perUnit', kcal: 70, protein: 6, carbs: 0.5, fat: 5 },
  { keywords: ['לחם', 'פרוסת לחם', 'פיתה'], label: 'פרוסת לחם / פיתה', type: 'perUnit', kcal: 90, protein: 3, carbs: 16, fat: 1 },
  { keywords: ['בננה'], label: 'בננה', type: 'perUnit', kcal: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { keywords: ['במבה'], label: 'במבה (שקית)', type: 'perUnit', kcal: 135, protein: 4, carbs: 11, fat: 9 },
  { keywords: ['מעדן', 'GO', 'PRO'], label: 'מעדן חלבון (GO/PRO)', type: 'perUnit', kcal: 140, protein: 15, carbs: 13, fat: 3 },
  { keywords: ['שוקולד'], label: 'שוקולד (20 גרם)', type: 'perUnit', kcal: 110, protein: 1, carbs: 13, fat: 6 },
  { keywords: ['חטיף פרוטאין', 'חטיף חלבון'], label: 'חטיף פרוטאין', type: 'perUnit', kcal: 200, protein: 20, carbs: 18, fat: 7 },
  { keywords: ['שייק חלבון', 'אבקת חלבון'], label: 'שייק חלבון', type: 'perUnit', kcal: 130, protein: 25, carbs: 3, fat: 2 },
];

export interface ParsedFoodItem {
  id: string;
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function parseFoodText(text: string): ParsedFoodItem[] {
  if (!text || !text.trim()) return [];
  const found: ParsedFoodItem[] = [];
  const seenLabels = new Set<string>();

  FOOD_DB.forEach((food) => {
    const kw = food.keywords.find((k) => text.includes(k));
    if (!kw || seenLabels.has(food.label)) return;
    const idx = text.indexOf(kw);
    const before = text.slice(Math.max(0, idx - 14), idx);
    const after = text.slice(idx + kw.length, idx + kw.length + 10);

    const numMatch = before.match(/(\d+)\s*(גרם|גר['׳]?|g)?\s*$/i);
    const qty = numMatch ? parseInt(numMatch[1], 10) : null;
    const hasGramUnit = !!(numMatch && numMatch[2]);

    let sizeMult = 1;
    if (/קטנ/.test(before) || /קטנ/.test(after)) sizeMult = 0.65;
    else if (/גדול/.test(before) || /גדול/.test(after)) sizeMult = 1.4;
    else if (/חצי/.test(before)) sizeMult = 0.5;

    seenLabels.add(food.label);

    if (food.type === 'per100g') {
      const grams = Math.round((hasGramUnit ? (qty as number) : food.defaultGrams) * sizeMult);
      const factor = grams / 100;
      found.push({
        id: genId(food.label),
        name: food.label,
        amount: `${grams} גרם${hasGramUnit ? '' : ' (משוער)'}`,
        kcal: Math.round(food.kcal * factor),
        protein: roundNum(food.protein * factor),
        carbs: roundNum(food.carbs * factor),
        fat: roundNum(food.fat * factor),
      });
    } else {
      const count = Math.max(0.5, (qty || 1) * sizeMult);
      found.push({
        id: genId(food.label),
        name: food.label,
        amount: `${count} יח׳`,
        kcal: Math.round(food.kcal * count),
        protein: roundNum(food.protein * count),
        carbs: roundNum(food.carbs * count),
        fat: roundNum(food.fat * count),
      });
    }
  });

  return found;
}
