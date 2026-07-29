// Home Kitchen Hacks — 64 recipes. ProjectShred.artifact.jsx:131-218 (Sprints 3,
// 11, 15.4, 15.5). Transcribed verbatim from the artifact.

export type HackCategory = 'breakfast' | 'main' | 'snack' | 'dessert';

export const HACK_CATEGORIES: { id: HackCategory; label: string }[] = [
  { id: 'breakfast', label: 'בוקר' },
  { id: 'main', label: 'ארוחה עיקרית' },
  { id: 'snack', label: 'חטיף' },
  { id: 'dessert', label: 'מתוק/קינוח' },
];

export interface Hack {
  id: string;
  name: string;
  detail: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  icon: string;
  category: HackCategory;
}

export const HACKS: Hack[] = [
  // ---- בוקר ----
  { id: 'shakshuka', name: 'שקשוקה', detail: '2 ביצים ברוטב עגבניות ופלפלים', kcal: 320, protein: 18, fat: 20, carbs: 15, icon: '🍳', category: 'breakfast' },
  { id: 'protein-omelette', name: 'חביתת חלבון עם ירקות', detail: '3 ביצים/חלבונים, פלפל, בצל, עגבנייה', kcal: 280, protein: 26, fat: 16, carbs: 6, icon: '🍳', category: 'breakfast' },
  { id: 'avocado-toast', name: 'טוסט אבוקדו וביצה', detail: 'לחם מלא, אבוקדו, ביצת עין', kcal: 380, protein: 16, fat: 22, carbs: 30, icon: '🥑', category: 'breakfast' },
  { id: 'oats-protein', name: 'שיבולת שועל פרוטאין עם בננה', detail: 'שיבולת שועל, אבקת חלבון, בננה, חלב', kcal: 400, protein: 28, fat: 8, carbs: 55, icon: '🥣', category: 'breakfast' },
  { id: 'protein-pancakes', name: 'פנקייק חלבון', detail: 'בננה, ביצה, שיבולת שועל טחונה', kcal: 350, protein: 22, fat: 10, carbs: 42, icon: '🥞', category: 'breakfast' },
  { id: 'yogurt-granola', name: 'יוגורט יווני עם גרנולה ודבש', detail: 'יוגורט יווני 5%, גרנולה, כפית דבש', kcal: 320, protein: 20, fat: 10, carbs: 38, icon: '🥣', category: 'breakfast' },
  { id: 'smoothie-bowl', name: 'סמוטי בול חלבון', detail: 'בננה קפואה, אבקת חלבון, פירות יער', kcal: 340, protein: 25, fat: 8, carbs: 45, icon: '🍓', category: 'breakfast' },
  { id: 'cheese-olive-toast', name: 'טוסט גבינה וזיתים', detail: 'לחם קל, גבינה צהובה, זיתים', kcal: 300, protein: 15, fat: 16, carbs: 25, icon: '🧀', category: 'breakfast' },
  { id: 'bulgarian-omelette', name: 'חביתה עם גבינה בולגרית ותרד', detail: '3 ביצים, גבינה בולגרית, תרד מוקפץ', kcal: 310, protein: 22, fat: 22, carbs: 4, icon: '🍳', category: 'breakfast' },
  { id: 'hummus-sandwich', name: 'לחמניה מלאה עם חומוס וירקות', detail: 'לחמניה מלאה, חומוס, מלפפון, עגבנייה', kcal: 340, protein: 12, fat: 10, carbs: 50, icon: '🥙', category: 'breakfast' },
  { id: 'quaker-raisins', name: 'קוואקר עם חלב וצימוקים', detail: 'שיבולת שועל, חלב 3%, צימוקים', kcal: 360, protein: 14, fat: 7, carbs: 60, icon: '🥣', category: 'breakfast' },
  { id: 'bourekas-egg', name: "בורקס תפוחי אדמה עם ביצה קשה", detail: 'בורקס ביתי + ביצה קשה — בוקר ישראלי קלאסי', kcal: 420, protein: 14, fat: 26, carbs: 34, icon: '🥐', category: 'breakfast' },

  // ---- ארוחה עיקרית ----
  { id: 'pasta-bolognese-home', name: 'פסטה ברוטב עגבניות ובקר טחון', detail: 'פסטה מלאה, בקר טחון 5%, רוטב עגבניות', kcal: 620, protein: 35, fat: 18, carbs: 75, icon: '🍝', category: 'main' },
  { id: 'rice-chicken-stew', name: 'אורז עם עוף ותבשיל ירקות', detail: 'חזה עוף, אורז בסמטי, תבשיל ירקות', kcal: 550, protein: 42, fat: 12, carbs: 60, icon: '🍗', category: 'main' },
  { id: 'meatballs-mash', name: 'קציצות בקר עם פירה', detail: 'קציצות בקר טחון, פירה תפוח אדמה', kcal: 580, protein: 38, fat: 28, carbs: 40, icon: '🍖', category: 'main' },
  { id: 'tuna-quinoa-salad', name: 'סלט טונה גדול עם קינואה', detail: 'טונה, קינואה מבושלת, ירקות טריים', kcal: 450, protein: 35, fat: 18, carbs: 35, icon: '🥗', category: 'main' },
  { id: 'chicken-sweet-potato', name: 'עוף בגריל עם בטטה אפויה', detail: 'חזה עוף גריל, בטטה אפויה, סלט ירוק', kcal: 500, protein: 45, fat: 12, carbs: 48, icon: '🍗', category: 'main' },
  { id: 'salmon-broccoli-rice', name: 'סטייק סלמון עם ברוקולי ואורז', detail: 'סלמון בתנור, ברוקולי מאודה, אורז מלא', kcal: 560, protein: 40, fat: 26, carbs: 35, icon: '🐟', category: 'main' },
  { id: 'ptitim-chicken-veg', name: 'פתיתים עם עוף וירקות', detail: 'פתיתים, חזה עוף, ירקות מוקפצים', kcal: 540, protein: 38, fat: 14, carbs: 60, icon: '🍲', category: 'main' },
  { id: 'shakshuka-sausage', name: 'שקשוקה עם נקניקיות עוף (ערב)', detail: 'ביצים, נקניקיות עוף, רוטב עגבניות חריף', kcal: 400, protein: 28, fat: 24, carbs: 12, icon: '🍳', category: 'main' },
  { id: 'tofu-veg-stirfry', name: 'מוקפץ טופו וירקות עם אורז', detail: 'טופו, ירקות מוקפצים, רוטב סויה, אורז', kcal: 480, protein: 22, fat: 14, carbs: 65, icon: '🥡', category: 'main' },
  { id: 'turkey-couscous', name: 'צלי הודו עם קוסקוס', detail: 'הודו טחון מבושל, קוסקוס, ירקות שורש', kcal: 520, protein: 40, fat: 14, carbs: 55, icon: '🍲', category: 'main' },
  { id: 'lentil-soup', name: 'מרק עדשים עם לחם מלא', detail: 'עדשים כתומות, גזר, בצל, לחם מלא בצד', kcal: 420, protein: 22, fat: 8, carbs: 65, icon: '🍲', category: 'main' },
  { id: 'fish-potato', name: 'פילה דג עם תפוח אדמה אפוי', detail: 'דג בקלה/אמנון, תפוח אדמה אפוי, לימון', kcal: 440, protein: 38, fat: 10, carbs: 45, icon: '🐟', category: 'main' },
  { id: 'stuffed-chicken', name: 'חזה עוף ממולא גבינה עם סלט', detail: 'חזה עוף ממולא מוצרלה, סלט ירקות', kcal: 480, protein: 45, fat: 20, carbs: 15, icon: '🍗', category: 'main' },
  { id: 'red-lentil-curry', name: 'קארי עדשים אדום עם אורז', detail: 'עדשים אדומות, חלב קוקוס, אורז בסמטי', kcal: 500, protein: 18, fat: 16, carbs: 70, icon: '🍛', category: 'main' },
  { id: 'creamy-pasta-chicken', name: 'פסטה ברוטב שמנת ופטריות עם עוף', detail: 'פסטה, רוטב שמנת קל, פטריות, חזה עוף', kcal: 650, protein: 36, fat: 30, carbs: 55, icon: '🍝', category: 'main' },

  // ---- חטיף ----
  { id: 'energy-balls-dates', name: 'חטיף אנרגיה ביתי (תמרים ואגוזים)', detail: 'תמרים, אגוזי מלך, קקאו', kcal: 220, protein: 6, fat: 12, carbs: 24, icon: '🍪', category: 'snack' },
  { id: 'chocolate-energy-balls', name: 'כדורי אנרגיה שוקולד', detail: 'שיבולת שועל, קקאו, חמאת בוטנים', kcal: 180, protein: 5, fat: 9, carbs: 20, icon: '🍫', category: 'snack' },
  { id: 'nuts-dried-fruit-mix', name: 'מיקס אגוזים ופירות יבשים', detail: 'שקדים, אגוזי מלך, צימוקים, משמש מיובש', kcal: 250, protein: 7, fat: 16, carbs: 22, icon: '🥜', category: 'snack' },
  { id: 'hummus-veggies', name: 'חומוס עם גזר ומלפפון', detail: 'חומוס ביתי/קנוי, מקלות גזר ומלפפון', kcal: 200, protein: 8, fat: 10, carbs: 18, icon: '🥕', category: 'snack' },
  { id: 'hard-boiled-egg', name: 'ביצה קשה עם מלח', detail: 'הכי פשוט שיש — ביצה קשה', kcal: 78, protein: 6, fat: 5, carbs: 1, icon: '🥚', category: 'snack' },
  { id: 'cottage-tomatoes', name: 'גבינת קוטג׳ עם עגבניות שרי', detail: "גבינת קוטג' 5%, עגבניות שרי, מלח ופלפל", kcal: 140, protein: 14, fat: 5, carbs: 8, icon: '🍅', category: 'snack' },
  { id: 'rice-cakes-pb', name: 'פריכיות אורז עם חמאת בוטנים', detail: '2 פריכיות אורז + כף חמאת בוטנים', kcal: 230, protein: 8, fat: 12, carbs: 24, icon: '🍘', category: 'snack' },
  { id: 'apple-almond-butter', name: 'תפוח עם חמאת שקדים', detail: 'תפוח עץ פרוס + כף חמאת שקדים', kcal: 210, protein: 5, fat: 12, carbs: 22, icon: '🍎', category: 'snack' },
  { id: 'protein-shake-banana', name: 'שייק חלבון עם חלב ובננה', detail: 'אבקת חלבון, חלב 1%, בננה', kcal: 260, protein: 30, fat: 5, carbs: 28, icon: '🥤', category: 'snack' },
  { id: 'raisins-almonds', name: 'צימוקים ושקדים', detail: 'מנה קלאסית — צימוקים ושקדים טבעיים', kcal: 200, protein: 6, fat: 11, carbs: 20, icon: '🌰', category: 'snack' },

  // ---- מתוק / קינוח ----
  { id: 'protein-brownie', name: 'פרוטאין בראוני ביתי', detail: 'אבקת חלבון, קקאו, בננה מחית', kcal: 260, protein: 14, fat: 10, carbs: 30, icon: '🍫', category: 'dessert' },
  { id: 'oat-banana-cookies', name: 'עוגיות שיבולת שועל ובננה', detail: '2 מרכיבים — שיבולת שועל ובננה מחית', kcal: 220, protein: 6, fat: 8, carbs: 32, icon: '🍪', category: 'dessert' },
  { id: 'chocolate-protein-mousse', name: 'מוס שוקולד חלבון', detail: 'קוטג׳/יוגורט יווני, קקאו, אבקת חלבון', kcal: 190, protein: 18, fat: 7, carbs: 15, icon: '🍮', category: 'dessert' },
  { id: 'chia-pudding', name: 'פודינג צ׳יה עם חלב שקדים', detail: 'זרעי צ׳יה, חלב שקדים, וניל', kcal: 210, protein: 8, fat: 10, carbs: 22, icon: '🍮', category: 'dessert' },
  { id: 'banana-nicecream', name: 'גלידת בננה טבעית', detail: 'בננה קפואה טחונה — "גלידה" ללא תוספות', kcal: 120, protein: 2, fat: 1, carbs: 28, icon: '🍦', category: 'dessert' },
  { id: 'protein-cheesecake-mug', name: 'עוגת גבינה חלבון (מיקרוגל)', detail: "גבינת שמנת/קוטג', ביצה, אבקת חלבון — דקה במיקרו", kcal: 240, protein: 22, fat: 9, carbs: 18, icon: '🍰', category: 'dessert' },
  { id: 'protein-waffle-berries', name: 'וופל פרוטאין עם פירות יער', detail: 'בלילת וופל חלבון, פירות יער טריים', kcal: 280, protein: 20, fat: 8, carbs: 34, icon: '🧇', category: 'dessert' },
  { id: 'date-coconut-bites', name: 'חטיף תמר וקוקוס', detail: 'תמרים, קוקוס טחון, קורט מלח', kcal: 190, protein: 3, fat: 8, carbs: 28, icon: '🥥', category: 'dessert' },

  // ---- בוקר (תוספת) ----
  { id: 'spinach-cheese-bourekas', name: 'בורקה תרד וגבינה ביתית', detail: 'בצק פילו, תרד, גבינה בולגרית', kcal: 340, protein: 12, fat: 20, carbs: 28, icon: '🥐', category: 'breakfast' },
  { id: 'turkish-eggs', name: 'שקשוקה טורקית (יוגורט ושום)', detail: 'ביצים עלומות, יוגורט, חמאה, פפריקה', kcal: 350, protein: 18, fat: 26, carbs: 8, icon: '🍳', category: 'breakfast' },
  { id: 'veg-frittata', name: 'פשטידת ירקות קלה', detail: 'ביצים, קישוא, גזר, בצל — אפויה בתבנית', kcal: 260, protein: 18, fat: 16, carbs: 10, icon: '🍳', category: 'breakfast' },
  { id: 'spanish-tortilla', name: 'חביתה ספרדית (טורטייה דה פטטס)', detail: 'ביצים, תפוח אדמה, בצל מוקפץ', kcal: 340, protein: 14, fat: 18, carbs: 32, icon: '🍳', category: 'breakfast' },
  { id: 'classic-protein-toast', name: 'טוסט חלבון קלאסי', detail: 'לחם קל, גבינה 9%, פסטרמה, רסק עגבניות', kcal: 380, protein: 30, fat: 16, carbs: 30, icon: '🥪', category: 'breakfast' },

  // ---- ארוחה עיקרית (תוספת) ----
  { id: 'chili-con-carne', name: "צ'ילי קון קרני", detail: 'בקר טחון, שעועית אדומה, עגבניות, תבלינים חריפים', kcal: 560, protein: 38, fat: 22, carbs: 45, icon: '🌶️', category: 'main' },
  { id: 'eggplant-moussaka', name: 'מוסקה חצילים', detail: 'חצילים אפויים, בקר טחון, בשמל קל', kcal: 500, protein: 28, fat: 28, carbs: 30, icon: '🍆', category: 'main' },
  { id: 'potato-tuna-bake', name: 'פשטידת תפוחי אדמה וטונה', detail: 'תפוח אדמה, טונה, ביצים, גבינה צהובה', kcal: 460, protein: 30, fat: 18, carbs: 45, icon: '🐟', category: 'main' },
  { id: 'mexican-rice-beans', name: 'אורז מקסיקני עם שעועית', detail: 'אורז, שעועית שחורה, תירס, עגבניות', kcal: 480, protein: 16, fat: 8, carbs: 85, icon: '🌮', category: 'main' },
  { id: 'fish-cakes', name: 'קציצות דגים ביתיות', detail: 'דג לבן טחון, ביצה, פירורי לחם, עשבי תיבול', kcal: 380, protein: 32, fat: 16, carbs: 24, icon: '🐟', category: 'main' },
  { id: 'cornflake-chicken', name: 'פילה עוף בציפוי קורנפלקס (תנור)', detail: 'חזה עוף, קורנפלקס גרוס, ביצה — אפוי לא מטוגן', kcal: 420, protein: 42, fat: 12, carbs: 32, icon: '🍗', category: 'main' },
  { id: 'pesto-pasta-chicken', name: 'פסטה פסטו עם עוף', detail: 'פסטה מלאה, רוטב פסטו, חזה עוף פרוס', kcal: 620, protein: 38, fat: 24, carbs: 65, icon: '🍝', category: 'main' },
  { id: 'homemade-chicken-tacos', name: 'טאקוס עוף ביתי', detail: 'טורטייה קטנה, עוף מתובל, סלסה, חסה', kcal: 480, protein: 34, fat: 16, carbs: 50, icon: '🌮', category: 'main' },

  // ---- חטיף (תוספת) ----
  { id: 'homemade-popcorn', name: 'פופקורן ביתי (ללא חמאה)', detail: 'תירס מתפוצץ, קורט מלח', kcal: 150, protein: 4, fat: 4, carbs: 26, icon: '🍿', category: 'snack' },
  { id: 'cold-protein-snack', name: 'חטיף חלבון קר (קוטג׳+פסטרמה)', detail: "גבינת קוטג' 5%, פסטרמה קצוצה", kcal: 160, protein: 20, fat: 6, carbs: 4, icon: '🧀', category: 'snack' },
  { id: 'mini-hummus-toast', name: 'טוסט מיני עם חומוס', detail: 'פרוסת לחם קטנה, חומוס, פפריקה', kcal: 150, protein: 6, fat: 6, carbs: 18, icon: '🥪', category: 'snack' },
  { id: 'chia-yogurt-fruit', name: 'יוגורט עם זרעי צ׳יה ופרי', detail: 'יוגורט טבעי, זרעי צ׳יה, פרי טרי', kcal: 180, protein: 10, fat: 6, carbs: 20, icon: '🍓', category: 'snack' },

  // ---- מתוק (תוספת) ----
  { id: 'apple-crumble-protein', name: 'קראמבל תפוחים חלבון', detail: 'תפוחים אפויים, שיבולת שועל, קינמון, אבקת חלבון', kcal: 240, protein: 12, fat: 6, carbs: 36, icon: '🍎', category: 'dessert' },
  { id: 'rice-pudding-protein', name: 'פודינג אורז חלבון', detail: 'אורז מבושל בחלב, אבקת חלבון, קינמון', kcal: 260, protein: 16, fat: 5, carbs: 40, icon: '🍮', category: 'dessert' },
];
