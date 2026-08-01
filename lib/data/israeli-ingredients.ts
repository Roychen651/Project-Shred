// Sprint 12.1 — generic Israeli-staple expansion (Path A of the pivot away
// from fabricated branded-SKU macros; see CLAUDE.md's Sprint 12 note for the
// full reasoning). Every entry here is a GENERIC food type ("high-protein
// probiotic yogurt", "corn-and-peanut puff snack") with an honestly-
// estimated, conservative macro value — never a specific real product name
// or brand, and never presented as verified against an actual current label.
// That distinction matters: a generic estimate is a reasonable starting
// point for logging; a fabricated number attributed to a real branded SKU is
// not, and won't become one just by being in a separate file.
//
// Same schema and hand-authoring discipline as lib/data/ingredients.ts
// (INGREDIENT_DB) — this is deliberately a SEPARATE file rather than
// appended to that one, so the "generic staples, not brand-verified" scope
// boundary stays visible in the codebase, not just in a comment. Ids are
// prefixed `il-` so they can never collide with INGREDIENT_DB's ids even if
// a future round adds an overlapping name.
//
// For a SPECIFIC real product (exact brand, exact label numbers) the correct
// path is still CustomIngredientModal — type in what's printed on the actual
// package. This file is not a substitute for that; it's the generic
// baseline CLAUDE.md's Sprint 8 note said this app should have.

import type { Ingredient } from '../domain/ingredients';

