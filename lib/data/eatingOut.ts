// The Eating-Out menu — 73 items, 11 categories. ProjectShred.artifact.jsx:263-375
// (Sprint 15.4, expanded 15.5). Deliberately broad rather than precise per
// specific chain (a "pizza slice" varies by pizzeria); values are reasonable
// representative estimates, the same spirit as the ingredient database.
// Transcribed verbatim from the artifact.

export type EatingOutCategory =
  | 'pizza' | 'burger' | 'shawarma_falafel' | 'asian' | 'sandwich_bakery' | 'drinks'
  | 'dessert_sweet' | 'grill_steakhouse' | 'italian' | 'breakfast_out' | 'salad_health';

export const EATING_OUT_CATEGORIES: { id: EatingOutCategory; label: string }[] = [
  { id: 'pizza', label: 'פיצה' },
  { id: 'burger', label: 'המבורגר' },
  { id: 'shawarma_falafel', label: 'שווארמה/פלאפל' },
  { id: 'asian', label: 'אסייתי' },
  { id: 'sandwich_bakery', label: 'כריכים/מאפייה' },
  { id: 'drinks', label: 'שתייה' },
  { id: 'dessert_sweet', label: 'מתוק' },
  { id: 'grill_steakhouse', label: 'גריל/בשרים' },
  { id: 'italian', label: 'איטלקי' },
  { id: 'breakfast_out', label: 'בוקר בבית קפה' },
  { id: 'salad_health', label: 'סלטים/בריאות' },
];

