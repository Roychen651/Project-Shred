// Sprint 29 — a real, reported gap: the ingredient database had ZERO beverage
// entries at all (not even coffee/espresso) even though EATING_OUT_MENU has
// carried whole take-out drink items (Coke/Coke Zero etc., see CLAUDE.md
// Sprint 15.4) since much earlier — that's a different schema (a finished
// dish/drink with a fixed serving size), not a raw, gram/ml-scalable
// ingredient usable from the Plate Composer's per-100 + PORTION_UNITS system.
// This file closes that gap directly at the ingredient level.
//
// Same hand-authoring discipline as lib/data/israeli-ingredients.ts: generic,
// honestly-estimated values for common drink TYPES, never a specific branded
// product held out as verified-to-label. `raw` values are per 100ML here
// (not 100g) — for a liquid this is the natural unit, and the app's existing
// PORTION_UNITS already treats "cup" as a ~200 volume/weight approximation
// for exactly this reason (see CLAUDE.md Sprint 15.3's documented
// simplification, which this file leans on rather than re-litigates).
// `hasCookedVariant` is always false — a drink has no raw/cooked distinction.
//
// Ids are prefixed `bev-` for the same collision-avoidance reason
// israeli-ingredients.ts's `il-` prefix exists (see that file's header).
//
// category is 'beverages' — a new IngredientCategory value added in this
// same sprint (lib/domain/ingredients.ts + INGREDIENT_CATEGORIES in
// lib/data/ingredients.ts). No other architecture change was needed: the
// Plate Composer's category-tab loop and STATIC_INGREDIENTS merge are both
// already generic over whatever categories/arrays exist.

import type { Ingredient } from '../domain/ingredients';