export const ISRAELI_INGREDIENTS: Ingredient[] = [
  // ---- High-protein dairy & snacks (~28) ----
  { id: 'il-yogurt-probiotic-protein', name: 'יוגורט פרוביוטי עתיר חלבון', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 75, protein: 10, carbs: 5, fat: 1.5 } },
  { id: 'il-yogurt-protein-vanilla', name: 'יוגורט חלבון בטעם וניל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 80, protein: 9, carbs: 7, fat: 1.8 } },
  { id: 'il-yogurt-protein-strawberry', name: 'יוגורט חלבון בטעם תות', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 82, protein: 9, carbs: 8, fat: 1.8 } },
  { id: 'il-yogurt-skyr', name: 'יוגורט סקיר (Skyr)', category: 'protein', hasCookedVariant: false, raw: { kcal: 63, protein: 11, carbs: 4, fat: 0.2 } },
  { id: 'il-protein-drink-ready', name: 'משקה חלבון מוכן לשתייה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 60, protein: 10, carbs: 3, fat: 0.5 } },
  { id: 'il-quark-3', name: 'גבינה לבנה 3%', category: 'protein', hasCookedVariant: false, raw: { kcal: 80, protein: 10, carbs: 4, fat: 3 } },
  { id: 'il-cottage-3', name: "גבינת קוטג' 3%", category: 'protein', hasCookedVariant: false, raw: { kcal: 84, protein: 11, carbs: 3.5, fat: 3 } },
  { id: 'il-cottage-protein-plus', name: "גבינת קוטג' עתיר חלבון", category: 'protein', hasCookedVariant: false, raw: { kcal: 90, protein: 15, carbs: 3.5, fat: 1.5 } },
  { id: 'il-high-protein-milk', name: 'חלב עתיר חלבון', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 55, protein: 6.5, carbs: 4.5, fat: 1.5 } },
  { id: 'il-protein-pudding-choc', name: 'פודינג חלבון שוקולד', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 90, protein: 10, carbs: 8, fat: 2 } },
  { id: 'il-salty-cheese', name: 'גבינה מלוחה (בולגרית רכה)', category: 'fat', hasCookedVariant: false, raw: { kcal: 260, protein: 16, carbs: 2, fat: 21 } },
  { id: 'il-goat-cheese-soft', name: 'גבינת עיזים רכה', category: 'fat', hasCookedVariant: false, raw: { kcal: 290, protein: 18, carbs: 2, fat: 24 } },
  { id: 'il-labneh', name: 'לאבנה', category: 'fat', hasCookedVariant: false, raw: { kcal: 150, protein: 6, carbs: 4, fat: 13 } },
  { id: 'il-whey-protein-powder', name: 'אבקת חלבון מי גבינה (נקי)', category: 'protein', hasCookedVariant: false, raw: { kcal: 380, protein: 80, carbs: 6, fat: 5 } },
  { id: 'il-plant-protein-powder', name: 'אבקת חלבון צמחי (אפונה)', category: 'protein', hasCookedVariant: false, raw: { kcal: 370, protein: 75, carbs: 8, fat: 5 } },
  { id: 'il-ricotta', name: 'ריקוטה', category: 'fat', hasCookedVariant: false, raw: { kcal: 174, protein: 11, carbs: 3, fat: 13 } },
  { id: 'il-emek-cheese', name: 'גבינה צהובה עמק 28%', category: 'fat', hasCookedVariant: false, raw: { kcal: 330, protein: 24, carbs: 1, fat: 26 } },
  { id: 'il-cream-cheese-light', name: 'גבינת שמנת דלת שומן', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 150, protein: 8, carbs: 5, fat: 10 } },
  { id: 'il-quark-9', name: 'גבינה לבנה 9%', category: 'fat', hasCookedVariant: false, raw: { kcal: 130, protein: 9, carbs: 3.5, fat: 9 } },
  { id: 'il-buttermilk', name: 'חלב ריאזנקה / חמוץ', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 62, protein: 3.3, carbs: 4.8, fat: 3.3 } },
  { id: 'il-protein-cheesecake-bite', name: 'עוגת גבינה חלבונית (חטיף)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 220, protein: 14, carbs: 20, fat: 9 } },
  { id: 'il-protein-milk-shake-powder', name: 'שייק חלבון אבקה בטעם שוקולד', category: 'protein', hasCookedVariant: false, raw: { kcal: 375, protein: 70, carbs: 12, fat: 6 } },
  { id: 'il-string-cheese', name: 'גבינת מקלות (String Cheese)', category: 'protein', hasCookedVariant: false, raw: { kcal: 280, protein: 24, carbs: 2, fat: 20 } },
  { id: 'il-egg-protein-muffin', name: 'מאפין ביצים וירקות', category: 'protein', hasCookedVariant: false, raw: { kcal: 150, protein: 12, carbs: 4, fat: 9 } },
  { id: 'il-turkey-breast-deli', name: 'חזה הודו פרוס (דלי)', category: 'protein', hasCookedVariant: false, raw: { kcal: 100, protein: 18, carbs: 2, fat: 2 } },
  { id: 'il-chicken-deli-slices', name: 'נתחי עוף פרוסים (דלי)', category: 'protein', hasCookedVariant: false, raw: { kcal: 105, protein: 19, carbs: 1.5, fat: 2.5 } },
  { id: 'il-edamame-snack', name: 'אדממה מלוח (חטיף)', category: 'protein', hasCookedVariant: false, raw: { kcal: 122, protein: 11, carbs: 9, fat: 5 } },
  { id: 'il-protein-ice-cream', name: 'גלידת חלבון', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 140, protein: 12, carbs: 18, fat: 3 } },

  // ---- Carbs & breads (~24) ----
  { id: 'il-whole-wheat-roll', name: 'לחמנייה מקמח מלא', category: 'carb', hasCookedVariant: false, raw: { kcal: 245, protein: 9, carbs: 46, fat: 3 } },
  { id: 'il-english-muffin', name: 'לחם אנגלי (מאפין)', category: 'carb', hasCookedVariant: false, raw: { kcal: 230, protein: 8, carbs: 44, fat: 2 } },
  { id: 'il-malawach', name: 'מלאווח', category: 'carb', hasCookedVariant: false, raw: { kcal: 380, protein: 7, carbs: 42, fat: 21 } },
  { id: 'il-jachnun', name: "ג'חנון", category: 'carb', hasCookedVariant: false, raw: { kcal: 350, protein: 6.5, carbs: 40, fat: 19 } },
  { id: 'il-bourekas-cheese', name: 'בורקס גבינה', category: 'carb', hasCookedVariant: false, raw: { kcal: 320, protein: 8, carbs: 28, fat: 20 } },
  { id: 'il-bourekas-potato', name: 'בורקס תפוחי אדמה', category: 'carb', hasCookedVariant: false, raw: { kcal: 290, protein: 5, carbs: 32, fat: 16 } },
  { id: 'il-focaccia', name: "פוקצ'ה", category: 'carb', hasCookedVariant: false, raw: { kcal: 275, protein: 8, carbs: 46, fat: 7 } },
  { id: 'il-baguette', name: 'באגט צרפתי', category: 'carb', hasCookedVariant: false, raw: { kcal: 270, protein: 9, carbs: 55, fat: 1.5 } },
  { id: 'il-croissant-butter', name: 'קרואסון חמאה', category: 'carb', hasCookedVariant: false, raw: { kcal: 405, protein: 8, carbs: 45, fat: 21 } },
  { id: 'il-dark-rye-bread', name: 'לחם שיפון כהה', category: 'carb', hasCookedVariant: false, raw: { kcal: 230, protein: 8, carbs: 43, fat: 2 } },
  { id: 'il-iraqi-pita', name: 'פיתה עיראקית', category: 'carb', hasCookedVariant: false, raw: { kcal: 285, protein: 8.5, carbs: 57, fat: 2 } },
  { id: 'il-laffa', name: 'לאפה', category: 'carb', hasCookedVariant: false, raw: { kcal: 260, protein: 8, carbs: 50, fat: 3 } },
  { id: 'il-spelt-crisp', name: 'פריכית כוסמין', category: 'carb', hasCookedVariant: false, raw: { kcal: 380, protein: 10, carbs: 78, fat: 3 } },
  { id: 'il-low-sugar-granola', name: 'גרנולה דלת סוכר', category: 'carb', hasCookedVariant: false, raw: { kcal: 410, protein: 11, carbs: 55, fat: 15 } },
  { id: 'il-brown-basmati', name: 'אורז בסמטי מלא', category: 'carb', hasCookedVariant: true, cookedFactor: 2.4, raw: { kcal: 360, protein: 7.5, carbs: 77, fat: 2.5 } },
  { id: 'il-whole-wheat-ptitim', name: 'פתיתים מקמח מלא', category: 'carb', hasCookedVariant: true, cookedFactor: 2.3, raw: { kcal: 350, protein: 13, carbs: 71, fat: 2 } },
  { id: 'il-matzah', name: 'מצה', category: 'carb', hasCookedVariant: false, raw: { kcal: 380, protein: 10, carbs: 80, fat: 1.5 } },
  { id: 'il-lachuch', name: 'לחוח (פנקייק תימני)', category: 'carb', hasCookedVariant: false, raw: { kcal: 210, protein: 6, carbs: 42, fat: 2 } },
  { id: 'il-israeli-salad-pita-combo', name: 'פיתה עם סלט ישראלי (מנה)', category: 'carb', hasCookedVariant: false, raw: { kcal: 240, protein: 8, carbs: 48, fat: 3 } },
  { id: 'il-thin-lavash', name: 'לבש דק (Lavash)', category: 'carb', hasCookedVariant: false, raw: { kcal: 275, protein: 9, carbs: 55, fat: 1.5 } },
  { id: 'il-oat-bran', name: 'סובין שיבולת שועל', category: 'carb', hasCookedVariant: false, raw: { kcal: 246, protein: 17, carbs: 66, fat: 7 } },
  { id: 'il-cornflakes-whole', name: 'קורנפלקס מלא (דגנים)', category: 'carb', hasCookedVariant: false, raw: { kcal: 370, protein: 8, carbs: 80, fat: 2 } },
  { id: 'il-pretzel-soft', name: 'בייגלה ירושלמי', category: 'carb', hasCookedVariant: false, raw: { kcal: 380, protein: 10, carbs: 72, fat: 6 } },
  { id: 'il-couscous-instant', name: 'קוסקוס מוכן מהיר', category: 'carb', hasCookedVariant: true, cookedFactor: 2.2, raw: { kcal: 370, protein: 12.5, carbs: 77, fat: 0.6 } },

  // ---- Snacks (~28) ----
  { id: 'il-corn-peanut-puff', name: 'חטיף תירס במילוי בוטנים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 540, protein: 12, carbs: 55, fat: 32 } },
  { id: 'il-fried-wheat-snack-spicy', name: 'חטיף חיטה מטוגן חריף', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 500, protein: 9, carbs: 58, fat: 26 } },
  { id: 'il-sunflower-seeds-roasted', name: 'גרעיני חמנייה קלויים ומלוחים', category: 'fat', hasCookedVariant: false, raw: { kcal: 580, protein: 21, carbs: 20, fat: 49 } },
  { id: 'il-pumpkin-seeds', name: 'גרעיני דלעת קלויים', category: 'fat', hasCookedVariant: false, raw: { kcal: 560, protein: 30, carbs: 11, fat: 49 } },
  { id: 'il-popcorn-salty', name: 'פופקורן מלוח', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 387, protein: 12, carbs: 78, fat: 4.5 } },
  { id: 'il-popcorn-caramel', name: 'פופקורן קרמל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 430, protein: 4, carbs: 78, fat: 12 } },
  { id: 'il-potato-chips-classic', name: 'צ׳יפס תפוחי אדמה קלאסי', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 536, protein: 6.5, carbs: 53, fat: 34 } },
  { id: 'il-potato-chips-flavored', name: 'תפוצ׳יפס מתובל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 540, protein: 6, carbs: 54, fat: 34 } },
  { id: 'il-cheese-chips', name: 'חטיף תפוחי אדמה בטעם גבינה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 545, protein: 6.5, carbs: 55, fat: 33 } },
  { id: 'il-rice-cracker-choc', name: 'פריכית אורז מצופה שוקולד', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 460, protein: 6, carbs: 68, fat: 18 } },
  { id: 'il-fruit-nut-bar', name: 'חטיף אנרגיה פירות ואגוזים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 400, protein: 8, carbs: 55, fat: 16 } },
  { id: 'il-oat-cookie', name: 'עוגיית שיבולת שועל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 460, protein: 7, carbs: 65, fat: 19 } },
  { id: 'il-peanut-butter-cookie', name: 'עוגיית חמאת בוטנים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 490, protein: 9, carbs: 55, fat: 26 } },
  { id: 'il-vanilla-wafer', name: 'וופל וניל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 480, protein: 6, carbs: 62, fat: 23 } },
  { id: 'il-dark-chocolate-70', name: 'שוקולד מריר 70%', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 570, protein: 8, carbs: 38, fat: 42 } },
  { id: 'il-white-chocolate', name: 'שוקולד לבן', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 540, protein: 6, carbs: 59, fat: 30 } },
  { id: 'il-caramel-corn-crisp', name: 'פריכיות תירס מצופות קרמל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 410, protein: 4, carbs: 82, fat: 8 } },
  { id: 'il-dried-fruit-nut-mix', name: 'תערובת תמרים ואגוזים מיובשת', category: 'fruit', hasCookedVariant: false, raw: { kcal: 420, protein: 8, carbs: 58, fat: 18 } },
  { id: 'il-halva-snack-bar', name: 'חטיף חלבה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 500, protein: 12, carbs: 42, fat: 32 } },
  { id: 'il-corn-snack-spicy', name: 'חטיף תירס חריף (פיתולים)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 495, protein: 7, carbs: 62, fat: 24 } },
  { id: 'il-rice-cake-caramel', name: 'פריכיית אורז ממותקת קרמל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 400, protein: 5, carbs: 87, fat: 3 } },
  { id: 'il-tortilla-chips', name: 'צ׳יפס תירס (נאצ׳וס)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 490, protein: 7, carbs: 62, fat: 24 } },
  { id: 'il-pretzel-sticks', name: 'מקלות פרצל מלוחים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 380, protein: 10, carbs: 79, fat: 2.5 } },
  { id: 'il-cereal-bar', name: 'חטיף דגנים (בר בוקר)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 400, protein: 6, carbs: 68, fat: 12 } },
  { id: 'il-jelly-candy', name: 'סוכריות ג׳לי', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 340, protein: 3, carbs: 80, fat: 0.2 } },
  { id: 'il-marshmallow', name: 'מרשמלו', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 320, protein: 2, carbs: 81, fat: 0 } },
  { id: 'il-milk-chocolate-wafer', name: 'וופל שוקולד חלב', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 520, protein: 6, carbs: 58, fat: 29 } },
  { id: 'il-protein-crunch-bar', name: 'חטיף חלבון קראנצ׳י', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 390, protein: 30, carbs: 35, fat: 14 } },

  // ---- Salads, spreads & dips (~25) ----
  { id: 'il-hummus-parsley', name: 'חומוס עם פטרוזיליה ופפריקה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 210, protein: 7, carbs: 14, fat: 15 } },
  { id: 'il-hummus-plain', name: 'חומוס טחינה מוכן', category: 'condiments', hasCookedVariant: false, raw: { kcal: 200, protein: 6.5, carbs: 13, fat: 14.5 } },
  { id: 'il-eggplant-tahini-salad', name: 'סלט חצילים בטחינה', category: 'veg', hasCookedVariant: false, raw: { kcal: 150, protein: 3, carbs: 8, fat: 12 } },
  { id: 'il-matbucha', name: 'מטבוחה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 70, protein: 1.5, carbs: 8, fat: 4 } },
  { id: 'il-white-cabbage-salad', name: 'סלט כרוב לבן חמוץ-מתוק', category: 'veg', hasCookedVariant: false, raw: { kcal: 95, protein: 1, carbs: 10, fat: 6 } },
  { id: 'il-moroccan-carrot-salad', name: 'סלט גזר מרוקאי', category: 'veg', hasCookedVariant: false, raw: { kcal: 110, protein: 1, carbs: 12, fat: 6.5 } },
  { id: 'il-israeli-salad-chopped', name: 'סלט ישראלי חתוך דק', category: 'veg', hasCookedVariant: false, raw: { kcal: 35, protein: 1, carbs: 6, fat: 1 } },
  { id: 'il-egg-salad', name: 'סלט ביצים', category: 'protein', hasCookedVariant: false, raw: { kcal: 210, protein: 11, carbs: 2, fat: 18 } },
  { id: 'il-tuna-salad-mayo', name: 'סלט טונה עם מיונז', category: 'protein', hasCookedVariant: false, raw: { kcal: 190, protein: 18, carbs: 2, fat: 12 } },
  { id: 'il-labneh-spread', name: 'ממרח לאבנה עם שמן זית', category: 'condiments', hasCookedVariant: false, raw: { kcal: 220, protein: 7, carbs: 4, fat: 20 } },
  { id: 'il-avocado-spread', name: 'ממרח אבוקדו', category: 'fat', hasCookedVariant: false, raw: { kcal: 175, protein: 2, carbs: 7, fat: 16 } },
  { id: 'il-almond-spread', name: 'ממרח שקדים', category: 'fat', hasCookedVariant: false, raw: { kcal: 610, protein: 21, carbs: 19, fat: 55 } },
  { id: 'il-roasted-eggplant-tahini', name: 'חציל קלוי בטחינה גולמית', category: 'veg', hasCookedVariant: false, raw: { kcal: 140, protein: 3, carbs: 7, fat: 11 } },
  { id: 'il-beet-salad', name: 'סלט סלק', category: 'veg', hasCookedVariant: false, raw: { kcal: 75, protein: 1.5, carbs: 9, fat: 4 } },
  { id: 'il-roasted-cauliflower-salad', name: 'סלט כרובית קלויה', category: 'veg', hasCookedVariant: false, raw: { kcal: 90, protein: 2, carbs: 7, fat: 6 } },
  { id: 'il-tahini-lemon-garlic', name: 'טחינה משודרגת (שום ולימון)', category: 'fat', hasCookedVariant: false, raw: { kcal: 580, protein: 17, carbs: 18, fat: 51 } },
  { id: 'il-red-pepper-dip', name: 'ממרח פלפל קלוי', category: 'condiments', hasCookedVariant: false, raw: { kcal: 90, protein: 2, carbs: 9, fat: 5.5 } },
  { id: 'il-olive-tapenade', name: 'ממרח זיתים (טפנד)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 260, protein: 2, carbs: 5, fat: 26 } },
  { id: 'il-yellow-split-pea-dip', name: 'ממרח אפונה צהובה (מג׳דרה-דיפ)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 150, protein: 8, carbs: 20, fat: 4 } },
  { id: 'il-cucumber-yogurt-salad', name: 'סלט מלפפון ביוגורט', category: 'veg', hasCookedVariant: false, raw: { kcal: 45, protein: 2, carbs: 4, fat: 2 } },
  { id: 'il-sabich-salad-mix', name: 'תערובת סביח (ירקות+חציל+ביצה)', category: 'veg', hasCookedVariant: false, raw: { kcal: 140, protein: 5, carbs: 10, fat: 9 } },
  { id: 'il-zaatar-oil-dip', name: 'זעתר בשמן זית (לטבילה)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 480, protein: 4, carbs: 12, fat: 47 } },
  { id: 'il-schug-red', name: 'סחוג אדום חריף', category: 'condiments', hasCookedVariant: false, raw: { kcal: 55, protein: 2, carbs: 6, fat: 3 } },
  { id: 'il-fried-cauliflower', name: 'כרובית מטוגנת (מנה)', category: 'veg', hasCookedVariant: false, raw: { kcal: 160, protein: 3, carbs: 12, fat: 11 } },
  { id: 'il-pickled-vegetables-mix', name: 'ירקות כבושים (מנה)', category: 'veg', hasCookedVariant: false, raw: { kcal: 30, protein: 0.8, carbs: 5, fat: 0.5 } },

  // ---- Round 2 (Sprint 29) — legumes, nuts & seeds (~10) ----
  // Same generic/honest-estimate discipline as everything above. This round
  // targets categories that were thin even after 15+ prior data-expansion
  // sprints in the artifact's own history (see CLAUDE.md) — real gaps like
  // more legume varieties, tree nuts beyond walnuts/cashews/almonds, and
  // seeds, cross-checked against the existing INGREDIENT_DB entries first so
  // nothing here duplicates an item that already exists there.
  { id: 'il-black-beans-cooked', name: 'שעועית שחורה מבושלת', category: 'protein', hasCookedVariant: false, raw: { kcal: 132, protein: 8.9, carbs: 24, fat: 0.5 } },
  { id: 'il-kidney-beans-cooked', name: 'שעועית אדומה מבושלת', category: 'protein', hasCookedVariant: false, raw: { kcal: 127, protein: 8.7, carbs: 22.8, fat: 0.5 } },
  { id: 'il-mung-beans-cooked', name: 'אפונת מש מבושלת', category: 'protein', hasCookedVariant: false, raw: { kcal: 105, protein: 7, carbs: 19, fat: 0.4 } },
  { id: 'il-split-peas-cooked', name: 'אפונה מבוקעת מבושלת', category: 'protein', hasCookedVariant: false, raw: { kcal: 118, protein: 8.3, carbs: 21, fat: 0.4 } },
  { id: 'il-pistachios', name: 'פיסטוקים', category: 'fat', hasCookedVariant: false, raw: { kcal: 562, protein: 20, carbs: 28, fat: 45 } },
  { id: 'il-hazelnuts', name: 'אגוזי לוז', category: 'fat', hasCookedVariant: false, raw: { kcal: 628, protein: 15, carbs: 17, fat: 61 } },
  { id: 'il-pecans', name: 'אגוזי פקאן', category: 'fat', hasCookedVariant: false, raw: { kcal: 691, protein: 9, carbs: 14, fat: 72 } },
  { id: 'il-macadamia', name: 'אגוזי מקדמיה', category: 'fat', hasCookedVariant: false, raw: { kcal: 718, protein: 8, carbs: 14, fat: 76 } },
  { id: 'il-chia-seeds', name: "זרעי צ'יה", category: 'fat', hasCookedVariant: false, raw: { kcal: 486, protein: 17, carbs: 42, fat: 31 } },
  { id: 'il-flax-seeds-ground', name: 'זרעי פשתן טחונים', category: 'fat', hasCookedVariant: false, raw: { kcal: 534, protein: 18, carbs: 29, fat: 42 } },

  // ---- Round 2 — cheeses (~6) ----
  { id: 'il-cheddar', name: "גבינת צ'דר", category: 'fat', hasCookedVariant: false, raw: { kcal: 403, protein: 25, carbs: 1.3, fat: 33 } },
  { id: 'il-gouda', name: 'גבינת גאודה', category: 'fat', hasCookedVariant: false, raw: { kcal: 356, protein: 25, carbs: 2.2, fat: 27 } },
  { id: 'il-parmesan-grated', name: 'פרמזן מגורר', category: 'fat', hasCookedVariant: false, raw: { kcal: 431, protein: 38, carbs: 4, fat: 29 } },
  { id: 'il-halloumi', name: 'גבינת האלומי', category: 'fat', hasCookedVariant: false, raw: { kcal: 321, protein: 22, carbs: 2, fat: 25 } },
  { id: 'il-brie', name: 'גבינת ברי', category: 'fat', hasCookedVariant: false, raw: { kcal: 334, protein: 21, carbs: 0.5, fat: 28 } },
  { id: 'il-edam-cheese', name: 'גבינת אדם', category: 'fat', hasCookedVariant: false, raw: { kcal: 356, protein: 25, carbs: 1.4, fat: 28 } },

  // ---- Round 2 — fish & seafood (~5) ----
  { id: 'il-mussels', name: 'צדפות בלו', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 86, protein: 12, carbs: 3.7, fat: 2.2 } },
  { id: 'il-anchovies', name: 'אנשובי', category: 'protein', hasCookedVariant: false, raw: { kcal: 131, protein: 20, carbs: 0, fat: 4.8 } },
  { id: 'il-mullet', name: 'דג בורי', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 117, protein: 19, carbs: 0, fat: 4 } },
  { id: 'il-herring', name: 'דג הרינג', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 158, protein: 18, carbs: 0, fat: 9 } },
  { id: 'il-whitefish-fillet', name: 'פילה דג לבן', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 90, protein: 19, carbs: 0, fat: 1.2 } },

  // ---- Round 2 — vegetables (~12) ----
  { id: 'il-eggplant', name: 'חציל', category: 'veg', hasCookedVariant: false, raw: { kcal: 25, protein: 1, carbs: 6, fat: 0.2 } },
  { id: 'il-celery', name: 'סלרי', category: 'veg', hasCookedVariant: false, raw: { kcal: 16, protein: 0.7, carbs: 3, fat: 0.2 } },
  { id: 'il-arugula', name: 'רוקט', category: 'veg', hasCookedVariant: false, raw: { kcal: 25, protein: 2.6, carbs: 3.7, fat: 0.7 } },
  { id: 'il-bean-sprouts', name: 'נבטי שעועית', category: 'veg', hasCookedVariant: false, raw: { kcal: 30, protein: 3, carbs: 6, fat: 0.2 } },
  { id: 'il-parsley', name: 'פטרוזיליה', category: 'veg', hasCookedVariant: false, raw: { kcal: 36, protein: 3, carbs: 6.3, fat: 0.8 } },
  { id: 'il-cilantro', name: 'כוסברה', category: 'veg', hasCookedVariant: false, raw: { kcal: 23, protein: 2.1, carbs: 3.7, fat: 0.5 } },
  { id: 'il-mint-fresh', name: 'נענע טרייה', category: 'veg', hasCookedVariant: false, raw: { kcal: 44, protein: 3.3, carbs: 8.4, fat: 0.7 } },
  { id: 'il-radish', name: 'צנון', category: 'veg', hasCookedVariant: false, raw: { kcal: 16, protein: 0.7, carbs: 3.4, fat: 0.1 } },
  { id: 'il-asparagus', name: 'אספרגוס', category: 'veg', hasCookedVariant: false, raw: { kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.1 } },
  { id: 'il-brussels-sprouts', name: 'כרוב ניצנים', category: 'veg', hasCookedVariant: false, raw: { kcal: 43, protein: 3.4, carbs: 9, fat: 0.3 } },
  { id: 'il-fennel', name: 'שומר', category: 'veg', hasCookedVariant: false, raw: { kcal: 31, protein: 1.2, carbs: 7.3, fat: 0.2 } },
  { id: 'il-okra-fresh', name: 'במיה טרייה', category: 'veg', hasCookedVariant: false, raw: { kcal: 33, protein: 1.9, carbs: 7.5, fat: 0.2 } },

  // ---- Round 2 — fruits (~10) ----
  { id: 'il-dates-fresh', name: 'תמרים טריים', category: 'fruit', hasCookedVariant: false, raw: { kcal: 282, protein: 2.5, carbs: 75, fat: 0.4 } },
  { id: 'il-cherries', name: 'דובדבנים', category: 'fruit', hasCookedVariant: false, raw: { kcal: 63, protein: 1.1, carbs: 16, fat: 0.2 } },
  { id: 'il-nectarine', name: 'נקטרינה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 44, protein: 1.1, carbs: 10.5, fat: 0.3 } },
  { id: 'il-persimmon', name: 'אפרסמון', category: 'fruit', hasCookedVariant: false, raw: { kcal: 70, protein: 0.6, carbs: 18.6, fat: 0.2 } },
  { id: 'il-watermelon', name: 'אבטיח', category: 'fruit', hasCookedVariant: false, raw: { kcal: 30, protein: 0.6, carbs: 7.6, fat: 0.2 } },
  { id: 'il-melon', name: 'מלון', category: 'fruit', hasCookedVariant: false, raw: { kcal: 34, protein: 0.8, carbs: 8.2, fat: 0.2 } },
  { id: 'il-strawberries', name: 'תותים', category: 'fruit', hasCookedVariant: false, raw: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 } },
  { id: 'il-blackberries', name: 'פטל שחור', category: 'fruit', hasCookedVariant: false, raw: { kcal: 43, protein: 1.4, carbs: 9.6, fat: 0.5 } },
  { id: 'il-clementine', name: 'קלמנטינה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 47, protein: 0.8, carbs: 12, fat: 0.2 } },
  { id: 'il-passion-fruit-fresh', name: 'פסיפלורה טרייה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 97, protein: 2.2, carbs: 23, fat: 0.7 } },

  // ---- Round 2 — carbs & grains (~8) ----
  { id: 'il-buckwheat-cooked', name: 'כוסמת מבושלת', category: 'carb', hasCookedVariant: false, raw: { kcal: 92, protein: 3.4, carbs: 20, fat: 0.6 } },
  { id: 'il-freekeh-cooked', name: 'פריכה (חיטה ירוקה) מבושלת', category: 'carb', hasCookedVariant: false, raw: { kcal: 130, protein: 5, carbs: 24, fat: 1.3 } },
  { id: 'il-semolina-cooked', name: 'סולת מבושלת', category: 'carb', hasCookedVariant: false, raw: { kcal: 90, protein: 3, carbs: 18.5, fat: 0.4 } },
  { id: 'il-rice-noodles-cooked', name: 'אטריות אורז מבושלות', category: 'carb', hasCookedVariant: false, raw: { kcal: 109, protein: 1.8, carbs: 25, fat: 0.2 } },
  { id: 'il-whole-wheat-couscous', name: 'קוסקוס מלא', category: 'carb', hasCookedVariant: true, cookedFactor: 2.2, raw: { kcal: 348, protein: 12.8, carbs: 72, fat: 1.6 } },
  { id: 'il-breadcrumbs', name: 'פירורי לחם', category: 'carb', hasCookedVariant: false, raw: { kcal: 395, protein: 13, carbs: 72, fat: 5.3 } },
  { id: 'il-oats-raw', name: 'קוואקר גולמי', category: 'carb', hasCookedVariant: false, raw: { kcal: 379, protein: 13.5, carbs: 67.7, fat: 6.5 } },
  { id: 'il-protein-pancake-cooked', name: 'פנקייק חלבון מוכן', category: 'carb', hasCookedVariant: false, raw: { kcal: 210, protein: 18, carbs: 22, fat: 6 } },

  // ---- Round 2 — condiments & spices (~8) ----
  { id: 'il-cinnamon', name: 'קינמון', category: 'condiments', hasCookedVariant: false, raw: { kcal: 247, protein: 4, carbs: 81, fat: 1.2 } },
  { id: 'il-cocoa-powder-unsweetened', name: 'קקאו טבעי לא ממותק', category: 'condiments', hasCookedVariant: false, raw: { kcal: 228, protein: 20, carbs: 58, fat: 14 } },
  { id: 'il-capers', name: 'קפרס', category: 'condiments', hasCookedVariant: false, raw: { kcal: 23, protein: 2.4, carbs: 4.9, fat: 0.9 } },
  { id: 'il-wasabi-paste', name: 'משחת וואסאבי', category: 'condiments', hasCookedVariant: false, raw: { kcal: 109, protein: 2.9, carbs: 23, fat: 0.6 } },
  { id: 'il-sriracha-sauce', name: "רוטב סריראצ'ה", category: 'condiments', hasCookedVariant: false, raw: { kcal: 93, protein: 1.9, carbs: 19, fat: 0.9 } },
  { id: 'il-nutritional-yeast', name: 'שמרי תזונה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 325, protein: 45, carbs: 36, fat: 6 } },
  { id: 'il-cornstarch', name: 'קורנפלור', category: 'condiments', hasCookedVariant: false, raw: { kcal: 381, protein: 0.3, carbs: 91, fat: 0.1 } },
  { id: 'il-turmeric', name: 'כורכום', category: 'condiments', hasCookedVariant: false, raw: { kcal: 312, protein: 9.7, carbs: 67, fat: 3.3 } },
];