export interface EatingOutItem {
  id: string;
  name: string;
  category: EatingOutCategory;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const EATING_OUT_MENU: EatingOutItem[] = [
  // ---- פיצה ----
  { id: 'pizza-slice', name: 'משולש פיצה (רגילה)', category: 'pizza', kcal: 285, protein: 12, fat: 10, carbs: 36 },
  { id: 'pizza-slice-topping', name: 'משולש פיצה עם תוספת בשר', category: 'pizza', kcal: 320, protein: 14, fat: 13, carbs: 36 },
  { id: 'pizza-personal', name: 'פיצה אישית שלמה (26 ס"מ)', category: 'pizza', kcal: 780, protein: 32, fat: 28, carbs: 95 },
  { id: 'pizza-roman', name: 'פרוסת פיצה רומאית (דקה)', category: 'pizza', kcal: 220, protein: 9, fat: 8, carbs: 28 },
  { id: 'pizza-family-slice', name: 'מגש פיצה משפחתי — פרוסה (1/8)', category: 'pizza', kcal: 260, protein: 11, fat: 9, carbs: 33 },
  { id: 'calzone', name: 'קלצונה (פיצה ממולאת)', category: 'pizza', kcal: 450, protein: 18, fat: 20, carbs: 48 },

  // ---- המבורגר ----
  { id: 'burger-classic', name: 'המבורגר קלאסי', category: 'burger', kcal: 450, protein: 25, fat: 24, carbs: 32 },
  { id: 'burger-cheese', name: 'המבורגר עם גבינה', category: 'burger', kcal: 520, protein: 28, fat: 30, carbs: 33 },
  { id: 'burger-double-cheese', name: "דאבל צ'יזבורגר", category: 'burger', kcal: 720, protein: 40, fat: 42, carbs: 36 },
  { id: 'burger-meal', name: 'ארוחת המבורגר + צ׳יפס + שתייה רגילה', category: 'burger', kcal: 1050, protein: 35, fat: 45, carbs: 120 },
  { id: 'burger-meal-zero', name: 'ארוחת המבורגר + צ׳יפס + שתייה זירו', category: 'burger', kcal: 915, protein: 35, fat: 45, carbs: 85 },
  { id: 'burger-vegan', name: 'המבורגר טבעוני', category: 'burger', kcal: 380, protein: 16, fat: 16, carbs: 42 },
  { id: 'fries-side', name: "צ'יפס (מנה בינונית)", category: 'burger', kcal: 365, protein: 4, fat: 17, carbs: 48 },
  { id: 'chicken-nuggets', name: "נגטס עוף (6 יח')", category: 'burger', kcal: 300, protein: 16, fat: 18, carbs: 18 },

  // ---- שווארמה/פלאפל ----
  { id: 'shawarma-laffa', name: 'שווארמה בלאפה מלאה', category: 'shawarma_falafel', kcal: 650, protein: 32, fat: 30, carbs: 58 },
  { id: 'shawarma-pita-half', name: 'שווארמה בחצי פיתה', category: 'shawarma_falafel', kcal: 480, protein: 24, fat: 22, carbs: 42 },
  { id: 'shawarma-plate', name: 'מנת שווארמה על צלחת (ללא לחם)', category: 'shawarma_falafel', kcal: 420, protein: 38, fat: 26, carbs: 6 },
  // Meat-type variants — a direct gap report: the built-in shawarma entries
  // above are all an implicit "default" (chicken) with no way to say the
  // stand serves turkey, veal, or lamb instead, which are all common
  // choices at a real Israeli shawarma stand.
  { id: 'shawarma-turkey-laffa', name: 'שווארמה הודו בלאפה מלאה', category: 'shawarma_falafel', kcal: 600, protein: 34, fat: 24, carbs: 58 },
  { id: 'shawarma-turkey-plate', name: 'מנת שווארמה הודו על צלחת (ללא לחם)', category: 'shawarma_falafel', kcal: 380, protein: 40, fat: 20, carbs: 6 },
  { id: 'shawarma-veal-laffa', name: 'שווארמה עגל בלאפה מלאה', category: 'shawarma_falafel', kcal: 720, protein: 34, fat: 38, carbs: 58 },
  { id: 'shawarma-veal-plate', name: 'מנת שווארמה עגל על צלחת (ללא לחם)', category: 'shawarma_falafel', kcal: 480, protein: 40, fat: 32, carbs: 6 },
  { id: 'shawarma-lamb-laffa', name: 'שווארמה כבש בלאפה מלאה', category: 'shawarma_falafel', kcal: 760, protein: 30, fat: 44, carbs: 58 },
  { id: 'shawarma-lamb-plate', name: 'מנת שווארמה כבש על צלחת (ללא לחם)', category: 'shawarma_falafel', kcal: 520, protein: 36, fat: 38, carbs: 6 },
  { id: 'falafel-pita', name: 'פלאפל בפיתה (5 כדורים)', category: 'shawarma_falafel', kcal: 500, protein: 16, fat: 22, carbs: 58 },
  { id: 'falafel-plate', name: 'מנת פלאפל על צלחת (10 כדורים + חומוס)', category: 'shawarma_falafel', kcal: 620, protein: 20, fat: 30, carbs: 65 },
  { id: 'sabich', name: 'סביח מלא', category: 'shawarma_falafel', kcal: 550, protein: 14, fat: 26, carbs: 62 },

  // ---- אסייתי ----
  { id: 'sushi-california', name: "סושי - רול קליפורניה (8 יח')", category: 'asian', kcal: 260, protein: 8, fat: 6, carbs: 42 },
  { id: 'sushi-salmon-avocado', name: "סושי - רול סלמון ואבוקדו (8 יח')", category: 'asian', kcal: 300, protein: 12, fat: 10, carbs: 38 },
  { id: 'chinese-fried-rice-chicken', name: "אורז מוקפץ עם עוף (צ'יינפוד)", category: 'asian', kcal: 520, protein: 28, fat: 14, carbs: 68 },
  { id: 'noodles-chicken-teriyaki', name: 'נודלס עם עוף ברוטב טריאקי', category: 'asian', kcal: 560, protein: 30, fat: 16, carbs: 70 },
  { id: 'sweet-sour-chicken-rice', name: 'עוף מתוק חמוץ עם אורז', category: 'asian', kcal: 650, protein: 26, fat: 20, carbs: 85 },
  { id: 'pad-thai-chicken', name: 'פאד תאי עם עוף', category: 'asian', kcal: 600, protein: 28, fat: 18, carbs: 75 },
  { id: 'poke-bowl-tuna', name: 'פוקה בול טונה (קנוי)', category: 'asian', kcal: 480, protein: 32, fat: 14, carbs: 55 },

  // ---- כריכים/מאפייה ----
  { id: 'tuna-sandwich-out', name: 'כריך טונה בלחם קל', category: 'sandwich_bakery', kcal: 380, protein: 26, fat: 14, carbs: 36 },
  { id: 'cheese-olive-sandwich-out', name: 'כריך גבינה צהובה וזיתים', category: 'sandwich_bakery', kcal: 400, protein: 16, fat: 20, carbs: 38 },
  { id: 'bourekas-potato-out', name: 'בורקס תפוחי אדמה (קנוי)', category: 'sandwich_bakery', kcal: 320, protein: 6, fat: 20, carbs: 28 },
  { id: 'bourekas-cheese-out', name: 'בורקס גבינה (קנוי)', category: 'sandwich_bakery', kcal: 350, protein: 10, fat: 22, carbs: 28 },
  { id: 'croissant-butter', name: 'קרואסון חמאה', category: 'sandwich_bakery', kcal: 270, protein: 5, fat: 16, carbs: 27 },
  { id: 'bagel-cream-cheese-salmon', name: 'בייגל עם קרם צ׳יז וסלמון מעושן', category: 'sandwich_bakery', kcal: 420, protein: 22, fat: 18, carbs: 42 },
  { id: 'cafe-toast', name: 'טוסט גבינה ופסטרמה (בית קפה)', category: 'sandwich_bakery', kcal: 450, protein: 24, fat: 22, carbs: 38 },

  // ---- שתייה (זירו ולא זירו) ----
  { id: 'coke-regular', name: 'קוקה קולה רגילה (330 מ"ל)', category: 'drinks', kcal: 139, protein: 0, fat: 0, carbs: 35 },
  { id: 'coke-zero', name: 'קוקה קולה זירו (330 מ"ל)', category: 'drinks', kcal: 1, protein: 0, fat: 0, carbs: 0.3 },
  { id: 'sprite-regular', name: 'ספרייט רגיל (330 מ"ל)', category: 'drinks', kcal: 140, protein: 0, fat: 0, carbs: 36 },
  { id: 'sprite-zero', name: 'ספרייט זירו (330 מ"ל)', category: 'drinks', kcal: 3, protein: 0, fat: 0, carbs: 0 },
  { id: 'fanta-orange', name: 'פאנטה תפוזים (330 מ"ל)', category: 'drinks', kcal: 150, protein: 0, fat: 0, carbs: 38 },
  { id: 'orange-juice-natural', name: 'מיץ תפוזים טבעי (250 מ"ל)', category: 'drinks', kcal: 110, protein: 1.7, fat: 0.3, carbs: 26 },
  { id: 'beer-330', name: 'בירה (330 מ"ל)', category: 'drinks', kcal: 145, protein: 1.3, fat: 0, carbs: 11 },
  { id: 'cafe-hafuch-large', name: 'קפה הפוך גדול (חלב 3%)', category: 'drinks', kcal: 130, protein: 6, fat: 6, carbs: 10 },

  // ---- מתוק ----
  { id: 'ice-cream-cone', name: 'גלידה בקונוס (כדור אחד)', category: 'dessert_sweet', kcal: 210, protein: 3, fat: 10, carbs: 28 },
  { id: 'milkshake-chocolate', name: 'מילקשייק שוקולד (300 מ"ל)', category: 'dessert_sweet', kcal: 400, protein: 8, fat: 14, carbs: 60 },
  { id: 'belgian-waffle-nutella', name: 'וופל בלגי עם נוטלה', category: 'dessert_sweet', kcal: 550, protein: 8, fat: 26, carbs: 70 },
  { id: 'crunch-bar-out', name: "קראנצ' בר", category: 'dessert_sweet', kcal: 240, protein: 3, fat: 13, carbs: 28 },
  { id: 'chocolate-cake-slice', name: 'עוגת שוקולד פרוסה (בית קפה)', category: 'dessert_sweet', kcal: 420, protein: 6, fat: 24, carbs: 46 },
  { id: 'pancake-syrup', name: 'ערימת פנקייק עם סירופ (בית קפה)', category: 'dessert_sweet', kcal: 480, protein: 9, fat: 16, carbs: 74 },
  { id: 'nutella-banana-crepe', name: 'קראפ נוטלה ובננה', category: 'dessert_sweet', kcal: 460, protein: 8, fat: 20, carbs: 62 },

  // ---- גריל/בשרים ----
  { id: 'entrecote-200', name: 'אנטריקוט (200 גרם, מסעדה)', category: 'grill_steakhouse', kcal: 520, protein: 44, fat: 38, carbs: 0 },
  { id: 'beef-fillet-200', name: 'פילה בקר (200 גרם, מסעדה)', category: 'grill_steakhouse', kcal: 420, protein: 46, fat: 26, carbs: 0 },
  { id: 'fried-chicken-liver', name: 'כבד עוף מטוגן (מנה)', category: 'grill_steakhouse', kcal: 380, protein: 32, fat: 24, carbs: 6 },
  { id: 'mixed-grill-jerusalem', name: 'מעורב ירושלמי (מנה)', category: 'grill_steakhouse', kcal: 480, protein: 34, fat: 34, carbs: 6 },
  { id: 'kebab-restaurant', name: 'קבב על האש (מנה, מסעדה)', category: 'grill_steakhouse', kcal: 460, protein: 28, fat: 34, carbs: 4 },
  { id: 'grilled-chicken-restaurant', name: 'חזה עוף על האש (מנה, מסעדה)', category: 'grill_steakhouse', kcal: 380, protein: 46, fat: 18, carbs: 2 },
  { id: 'lamb-chops-restaurant', name: 'צלעות טלה (מנה, מסעדה)', category: 'grill_steakhouse', kcal: 560, protein: 38, fat: 42, carbs: 0 },

  // ---- איטלקי ----
  { id: 'pasta-rosa-restaurant', name: 'פסטה ברוטב רוזה (מסעדה)', category: 'italian', kcal: 680, protein: 20, fat: 28, carbs: 85 },
  { id: 'pasta-arrabiata', name: 'פסטה ארביאטה', category: 'italian', kcal: 560, protein: 16, fat: 14, carbs: 90 },
  { id: 'lasagna-slice', name: 'לזניה (מנה)', category: 'italian', kcal: 620, protein: 32, fat: 30, carbs: 55 },
  { id: 'risotto-mushroom', name: 'ריזוטו פטריות', category: 'italian', kcal: 540, protein: 12, fat: 18, carbs: 78 },
  { id: 'focaccia-slice', name: 'פוקאצ׳ה (פרוסה)', category: 'italian', kcal: 280, protein: 6, fat: 10, carbs: 42 },
  { id: 'tiramisu', name: 'טירמיסו (מנה)', category: 'italian', kcal: 450, protein: 6, fat: 28, carbs: 42 },

  // ---- בוקר בבית קפה ----
  { id: 'israeli-breakfast-full', name: 'ארוחת בוקר ישראלית מלאה (בית קפה)', category: 'breakfast_out', kcal: 720, protein: 28, fat: 42, carbs: 55 },
  { id: 'shakshuka-restaurant', name: 'שקשוקה (מסעדה/בית קפה)', category: 'breakfast_out', kcal: 420, protein: 20, fat: 26, carbs: 22 },
  { id: 'cheese-blintz', name: 'בלינצ׳ס גבינה (2 יח׳)', category: 'breakfast_out', kcal: 380, protein: 14, fat: 18, carbs: 42 },
  { id: 'almond-croissant', name: 'קרואסון שקדים', category: 'breakfast_out', kcal: 420, protein: 9, fat: 26, carbs: 38 },
  { id: 'granola-bowl-cafe', name: 'קערת גרנולה (בית קפה)', category: 'breakfast_out', kcal: 480, protein: 14, fat: 18, carbs: 65 },
  { id: 'spanish-omelette-cafe', name: 'אומלט חמוצים (בית קפה)', category: 'breakfast_out', kcal: 380, protein: 22, fat: 28, carbs: 8 },

  // ---- סלטים/בריאות ----
  { id: 'caesar-salad-chicken', name: 'סלט קיסר עם עוף', category: 'salad_health', kcal: 480, protein: 34, fat: 30, carbs: 20 },
  { id: 'greek-salad-restaurant', name: 'סלט יווני (מסעדה)', category: 'salad_health', kcal: 320, protein: 8, fat: 26, carbs: 14 },
  { id: 'protein-bowl-bought', name: 'בול חלבון קנוי (עוף/קינואה/ירקות)', category: 'salad_health', kcal: 450, protein: 35, fat: 14, carbs: 42 },
  { id: 'tuna-salad-bought', name: 'סלט טונה מוכן (חנות בריאות)', category: 'salad_health', kcal: 380, protein: 28, fat: 20, carbs: 18 },
  { id: 'veg-hummus-side', name: 'מנת ירקות + חומוס לתוספת', category: 'salad_health', kcal: 220, protein: 8, fat: 12, carbs: 20 },
];