export const BEVERAGES: Ingredient[] = [
  // ---- Coffee (14) ----
  { id: 'bev-espresso', name: 'אספרסו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 3, protein: 0.2, carbs: 0.5, fat: 0.1 } },
  { id: 'bev-coffee-black', name: 'קפה שחור (פילטר)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 1, protein: 0.1, carbs: 0.2, fat: 0 } },
  { id: 'bev-coffee-instant-black', name: 'נס קפה שחור', category: 'beverages', hasCookedVariant: false, raw: { kcal: 2, protein: 0.1, carbs: 0.3, fat: 0 } },
  { id: 'bev-americano', name: 'אמריקנו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 2, protein: 0.2, carbs: 0.3, fat: 0.1 } },
  { id: 'bev-cappuccino', name: 'קפוצ׳ינו (חלב 3%)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 40, protein: 2.1, carbs: 3.1, fat: 2 } },
  { id: 'bev-latte', name: 'לאטה (חלב 3%)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 45, protein: 2.4, carbs: 3.5, fat: 2.3 } },
  { id: 'bev-cafe-hafuch', name: 'קפה הפוך', category: 'beverages', hasCookedVariant: false, raw: { kcal: 48, protein: 2.5, carbs: 3.7, fat: 2.4 } },
  { id: 'bev-cafe-hafuch-skim', name: 'קפה הפוך חלב דל שומן', category: 'beverages', hasCookedVariant: false, raw: { kcal: 24, protein: 2.6, carbs: 3.6, fat: 0.1 } },
  { id: 'bev-macchiato', name: 'מקיאטו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 15, protein: 0.8, carbs: 1.2, fat: 0.8 } },
  { id: 'bev-mocha', name: 'מוקה (קפה+שוקולד)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 70, protein: 2.3, carbs: 9.5, fat: 2.8 } },
  { id: 'bev-iced-coffee-sweet', name: 'קפה קר ממותק', category: 'beverages', hasCookedVariant: false, raw: { kcal: 55, protein: 1.5, carbs: 9, fat: 1.5 } },
  { id: 'bev-turkish-coffee', name: 'קפה טורקי (לא ממותק)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 4, protein: 0.3, carbs: 0.6, fat: 0.1 } },
  { id: 'bev-decaf-coffee', name: 'קפה נטול קפאין', category: 'beverages', hasCookedVariant: false, raw: { kcal: 1, protein: 0.1, carbs: 0.2, fat: 0 } },
  { id: 'bev-cold-brew-black', name: 'קולד ברו (ללא תוספות)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 2, protein: 0.1, carbs: 0.3, fat: 0 } },

  // ---- Tea (6) ----
  { id: 'bev-tea-black', name: 'תה שחור', category: 'beverages', hasCookedVariant: false, raw: { kcal: 1, protein: 0, carbs: 0.3, fat: 0 } },
  { id: 'bev-tea-green', name: 'תה ירוק', category: 'beverages', hasCookedVariant: false, raw: { kcal: 1, protein: 0, carbs: 0.2, fat: 0 } },
  { id: 'bev-tea-herbal', name: 'תה צמחים / נענע', category: 'beverages', hasCookedVariant: false, raw: { kcal: 1, protein: 0, carbs: 0.2, fat: 0 } },
  { id: 'bev-tea-with-honey', name: 'תה עם דבש', category: 'beverages', hasCookedVariant: false, raw: { kcal: 20, protein: 0, carbs: 5, fat: 0 } },
  { id: 'bev-iced-tea-sweet', name: 'תה קר ממותק', category: 'beverages', hasCookedVariant: false, raw: { kcal: 38, protein: 0, carbs: 9.4, fat: 0 } },
  { id: 'bev-iced-tea-zero', name: 'תה קר זירו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 1, protein: 0, carbs: 0.2, fat: 0 } },

  // ---- Soft drinks & carbonated (12) ----
  { id: 'bev-cola', name: 'קולה רגילה', category: 'beverages', hasCookedVariant: false, raw: { kcal: 42, protein: 0, carbs: 10.6, fat: 0 } },
  { id: 'bev-cola-zero', name: 'קולה זירו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 0.3, protein: 0, carbs: 0, fat: 0 } },
  { id: 'bev-sprite', name: 'ספרייט רגיל', category: 'beverages', hasCookedVariant: false, raw: { kcal: 40, protein: 0, carbs: 10, fat: 0 } },
  { id: 'bev-sprite-zero', name: 'ספרייט זירו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 0.2, protein: 0, carbs: 0, fat: 0 } },
  { id: 'bev-fanta-orange', name: 'פאנטה תפוזים רגיל', category: 'beverages', hasCookedVariant: false, raw: { kcal: 46, protein: 0, carbs: 11.5, fat: 0 } },
  { id: 'bev-fanta-zero', name: 'פאנטה זירו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 0.5, protein: 0, carbs: 0.1, fat: 0 } },
  { id: 'bev-tonic-water', name: 'מי טוניק', category: 'beverages', hasCookedVariant: false, raw: { kcal: 35, protein: 0, carbs: 8.5, fat: 0 } },
  { id: 'bev-soda-water', name: 'מים מוגזים / סודה', category: 'beverages', hasCookedVariant: false, raw: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
  { id: 'bev-malt-beer', name: 'מאלט (לא אלכוהולי)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 37, protein: 0.3, carbs: 8.5, fat: 0 } },
  { id: 'bev-ginger-ale', name: "ג'ינג'ר אייל", category: 'beverages', hasCookedVariant: false, raw: { kcal: 34, protein: 0, carbs: 8.5, fat: 0 } },
  { id: 'bev-root-beer', name: 'רוט־ביר', category: 'beverages', hasCookedVariant: false, raw: { kcal: 43, protein: 0, carbs: 11, fat: 0 } },
  { id: 'bev-cola-diet-caffeine-free', name: 'קולה דיאט נטולת קפאין', category: 'beverages', hasCookedVariant: false, raw: { kcal: 0.3, protein: 0, carbs: 0, fat: 0 } },

  // ---- Juices & fruit drinks (11) ----
  { id: 'bev-orange-juice-fresh', name: 'מיץ תפוזים סחוט טרי', category: 'beverages', hasCookedVariant: false, raw: { kcal: 45, protein: 0.7, carbs: 10.4, fat: 0.2 } },
  { id: 'bev-orange-juice-carton', name: 'מיץ תפוזים מיץ מרוכז (קרטון)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 44, protein: 0.6, carbs: 10.8, fat: 0.1 } },
  { id: 'bev-apple-juice', name: 'מיץ תפוחים', category: 'beverages', hasCookedVariant: false, raw: { kcal: 46, protein: 0.1, carbs: 11.3, fat: 0.1 } },
  { id: 'bev-grape-juice', name: 'מיץ ענבים', category: 'beverages', hasCookedVariant: false, raw: { kcal: 60, protein: 0.4, carbs: 14.5, fat: 0.1 } },
  { id: 'bev-pomegranate-juice', name: 'מיץ רימונים', category: 'beverages', hasCookedVariant: false, raw: { kcal: 55, protein: 0.2, carbs: 13, fat: 0.3 } },
  { id: 'bev-mango-nectar', name: 'נקטר מנגו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 55, protein: 0.3, carbs: 13.5, fat: 0.1 } },
  { id: 'bev-peach-nectar', name: 'נקטר אפרסק', category: 'beverages', hasCookedVariant: false, raw: { kcal: 50, protein: 0.3, carbs: 12.3, fat: 0.1 } },
  { id: 'bev-vegetable-juice', name: 'מיץ ירקות מעורב', category: 'beverages', hasCookedVariant: false, raw: { kcal: 20, protein: 0.8, carbs: 4.5, fat: 0.1 } },
  { id: 'bev-carrot-juice', name: 'מיץ גזר', category: 'beverages', hasCookedVariant: false, raw: { kcal: 40, protein: 0.9, carbs: 9.3, fat: 0.2 } },
  { id: 'bev-lemonade-homemade', name: 'לימונדה ביתית ממותקת', category: 'beverages', hasCookedVariant: false, raw: { kcal: 42, protein: 0, carbs: 10.5, fat: 0 } },
  { id: 'bev-grapefruit-juice', name: 'מיץ אשכוליות', category: 'beverages', hasCookedVariant: false, raw: { kcal: 39, protein: 0.5, carbs: 9.2, fat: 0.1 } },

  // ---- Sports / energy (6) ----
  { id: 'bev-sports-drink', name: 'משקה איזוטוני (ספורט)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 26, protein: 0, carbs: 6.4, fat: 0 } },
  { id: 'bev-energy-drink', name: 'משקה אנרגיה רגיל', category: 'beverages', hasCookedVariant: false, raw: { kcal: 45, protein: 0, carbs: 11, fat: 0 } },
  { id: 'bev-energy-drink-zero', name: 'משקה אנרגיה זירו', category: 'beverages', hasCookedVariant: false, raw: { kcal: 3, protein: 0.2, carbs: 0.5, fat: 0 } },
  { id: 'bev-electrolyte-water', name: 'מי אלקטרוליטים', category: 'beverages', hasCookedVariant: false, raw: { kcal: 10, protein: 0, carbs: 2.5, fat: 0 } },
  { id: 'bev-kombucha', name: 'קומבוצ׳ה', category: 'beverages', hasCookedVariant: false, raw: { kcal: 30, protein: 0, carbs: 7, fat: 0 } },
  { id: 'bev-coconut-water', name: 'מי קוקוס', category: 'beverages', hasCookedVariant: false, raw: { kcal: 19, protein: 0.7, carbs: 3.7, fat: 0.2 } },

  // ---- Alcohol (7) ----
  { id: 'bev-beer-regular', name: 'בירה רגילה (5%)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 43, protein: 0.5, carbs: 3.6, fat: 0 } },
  { id: 'bev-beer-light', name: 'בירה לייט', category: 'beverages', hasCookedVariant: false, raw: { kcal: 29, protein: 0.3, carbs: 1.8, fat: 0 } },
  { id: 'bev-wine-red', name: 'יין אדום', category: 'beverages', hasCookedVariant: false, raw: { kcal: 85, protein: 0.1, carbs: 2.6, fat: 0 } },
  { id: 'bev-wine-white', name: 'יין לבן', category: 'beverages', hasCookedVariant: false, raw: { kcal: 82, protein: 0.1, carbs: 2.6, fat: 0 } },
  { id: 'bev-vodka', name: 'וודקה (40%)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 231, protein: 0, carbs: 0, fat: 0 } },
  { id: 'bev-whiskey', name: 'ויסקי (40%)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 250, protein: 0, carbs: 0.1, fat: 0 } },
  { id: 'bev-arak', name: 'ערק (35%)', category: 'beverages', hasCookedVariant: false, raw: { kcal: 220, protein: 0, carbs: 1, fat: 0 } },

  // ---- Water / other (3) ----
  { id: 'bev-water', name: 'מים', category: 'beverages', hasCookedVariant: false, raw: { kcal: 0, protein: 0, carbs: 0, fat: 0 } },
  { id: 'bev-water-mint-lemon', name: 'מים עם נענע ולימון', category: 'beverages', hasCookedVariant: false, raw: { kcal: 1, protein: 0, carbs: 0.3, fat: 0 } },
  { id: 'bev-hot-chocolate', name: 'שוקו חם', category: 'beverages', hasCookedVariant: false, raw: { kcal: 75, protein: 3, carbs: 9.5, fat: 2.8 } },
];
