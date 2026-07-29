import { useState, useEffect, useRef, createContext, useContext } from 'react';
import * as Tone from 'tone';
import {
  Flame, Dumbbell, Plus, UtensilsCrossed,
  TrendingUp, TrendingDown, Scale, Ruler, Play, Pause,
  Check, Sunrise, Coffee, Moon, Sun, Sparkles, Target,
  ChevronDown, ChevronUp, CircleCheck, CalendarDays,
  Settings, X, User, UserPlus, Download, Upload, Trash2, Zap, Loader2, Gauge, Bell,
  HelpCircle, BookOpen, LifeBuoy, Compass, ArrowLeft, ArrowRight, Info,
  Brain, BarChart3, Wand2, Sparkle, AlertTriangle, Lightbulb, Send,
  ClipboardList, Copy, MessageCircle, RotateCcw, Pencil,
  ChefHat, Store, ListPlus, Utensils, CheckCircle2, XCircle,
  FileCode, Database, ShieldCheck, Award, Layers, GitBranch, HardDrive, AlertCircle, ShieldAlert,
  PackagePlus, ArrowRightLeft, Layers3,
  Beef, Wheat, Droplet, Salad, Apple, Milk, FlaskConical, Search, Star
} from 'lucide-react';

/* ============================= FONTS ============================= */
// A real pairing, not "one font everywhere": Frank Ruhl Libre is a serif purpose-built
// for Hebrew+Latin (used across Israeli editorial design) — it carries the "premium/executive"
// character for titles. Heebo stays as the neutral, highly-legible body face. JetBrains Mono
// (tabular figures) is reserved for every number in the app so columns of data align crisply.
const FONT_DISPLAY = "'Frank Ruhl Libre', 'Heebo', serif";
const FONT_BODY = "'Heebo', 'Segoe UI', sans-serif";
// NOTE: previously 'JetBrains Mono' — that font has ZERO Hebrew glyph coverage, so any Hebrew
// mixed into a FONT_MONO span (e.g. "150 קל'", "30g" next to a Hebrew label) silently fell back
// to the browser's default system font for just the Hebrew characters, producing inconsistent,
// unprofessional-looking mixed typography throughout the app — which is nearly everywhere, since
// almost every number here is shown with a Hebrew unit. IBM Plex Sans Hebrew has full Hebrew
// coverage and a distinct technical/geometric feel, so it keeps numbers visually differentiated
// from body text (the original design intent) without ever breaking on Hebrew.
const FONT_MONO = "'IBM Plex Sans Hebrew', 'Heebo', sans-serif";

// Restrained elevation, not neon ambient glow: small radius blur, low opacity, used sparingly
// (active/selected states and the tour spotlight) rather than on every interactive element.
function glow(hex, size = 10, alpha = '38') {
  return `0 0 ${size}px ${hex}${alpha}`;
}

/* ============================= CUSTOM PALETTE ============================= */
// Derived, desaturated jewel tones — deliberately NOT stock Tailwind emerald/cyan/violet/amber.
// Each has a slightly deeper "dark-surface" shade and a slightly richer "light-surface" shade,
// per the standard practice of pulling accent lightness/saturation down a touch on dark
// backgrounds (where saturated hues read as neon) and up a touch on light ones (for contrast).
const JEWEL = {
  dark: { jade: '#3F8D6E', bronze: '#CE8027', steel: '#548BB6', plum: '#9064AF', petrol: '#3E8B98' },
  light: { jade: '#307E5F', bronze: '#B8701E', steel: '#3A77A6', plum: '#7D49A2', petrol: '#2E7C8A' },
};

function getMacroColors(mode) {
  const j = JEWEL[mode];
  return { kcal: j.bronze, protein: j.jade, carbs: j.steel, fat: j.plum };
}

const ACCENT_META = {
  emerald: { label: 'Jade', emoji: '🟢', key: 'jade' },
  cyan: { label: 'Petrol', emoji: '🔷', key: 'petrol' },
  violet: { label: 'Plum', emoji: '🟣', key: 'plum' },
  gold: { label: 'Bronze', emoji: '🟡', key: 'bronze' },
};

function getAccentHex(mode, accentKey) {
  return JEWEL[mode][ACCENT_META[accentKey].key];
}

/* ============================= SPRINT 7 · THEME ENGINE ============================= */
// Warm-tinted neutrals (never pure #000/#fff) — the base hue leans toward the bronze/jade
// accents so dark and light mode both feel like one considered system, not an inverted default.
const THEME_PRESETS = {
  dark: {
    bg: '#0E0C0A',
    bgGrad: 'radial-gradient(ellipse 130% 80% at 50% -10%, #1D1712 0%, #0E0C0A 55%)',
    card: '#17130F',
    cardSolid: '#17130F',
    cardBorder: '#2A241E',
    elevated: '#211B16',
    border: '#2A241E',
    textPrimary: '#F3EFE9',
    textSecondary: '#B4A99B',
    textDim: '#7A6F62',
    inputBg: '#171310',
    chipBg: '#1C1712',
    popover: '#1C1712',
    modalBg: '#19140F',
    overlayBg: 'rgba(10,8,6,0.72)',
    shadowCard: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px -18px rgba(0,0,0,0.7)',
    dropdownShadow: '0 20px 45px -16px rgba(0,0,0,0.65)',
    modalShadowExtra: '0 30px 70px -24px rgba(0,0,0,0.75)',
  },
  light: {
    bg: '#FBF9F6',
    bgGrad: 'radial-gradient(ellipse 130% 80% at 50% -10%, #FFFFFF 0%, #FBF9F6 55%)',
    card: '#FFFFFF',
    cardSolid: '#FFFFFF',
    cardBorder: '#E9E2D8',
    elevated: '#F6F1EA',
    border: '#E9E2D8',
    textPrimary: '#241F1A',
    textSecondary: '#6B6154',
    textDim: '#A69C8D',
    inputBg: '#F6F1EA',
    chipBg: '#F6F1EA',
    popover: '#FFFFFF',
    modalBg: '#FFFFFF',
    overlayBg: 'rgba(36,31,26,0.52)',
    shadowCard: '0 1px 2px rgba(36,31,26,0.04), 0 10px 28px -18px rgba(36,31,26,0.18)',
    dropdownShadow: '0 20px 45px -16px rgba(36,31,26,0.18)',
    modalShadowExtra: '0 30px 70px -24px rgba(36,31,26,0.22)',
  },
};

const ACCENT_PRESETS = {
  emerald: { hex: JEWEL.dark.jade, label: 'Jade', emoji: '🟢' },
  cyan: { hex: JEWEL.dark.petrol, label: 'Petrol', emoji: '🔷' },
  violet: { hex: JEWEL.dark.plum, label: 'Plum', emoji: '🟣' },
  gold: { hex: JEWEL.dark.bronze, label: 'Bronze', emoji: '🟡' },
};

const DENSITY_PRESETS = {
  comfortable: { label: 'מרווח', section: 'mb-8', card: 'p-5', cardSm: 'p-4', gap: 'gap-4', ring: 108, timelineGap: 'gap-4', showDetail: true },
  compact: { label: 'מרוכז', section: 'mb-4', card: 'p-3', cardSm: 'p-3', gap: 'gap-2', ring: 80, timelineGap: 'gap-2', showDetail: false },
};

const ThemeContext = createContext(null);
function useTheme() {
  return useContext(ThemeContext);
}

/* ============================= STATIC DATA ============================= */

const HACK_CATEGORIES = [
  { id: 'breakfast', label: 'בוקר' },
  { id: 'main', label: 'ארוחה עיקרית' },
  { id: 'snack', label: 'חטיף' },
  { id: 'dessert', label: 'מתוק/קינוח' },
];

const HACKS = [
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

const SHUMSHUM = {
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

const CHICKEN_STATION = {
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

const GOOMBA = [
  { id: 'pasta', name: 'פסטה בולונז', kcal: 650, protein: 30, fat: 20, carbs: 75 },
  { id: 'chicken', name: 'עוף גריל + סלט ירוק', kcal: 380, protein: 42, fat: 12, carbs: 15 },
];

const KANSAI = {
  protein: [
    { id: 'salmon', name: 'סלמון', kcal: 250, protein: 28, fat: 14, carbs: 0 },
    { id: 'chicken', name: 'עוף', kcal: 210, protein: 32, fat: 6, carbs: 0 },
  ],
  rice: { kcal: 150, protein: 3, fat: 0, carbs: 33 },
  veg: { kcal: 50, protein: 2, fat: 0, carbs: 8 },
  sauce: { kcal: 20, protein: 0, fat: 0, carbs: 3 },
};

const EATING_OUT_CATEGORIES = [
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

// Common Israeli takeout/delivery/eating-out items — deliberately broad rather than precise per
// specific chain (a "pizza slice" varies by pizzeria); values are reasonable representative
// estimates for each category, the same spirit as the rest of the app's ingredient data.
const EATING_OUT_MENU = [
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

const WORKOUTS = {
  A1: {
    label: 'A1 · Power Upper', color: JEWEL.dark.petrol,
    exercises: [
      { name: 'לחיצת חזה במוט', sets: 4, reps: '4', rest: 150 },
      { name: 'מתח משוקלל', sets: 4, reps: '5', rest: 150 },
      { name: 'לחיצת כתפיים במוט', sets: 3, reps: '6', rest: 120 },
      { name: 'חתירה בכפיפה', sets: 3, reps: '6', rest: 120 },
    ],
  },
  B1: {
    label: 'B1 · Power Lower', color: JEWEL.dark.petrol,
    exercises: [
      { name: 'סקוואט גב', sets: 4, reps: '4', rest: 180 },
      { name: 'רומנית עם מוט', sets: 3, reps: '6', rest: 150 },
      { name: 'לחיצת רגליים', sets: 3, reps: '8', rest: 120 },
      { name: 'עליות שוק בעמידה', sets: 4, reps: '10', rest: 75 },
    ],
  },
  A2: {
    label: 'A2 · Volume Upper', color: JEWEL.dark.plum,
    exercises: [
      { name: 'לחיצת חזה שיפוע - משקולות', sets: 4, reps: '10', rest: 90 },
      { name: 'משיכת פולי עליון', sets: 4, reps: '10', rest: 90 },
      { name: 'הרחקת כתפיים בכבל', sets: 3, reps: '15', rest: 60 },
      { name: 'פייס פול', sets: 3, reps: '15', rest: 60 },
      { name: 'פשיטת מרפק בפולי', sets: 3, reps: '12', rest: 60 },
      { name: 'כפיפת מרפק משקולות', sets: 3, reps: '12', rest: 60 },
    ],
  },
  B2: {
    label: 'B2 · Volume Lower', color: JEWEL.dark.plum,
    exercises: [
      { name: 'סקוואט קדמי', sets: 3, reps: '10', rest: 120 },
      { name: 'כפיפת ברך שכיבה', sets: 4, reps: '12', rest: 75 },
      { name: 'מכרעים הליכה', sets: 3, reps: '12', rest: 75 },
      { name: 'פשיטת ברך במכונה', sets: 3, reps: '15', rest: 60 },
      { name: 'עליות שוק ישיבה', sets: 4, reps: '15', rest: 60 },
    ],
  },
};


/* ============================= SPRINT 13 · FLEXIBLE IIFYM PORTION ENGINE ============================= */
// (Labeled Sprint 13 internally — "Sprint 12" in the project's own history already shipped the
// 2.0 finalization/sign-off layer. See CLAUDE.md for the renumbering note.)

// Base matrix, all values per RAW 100g unless `hasCookedVariant` is false (in which case the
// single set of values already represents the food as normally eaten/weighed).
// `cookedFactor` = cooked-weight ÷ raw-weight for the same starting quantity (rice absorbs water
// and gets heavier → factor > 1; meat loses water and shrinks → factor < 1). Cooked-basis
// per-100g values are then mathematically derived as raw ÷ factor — never hand-typed twice,
// so raw and cooked can never drift out of sync with each other.
const INGREDIENT_DB = [
  // ---- Proteins (~25) ----
  { id: 'chicken-breast', name: 'חזה עוף', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 120, protein: 22.5, carbs: 0, fat: 2.6 } },
  { id: 'chicken-thigh', name: 'ירך עוף', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 170, protein: 19, carbs: 0, fat: 10 } },
  { id: 'turkey-breast', name: 'חזה הודו', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 110, protein: 24, carbs: 0, fat: 1 } },
  { id: 'turkey-ground', name: 'הודו טחון', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 140, protein: 20, carbs: 0, fat: 7 } },
  { id: 'beef-10', name: 'בקר טחון 10%', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 176, protein: 20, carbs: 0, fat: 10 } },
  { id: 'beef-5', name: 'בקר טחון 5%', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 137, protein: 21, carbs: 0, fat: 5 } },
  { id: 'schnitzel', name: 'שניצל עוף', category: 'protein', hasCookedVariant: false, raw: { kcal: 260, protein: 18, carbs: 15, fat: 14 } },
  { id: 'kebab', name: 'קבב', category: 'protein', hasCookedVariant: true, cookedFactor: 0.8, raw: { kcal: 250, protein: 17, carbs: 3, fat: 19 } },
  { id: 'chicken-sausage', name: 'נקניקיות עוף', category: 'protein', hasCookedVariant: false, raw: { kcal: 210, protein: 14, carbs: 4, fat: 15 } },
  { id: 'turkey-salami', name: 'סלמי הודו', category: 'protein', hasCookedVariant: false, raw: { kcal: 140, protein: 18, carbs: 2, fat: 7 } },
  { id: 'salmon', name: 'סלמון', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 208, protein: 20, carbs: 0, fat: 13 } },
  { id: 'tilapia', name: 'דג אמנון', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 96, protein: 20, carbs: 0, fat: 1.7 } },
  { id: 'cod', name: 'דג בקלה', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 82, protein: 18, carbs: 0, fat: 0.7 } },
  { id: 'shrimp', name: 'שרימפס', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 } },
  { id: 'eggs', name: 'ביצים', category: 'protein', hasCookedVariant: false, raw: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 } },
  { id: 'egg-whites', name: 'חלבון ביצה', category: 'protein', hasCookedVariant: false, raw: { kcal: 52, protein: 11, carbs: 0.7, fat: 0.2 } },
  { id: 'tuna-oil', name: 'טונה בשמן', category: 'protein', hasCookedVariant: false, raw: { kcal: 190, protein: 25, carbs: 0, fat: 9 } },
  { id: 'tuna-water', name: 'טונה במים', category: 'protein', hasCookedVariant: false, raw: { kcal: 116, protein: 26, carbs: 0, fat: 1 } },
  { id: 'pastrami', name: 'פסטרמה', category: 'protein', hasCookedVariant: false, raw: { kcal: 180, protein: 32, carbs: 2, fat: 6 } },
  { id: 'tofu', name: 'טופו', category: 'protein', hasCookedVariant: false, raw: { kcal: 76, protein: 8, carbs: 1.9, fat: 4.8 } },
  { id: 'seitan', name: 'סייטן', category: 'protein', hasCookedVariant: false, raw: { kcal: 120, protein: 21, carbs: 4, fat: 2 } },
  { id: 'lentils-red', name: 'עדשים אדומות מבושלות', category: 'protein', hasCookedVariant: false, raw: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 } },
  { id: 'lentils-green', name: 'עדשים ירוקות מבושלות', category: 'protein', hasCookedVariant: false, raw: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 } },
  { id: 'chickpeas', name: 'חומוס גרעינים מבושל', category: 'protein', hasCookedVariant: false, raw: { kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 } },
  { id: 'white-beans', name: 'שעועית לבנה מבושלת', category: 'protein', hasCookedVariant: false, raw: { kcal: 127, protein: 9, carbs: 23, fat: 0.5 } },
  { id: 'cottage-5', name: "גבינת קוטג' 5%", category: 'protein', hasCookedVariant: false, raw: { kcal: 98, protein: 11, carbs: 3.4, fat: 5 } },
  { id: 'greek-yogurt-5', name: 'יוגורט יווני 5%', category: 'protein', hasCookedVariant: false, raw: { kcal: 97, protein: 8, carbs: 5, fat: 5 } },

  // ---- Carbs (~25) ----
  { id: 'rice-persian', name: 'אורז פרסי', category: 'carb', hasCookedVariant: true, cookedFactor: 2.6, raw: { kcal: 360, protein: 7, carbs: 79, fat: 0.7 } },
  { id: 'rice-basmati', name: 'אורז בסמטי', category: 'carb', hasCookedVariant: true, cookedFactor: 2.6, raw: { kcal: 356, protein: 7.5, carbs: 78, fat: 0.6 } },
  { id: 'rice-brown', name: 'אורז מלא', category: 'carb', hasCookedVariant: true, cookedFactor: 2.4, raw: { kcal: 362, protein: 7.5, carbs: 76, fat: 2.7 } },
  { id: 'potato', name: 'תפוח אדמה', category: 'carb', hasCookedVariant: false, raw: { kcal: 87, protein: 2, carbs: 20, fat: 0.1 } },
  { id: 'sweet-potato', name: 'בטטה', category: 'carb', hasCookedVariant: false, raw: { kcal: 90, protein: 2, carbs: 21, fat: 0.1 } },
  { id: 'pasta', name: 'פסטה', category: 'carb', hasCookedVariant: true, cookedFactor: 2.2, raw: { kcal: 371, protein: 13, carbs: 75, fat: 1.5 } },
  { id: 'couscous-ptitim', name: 'פתיתים (קוסקוס ישראלי)', category: 'carb', hasCookedVariant: true, cookedFactor: 2.3, raw: { kcal: 376, protein: 12.5, carbs: 77, fat: 1.2 } },
  { id: 'couscous-fine', name: 'קוסקוס דק', category: 'carb', hasCookedVariant: true, cookedFactor: 2.3, raw: { kcal: 376, protein: 12.8, carbs: 77, fat: 0.6 } },
  { id: 'quinoa', name: 'קינואה', category: 'carb', hasCookedVariant: true, cookedFactor: 2.8, raw: { kcal: 368, protein: 14, carbs: 64, fat: 6 } },
  { id: 'bulgur', name: 'בורגול', category: 'carb', hasCookedVariant: true, cookedFactor: 2.5, raw: { kcal: 342, protein: 12.3, carbs: 76, fat: 1.3 } },
  { id: 'bread-light', name: 'לחם קל', category: 'carb', hasCookedVariant: false, raw: { kcal: 230, protein: 10, carbs: 42, fat: 2.5 } },
  { id: 'bread-whole', name: 'לחם מלא', category: 'carb', hasCookedVariant: false, raw: { kcal: 252, protein: 9, carbs: 45, fat: 3.5 } },
  { id: 'bread-white', name: 'לחם לבן', category: 'carb', hasCookedVariant: false, raw: { kcal: 266, protein: 8, carbs: 50, fat: 3.3 } },
  { id: 'pita', name: 'פיתה', category: 'carb', hasCookedVariant: false, raw: { kcal: 275, protein: 9, carbs: 55, fat: 1.5 } },
  { id: 'challah', name: 'חלה', category: 'carb', hasCookedVariant: false, raw: { kcal: 300, protein: 8.5, carbs: 52, fat: 6.5 } },
  { id: 'bagel', name: 'בייגל', category: 'carb', hasCookedVariant: false, raw: { kcal: 270, protein: 10, carbs: 53, fat: 1.5 } },
  { id: 'tortilla', name: 'טורטייה', category: 'carb', hasCookedVariant: false, raw: { kcal: 280, protein: 8, carbs: 47, fat: 7 } },
  { id: 'oats', name: 'שיבולת שועל', category: 'carb', hasCookedVariant: false, raw: { kcal: 375, protein: 13, carbs: 66, fat: 7 } },
  { id: 'rice-cakes', name: 'פריכיות אורז', category: 'carb', hasCookedVariant: false, raw: { kcal: 387, protein: 8, carbs: 82, fat: 3 } },
  { id: 'corn-cakes', name: 'פריכיות תירס', category: 'carb', hasCookedVariant: false, raw: { kcal: 392, protein: 7, carbs: 85, fat: 2.5 } },
  { id: 'crackers-salty', name: 'קרקר מלוח', category: 'carb', hasCookedVariant: false, raw: { kcal: 440, protein: 9, carbs: 65, fat: 16 } },
  { id: 'corn', name: 'תירס מתוק', category: 'carb', hasCookedVariant: false, raw: { kcal: 96, protein: 3.4, carbs: 21, fat: 1.5 } },
  { id: 'sweet-potato-baked', name: 'בטטה אפויה', category: 'carb', hasCookedVariant: false, raw: { kcal: 90, protein: 2, carbs: 21, fat: 0.2 } },
  { id: 'lentils-carb', name: 'עדשים (כפחמימה מלאה)', category: 'carb', hasCookedVariant: false, raw: { kcal: 116, protein: 9, carbs: 20, fat: 0.4 } },
  { id: 'chickpeas-carb', name: 'חומוס גרעינים (כפחמימה)', category: 'carb', hasCookedVariant: false, raw: { kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 } },

  // ---- Fats & Extras (~16) ----
  { id: 'olive-oil', name: 'שמן זית', category: 'fat', hasCookedVariant: false, raw: { kcal: 884, protein: 0, carbs: 0, fat: 100 } },
  { id: 'canola-oil', name: 'שמן קנולה', category: 'fat', hasCookedVariant: false, raw: { kcal: 884, protein: 0, carbs: 0, fat: 100 } },
  { id: 'butter', name: 'חמאה', category: 'fat', hasCookedVariant: false, raw: { kcal: 717, protein: 0.9, carbs: 0.1, fat: 81 } },
  { id: 'tahini-raw', name: 'טחינה גולמית', category: 'fat', hasCookedVariant: false, raw: { kcal: 595, protein: 17, carbs: 21, fat: 54 } },
  { id: 'tahini-prepared', name: 'טחינה מוכנה (עם מים/לימון)', category: 'fat', hasCookedVariant: false, raw: { kcal: 310, protein: 8, carbs: 12, fat: 27 } },
  { id: 'peanut-butter', name: 'חמאת בוטנים', category: 'fat', hasCookedVariant: false, raw: { kcal: 588, protein: 25, carbs: 20, fat: 50 } },
  { id: 'almond-butter', name: 'חמאת שקדים', category: 'fat', hasCookedVariant: false, raw: { kcal: 614, protein: 21, carbs: 19, fat: 56 } },
  { id: 'avocado', name: 'אבוקדו', category: 'fat', hasCookedVariant: false, raw: { kcal: 160, protein: 2, carbs: 8.5, fat: 15 } },
  { id: 'olives', name: 'זיתים', category: 'fat', hasCookedVariant: false, raw: { kcal: 145, protein: 1, carbs: 3.8, fat: 15 } },
  { id: 'cheese-9', name: 'גבינה צהובה 9%', category: 'fat', hasCookedVariant: false, raw: { kcal: 220, protein: 24, carbs: 3, fat: 9 } },
  { id: 'mozzarella', name: 'מוצרלה', category: 'fat', hasCookedVariant: false, raw: { kcal: 280, protein: 22, carbs: 2.2, fat: 21 } },
  { id: 'bulgarian-cheese', name: 'גבינה בולגרית', category: 'fat', hasCookedVariant: false, raw: { kcal: 260, protein: 15, carbs: 2, fat: 22 } },
  { id: 'cream-cheese', name: 'גבינת שמנת', category: 'fat', hasCookedVariant: false, raw: { kcal: 290, protein: 6, carbs: 4, fat: 28 } },
  { id: 'walnuts', name: 'אגוזי מלך', category: 'fat', hasCookedVariant: false, raw: { kcal: 654, protein: 15, carbs: 14, fat: 65 } },
  { id: 'almonds', name: 'שקדים', category: 'fat', hasCookedVariant: false, raw: { kcal: 579, protein: 21, carbs: 22, fat: 50 } },
  { id: 'peanuts', name: 'בוטנים', category: 'fat', hasCookedVariant: false, raw: { kcal: 567, protein: 26, carbs: 16, fat: 49 } },
  { id: 'cashews', name: 'קשיו', category: 'fat', hasCookedVariant: false, raw: { kcal: 553, protein: 18, carbs: 30, fat: 44 } },

  // ---- Veggies (~16) ----
  { id: 'cucumber', name: 'מלפפון', category: 'veg', hasCookedVariant: false, raw: { kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 } },
  { id: 'tomato', name: 'עגבנייה', category: 'veg', hasCookedVariant: false, raw: { kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 } },
  { id: 'bell-pepper', name: 'גמבה (פלפל)', category: 'veg', hasCookedVariant: false, raw: { kcal: 31, protein: 1, carbs: 6, fat: 0.3 } },
  { id: 'broccoli', name: 'ברוקולי', category: 'veg', hasCookedVariant: false, raw: { kcal: 34, protein: 2.8, carbs: 7, fat: 0.4 } },
  { id: 'cauliflower', name: 'כרובית', category: 'veg', hasCookedVariant: false, raw: { kcal: 25, protein: 1.9, carbs: 5, fat: 0.3 } },
  { id: 'green-beans', name: 'שעועית ירוקה', category: 'veg', hasCookedVariant: false, raw: { kcal: 31, protein: 1.8, carbs: 7, fat: 0.2 } },
  { id: 'onion', name: 'בצל', category: 'veg', hasCookedVariant: false, raw: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 } },
  { id: 'lettuce', name: 'חסה', category: 'veg', hasCookedVariant: false, raw: { kcal: 15, protein: 1.4, carbs: 2.9, fat: 0.2 } },
  { id: 'carrot', name: 'גזר', category: 'veg', hasCookedVariant: false, raw: { kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 } },
  { id: 'zucchini', name: 'קישוא', category: 'veg', hasCookedVariant: false, raw: { kcal: 17, protein: 1.2, carbs: 3.1, fat: 0.3 } },
  { id: 'eggplant', name: 'חציל', category: 'veg', hasCookedVariant: false, raw: { kcal: 25, protein: 1, carbs: 6, fat: 0.2 } },
  { id: 'spinach', name: 'תרד', category: 'veg', hasCookedVariant: false, raw: { kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 } },
  { id: 'cabbage', name: 'כרוב', category: 'veg', hasCookedVariant: false, raw: { kcal: 25, protein: 1.3, carbs: 5.8, fat: 0.1 } },
  { id: 'mushrooms', name: 'פטריות', category: 'veg', hasCookedVariant: false, raw: { kcal: 22, protein: 3.1, carbs: 3.3, fat: 0.3 } },
  { id: 'radish', name: 'צנונית', category: 'veg', hasCookedVariant: false, raw: { kcal: 16, protein: 0.7, carbs: 3.4, fat: 0.1 } },
  { id: 'beetroot', name: 'סלק', category: 'veg', hasCookedVariant: false, raw: { kcal: 43, protein: 1.6, carbs: 10, fat: 0.2 } },

  // ---- Fruit (~15) ----
  { id: 'banana', name: 'בננה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 } },
  { id: 'apple', name: 'תפוח עץ', category: 'fruit', hasCookedVariant: false, raw: { kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 } },
  { id: 'orange', name: 'תפוז', category: 'fruit', hasCookedVariant: false, raw: { kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 } },
  { id: 'clementine', name: 'קלמנטינה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 47, protein: 0.8, carbs: 12, fat: 0.2 } },
  { id: 'grapes', name: 'ענבים', category: 'fruit', hasCookedVariant: false, raw: { kcal: 69, protein: 0.7, carbs: 18, fat: 0.2 } },
  { id: 'watermelon', name: 'אבטיח', category: 'fruit', hasCookedVariant: false, raw: { kcal: 30, protein: 0.6, carbs: 8, fat: 0.2 } },
  { id: 'melon', name: 'מלון', category: 'fruit', hasCookedVariant: false, raw: { kcal: 34, protein: 0.8, carbs: 8, fat: 0.2 } },
  { id: 'strawberries', name: 'תות שדה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 } },
  { id: 'pear', name: 'אגס', category: 'fruit', hasCookedVariant: false, raw: { kcal: 57, protein: 0.4, carbs: 15, fat: 0.1 } },
  { id: 'peach', name: 'אפרסק', category: 'fruit', hasCookedVariant: false, raw: { kcal: 39, protein: 0.9, carbs: 10, fat: 0.3 } },
  { id: 'mango', name: 'מנגו', category: 'fruit', hasCookedVariant: false, raw: { kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 } },
  { id: 'pomegranate', name: 'רימון (גרעינים)', category: 'fruit', hasCookedVariant: false, raw: { kcal: 83, protein: 1.7, carbs: 19, fat: 1.2 } },
  { id: 'dates-medjool', name: "תמר מג'הול", category: 'fruit', hasCookedVariant: false, raw: { kcal: 277, protein: 1.8, carbs: 75, fat: 0.2 } },
  { id: 'raisins', name: 'צימוקים', category: 'fruit', hasCookedVariant: false, raw: { kcal: 299, protein: 3.1, carbs: 79, fat: 0.5 } },
  { id: 'dried-apricot', name: 'משמש מיובש', category: 'fruit', hasCookedVariant: false, raw: { kcal: 241, protein: 3.4, carbs: 63, fat: 0.5 } },

  // ---- Dairy & Israeli Snacks (~25) ----
  { id: 'gamadim', name: 'מעדן גמדים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 145, protein: 4.2, carbs: 20, fat: 5.2 } },
  { id: 'milky', name: 'מילקי', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 155, protein: 3.5, carbs: 18, fat: 7.5 } },
  { id: 'shoko', name: 'שוקו', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 64, protein: 3.2, carbs: 8.5, fat: 2 } },
  { id: 'yogurt-natural-3', name: 'יוגורט טבעי 3%', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 62, protein: 3.9, carbs: 4.7, fat: 3 } },
  { id: 'activia', name: 'אקטיביה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 75, protein: 3.3, carbs: 11, fat: 1.9 } },
  { id: 'danone-fruit', name: 'דנונה עם פירות', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 88, protein: 3.4, carbs: 13, fat: 2.5 } },
  { id: 'chocolate-pudding', name: 'פודינג שוקולד', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 130, protein: 3.5, carbs: 20, fat: 4 } },
  { id: 'milk-3', name: 'חלב 3%', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 60, protein: 3.2, carbs: 4.8, fat: 3.2 } },
  { id: 'milk-1', name: 'חלב 1%', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 42, protein: 3.4, carbs: 5, fat: 1 } },
  { id: 'granola-plain', name: 'גרנולה פשוטה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 471, protein: 10, carbs: 64, fat: 20 } },
  { id: 'granola-raisins-honey-nuts', name: 'גרנולה עם צימוקים, דבש ואגוזים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 460, protein: 9.5, carbs: 60, fat: 19 } },
  { id: 'cornflakes', name: 'קורנפלקס', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 378, protein: 7, carbs: 84, fat: 0.9 } },
  { id: 'cheerios', name: "דגני בוקר (צ'יריוס)", category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 379, protein: 9, carbs: 73, fat: 6 } },
  { id: 'bamba', name: 'במבה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 541, protein: 16, carbs: 44, fat: 34 } },
  { id: 'bissli-grill', name: 'ביסלי גריל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 470, protein: 9, carbs: 61, fat: 21 } },
  { id: 'chips', name: "צ'יפס תפוצ'יפס", category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 536, protein: 6, carbs: 51, fat: 34 } },
  { id: 'halva', name: 'חלבה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 500, protein: 12, carbs: 50, fat: 30 } },
  { id: 'petit-beurre', name: 'עוגיות פטיפור', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 440, protein: 7, carbs: 75, fat: 13 } },
  { id: 'wafer-chocolate', name: 'וופל שוקולד', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 510, protein: 6, carbs: 60, fat: 27 } },
  { id: 'milk-chocolate', name: 'שוקולד חלב', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 545, protein: 7.6, carbs: 58, fat: 31 } },
  { id: 'energy-bar', name: 'חטיף אנרגיה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 400, protein: 12, carbs: 55, fat: 15 } },
  { id: 'petit-bar', name: "עוגיות פטי בר", category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 490, protein: 6.5, carbs: 63, fat: 24 } },
  { id: 'labneh', name: 'לבנה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 130, protein: 5, carbs: 4, fat: 11 } },
  { id: 'skim-cottage-1', name: "גבינת קוטג' 1%", category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 72, protein: 12, carbs: 3.5, fat: 1 } },
  { id: 'protein-drink', name: 'שייק חלבון מוכן (קרטון)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 90, protein: 15, carbs: 4, fat: 1.5 } },
  { id: 'kefir', name: 'קפיר', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 56, protein: 3.3, carbs: 4.5, fat: 2.5 } },
  { id: 'light-cream-cheese', name: 'גבינת שמנת לייט', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 180, protein: 8, carbs: 5, fat: 15 } },
  { id: 'chocolate-rice-cakes', name: 'פריכיות אורז מצופות שוקולד', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 460, protein: 5, carbs: 68, fat: 19 } },
  { id: 'chocolate-protein-bar', name: 'חטיף פרוטאין מצופה שוקולד', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 380, protein: 30, carbs: 35, fat: 13 } },

  // ---- Proteins (additions) ----
  { id: 'turkey-pastrami', name: 'פסטרמה הודו', category: 'protein', hasCookedVariant: false, raw: { kcal: 110, protein: 20, carbs: 3, fat: 2.5 } },
  { id: 'beef-sausage', name: 'נקניק בקר', category: 'protein', hasCookedVariant: false, raw: { kcal: 250, protein: 13, carbs: 3, fat: 21 } },
  { id: 'lamb-kebab-raw', name: 'קבב טלה', category: 'protein', hasCookedVariant: true, cookedFactor: 0.8, raw: { kcal: 280, protein: 16, carbs: 2, fat: 23 } },
  { id: 'smoked-salmon', name: 'סלמון מעושן', category: 'protein', hasCookedVariant: false, raw: { kcal: 117, protein: 18, carbs: 0, fat: 4.3 } },
  { id: 'edamame', name: 'אדממה', category: 'protein', hasCookedVariant: false, raw: { kcal: 121, protein: 11, carbs: 9, fat: 5 } },

  // ---- Carbs (additions) ----
  { id: 'rye-bread', name: 'לחם שיפון', category: 'carb', hasCookedVariant: false, raw: { kcal: 220, protein: 8, carbs: 44, fat: 1.5 } },
  { id: 'rye-crackers', name: 'פריכיות שיפון', category: 'carb', hasCookedVariant: false, raw: { kcal: 335, protein: 9, carbs: 70, fat: 2 } },
  { id: 'rice-jasmine', name: "אורז ג'סמין", category: 'carb', hasCookedVariant: true, cookedFactor: 2.6, raw: { kcal: 356, protein: 6.7, carbs: 80, fat: 0.5 } },
  { id: 'whole-wheat-pasta', name: 'פסטה מקמח מלא', category: 'carb', hasCookedVariant: true, cookedFactor: 2.2, raw: { kcal: 348, protein: 14, carbs: 68, fat: 2.3 } },
  { id: 'potato-boiled', name: 'תפוח אדמה מבושל', category: 'carb', hasCookedVariant: false, raw: { kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 } },

  // ---- Fats & Extras (additions) ----
  { id: 'sesame-oil', name: 'שמן שומשום', category: 'fat', hasCookedVariant: false, raw: { kcal: 884, protein: 0, carbs: 0, fat: 100 } },
  { id: 'feta-cheese', name: 'גבינת פטה', category: 'fat', hasCookedVariant: false, raw: { kcal: 264, protein: 14, carbs: 4, fat: 21 } },
  { id: 'creme-fraiche', name: 'קרם פרש', category: 'fat', hasCookedVariant: false, raw: { kcal: 300, protein: 2.5, carbs: 3, fat: 30 } },

  // ---- Veggies (additions) ----
  { id: 'asparagus', name: 'אספרגוס', category: 'veg', hasCookedVariant: false, raw: { kcal: 20, protein: 2.2, carbs: 3.9, fat: 0.1 } },
  { id: 'artichoke', name: 'ארטישוק', category: 'veg', hasCookedVariant: false, raw: { kcal: 47, protein: 3.3, carbs: 10.5, fat: 0.2 } },
  { id: 'green-onion', name: 'בצל ירוק', category: 'veg', hasCookedVariant: false, raw: { kcal: 32, protein: 1.8, carbs: 7.3, fat: 0.2 } },

  // ---- Fruit (additions) ----
  { id: 'kiwi', name: 'קיווי', category: 'fruit', hasCookedVariant: false, raw: { kcal: 61, protein: 1.1, carbs: 15, fat: 0.5 } },
  { id: 'pineapple', name: 'אננס', category: 'fruit', hasCookedVariant: false, raw: { kcal: 50, protein: 0.5, carbs: 13, fat: 0.1 } },
  { id: 'papaya', name: 'פפאיה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 43, protein: 0.5, carbs: 11, fat: 0.3 } },
  { id: 'cherries', name: 'דובדבנים', category: 'fruit', hasCookedVariant: false, raw: { kcal: 63, protein: 1.1, carbs: 16, fat: 0.2 } },

  // ---- Condiments & Sauces (new category) ----
  { id: 'ketchup', name: 'קטשופ', category: 'condiments', hasCookedVariant: false, raw: { kcal: 112, protein: 1.2, carbs: 27, fat: 0.2 } },
  { id: 'ketchup-no-sugar', name: 'קטשופ ללא סוכר', category: 'condiments', hasCookedVariant: false, raw: { kcal: 35, protein: 1, carbs: 8, fat: 0.2 } },
  { id: 'mayo', name: 'מיונז', category: 'condiments', hasCookedVariant: false, raw: { kcal: 680, protein: 1, carbs: 2, fat: 75 } },
  { id: 'mayo-light', name: 'מיונז לייט', category: 'condiments', hasCookedVariant: false, raw: { kcal: 290, protein: 1, carbs: 6, fat: 29 } },
  { id: 'mustard', name: 'חרדל', category: 'condiments', hasCookedVariant: false, raw: { kcal: 66, protein: 4.4, carbs: 5, fat: 4 } },
  { id: 'soy-sauce', name: 'רוטב סויה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 53, protein: 8, carbs: 5, fat: 0.1 } },
  { id: 'silan', name: 'סילאן (דבש תמרים)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 305, protein: 1.5, carbs: 75, fat: 0.3 } },
  { id: 'honey', name: 'דבש', category: 'condiments', hasCookedVariant: false, raw: { kcal: 304, protein: 0.3, carbs: 82, fat: 0 } },
  { id: 'sugar-white', name: 'סוכר לבן', category: 'condiments', hasCookedVariant: false, raw: { kcal: 387, protein: 0, carbs: 100, fat: 0 } },
  { id: 'maple-syrup', name: 'סירופ מייפל', category: 'condiments', hasCookedVariant: false, raw: { kcal: 260, protein: 0, carbs: 67, fat: 0.1 } },
  { id: 'bbq-sauce', name: 'רוטב ברביקיו', category: 'condiments', hasCookedVariant: false, raw: { kcal: 172, protein: 1, carbs: 40, fat: 0.6 } },
  { id: 'sweet-chili-sauce', name: "רוטב צ'ילי מתוק", category: 'condiments', hasCookedVariant: false, raw: { kcal: 220, protein: 0.7, carbs: 53, fat: 0.4 } },
  { id: 'hot-sauce', name: 'רוטב חריף (טבסקו/שרירה)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 30, protein: 1, carbs: 5, fat: 1 } },
  { id: 'balsamic-vinegar', name: 'חומץ בלסמי', category: 'condiments', hasCookedVariant: false, raw: { kcal: 88, protein: 0.5, carbs: 17, fat: 0 } },
  { id: 'white-vinegar', name: 'חומץ יין לבן', category: 'condiments', hasCookedVariant: false, raw: { kcal: 19, protein: 0, carbs: 0.4, fat: 0 } },
  { id: 'pesto-jar', name: 'פסטו (צנצנת)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 430, protein: 4, carbs: 6, fat: 44 } },
  { id: 'tartar-sauce', name: 'רוטב טרטר', category: 'condiments', hasCookedVariant: false, raw: { kcal: 380, protein: 0.6, carbs: 8, fat: 39 } },
  { id: 'sour-cream', name: 'שמנת חמוצה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 193, protein: 2.4, carbs: 4.6, fat: 19 } },
  { id: 'jam-strawberry', name: 'ריבת תות', category: 'condiments', hasCookedVariant: false, raw: { kcal: 250, protein: 0.4, carbs: 63, fat: 0.1 } },
  { id: 'nutella', name: 'נוטלה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 539, protein: 6, carbs: 57, fat: 31 } },
  { id: 'harissa', name: 'חריסה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 90, protein: 2.5, carbs: 12, fat: 4 } },
  { id: 'schug', name: 'סחוג', category: 'condiments', hasCookedVariant: false, raw: { kcal: 60, protein: 2, carbs: 6, fat: 3.5 } },

  // ---- Proteins (round 3) ----
  { id: 'beef-cubes-stew', name: 'בקר בקוביות (לתבשיל)', category: 'protein', hasCookedVariant: true, cookedFactor: 0.72, raw: { kcal: 190, protein: 20, carbs: 0, fat: 12 } },
  { id: 'chicken-cubes', name: 'עוף בקוביות', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 120, protein: 22.5, carbs: 0, fat: 2.6 } },
  { id: 'beef-chuck', name: 'כתף בקר', category: 'protein', hasCookedVariant: true, cookedFactor: 0.7, raw: { kcal: 215, protein: 19, carbs: 0, fat: 15 } },
  { id: 'beef-pot-roast', name: 'צלי בקר', category: 'protein', hasCookedVariant: true, cookedFactor: 0.72, raw: { kcal: 180, protein: 21, carbs: 0, fat: 10 } },
  { id: 'entrecote-raw', name: 'אנטריקוט נא', category: 'protein', hasCookedVariant: true, cookedFactor: 0.78, raw: { kcal: 250, protein: 19, carbs: 0, fat: 19 } },
  { id: 'beef-fillet-raw', name: 'פילה בקר נא', category: 'protein', hasCookedVariant: true, cookedFactor: 0.78, raw: { kcal: 190, protein: 21, carbs: 0, fat: 11 } },
  { id: 'turkey-schnitzel-raw', name: 'הודו שניצל נא', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 108, protein: 24, carbs: 0, fat: 1.2 } },
  { id: 'sea-bream', name: 'דג לברק', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 96, protein: 20, carbs: 0, fat: 1.5 } },
  { id: 'tilapia-mousht', name: 'דג מושט', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 96, protein: 20, carbs: 0, fat: 1.7 } },
  { id: 'calamari', name: 'קלמארי', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 92, protein: 15.6, carbs: 3.1, fat: 1.4 } },
  { id: 'scallops', name: 'צדפות ים', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 88, protein: 16.8, carbs: 3.2, fat: 0.8 } },
  { id: 'fresh-tuna-steak', name: 'סטייק טונה טרייה', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 132, protein: 28, carbs: 0, fat: 1.3 } },
  { id: 'duck-breast', name: 'חזה ברווז', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 200, protein: 19, carbs: 0, fat: 13 } },
  { id: 'raw-beef-sausage', name: 'נקניקיית בקר נא', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 270, protein: 12, carbs: 3, fat: 24 } },
  { id: 'ground-lamb', name: 'טלה טחון', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 282, protein: 16, carbs: 0, fat: 24 } },

  // ---- Carbs (round 3) ----
  { id: 'fried-potato-cubes', name: 'תפוח אדמה מטוגן/מוקפץ', category: 'carb', hasCookedVariant: false, raw: { kcal: 165, protein: 2.5, carbs: 24, fat: 7 } },
  { id: 'fried-sweet-potato', name: 'בטטה מטוגנת', category: 'carb', hasCookedVariant: false, raw: { kcal: 168, protein: 2, carbs: 25, fat: 7 } },
  { id: 'whole-wheat-cracker', name: 'פריכית חיטה מלאה', category: 'carb', hasCookedVariant: false, raw: { kcal: 380, protein: 10, carbs: 75, fat: 4 } },
  { id: 'corn-tortilla', name: 'טורטיית תירס', category: 'carb', hasCookedVariant: false, raw: { kcal: 218, protein: 5.7, carbs: 44, fat: 3 } },
  { id: 'burger-bun', name: 'לחמניית המבורגר', category: 'carb', hasCookedVariant: false, raw: { kcal: 280, protein: 9, carbs: 50, fat: 5 } },
  { id: 'whole-wheat-pita', name: 'פיתה מלאה', category: 'carb', hasCookedVariant: false, raw: { kcal: 250, protein: 10, carbs: 48, fat: 2 } },
  { id: 'spelt-bread', name: 'לחם כוסמין', category: 'carb', hasCookedVariant: false, raw: { kcal: 245, protein: 9, carbs: 46, fat: 2.8 } },
  { id: 'sourdough-bread', name: 'לחם מחמצת', category: 'carb', hasCookedVariant: false, raw: { kcal: 258, protein: 9, carbs: 50, fat: 1.5 } },
  { id: 'polenta', name: 'פולנטה (גריסי תירס)', category: 'carb', hasCookedVariant: true, cookedFactor: 3, raw: { kcal: 360, protein: 8, carbs: 79, fat: 1.3 } },
  { id: 'orzo-pasta', name: 'פסטה אורזו', category: 'carb', hasCookedVariant: true, cookedFactor: 2.2, raw: { kcal: 371, protein: 13, carbs: 75, fat: 1.5 } },

  // ---- Fats & Extras (round 3) ----
  { id: 'coconut-oil', name: 'שמן קוקוס', category: 'fat', hasCookedVariant: false, raw: { kcal: 862, protein: 0, carbs: 0, fat: 100 } },
  { id: 'cashew-butter', name: 'חמאת קשיו', category: 'fat', hasCookedVariant: false, raw: { kcal: 587, protein: 18, carbs: 28, fat: 46 } },
  { id: 'mozzarella-light', name: 'מוצרלה קלה', category: 'fat', hasCookedVariant: false, raw: { kcal: 180, protein: 24, carbs: 3, fat: 8 } },
  { id: 'cheese-5', name: 'גבינה צהובה 5%', category: 'fat', hasCookedVariant: false, raw: { kcal: 175, protein: 26, carbs: 2, fat: 5 } },
  { id: 'kalamata-olives', name: 'זיתי קלמטה', category: 'fat', hasCookedVariant: false, raw: { kcal: 155, protein: 1, carbs: 4, fat: 15 } },
  { id: 'sweet-tahini', name: 'טחינה עם דבש', category: 'fat', hasCookedVariant: false, raw: { kcal: 430, protein: 10, carbs: 35, fat: 30 } },
  { id: 'guacamole', name: 'גוואקמולי', category: 'fat', hasCookedVariant: false, raw: { kcal: 150, protein: 2, carbs: 8, fat: 13 } },
  { id: 'pine-nuts', name: 'צנוברים', category: 'fat', hasCookedVariant: false, raw: { kcal: 673, protein: 14, carbs: 13, fat: 68 } },

  // ---- Veggies (round 3) ----
  { id: 'baby-corn', name: 'תירס גמדים', category: 'veg', hasCookedVariant: false, raw: { kcal: 25, protein: 2, carbs: 5, fat: 0.2 } },
  { id: 'purple-cabbage', name: 'כרוב סגול', category: 'veg', hasCookedVariant: false, raw: { kcal: 27, protein: 1.4, carbs: 6.2, fat: 0.2 } },
  { id: 'red-onion', name: 'בצל סגול', category: 'veg', hasCookedVariant: false, raw: { kcal: 40, protein: 1.1, carbs: 9.3, fat: 0.1 } },
  { id: 'garlic', name: 'שום', category: 'veg', hasCookedVariant: false, raw: { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 } },
  { id: 'ginger', name: "ג'ינג'ר טרי", category: 'veg', hasCookedVariant: false, raw: { kcal: 80, protein: 1.8, carbs: 18, fat: 0.8 } },
  { id: 'pickles', name: 'מלפפון חמוץ', category: 'veg', hasCookedVariant: false, raw: { kcal: 11, protein: 0.3, carbs: 2.3, fat: 0.2 } },
  { id: 'green-olives', name: 'זיתים ירוקים', category: 'veg', hasCookedVariant: false, raw: { kcal: 145, protein: 1, carbs: 3.8, fat: 15 } },
  { id: 'romaine-lettuce', name: 'חסה רומאית', category: 'veg', hasCookedVariant: false, raw: { kcal: 17, protein: 1.2, carbs: 3.3, fat: 0.3 } },
  { id: 'okra', name: 'במיה', category: 'veg', hasCookedVariant: false, raw: { kcal: 33, protein: 1.9, carbs: 7.5, fat: 0.2 } },
  { id: 'leek', name: 'כרישה', category: 'veg', hasCookedVariant: false, raw: { kcal: 61, protein: 1.5, carbs: 14, fat: 0.3 } },

  // ---- Fruit (round 3) ----
  { id: 'grapefruit', name: 'אשכולית', category: 'fruit', hasCookedVariant: false, raw: { kcal: 42, protein: 0.8, carbs: 11, fat: 0.1 } },
  { id: 'lime', name: 'ליים', category: 'fruit', hasCookedVariant: false, raw: { kcal: 30, protein: 0.7, carbs: 11, fat: 0.2 } },
  { id: 'lemon', name: 'לימון', category: 'fruit', hasCookedVariant: false, raw: { kcal: 29, protein: 1.1, carbs: 9.3, fat: 0.3 } },
  { id: 'raspberries', name: 'פטל', category: 'fruit', hasCookedVariant: false, raw: { kcal: 52, protein: 1.2, carbs: 12, fat: 0.7 } },
  { id: 'blueberries', name: 'אוכמניות', category: 'fruit', hasCookedVariant: false, raw: { kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 } },
  { id: 'plum', name: 'שזיף', category: 'fruit', hasCookedVariant: false, raw: { kcal: 46, protein: 0.7, carbs: 11, fat: 0.3 } },
  { id: 'fig-fresh', name: 'תאנה טרייה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 74, protein: 0.8, carbs: 19, fat: 0.3 } },
  { id: 'passion-fruit', name: 'פסיפלורה', category: 'fruit', hasCookedVariant: false, raw: { kcal: 97, protein: 2.2, carbs: 23, fat: 0.7 } },

  // ---- Dairy & Snacks (round 3) ----
  { id: 'soy-milk', name: 'חלב סויה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 33, protein: 3.3, carbs: 1.8, fat: 1.8 } },
  { id: 'almond-milk', name: 'חלב שקדים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 15, protein: 0.5, carbs: 0.6, fat: 1.2 } },
  { id: 'oat-milk', name: 'חלב שיבולת שועל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 47, protein: 1, carbs: 7.5, fat: 1.5 } },
  { id: 'vanilla-yogurt', name: 'יוגורט וניל', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 105, protein: 4, carbs: 17, fat: 2.5 } },
  { id: 'mozzarella-stick', name: 'מוצרלה סטיק (חטיף)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 300, protein: 15, carbs: 20, fat: 18 } },
  { id: 'sweet-corn-snack', name: 'פריכיות תירס מתוקות', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 400, protein: 4, carbs: 90, fat: 2 } },
  { id: 'waffle-crackers', name: 'וופל פריכיות', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 480, protein: 6, carbs: 65, fat: 22 } },
  { id: 'low-fat-shoko', name: 'שוקו דל שומן', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 52, protein: 3.3, carbs: 8, fat: 0.7 } },
  { id: 'protein-cookies', name: 'עוגיות פרוטאין', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 420, protein: 25, carbs: 40, fat: 18 } },
  { id: 'rice-pudding-snack', name: 'פודינג אורז (מעדנייה)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 120, protein: 3, carbs: 20, fat: 3 } },

  // ---- Condiments & Sauces (round 3) ----
  { id: 'garlic-paste', name: 'שום כתוש', category: 'condiments', hasCookedVariant: false, raw: { kcal: 149, protein: 6.4, carbs: 33, fat: 0.5 } },
  { id: 'tomato-paste', name: 'רסק עגבניות', category: 'condiments', hasCookedVariant: false, raw: { kcal: 82, protein: 4.3, carbs: 19, fat: 0.5 } },
  { id: 'crushed-tomatoes', name: 'עגבניות מרוסקות (שימורים)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 32, protein: 1.6, carbs: 7, fat: 0.3 } },
  { id: 'chicken-broth', name: 'ציר עוף', category: 'condiments', hasCookedVariant: false, raw: { kcal: 15, protein: 1.5, carbs: 1, fat: 0.5 } },
  { id: 'beef-broth', name: 'ציר בקר', category: 'condiments', hasCookedVariant: false, raw: { kcal: 17, protein: 2, carbs: 1, fat: 0.5 } },
  { id: 'cooking-cream', name: 'שמנת מתוקה לבישול', category: 'condiments', hasCookedVariant: false, raw: { kcal: 292, protein: 2.5, carbs: 3.5, fat: 30 } },
  { id: 'coconut-milk', name: 'חלב קוקוס', category: 'condiments', hasCookedVariant: false, raw: { kcal: 230, protein: 2.3, carbs: 5.5, fat: 24 } },
  { id: 'dijon-mustard', name: 'חרדל דיז׳ון', category: 'condiments', hasCookedVariant: false, raw: { kcal: 66, protein: 4.4, carbs: 5, fat: 4 } },
  { id: 'vanilla-extract', name: 'תמצית וניל', category: 'condiments', hasCookedVariant: false, raw: { kcal: 288, protein: 0.1, carbs: 12.7, fat: 0.1 } },
  { id: 'sesame-seeds', name: 'שומשום גרעינים', category: 'condiments', hasCookedVariant: false, raw: { kcal: 573, protein: 17.7, carbs: 23.4, fat: 49.7 } },

  // ---- Proteins (round 4) ----
  { id: 'chicken-thigh-cutlet', name: 'פרגית עוף', category: 'protein', hasCookedVariant: true, cookedFactor: 0.75, raw: { kcal: 209, protein: 18, carbs: 0, fat: 15 } },
  { id: 'turkey-ground-smoked', name: 'נקניק הודו טחון', category: 'protein', hasCookedVariant: false, raw: { kcal: 145, protein: 17, carbs: 3, fat: 7 } },
  { id: 'sardines-oil', name: 'סרדינים בשמן', category: 'protein', hasCookedVariant: false, raw: { kcal: 208, protein: 24.6, carbs: 0, fat: 11.5 } },
  { id: 'mackerel', name: 'מקרל', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 205, protein: 19, carbs: 0, fat: 14 } },
  { id: 'trout', name: 'פורל', category: 'protein', hasCookedVariant: true, cookedFactor: 0.85, raw: { kcal: 148, protein: 20.8, carbs: 0, fat: 6.6 } },
  { id: 'corned-beef', name: 'קורנד ביף (משומר)', category: 'protein', hasCookedVariant: false, raw: { kcal: 250, protein: 24, carbs: 0, fat: 16 } },
  { id: 'smoked-chicken-breast', name: 'חזה עוף מעושן', category: 'protein', hasCookedVariant: false, raw: { kcal: 130, protein: 23, carbs: 1.5, fat: 3 } },

  // ---- Carbs (round 4) ----
  { id: 'black-rice', name: 'אורז שחור', category: 'carb', hasCookedVariant: true, cookedFactor: 2.5, raw: { kcal: 356, protein: 8.9, carbs: 75.6, fat: 3.2 } },
  { id: 'bulgur-coarse', name: 'בורגול גס', category: 'carb', hasCookedVariant: true, cookedFactor: 2.5, raw: { kcal: 342, protein: 12.3, carbs: 76, fat: 1.3 } },
  { id: 'american-sliced-bread', name: 'לחם אמריקאי פרוס', category: 'carb', hasCookedVariant: false, raw: { kcal: 264, protein: 8, carbs: 49, fat: 3.5 } },
  { id: 'mashed-potato-ready', name: 'פירה תפוחי אדמה מוכן', category: 'carb', hasCookedVariant: false, raw: { kcal: 110, protein: 2, carbs: 16, fat: 4 } },

  // ---- Fats & Extras (round 4) ----
  { id: 'black-tahini', name: 'טחינה שחורה', category: 'fat', hasCookedVariant: false, raw: { kcal: 603, protein: 18, carbs: 18, fat: 55 } },
  { id: 'mascarpone', name: 'גבינת מסקרפונה', category: 'fat', hasCookedVariant: false, raw: { kcal: 429, protein: 4.3, carbs: 4.8, fat: 44 } },
  { id: 'heavy-cream-38', name: 'שמנת מתוקה 38%', category: 'fat', hasCookedVariant: false, raw: { kcal: 346, protein: 2.2, carbs: 3, fat: 38 } },
  { id: 'spicy-chili-oil', name: 'שמן צ׳ילי חריף', category: 'fat', hasCookedVariant: false, raw: { kcal: 850, protein: 0.5, carbs: 2, fat: 92 } },

  // ---- Veggies (round 4) ----
  { id: 'iceberg-lettuce', name: 'חסה אייסברג', category: 'veg', hasCookedVariant: false, raw: { kcal: 14, protein: 0.9, carbs: 3, fat: 0.1 } },
  { id: 'frozen-spinach', name: 'תרד קפוא (מבושל)', category: 'veg', hasCookedVariant: false, raw: { kcal: 23, protein: 2.9, carbs: 3.8, fat: 0.3 } },
  { id: 'green-peas', name: 'אפונה ירוקה', category: 'veg', hasCookedVariant: false, raw: { kcal: 81, protein: 5.4, carbs: 14, fat: 0.4 } },
  { id: 'frozen-cauliflower', name: 'כרובית קפואה (מבושלת)', category: 'veg', hasCookedVariant: false, raw: { kcal: 23, protein: 1.8, carbs: 4.4, fat: 0.3 } },
  { id: 'yellow-pepper', name: 'פלפל צהוב', category: 'veg', hasCookedVariant: false, raw: { kcal: 27, protein: 1, carbs: 6.3, fat: 0.2 } },
  { id: 'sweet-potato-mash', name: 'מחית בטטה', category: 'veg', hasCookedVariant: false, raw: { kcal: 86, protein: 1.6, carbs: 20, fat: 0.1 } },

  // ---- Fruit (round 4) ----
  { id: 'lychee', name: 'ליצ׳י', category: 'fruit', hasCookedVariant: false, raw: { kcal: 66, protein: 0.8, carbs: 17, fat: 0.4 } },
  { id: 'frozen-mango', name: 'מנגו קפוא', category: 'fruit', hasCookedVariant: false, raw: { kcal: 60, protein: 0.8, carbs: 15, fat: 0.4 } },
  { id: 'barhi-dates', name: 'תמר ברהי', category: 'fruit', hasCookedVariant: false, raw: { kcal: 143, protein: 1.9, carbs: 34, fat: 0.2 } },
  { id: 'blood-orange', name: 'תפוז דם', category: 'fruit', hasCookedVariant: false, raw: { kcal: 45, protein: 0.9, carbs: 11.5, fat: 0.1 } },

  // ---- Dairy & Snacks (round 4) ----
  { id: 'high-protein-yogurt', name: 'יוגורט פרו עתיר חלבון', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 65, protein: 10, carbs: 4, fat: 0.2 } },
  { id: 'philadelphia-cheese', name: 'גבינת שמנת פילדלפיה', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 253, protein: 5.9, carbs: 4.1, fat: 24 } },
  { id: 'bamba-nuts', name: 'במבה אגוזים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 555, protein: 15, carbs: 42, fat: 37 } },
  { id: 'flavored-chips', name: "תפוצ'יפס בטעם (גבינה/בצל)", category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 540, protein: 6, carbs: 52, fat: 34 } },
  { id: 'nutella-wafer-snack', name: 'וופל נוטלה (חטיף)', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 510, protein: 6, carbs: 58, fat: 28 } },
  { id: 'goat-milk', name: 'חלב עיזים', category: 'dairy_snacks', hasCookedVariant: false, raw: { kcal: 69, protein: 3.6, carbs: 4.4, fat: 4.1 } },

  // ---- Condiments & Sauces (round 4) ----
  { id: 'sweet-soy-sauce', name: 'רוטב סויה מתוק', category: 'condiments', hasCookedVariant: false, raw: { kcal: 137, protein: 3, carbs: 30, fat: 0.2 } },
  { id: 'red-pesto', name: 'פסטו אדום (עגבניות מיובשות)', category: 'condiments', hasCookedVariant: false, raw: { kcal: 350, protein: 4, carbs: 12, fat: 32 } },
  { id: 'zaatar', name: "זעתר", category: 'condiments', hasCookedVariant: false, raw: { kcal: 350, protein: 10, carbs: 40, fat: 15 } },
  { id: 'sumac', name: 'סומק', category: 'condiments', hasCookedVariant: false, raw: { kcal: 245, protein: 4, carbs: 65, fat: 5 } },
  { id: 'sweet-paprika', name: 'פפריקה מתוקה', category: 'condiments', hasCookedVariant: false, raw: { kcal: 282, protein: 14, carbs: 54, fat: 13 } },
  { id: 'cumin', name: 'כמון', category: 'condiments', hasCookedVariant: false, raw: { kcal: 375, protein: 18, carbs: 44, fat: 22 } },
];

const INGREDIENT_CATEGORIES = [
  { id: 'protein', label: 'חלבון', icon: Beef, tint: 'protein' },
  { id: 'carb', label: 'פחמימה', icon: Wheat, tint: 'carbs' },
  { id: 'fat', label: 'שומן', icon: Droplet, tint: 'fat' },
  { id: 'veg', label: 'ירקות', icon: Salad, tint: 'kcal' },
  { id: 'fruit', label: 'פירות', icon: Apple, tint: 'accent' },
  { id: 'dairy_snacks', label: 'חלב וחטיפים', icon: Milk, tint: 'accent' },
  { id: 'condiments', label: 'רטבים ותבלינים', icon: FlaskConical, tint: 'accent' },
];

// Generic volume/piece → gram approximations, used when the person prefers measuring by
// tablespoon/teaspoon/cup/piece instead of a kitchen scale. These are broad averages (a cup of
// rice and a cup of oil don't actually weigh the same) — a deliberate, documented simplification
// that trades perfect per-ingredient density for a simple, transparent, universally-usable system.
const PORTION_UNITS = [
  { id: 'gram', label: 'גרם', shortLabel: 'גר׳', gramsPerUnit: 1, step: 5, defaultQty: 100 },
  { id: 'tbsp', label: 'כף', shortLabel: 'כף', gramsPerUnit: 15, step: 0.5, defaultQty: 1 },
  { id: 'tsp', label: 'כפית', shortLabel: 'כפית', gramsPerUnit: 5, step: 0.5, defaultQty: 1 },
  { id: 'cup', label: 'כוס', shortLabel: 'כוס', gramsPerUnit: 200, step: 0.25, defaultQty: 1 },
  { id: 'piece', label: 'יחידה', shortLabel: 'יח׳', gramsPerUnit: 100, step: 1, defaultQty: 1 },
  { id: 'handful', label: 'חופן', shortLabel: 'חופן', gramsPerUnit: 30, step: 0.5, defaultQty: 1 },
  { id: 'slice', label: 'פרוסה', shortLabel: 'פרוסה', gramsPerUnit: 25, step: 0.5, defaultQty: 1 },
  { id: 'can', label: 'קופסה/פחית', shortLabel: 'קופסה', gramsPerUnit: 150, step: 0.25, defaultQty: 1 },
  { id: 'palm', label: 'כף יד', shortLabel: 'כף יד', gramsPerUnit: 90, step: 0.5, defaultQty: 1 },
];

// Derives per-100g macros for the requested state (raw/cooked) from the single raw base —
// this is the "conversion calculator": cooked values are computed, never duplicated by hand.
function getPer100(ingredient, state) {
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

function getIngredientMacros(ingredient, state, grams) {
  const per100 = getPer100(ingredient, state);
  const factor = grams / 100;
  return {
    kcal: Math.round(per100.kcal * factor),
    protein: roundNum(per100.protein * factor),
    carbs: roundNum(per100.carbs * factor),
    fat: roundNum(per100.fat * factor),
  };
}

function emptyCustomIngredient() {
  return { id: newId('ing'), name: '', category: 'protein', hasCookedVariant: false, raw: { kcal: '', protein: '', carbs: '', fat: '' }, isCustom: true };
}

/* ============================= SPRINT 15 · DATE-FIRST STATE ENGINE & UNIFIED ITEM SCHEMA ============================= */

// The single source of truth for slot identity everywhere in the app — Timeline, Cibus sheet,
// Kitchen Hacks, Plate Composer, and every quick-log flow all read from this one list now,
// instead of each screen inventing its own slot labels (which is how slot mismatches happened).
const SLOT_DEFS = [
  { id: 'breakfast', time: '08:00', label: 'בוקר', emoji: '🌅', icon: Sunrise },
  { id: 'midmorning', time: '10:30', label: 'ביניים', emoji: '🍏', icon: Coffee },
  { id: 'lunch', time: '13:00', label: 'צהריים', emoji: '🍲', icon: UtensilsCrossed },
  { id: 'preworkout', time: '16:30', label: 'אחה"כ', emoji: '🍌', icon: Dumbbell },
  { id: 'dinner', time: '20:00', label: 'ערב', emoji: '🍳', icon: Moon },
];
const PORTION_SLOTS = SLOT_DEFS; // kept as an alias so any earlier-sprint reference still resolves

// Every logged item — regardless of whether it came from Cibus, a Kitchen Hack, the raw
// ingredient/Plate Composer, quick-log text parsing, or a Smart Swap — is normalized into this
// exact shape before it ever enters state. `grams` is a *portion index*, not a literal gram
// count for composite dishes: 100 = "the recorded portion as logged," and base* fields hold the
// macros at that baseline, so editing the portion later (50/150/etc.) scales everything
// proportionally and consistently, regardless of what kind of food it originally was.
function makeLoggedItem({ dateKey, slotId, name, calories, protein, carbs, fats, source, isCompleted = true }) {
  return {
    id: newId('log'),
    dateKey,
    slotId,
    name,
    baseCalories: Math.round(calories) || 0,
    baseProtein: roundNum(protein) || 0,
    baseCarbs: roundNum(carbs) || 0,
    baseFats: roundNum(fats) || 0,
    grams: 100,
    isCompleted,
    source: source || 'manual',
  };
}

function scaleLoggedItem(item) {
  const factor = (item.grams ?? 100) / 100;
  return {
    calories: Math.round(item.baseCalories * factor),
    protein: roundNum(item.baseProtein * factor),
    carbs: roundNum(item.baseCarbs * factor),
    fats: roundNum(item.baseFats * factor),
  };
}

function sumItems(items) {
  return items.reduce(
    (acc, item) => {
      if (!item.isCompleted) return acc;
      const m = scaleLoggedItem(item);
      return { kcal: acc.kcal + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fats };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function shiftDateKey(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dateKey(dt);
}

// Scans backward through exerciseLogs (dates strictly before currentDateKey) for the most recent
// session where this exercise had a logged weight — this is what powers the "+2.5kg PR" delta badge.
function getLastLoggedSet(exerciseLogs, exerciseName, currentDateKey) {
  const dates = Object.keys(exerciseLogs).filter((d) => d < currentDateKey && exerciseLogs[d]?.[exerciseName]?.weight).sort().reverse();
  if (!dates.length) return null;
  return { date: dates[0], ...exerciseLogs[dates[0]][exerciseName] };
}

function formatHebrewDate(key) {
  const today = dateKey(new Date());
  const yesterday = shiftDateKey(today, -1);
  const tomorrow = shiftDateKey(today, 1);
  if (key === today) return 'היום';
  if (key === yesterday) return 'אתמול';
  if (key === tomorrow) return 'מחר';
  const [, m, d] = key.split('-');
  const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  return `${parseInt(d, 10)} ב${months[parseInt(m, 10) - 1]}`;
}



const HACK_EMOJIS = ['🍕', '🍔', '🥪', '🥣', '🍝', '🍗', '🥗', '🍲', '🌯', '🍳', '🥙', '🍱'];

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyFoodItem() {
  return { id: newId('item'), name: '', kcal: '', protein: '', carbs: '', fat: '' };
}

function emptyRestaurant() {
  return {
    id: newId('rest'),
    name: '',
    isCustom: true,
    type: 'simple', // 'simple' (pick one dish) | 'plate3' (build a 3-part plate)
    dishes: [emptyFoodItem()],
    plateOptions: { veg: [emptyFoodItem()], protein: [emptyFoodItem()], carb: [emptyFoodItem()] },
  };
}

function emptyHack() {
  return { id: newId('hack'), name: '', kcal: '', protein: '', carbs: '', fat: '', icon: '🍽️', detail: 'מתכון אישי', isCustom: true };
}

// Enumerate every combination the built-in Cibus builders can produce, plus every
// custom restaurant's dishes/plate combos, plus all Kitchen Hacks — this is the
// candidate pool the "מה לאכול עכשיו?" Smart Swap engine searches for the closest fit.
function buildFoodLibrary(customRestaurants, customHacks) {
  const lib = [];

  SHUMSHUM.veg.forEach((v) => SHUMSHUM.protein.forEach((p) => SHUMSHUM.carb.forEach((c) => {
    lib.push({
      id: `shumshum-${v.id}-${p.id}-${c.id}`, name: `שומשום · ${p.name}`, source: 'שומשום',
      kcal: v.kcal + p.kcal + c.kcal, protein: v.protein + p.protein + c.protein,
      carbs: v.carbs + p.carbs + c.carbs, fat: v.fat + p.fat + c.fat,
    });
  })));

  CHICKEN_STATION.protein.forEach((p) => CHICKEN_STATION.carb.forEach((c) => {
    const veg = CHICKEN_STATION.veg;
    lib.push({
      id: `chicken-${p.id}-${c.id}`, name: `צ'יקן סטיישן · ${p.name}`, source: "צ'יקן סטיישן",
      kcal: p.kcal + c.kcal + veg.kcal, protein: p.protein + c.protein + veg.protein,
      carbs: p.carbs + c.carbs + veg.carbs, fat: p.fat + c.fat + veg.fat,
    });
  }));

  GOOMBA.forEach((g) => lib.push({ id: `goomba-${g.id}`, name: `גומבה · ${g.name}`, source: 'גומבה', kcal: g.kcal, protein: g.protein, carbs: g.carbs, fat: g.fat }));

  KANSAI.protein.forEach((p) => {
    const { rice, veg, sauce } = KANSAI;
    lib.push({
      id: `kansai-${p.id}`, name: `קנסאי · ${p.name}`, source: 'קנסאי',
      kcal: p.kcal + rice.kcal + veg.kcal + sauce.kcal, protein: p.protein + rice.protein + veg.protein + sauce.protein,
      carbs: p.carbs + rice.carbs + veg.carbs + sauce.carbs, fat: p.fat + rice.fat + veg.fat + sauce.fat,
    });
  });

  [...HACKS, ...customHacks].forEach((h) => lib.push({ id: `hack-${h.id}`, name: h.name, source: 'Kitchen Hack', kcal: Number(h.kcal) || 0, protein: Number(h.protein) || 0, carbs: Number(h.carbs) || 0, fat: Number(h.fat) || 0 }));

  EATING_OUT_MENU.forEach((e) => lib.push({ id: `eatingout-${e.id}`, name: e.name, source: 'אוכל בחוץ', kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat }));

  customRestaurants.forEach((r) => {
    if (r.type === 'simple') {
      r.dishes.forEach((d) => {
        if (!d.name) return;
        lib.push({ id: `custom-${r.id}-${d.id}`, name: `${r.name} · ${d.name}`, source: r.name, kcal: Number(d.kcal) || 0, protein: Number(d.protein) || 0, carbs: Number(d.carbs) || 0, fat: Number(d.fat) || 0 });
      });
    } else {
      const { veg, protein, carb } = r.plateOptions;
      veg.forEach((v) => protein.forEach((p) => carb.forEach((c) => {
        if (!v.name || !p.name || !c.name) return;
        lib.push({
          id: `custom-${r.id}-${v.id}-${p.id}-${c.id}`, name: `${r.name} · ${p.name}`, source: r.name,
          kcal: (Number(v.kcal) || 0) + (Number(p.kcal) || 0) + (Number(c.kcal) || 0),
          protein: (Number(v.protein) || 0) + (Number(p.protein) || 0) + (Number(c.protein) || 0),
          carbs: (Number(v.carbs) || 0) + (Number(p.carbs) || 0) + (Number(c.carbs) || 0),
          fat: (Number(v.fat) || 0) + (Number(p.fat) || 0) + (Number(c.fat) || 0),
        });
      })));
    }
  });

  return lib;
}

// Ranks the food library by closeness to the remaining calorie/protein gap for the day.
function findBestMatches(library, remainingKcal, remainingProtein, n = 3) {
  const targetKcal = Math.max(remainingKcal, 50);
  const targetProtein = Math.max(remainingProtein, 5);
  return library
    .map((item) => {
      const kcalDiff = Math.abs(item.kcal - targetKcal);
      const proteinDiff = Math.abs(item.protein - targetProtein);
      return { ...item, matchScore: kcalDiff / 40 + proteinDiff / 6 };
    })
    .sort((a, b) => a.matchScore - b.matchScore)
    .slice(0, n);
}

/* ============================= PROFILE & GOALS ENGINE ============================= */

const ACTIVITY_LEVELS = {
  sedentary: { label: 'יושבני', mult: 1.2 },
  office: { label: 'משרד + הליכות / תזזיתי', mult: 1.55 },
  veryActive: { label: 'פעיל מאוד', mult: 1.75 },
};

const GOALS = {
  aggressive: { label: 'חיטוב עצבני', pct: -0.25, color: JEWEL.dark.bronze },
  moderate: { label: 'חיטוב מתון', pct: -0.15, color: JEWEL.dark.petrol },
  maintain: { label: 'שמירה', pct: 0, color: JEWEL.dark.jade },
  bulk: { label: 'מסה', pct: 0.12, color: JEWEL.dark.plum },
};

const STORAGE_KEY = 'project-shred-state';

const DEFAULT_PROFILES = {
  mine: {
    id: 'mine', name: 'הפרופיל שלי', age: 29, weight: 84, height: 171, waist: 103,
    activity: 'office', goal: 'moderate', locked: true,
  },
  guest: {
    id: 'guest', name: 'פרופיל אורח / חבר', age: 30, weight: 78, height: 175, waist: 92,
    activity: 'sedentary', goal: 'maintain', locked: true,
  },
};

const DEFAULT_THEME_SETTINGS = { mode: 'dark', accentKey: 'emerald', density: 'comfortable', feedback: true };

/* ============================= SPRINT 8 · GUIDE, LEGEND & TOUR CONTENT ============================= */

function getLegendColors(macro) {
  return [
    { hex: macro.protein, label: 'ירוק ג׳ייד (Jade)', desc: 'יעדים, חלבון ומצבי הצלחה (וי, השלמת יעד)' },
    { hex: macro.kcal, label: 'ברונזה (Bronze)', desc: 'קלוריות, אנרגיה ואינדיקציית תדלוק (Refeed)' },
    { hex: macro.carbs, label: 'כחול פלדה (Steel)', desc: 'פחמימות בכל מקום בדשבורד' },
    { hex: macro.fat, label: 'סגול פלאם (Plum)', desc: 'שומן, וגם חלק מצבעי היעדים המטבוליים' },
  ];
}

const GLOSSARY = [
  {
    term: 'NEAT', full: 'Non-Exercise Activity Thermogenesis',
    desc: 'כל שריפת הקלוריות היומיומית שאינה אימון מובנה — הליכה לעבודה, עמידה, תזזיתיות. ב-PROJECT SHRED זה מיוצג ע"י יעד הצעדים היומי (8,000-10,000) שמוזן לתוך רמת הפעילות בפרופיל.',
  },
  {
    term: 'BMR / TDEE', full: 'Basal Metabolic Rate / Total Daily Energy Expenditure',
    desc: 'BMR הוא חילוף החומרים הבסיסי — כמות הקלוריות שהגוף שורף במנוחה מוחלטת. TDEE הוא ה-BMR מוכפל במקדם הפעילות היומית — זו ההוצאה הקלורית האמיתית שממנה נגזר היעד היומי.',
  },
  {
    term: 'Refeed / פחמימת אימון', full: 'Training-Day Carbohydrate Refeed',
    desc: 'ביום אימון המערכת מוסיפה 300 קלוריות אוטומטית — כולן כפחמימה (75 גרם) — כדי לתדלק ולמלא מאגרי גליקוגן סביב האימון, ולתמוך בביצועים ובהתאוששות.',
  },
  {
    term: 'Progressive Overload', full: 'עומס פרוגרסיבי',
    desc: 'העיקרון שמניע התקדמות בחדר הכושר: הוספה הדרגתית ועקבית של משקל, חזרות או נפח אימון לאורך זמן. מעקב הסטים בארנה 04 קיים בדיוק כדי לתעד את זה מפגישה לפגישה.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'מה עושים אם חרגתי בארוחה מחוץ לתפריט?',
    a: 'עקרון ה-80/20: אם 80% מהתזונה השבועית שלך תואמת את התפריט והיעדים, חריגה חד-פעמית לא תשפיע על התוצאה לטווח ארוך. תעדו את זה, המשיכו הלאה, וחזרו לתפריט בארוחה הבאה — בלי "לפצות" עם הגבלה קיצונית.',
  },
  {
    q: 'איך מתנהלים בארוחות שישי / סוף שבוע?',
    a: 'תכננו מראש: אם יודעים שיש ארוחה גדולה בערב, אפשר להקטין מעט פחמימה/שומן בארוחות הקודמות של אותו יום ("shifting", לא "starving"). אל תדלגו על ארוחות כדי "לחסוך" קלוריות — זה פוגע באנרגיה ובשליטה.',
  },
  {
    q: 'מה עושים ביום מחלה, טיסה או נסיעת עסקים?',
    a: 'ביום כזה שמירה על היעד היא הישג, לא כישלון. אם אין גישה לתפריט הרגיל — התמקדו בחלבון מספק (הכי קל לפספס) ובשתייה, ותנו לעצמכם גמישות מלאה בבחירת המקורות. חזרה לשגרה ברגע שאפשר.',
  },
];

const TOUR_STEPS = [
  { id: 1, ref: 'header', tab: null, title: 'שלב 1 · בורר יום ופרופיל', desc: 'כאן עוברים בין יום אימון ליום מנוחה ומחליפים פרופיל — הכל דינמי ומחושב מחדש בזמן אמת.' },
  { id: 2, ref: 'today', tab: 'today', title: 'שלב 2 · טאב היום', desc: 'טבעת אחת ומרוכזת: קלוריות שנותרו בחוץ, חלבון בפנים. הכרטיס שמתחתיה מציג את הארוחה הנוכחית לפי השעה, עם סימון/עריכה בלחיצה אחת.' },
  { id: 3, ref: 'nutrition', tab: 'nutrition', title: 'שלב 3 · טאב תזונה', desc: 'ציר הזמן היומי, Cibus, ובניית צלחת אישית — הכל נפתח כעת בגיליון נקי מלמטה כדי לא להעמיס על המסך. כפתור ה-+ למטה פותח כל אחד מהם ישירות.' },
  { id: 4, ref: 'workouts', tab: 'workouts', title: 'שלב 4 · טאב אימונים', desc: 'מעקב סטים וטיימר מנוחה. תובנות, אנליטיקה ומעקב משקל/היקף מותן עברו לטאב "תובנות" הנפרד.' },
];


// Mifflin-St Jeor: BMR = 10*weight + 6.25*height - 5*age + 5
function computeProfileTargets(profile) {
  const w = Number(profile.weight) || 0;
  const h = Number(profile.height) || 0;
  const a = Number(profile.age) || 0;
  const bmr = 10 * w + 6.25 * h - 5 * a + 5;
  const activityMult = (ACTIVITY_LEVELS[profile.activity] || ACTIVITY_LEVELS.office).mult;
  const tdee = bmr * activityMult;
  const goalPct = (GOALS[profile.goal] || GOALS.maintain).pct;

  const restKcal = Math.max(Math.round(tdee * (1 + goalPct)), 0);
  const protein = Math.round(w * 2.0);
  const fat = Math.round(w * 0.7);
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const restCarbKcal = Math.max(restKcal - proteinKcal - fatKcal, 0);
  const restCarbs = Math.round(restCarbKcal / 4);

  // Training-day refeed: +300kcal, delivered entirely as carbs (+75g)
  const trainingKcal = restKcal + 300;
  const trainingCarbs = restCarbs + 75;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    rest: { label: 'יום מנוחה', kcal: restKcal, protein, fat, carbs: restCarbs },
    training: { label: 'יום אימון', kcal: trainingKcal, protein, fat, carbs: trainingCarbs },
  };
}

/* ============================= SPRINT 9 · AI COACH ENGINE (100% CLIENT-SIDE, ZERO-KEY) ============================= */

// Small heuristic food database. type='per100g' scales by grams/100; type='perUnit' scales by count.
const FOOD_DB = [
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

function roundNum(n) {
  return Math.round(n * 10) / 10;
}

// Heuristic client-side parser: scans the free-text log entry for known food keywords,
// then looks in a small window immediately before (quantity/grams) and after (size adjectives)
// each match to estimate a realistic portion — no network call, no external NLP service.
function parseFoodText(text) {
  if (!text || !text.trim()) return [];
  const found = [];
  const seenLabels = new Set();

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
      const grams = Math.round((hasGramUnit ? qty : food.defaultGrams) * sizeMult);
      const factor = grams / 100;
      found.push({
        id: `${food.label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
        id: `${food.label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

const MENTAL_TIPS = {
  training: [
    'שינה של 7-8 שעות הלילה חשובה יותר מהסט האחרון באימון — תעדפו אותה.',
    'התאוששות היא חלק מהאימון, לא הפסקה ממנו. תנו לגוף את הזמן שהוא צריך.',
    'עקביות מנצחת עצימות חד-פעמית — היום היה עוד לבנה בקיר, לא הכל או כלום.',
  ],
  rest: [
    'יום מנוחה הוא לא יום "לא עשיתי כלום" — זה היום שבו הגוף בונה את מה שפירקתם אתמול.',
    'תזוזה קלה (הליכה, מתיחות) ביום מנוחה יכולה להוריד עייפות טובה יותר מישיבה מוחלטת.',
    'המשמעת שאתם בונים היום ביום מנוחה היא בדיוק מה שתומך ביום האימון הבא.',
  ],
};

// Rule-based "AI report" — deterministic, explainable, and works with zero API key.
function generateAiReport({ consumed, targets, dayMode }) {
  const proteinPct = targets.protein > 0 ? consumed.protein / targets.protein : 0;
  const kcalDelta = targets.kcal > 0 ? Math.abs(consumed.kcal - targets.kcal) / targets.kcal : 0;
  const proteinScore = Math.min(proteinPct, 1) * 100;
  const kcalScore = Math.max(0, 100 - kcalDelta * 100);
  const score = Math.round(proteinScore * 0.6 + kcalScore * 0.4);

  const proteinGap = Math.round(targets.protein - consumed.protein);
  const kcalGap = Math.round(targets.kcal - consumed.kcal);

  let tactical;
  if (proteinGap > 25) {
    tactical = `אתם בפיגור של כ-${proteinGap} גרם חלבון מהיעד. שקלו טוסט חלבון או מעדן חלבון + פסטרמה בארוחה הקרובה כדי לסגור את הפער.`;
  } else if (kcalGap < -150) {
    tactical = `חרגתם בכ-${Math.abs(kcalGap)} קלוריות מהיעד היומי. אין צורך "לתקן" בהגבלה קיצונית — פשוט העדיפו ארוחה קלה יותר מבוססת חלבון וירקות בהמשך היום.`;
  } else if (kcalGap > 400) {
    tactical = `נשארו לכם כ-${kcalGap} קלוריות פנויות היום — זה מקום טוב להוסיף תוספת פחמימה איכותית סביב האימון, לא לדלג על ארוחה.`;
  } else {
    tactical = 'היחס בין הקלוריות לחלבון מאוזן היטב היום. המשיכו באותה רמת דיוק עד סוף היום.';
  }

  const pool = MENTAL_TIPS[dayMode] || MENTAL_TIPS.rest;
  const mental = pool[Math.floor(Math.random() * pool.length)];

  return {
    score: Math.max(0, Math.min(100, score)),
    tactical,
    mental,
    generatedAt: new Date().toISOString(),
  };
}



/* ============================= SPRINT 10 · ANALYTICS & HEATMAP ENGINE ============================= */

const TARGET_WAIST_CM = 90;
const HEATMAP_WEEKS = 6; // 6 weeks = 42 days, within the requested 4-8 week range

// CRITICAL: must format using LOCAL date parts, not toISOString() (which converts to UTC).
// Every other date function here (shiftDateKey, addDays, "now") works in local time — mixing
// in a UTC-based key caused the date to silently shift by a day in timezones ahead of UTC
// (e.g. Israel), which compounded with shiftDateKey's own +/-1 into an apparent 2-day jump.
function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function addDays(d, n) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}
function formatShortDate(key) {
  const [, m, day] = key.split('-');
  return `${day}/${m}`;
}

// Deterministic day-level adherence score (0-100), same spirit as the AI Coach's score
// but simplified to what the heatmap needs: calories + protein accuracy.
function scoreDayLog(log, targets) {
  if (!log) return null;
  const proteinRatio = targets.protein > 0 ? Math.min(log.protein / targets.protein, 1) : 0;
  const kcalDelta = targets.kcal > 0 ? Math.abs(log.kcal - targets.kcal) / targets.kcal : 1;
  const kcalRatio = Math.max(0, 1 - kcalDelta);
  return Math.round((proteinRatio * 0.5 + kcalRatio * 0.5) * 100);
}

function heatColor(score, macro) {
  if (score === null || score === undefined) return null; // unlogged
  if (score >= 90) return macro.protein; // dark emerald/jade — on point
  if (score >= 75) return macro.kcal; // amber/bronze — slight deviation
  return macro.fat; // used as the "needs attention" red-adjacent tone at low scores
}

// Seed ~6 weeks of plausible-but-synthetic history so the heatmap/trendline aren't empty
// on a first-ever visit. Today's real entry is computed live and overwrites the seed.
function seedDailyLogs(targets) {
  const logs = {};
  const today = new Date();
  const cycle = ['A1', 'B1', 'A2', 'B2'];
  for (let i = HEATMAP_WEEKS * 7; i >= 1; i--) {
    const d = addDays(today, -i);
    const key = dateKey(d);
    const isWorkoutDay = i % 2 === 0; // roughly a 4-day upper/lower split cadence
    const wobble = () => (Math.random() - 0.5) * 0.28; // ±14% noise
    const dayTargets = isWorkoutDay ? targets.training : targets.rest;
    const proteinFactor = Math.max(0.55, 1 + wobble());
    const kcalFactor = Math.max(0.7, 1 + wobble() * 0.6);
    logs[key] = {
      kcal: Math.round(dayTargets.kcal * kcalFactor),
      protein: Math.round(dayTargets.protein * proteinFactor),
      carbs: Math.round(dayTargets.carbs * kcalFactor),
      fat: Math.round(dayTargets.fat * kcalFactor),
      workoutDone: isWorkoutDay && Math.random() > 0.15,
      workoutDay: isWorkoutDay ? cycle[Math.floor(i / 2) % 4] : null,
    };
  }
  return logs;
}

function seedMetricEntries(profile) {
  const today = new Date();
  const entries = [];
  const points = 8;
  const startWeight = Number(profile.weight) + 3.2;
  const startWaist = Number(profile.waist) + 6;
  for (let i = points - 1; i >= 0; i--) {
    const d = addDays(today, -i * 7);
    const t = (points - 1 - i) / (points - 1);
    entries.push({
      date: dateKey(d),
      weight: roundNum(startWeight - (startWeight - Number(profile.weight)) * t + (Math.random() - 0.5) * 0.4),
      waist: Math.round(startWaist - (startWaist - Number(profile.waist)) * t + (Math.random() - 0.5) * 0.8),
    });
  }
  return entries;
}

/* ============================= SPRINT 12 · SYSTEM DOCS, DIAGNOSTICS & SIGN-OFF ============================= */

const APP_VERSION = '3.1.0';

const DOCS_CHANGELOG = `
## יומן שינויים · 12 ספרינטים

- **ספרינט 1** — לוח מנהלים בסיסי: טבעות מאקרו, ציר זמן יומי 08:00-20:00.
- **ספרינט 2** — מטריצת מסעדות סיבוס: שומשום, צ'יקן סטיישן, גומבה, קנסאי.
- **ספרינט 3** — Kitchen Hacks: 4 מתכוני בית מהירים לערב.
- **ספרינט 4** — מעקב אימוני A/B עליון-תחתון עם לוגר סטים וטיימר מנוחה.
- **ספרינט 5** — מעקב שבועי משקל/היקף מותן.
- **ספרינט 6** — מנוע פרופיל ויעדים: נוסחת Mifflin-St Jeor, ריבוי פרופילים, ייצוא/ייבוא.
- **ספרינט 7** — מנוע ערכת נושא: מצב כהה/בהיר, צבע Accent נבחר, צפיפות תצוגה, משוב הפטי-קולי.
- **ספרינט 8** — מדריך ומקרא אינטראקטיבי, סיור היכרות אוטומטי בביקור ראשון.
- **ספרינט 9** — AI Coach Hub: ניתוח יום, פענוח טקסט חופשי (NLP היוריסטי), התראות Smart Swap.
- **ספרינט 10** — מרכז אנליטיקה: מפת חום, גרף מגמה כפול, דוח שבועי ל-WhatsApp.
- **ספרינט 11** — מנוע מתכונים אישי: מסעדות/מנות/Kitchen Hacks מותאמים אישית, מנוע "מה לאכול עכשיו".
- **ספרינט 12** — **PROJECT SHRED 2.0**: תיעוד מובנה בתוך האפליקציה, דיאגנוסטיקת מערכת, איפוס יצרן, תעודת סיום.
- **ספרינט 13** — **PROJECT SHRED 2.1**: מנוע מנות גמיש (IIFYM) עם חומרי גלם גולמי/מבושל, סליידר גרמים, ובנאי צלחת מודולרית שמשבץ לכל חמשת חלונות הזמן היומיים.
- **ספרינט 14** — **PROJECT SHRED 3.0**: מעבר מגלילה ארוכה אחת לניווט תחתון של 4 טאבים (היום/תזונה/אימונים/תובנות), מסך "היום" מרוכז סביב טבעת אחת, וגיליונות נגללים לכל רישום.
- **ספרינט 15** — **PROJECT SHRED 3.1**: מודל מצב מבוסס-תאריך מלא, סכימת פריט אחידה לכל רישום, ותיקון תקלת בחירת שומשום שנעלמה.
`;

const DOCS_ARCHITECTURE = `
## ארכיטקטורת מצב ושמירה

מנוע הפרסיסטנטיות מבוסס על **\`window.storage\`** — ה-API הייעודי לאחסון בתוך ארטיפקטים של Claude — **לא** \`localStorage\`, שאינו נתמך בסביבה זו ונכשל בשקט. כל מצב האפליקציה (פרופילים, ערכת נושא, יומני מאכלים, מסעדות מותאמות אישית, היסטוריית אנליטיקה) נשמר תחת מפתח אחד (\`STORAGE_KEY\`) כאובייקט JSON יחיד, עם שמירה אוטומטית כ-350ms אחרי כל שינוי (debounce), וטעינה חד-פעמית באתחול הרכיב.

**מפתח האבטחה:** מפתח API (Groq/OpenAI/HuggingFace) בהגדרות **לעולם לא** נכלל בייצוא JSON או משתמר עם התוכן המלא — הוא מטופל בנפרד ומאופס בכל ייצוא.

**מבנה נתונים מרכזי:**
- \`profiles\` — מילון פרופילים (גיל/משקל/גובה/היקף מותן/רמת פעילות/יעד).
- \`itemsByDate\` — מילון לפי תאריך (YYYY-MM-DD), כל תאריך מכיל מערך פריטים אחיד: \`{ id, slotId, name, baseCalories/Protein/Carbs/Fats, grams, isCompleted }\`. זהו מקור האמת היחיד לכל מה שנרשם — Cibus, Kitchen Hacks, חומרי גלם, ורישום חופשי — הכל עובר דרך אותו מבנה.
- \`dailyLogs\` — היסטוריית מפת החום; מחושב מ-\`itemsByDate\` עבור תאריכים עם נתונים אמיתיים, ונופל חזרה לנתוני seed סינתטיים עבור תאריכים ללא רישום.
- \`metricEntries\` — מערך רשומות משקל/היקף מותן לפי תאריך.
- \`customRestaurants\` / \`customHacks\` / \`customIngredients\` — פריטים שנוצרו על ידי המשתמש.
- \`aiReport\` — פלט מנוע ה-AI המקומי.
`;

const DOCS_FORMULAS = `
## נוסחאות מטבוליות

**BMR (חילוף חומרים בסיסי) — Mifflin-St Jeor:**
\`BMR = 10 × משקל(ק"ג) + 6.25 × גובה(ס"מ) − 5 × גיל + 5\`

**TDEE (הוצאה יומית כוללת):**
\`TDEE = BMR × מקדם פעילות\` (יושבני ×1.2 / משרד+הליכות ×1.55 / פעיל מאוד ×1.75)

**יעד קלורי לפי מטרה:**
\`יעד = TDEE × (1 + אחוז יעד)\` — חיטוב עצבני −25% / חיטוב מתון −15% / שמירה 0% / מסה +12%

**פיצול מאקרו:**
- חלבון = 2.0 גרם × משקל גוף
- שומן = 0.7 גרם × משקל גוף
- פחמימה = השארית: \`(יעד קלורי − חלבון×4 − שומן×9) ÷ 4\`

**Refeed ליום אימון:** יעד יום אימון = יעד יום מנוחה + 300 קלוריות, כולן כ-75 גרם פחמימה נוספת.
`;

const DOCS_COMPONENT_TREE = `
## עץ קומפוננטות (תמצית)

- **ProjectShred** (רכיב שורש, מחזיק את כל המצב, עוטף ב-\`ThemeContext.Provider\`)
  - Header (בורר יום/פרופיל/עזרה/הגדרות/מצב תצוגה)
  - **AiCoachWidget** — ניתוח יום, Smart Swap, פענוח NLP
  - **Timeline** — ציר זמן יומי
  - **CibusMatrix** → ShumshumBuilder / ChickenStationBuilder / GoombaBuilder / KansaiBuilder / GenericDishList / GenericPlateBuilder
  - Kitchen Hacks grid → **HackCard** (קבוע + מותאם אישית)
  - **WorkoutPanel** → ExerciseRow → RestTimer
  - **MetricTracker** → Sparkline
  - **ComplianceHeatmap** → HeatmapDetail / DayEditor
  - **DualTrendChart**
  - מודאלים: SettingsModal · HelpModal · WeeklyReportModal · RestaurantBuilderModal · HackBuilderModal · **DocsViewerModal** · **DiagnosticsModal** · **CertificateModal**
`;

// Deterministic checks that the active profile's metabolic math is internally consistent —
// this is a real, meaningful check (not decorative): it recomputes the formula and verifies
// the macro split actually sums back to the calorie target within rounding tolerance.
function runIntegrityChecks(profile, computed) {
  const checks = [];
  const w = Number(profile.weight), h = Number(profile.height), a = Number(profile.age);

  checks.push({
    label: 'שדות פרופיל תקינים',
    pass: w > 0 && h > 0 && a > 0,
    detail: w > 0 && h > 0 && a > 0 ? 'משקל, גובה וגיל הם מספרים חיוביים תקינים.' : 'אחד השדות חסר או לא תקין.',
  });

  checks.push({
    label: 'BMR חיובי וסופי',
    pass: Number.isFinite(computed.bmr) && computed.bmr > 0,
    detail: `BMR מחושב: ${computed.bmr} קל׳.`,
  });

  ['rest', 'training'].forEach((mode) => {
    const d = computed[mode];
    const rebuilt = d.protein * 4 + d.fat * 9 + d.carbs * 4;
    const diff = Math.abs(rebuilt - d.kcal);
    checks.push({
      label: `עקביות מאקרו · ${mode === 'rest' ? 'יום מנוחה' : 'יום אימון'}`,
      pass: diff <= 6,
      detail: `${d.protein}×4 + ${d.fat}×9 + ${d.carbs}×4 = ${rebuilt} קל׳ (יעד: ${d.kcal} קל׳, פער: ${diff}).`,
    });
  });

  checks.push({
    label: 'דלתא Refeed מדויקת',
    pass: computed.training.kcal - computed.rest.kcal === 300 && computed.training.carbs - computed.rest.carbs === 75,
    detail: `הפרש קלורי: ${computed.training.kcal - computed.rest.kcal} (יעד: 300) · הפרש פחמימה: ${computed.training.carbs - computed.rest.carbs}g (יעד: 75g).`,
  });

  return checks;
}

function buildFullBackup(state) {
  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    profiles: state.profiles, activeProfileId: state.activeProfileId,
    theme: { mode: state.mode, accentKey: state.accentKey, density: state.density, feedback: state.feedback },
    hasSeenOnboarding: state.hasSeenOnboarding,
    aiReport: state.aiReport,
    apiConfig: { provider: state.apiConfig.provider, key: '' }, // never export the raw key
    dailyLogs: state.dailyLogs, metricEntries: state.metricEntries,
    customRestaurants: state.customRestaurants, customHacks: state.customHacks,
    itemsByDate: state.itemsByDate,
    customIngredients: state.customIngredients,
    favorites: state.favorites,
    exerciseLogs: state.exerciseLogs,
  };
}

/* ============================= MICRO-INTERACTION HELPERS ============================= */

// CSS vh/dvh units can be unreliable inside embedded/iframe contexts — they sometimes resolve
// against a taller "virtual" document rather than what's actually visible on screen, which is
// exactly what caused sheets to render with their bottom portion cut off regardless of how the
// vh percentage was tuned. window.innerHeight reflects the real, current visible height of
// whatever browsing context this script is running in, so measuring it directly in JS and
// re-measuring on resize is a more robust fix than trusting any CSS viewport unit here.
function useViewportHeight() {
  const getHeight = () => {
    if (typeof window === 'undefined') return 800;
    // visualViewport tracks the *actually visible* area, shrinking correctly when the on-screen
    // keyboard opens on mobile — window.innerHeight often does NOT update in that case, which is
    // exactly what caused sheet content (like the "add" button) to end up hidden behind the keyboard.
    return window.visualViewport ? window.visualViewport.height : window.innerHeight;
  };
  const [vh, setVh] = useState(getHeight);
  useEffect(() => {
    const onResize = () => setVh(getHeight());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize);
      window.visualViewport.addEventListener('scroll', onResize);
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    onResize();
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
        window.visualViewport.removeEventListener('scroll', onResize);
      }
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return vh;
}

function usePulse(duration = 350) {
  const [pulseKey, setPulseKey] = useState(null);
  const trigger = (id) => {
    setPulseKey(id);
    setTimeout(() => setPulseKey((k) => (k === id ? null : k)), duration);
  };
  return [pulseKey, trigger];
}

/* ============================= SMALL UI PARTS ============================= */

function GlassCard({ children, className = '', style = {}, accent }) {
  const T = useTheme();
  const a = accent || T.accent;
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${className}`}
      style={{
        background: T.t.card,
        border: `1.5px solid ${accent === null ? T.t.border : a + '40'}`,
        boxShadow: accent === null ? T.t.shadowCard : `0 8px 24px -14px ${a}30`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children, color }) {
  const T = useTheme();
  return (
    <span
      className="text-xs font-semibold uppercase inline-block mb-2"
      style={{ color: color || T.accent, letterSpacing: '0.08em', fontFamily: FONT_MONO }}
    >
      {children}
    </span>
  );
}

function Ring({ value, max, size, stroke = 9, color, icon, unit }) {
  const T = useTheme();
  const s = size || T.spacing.ring;
  const radius = (s - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(value / max, 1));
  const offset = circumference * (1 - pct);
  const over = value > max;
  return (
    <div className="relative flex items-center justify-center" style={{ width: s, height: s }}>
      <svg width={s} height={s} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={s / 2} cy={s / 2} r={radius} stroke={T.t.border} strokeWidth={stroke} fill="none" />
        <circle
          cx={s / 2} cy={s / 2} r={radius}
          stroke={over ? T.macro.kcal : color}
          strokeWidth={stroke} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)', filter: `drop-shadow(0 0 5px ${color}aa)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        {icon}
        <span className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{Math.round(value)}</span>
        <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>/{max}{unit}</span>
      </div>
    </div>
  );
}

function SegBtn({ active, onClick, children, color }) {
  const T = useTheme();
  const c = color || T.accent;
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300"
      style={{
        background: active ? c : 'transparent',
        color: active ? '#07080B' : T.t.textSecondary,
        boxShadow: active ? glow(c, 10, '35') : 'none',
      }}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }) {
  const T = useTheme();
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative rounded-full transition-colors duration-300 flex-shrink-0"
      style={{ width: 46, height: 26, background: checked ? T.accent : T.t.border }}
      aria-pressed={checked}
    >
      <span
        className="absolute rounded-full transition-all duration-300"
        style={{
          width: 20, height: 20, top: 3,
          right: checked ? 3 : 23,
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
        }}
      />
    </button>
  );
}

/* ============================= TIMELINE ============================= */

function ItemLogRow({ item, onToggle, onDelete, onEdit }) {
  const T = useTheme();
  const [pulsing, setPulsing] = useState(false);
  const m = scaleLoggedItem(item);
  const done = item.isCompleted;

  const handleToggle = () => {
    onToggle(item.id);
    setPulsing(true);
    T.playFeedback();
    setTimeout(() => setPulsing(false), 300);
  };

  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: T.t.chipBg, opacity: done ? 1 : 0.6 }}>
      <button
        onClick={handleToggle}
        className="flex-shrink-0 flex items-center justify-center rounded-full"
        style={{
          width: 26, height: 26,
          background: done ? T.accent : 'transparent',
          border: `2px solid ${done ? T.accent : T.t.border}`,
          transform: pulsing ? 'scale(1.2)' : 'scale(1)',
          transition: 'transform 0.2s ease',
        }}
        aria-label={done ? 'בטל סימון' : 'סמן כבוצע'}
      >
        {done && <Check size={13} color="#07080B" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold truncate" style={{ color: T.t.textPrimary }}>{item.name}</div>
        <div className="flex items-center gap-2 text-xs flex-wrap" style={{ fontFamily: FONT_MONO }}>
          <span style={{ color: T.macro.kcal }}>{m.calories} קל׳</span>
          <span style={{ color: T.macro.protein }}>{m.protein}ח</span>
          <span style={{ color: T.macro.carbs }}>{m.carbs}פ</span>
          <span style={{ color: T.macro.fat }}>{m.fats}ש</span>
          {item.grams !== 100 && <span style={{ color: T.t.textDim }}>· {item.grams}%</span>}
        </div>
      </div>

      <button onClick={() => onEdit(item)} className="flex-shrink-0 p-1.5 rounded-lg" style={{ color: T.t.textDim }} aria-label="ערוך">
        <Pencil size={14} />
      </button>
      <button onClick={() => onDelete(item.id)} className="flex-shrink-0 p-1.5 rounded-lg" style={{ color: T.macro.fat }} aria-label="מחק">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function Timeline({ items, onToggle, onDelete, onEdit, trainingRefeedNotice }) {
  const T = useTheme();
  const bySlot = {};
  items.forEach((it) => {
    if (!bySlot[it.slotId]) bySlot[it.slotId] = [];
    bySlot[it.slotId].push(it);
  });

  return (
    <div className="relative pr-2">
      <div className="absolute top-2 bottom-2" style={{ right: '15px', width: '2px', background: T.t.border }} />
      <div className={`flex flex-col ${T.spacing.timelineGap}`}>
        {SLOT_DEFS.map((slot) => {
          const slotItems = bySlot[slot.id] || [];
          const Icon = slot.icon;
          const hasCompleted = slotItems.some((i) => i.isCompleted);
          return (
            <div key={slot.id} className="flex items-start gap-4 relative">
              <div
                className="relative z-10 flex-shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 30, height: 30,
                  background: hasCompleted ? `${T.accent}18` : T.t.cardSolid,
                  border: `2px solid ${hasCompleted ? T.accent : T.t.border}`,
                }}
              >
                <Icon size={14} color={hasCompleted ? T.accent : T.t.textSecondary} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold" style={{ color: T.accent, fontFamily: FONT_MONO }}>{slot.time}</span>
                  <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{slot.emoji} {slot.label}</span>
                </div>
                {slotItems.length === 0 ? (
                  <p className="text-xs" style={{ color: T.t.textDim }}>אין עדיין פריטים משובצים — הוסיפו דרך כפתור ה-+ למטה.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {slotItems.map((item) => (
                      <ItemLogRow key={item.id} item={item} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {trainingRefeedNotice && (
        <div className="mt-3 mr-11 p-3 rounded-xl flex items-start gap-2" style={{ background: `${T.macro.kcal}12`, border: `1px solid ${T.macro.kcal}33` }}>
          <Flame size={14} color={T.macro.kcal} style={{ flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs" style={{ color: T.t.textPrimary }}>יום אימון: יעד היום כולל תוספת של כ-75 גרם פחמימה סביב האימון — שבצו אותה דרך ה-+ בכל שלב שנוח.</p>
        </div>
      )}
    </div>
  );
}

function ItemEditSheetBody({ item, onSave, onClose }) {
  const T = useTheme();
  const [grams, setGrams] = useState(item.grams);
  const [slotId, setSlotId] = useState(item.slotId);
  const preview = scaleLoggedItem({ ...item, grams });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-bold mb-3" style={{ color: T.t.textPrimary }}>{item.name}</p>
        <label className="text-xs font-semibold block mb-2" style={{ color: T.t.textDim }}>גודל מנה ({grams}% מהכמות שנרשמה)</label>
        <input
          type="range" min={10} max={300} step={5}
          value={grams}
          onChange={(e) => setGrams(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: T.accent }}
        />
        <div className="flex items-center gap-3 text-xs mt-2" style={{ fontFamily: FONT_MONO }}>
          <span className="font-bold" style={{ color: T.t.textPrimary }}>{preview.calories} קל׳</span>
          <span style={{ color: T.macro.protein }}>{preview.protein}ח</span>
          <span style={{ color: T.macro.carbs }}>{preview.carbs}פ</span>
          <span style={{ color: T.macro.fat }}>{preview.fats}ש</span>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold block mb-2" style={{ color: T.t.textDim }}>שבצו לחלון זמן אחר</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {SLOT_DEFS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlotId(s.id)}
              className="py-2 px-1 rounded-lg text-xs font-semibold"
              style={{
                background: slotId === s.id ? T.accent : T.t.chipBg,
                color: slotId === s.id ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${slotId === s.id ? T.accent : T.t.border}`,
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => { onSave(item.id, { grams, slotId }); onClose(); }} className="py-3 rounded-xl font-bold text-sm" style={{ background: T.accent, color: '#07080B' }}>
        שמור שינויים
      </button>
    </div>
  );
}

/* ============================= CIBUS BUILDERS ============================= */

function OptionPicker({ title, options, selectedId, onSelect }) {
  const T = useTheme();
  return (
    <div>
      <p className="text-xs font-semibold mb-2" style={{ color: T.t.textSecondary }}>{title}</p>
      <div className="flex flex-col gap-2">
        {options.map((o) => {
          const sel = o.id === selectedId;
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o.id)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-right transition-all duration-300"
              style={{
                background: sel ? `${T.accent}14` : T.t.chipBg,
                border: `1px solid ${sel ? T.accent : T.t.border}`,
              }}
            >
              <span className="text-sm font-medium" style={{ color: T.t.textPrimary }}>{o.name}</span>
              <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{o.kcal} קל׳</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MacroStrip({ totals }) {
  const T = useTheme();
  return (
    <div className="flex items-center gap-4 flex-wrap text-sm" style={{ fontFamily: FONT_MONO }}>
      <span className="font-bold" style={{ color: T.t.textPrimary }}>{totals.kcal} קל׳</span>
      <span style={{ color: T.macro.protein }}>ח {totals.protein}g</span>
      <span style={{ color: T.macro.carbs }}>פ {totals.carbs}g</span>
      <span style={{ color: T.macro.fat }}>ש {totals.fat}g</span>
    </div>
  );
}

function ConfirmBtn({ onClick, label }) {
  const T = useTheme();
  const [pulsing, setPulsing] = useState(false);
  const handle = () => {
    onClick();
    setPulsing(true);
    T.playFeedback();
    setTimeout(() => setPulsing(false), 350);
  };
  return (
    <button
      onClick={handle}
      className="mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all duration-300"
      style={{
        background: T.accent, color: '#07080B', boxShadow: glow(T.accent, 12, '35'),
        transform: pulsing ? 'scale(1.03)' : 'scale(1)',
      }}
    >
      {label}
    </button>
  );
}

function ShumshumBuilder({ onConfirm }) {
  const [veg, setVeg] = useState(SHUMSHUM.veg[0].id);
  const [protein, setProtein] = useState(SHUMSHUM.protein[0].id);
  const [carb, setCarb] = useState(SHUMSHUM.carb[0].id);
  const T = useTheme();
  const v = SHUMSHUM.veg.find((x) => x.id === veg);
  const p = SHUMSHUM.protein.find((x) => x.id === protein);
  const cb = SHUMSHUM.carb.find((x) => x.id === carb);
  const totals = {
    kcal: v.kcal + p.kcal + cb.kcal,
    protein: v.protein + p.protein + cb.protein,
    fat: v.fat + p.fat + cb.fat,
    carbs: v.carbs + p.carbs + cb.carbs,
  };
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: T.t.textSecondary }}>
        נוסחת 3 החלקים: חצי צלחת ירקות · רבע חלבון · רבע פחמימה (3-4 כפות מקסימום)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OptionPicker title="ירקות (½ צלחת)" options={SHUMSHUM.veg} selectedId={veg} onSelect={setVeg} />
        <OptionPicker title="חלבון (¼ צלחת)" options={SHUMSHUM.protein} selectedId={protein} onSelect={setProtein} />
        <OptionPicker title="פחמימה (¼ צלחת)" options={SHUMSHUM.carb} selectedId={carb} onSelect={setCarb} />
      </div>
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <MacroStrip totals={totals} />
      </div>
      <ConfirmBtn
        label="אשר בחירה לארוחת הצהריים"
        onClick={() => onConfirm({ name: `שומשום · ${p.name}`, ...totals })}
      />
    </div>
  );
}

function ChickenStationBuilder({ onConfirm }) {
  const [protein, setProtein] = useState(CHICKEN_STATION.protein[0].id);
  const [carb, setCarb] = useState(CHICKEN_STATION.carb[0].id);
  const T = useTheme();
  const p = CHICKEN_STATION.protein.find((x) => x.id === protein);
  const cb = CHICKEN_STATION.carb.find((x) => x.id === carb);
  const veg = CHICKEN_STATION.veg;
  const totals = {
    kcal: p.kcal + cb.kcal + veg.kcal,
    protein: p.protein + cb.protein + veg.protein,
    fat: p.fat + cb.fat + veg.fat,
    carbs: p.carbs + cb.carbs + veg.carbs,
  };
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: T.t.textSecondary }}>
        חלבון על הגריל + {veg.name} (כלול קבוע) + תוספת פחמימה — בלי צ׳יפס מטוגן.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <OptionPicker title="חלבון" options={CHICKEN_STATION.protein} selectedId={protein} onSelect={setProtein} />
        <OptionPicker title="פחמימה" options={CHICKEN_STATION.carb} selectedId={carb} onSelect={setCarb} />
      </div>
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <MacroStrip totals={totals} />
      </div>
      <ConfirmBtn
        label="אשר בחירה לארוחת הצהריים"
        onClick={() => onConfirm({ name: `צ׳יקן סטיישן · ${p.name}`, ...totals })}
      />
    </div>
  );
}

function GoombaBuilder({ onConfirm }) {
  const [choice, setChoice] = useState(GOOMBA[0].id);
  const T = useTheme();
  const g = GOOMBA.find((x) => x.id === choice);
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: T.t.textSecondary }}>בחירה בין שתי אפשרויות עיקריות בתפריט.</p>
      <OptionPicker title="הבחירה שלי" options={GOOMBA} selectedId={choice} onSelect={setChoice} />
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <MacroStrip totals={g} />
      </div>
      <ConfirmBtn label="אשר בחירה לארוחת הצהריים" onClick={() => onConfirm({ name: `גומבה · ${g.name}`, ...g })} />
    </div>
  );
}

function KansaiBuilder({ onConfirm }) {
  const [protein, setProtein] = useState(KANSAI.protein[0].id);
  const T = useTheme();
  const p = KANSAI.protein.find((x) => x.id === protein);
  const { rice, veg, sauce } = KANSAI;
  const totals = {
    kcal: p.kcal + rice.kcal + veg.kcal + sauce.kcal,
    protein: p.protein + rice.protein + veg.protein + sauce.protein,
    fat: p.fat + rice.fat + veg.fat + sauce.fat,
    carbs: p.carbs + rice.carbs + veg.carbs + sauce.carbs,
  };
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: T.t.textSecondary }}>פוקה בול: אורז מאודה + ירקות + רוטב סויה/פונזו (כלולים קבוע).</p>
      <OptionPicker title="חלבון" options={KANSAI.protein} selectedId={protein} onSelect={setProtein} />
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <MacroStrip totals={totals} />
      </div>
      <ConfirmBtn label="אשר בחירה לארוחת הצהריים" onClick={() => onConfirm({ name: `קנסאי · ${p.name}`, ...totals })} />
    </div>
  );
}

function GenericDishList({ dishes, onConfirm, restaurantName }) {
  const T = useTheme();
  const valid = dishes.filter((d) => d.name);
  const [choice, setChoice] = useState(valid[0]?.id);
  const dish = valid.find((d) => d.id === choice) || valid[0];
  if (!dish) {
    return <p className="text-sm" style={{ color: T.t.textDim }}>אין עדיין מנות במסעדה הזו — ערכו אותה כדי להוסיף מנות.</p>;
  }
  const totals = { kcal: Number(dish.kcal) || 0, protein: Number(dish.protein) || 0, carbs: Number(dish.carbs) || 0, fat: Number(dish.fat) || 0 };
  return (
    <div>
      <OptionPicker title="בחרו מנה" options={valid.map((d) => ({ ...d, kcal: Number(d.kcal) || 0 }))} selectedId={dish.id} onSelect={setChoice} />
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <MacroStrip totals={totals} />
      </div>
      <ConfirmBtn label="אשר בחירה לארוחת הצהריים" onClick={() => onConfirm({ name: `${restaurantName} · ${dish.name}`, ...totals })} />
    </div>
  );
}

function GenericPlateBuilder({ plateOptions, onConfirm, restaurantName }) {
  const T = useTheme();
  const veg = plateOptions.veg.filter((v) => v.name);
  const protein = plateOptions.protein.filter((v) => v.name);
  const carb = plateOptions.carb.filter((v) => v.name);
  const [vegId, setVegId] = useState(veg[0]?.id);
  const [proteinId, setProteinId] = useState(protein[0]?.id);
  const [carbId, setCarbId] = useState(carb[0]?.id);
  if (!veg.length || !protein.length || !carb.length) {
    return <p className="text-sm" style={{ color: T.t.textDim }}>יש להוסיף לפחות אפשרות אחת בכל קטגוריה (ירק/חלבון/פחמימה) בעריכת המסעדה.</p>;
  }
  const v = veg.find((x) => x.id === vegId) || veg[0];
  const p = protein.find((x) => x.id === proteinId) || protein[0];
  const c = carb.find((x) => x.id === carbId) || carb[0];
  const totals = {
    kcal: (Number(v.kcal) || 0) + (Number(p.kcal) || 0) + (Number(c.kcal) || 0),
    protein: (Number(v.protein) || 0) + (Number(p.protein) || 0) + (Number(c.protein) || 0),
    carbs: (Number(v.carbs) || 0) + (Number(p.carbs) || 0) + (Number(c.carbs) || 0),
    fat: (Number(v.fat) || 0) + (Number(p.fat) || 0) + (Number(c.fat) || 0),
  };
  return (
    <div>
      <p className="text-sm mb-4" style={{ color: T.t.textSecondary }}>נוסחת 3 החלקים המותאמת אישית של {restaurantName}.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <OptionPicker title="ירקות" options={veg.map((x) => ({ ...x, kcal: Number(x.kcal) || 0 }))} selectedId={v.id} onSelect={setVegId} />
        <OptionPicker title="חלבון" options={protein.map((x) => ({ ...x, kcal: Number(x.kcal) || 0 }))} selectedId={p.id} onSelect={setProteinId} />
        <OptionPicker title="פחמימה" options={carb.map((x) => ({ ...x, kcal: Number(x.kcal) || 0 }))} selectedId={c.id} onSelect={setCarbId} />
      </div>
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <MacroStrip totals={totals} />
      </div>
      <ConfirmBtn label="אשר בחירה לארוחת הצהריים" onClick={() => onConfirm({ name: `${restaurantName} · ${p.name}`, ...totals })} />
    </div>
  );
}


function EatingOutBuilder({ onConfirm }) {
  const T = useTheme();
  const [category, setCategory] = useState('pizza');
  const [search, setSearch] = useState('');
  const searchTerm = search.trim();
  const items = searchTerm
    ? EATING_OUT_MENU.filter((i) => i.name.includes(searchTerm))
    : EATING_OUT_MENU.filter((i) => i.category === category);

  return (
    <div>
      <p className="text-sm mb-3" style={{ color: T.t.textSecondary }}>כל מה שמזמינים או קונים בחוץ — פיצה, המבורגר, שווארמה, אסייתי, כריכים, שתייה (כולל זירו) וקינוחים.</p>

      <div className="relative mb-3">
        <Search size={15} color={T.t.textDim} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש... (למשל: זירו, בורקס, סושי)"
          className="w-full py-3 pr-10 pl-3.5 rounded-xl text-sm outline-none"
          style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
        />
      </div>

      {!searchTerm && (
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {EATING_OUT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="py-2 px-3 rounded-full text-xs font-semibold flex-shrink-0 whitespace-nowrap"
              style={{
                background: category === c.id ? T.accent : T.t.chipBg,
                color: category === c.id ? '#07080B' : T.t.textSecondary,
                border: `1.5px solid ${category === c.id ? T.accent : T.t.border}`,
                transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => { onConfirm({ name: item.name, kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat }); if (document.activeElement) document.activeElement.blur(); }}
            className="flex items-center justify-between px-3.5 py-3 rounded-xl text-right w-full"
            style={{
              background: T.t.chipBg,
              border: `1.5px solid ${T.t.border}`,
              animation: `rowFadeIn 0.3s ease ${Math.min(idx * 0.03, 0.35)}s both`,
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <span className="text-sm font-medium" style={{ color: T.t.textPrimary }}>
              <HighlightedText text={item.name} term={searchTerm} color={T.accent} />
            </span>
            <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ fontFamily: FONT_MONO }}>
              <span style={{ color: T.macro.kcal }}>{item.kcal}</span>
              <span style={{ color: T.macro.protein }}>{item.protein}ח</span>
              <span style={{ color: T.accent }}>+</span>
            </div>
          </button>
        ))}
        {items.length === 0 && <p className="text-xs text-center py-4" style={{ color: T.t.textDim }}>לא נמצאו תוצאות</p>}
      </div>
    </div>
  );
}

function CibusMatrix({ onLogItem, customRestaurants, onAddRestaurant, onEditRestaurant, onDeleteRestaurant, defaultSlotId }) {
  const T = useTheme();
  const builtInTabs = [
    { id: 'shumshum', label: 'שומשום' },
    { id: 'chicken', label: "צ'יקן סטיישן" },
    { id: 'goomba', label: 'גומבה' },
    { id: 'kansai', label: 'קנסאי' },
    { id: 'eating_out', label: 'אוכל בחוץ' },
  ];
  const customTabs = customRestaurants.map((r) => ({ id: r.id, label: r.name || 'ללא שם', isCustom: true }));
  const tabs = [...builtInTabs, ...customTabs];
  const [tab, setTab] = useState('shumshum');
  const [slotId, setSlotId] = useState(defaultSlotId || 'lunch');
  const [confirmedName, setConfirmedName] = useState(null);
  const activeCustom = customRestaurants.find((r) => r.id === tab);

  const handleConfirm = (meal) => {
    onLogItem(meal, slotId);
    setConfirmedName(meal.name);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow>CIBUS</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מטריצת מסעדות סיבוס</h3>
          <p className="text-xs mt-0.5" style={{ color: T.t.textDim }}>5 מסעדות · {EATING_OUT_MENU.length} מנות "אוכל בחוץ" + {SHUMSHUM.veg.length * SHUMSHUM.protein.length * SHUMSHUM.carb.length}+ שילובים</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddRestaurant()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
          >
            <Store size={13} /> ערוך/הוסף מסעדה
          </button>
          <UtensilsCrossed size={22} color={T.accent} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: T.t.textSecondary }}>שיבוץ לחלון זמן</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-4">
          {SLOT_DEFS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlotId(s.id)}
              className="py-2 px-1 rounded-lg text-xs font-semibold"
              style={{
                background: slotId === s.id ? T.accent : T.t.chipBg,
                color: slotId === s.id ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${slotId === s.id ? T.accent : T.t.border}`,
              }}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-3 flex-wrap" style={{ background: T.t.chipBg }}>
        {tabs.map((tItem) => (
          <button
            key={tItem.id}
            onClick={() => { setTab(tItem.id); setConfirmedName(null); }}
            className="flex-1 py-2 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300"
            style={{
              background: tab === tItem.id ? T.accent : 'transparent',
              color: tab === tItem.id ? '#07080B' : T.t.textSecondary,
              minWidth: 90,
            }}
          >
            {tItem.label}
          </button>
        ))}
      </div>

      {activeCustom && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: `${T.accent}18`, color: T.accent }}>מותאם אישית</span>
          <button onClick={() => onEditRestaurant(activeCustom.id)} className="flex items-center gap-1 text-xs" style={{ color: T.t.textSecondary }}>
            <Pencil size={12} /> ערוך
          </button>
          <button
            onClick={() => { onDeleteRestaurant(activeCustom.id); setTab('shumshum'); }}
            className="flex items-center gap-1 text-xs"
            style={{ color: T.macro.fat }}
          >
            <Trash2 size={12} /> מחק
          </button>
        </div>
      )}

      {tab === 'shumshum' && <ShumshumBuilder onConfirm={handleConfirm} />}
      {tab === 'chicken' && <ChickenStationBuilder onConfirm={handleConfirm} />}
      {tab === 'goomba' && <GoombaBuilder onConfirm={handleConfirm} />}
      {tab === 'kansai' && <KansaiBuilder onConfirm={handleConfirm} />}
      {tab === 'eating_out' && <EatingOutBuilder onConfirm={handleConfirm} />}
      {activeCustom && activeCustom.type === 'simple' && (
        <GenericDishList dishes={activeCustom.dishes} onConfirm={handleConfirm} restaurantName={activeCustom.name} />
      )}
      {activeCustom && activeCustom.type === 'plate3' && (
        <GenericPlateBuilder plateOptions={activeCustom.plateOptions} onConfirm={handleConfirm} restaurantName={activeCustom.name} />
      )}
      {confirmedName && (
        <p className="text-xs mt-4 text-center" style={{ color: T.accent }}>
          ✓ {confirmedName} נוסף ל־{SLOT_DEFS.find((s) => s.id === slotId)?.label}
        </p>
      )}
    </div>
  );
}

/* ============================= HOME KITCHEN HACKS ============================= */

function HackCard({ hack, onLog, onEdit }) {
  const T = useTheme();
  const [picking, setPicking] = useState(false);
  const [justLogged, setJustLogged] = useState(false);

  const pick = (slotId) => {
    onLog(hack, slotId);
    setPicking(false);
    setJustLogged(true);
    T.playFeedback();
    setTimeout(() => setJustLogged(false), 1200);
  };

  return (
    <GlassCard className={`${T.spacing.cardSm} flex flex-col justify-between transition-all duration-300`} accent={justLogged ? T.macro.protein : null}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{hack.icon}</span>
          <div className="flex items-center gap-1.5">
            {hack.isCustom && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md" style={{ background: `${T.accent}18`, color: T.accent }}>מותאם אישית</span>
            )}
            <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ color: T.macro.kcal, background: `${T.macro.kcal}14`, fontFamily: FONT_MONO }}>
              {hack.kcal} קל׳
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{hack.name}</h4>
          {hack.isCustom && onEdit && (
            <button onClick={() => onEdit(hack.id)} style={{ color: T.t.textDim, flexShrink: 0 }}>
              <Pencil size={13} />
            </button>
          )}
        </div>
        {T.spacing.showDetail && <p className="text-xs mb-3" style={{ color: T.t.textSecondary }}>{hack.detail}</p>}
        <div className="flex gap-3 text-xs mb-3" style={{ fontFamily: FONT_MONO }}>
          <span style={{ color: T.macro.protein }}>ח {hack.protein}g</span>
          <span style={{ color: T.macro.carbs }}>פ {hack.carbs}g</span>
          <span style={{ color: T.macro.fat }}>ש {hack.fat}g</span>
        </div>
      </div>
      {picking ? (
        <div className="grid grid-cols-5 gap-1">
          {SLOT_DEFS.map((s) => (
            <button key={s.id} onClick={() => pick(s.id)} className="py-2 rounded-lg text-xs" style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }} title={s.label}>
              {s.emoji}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setPicking(true)}
          className="w-full py-2.5 rounded-lg text-xs font-bold transition-all duration-300"
          style={{
            background: justLogged ? T.macro.protein : T.t.chipBg,
            color: justLogged ? '#07080B' : T.t.textPrimary,
          }}
        >
          {justLogged ? '✓ נוסף!' : 'הוסף לתפריט'}
        </button>
      )}
    </GlassCard>
  );
}

function KitchenHacksSection({ customHacks, onLog, onEditHack, onAddHack }) {
  const T = useTheme();
  const [category, setCategory] = useState('breakfast');
  const [search, setSearch] = useState('');
  const searchTerm = search.trim();
  const allHacks = [...HACKS, ...customHacks];
  const visible = searchTerm
    ? allHacks.filter((h) => h.name.includes(searchTerm))
    : allHacks.filter((h) => h.category === category || (!h.category && category === 'breakfast'));

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <Eyebrow>Home Kitchen Hacks</Eyebrow>
          <p className="text-xs -mt-1.5" style={{ color: T.t.textDim }}>{allHacks.length} מתכונים ביתיים · בוקר, עיקריות, חטיפים ומתוקים</p>
        </div>
        <button
          onClick={onAddHack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
        >
          <ChefHat size={13} /> הוסף מתכון
        </button>
      </div>

      <div className="relative mb-3">
        <Search size={15} color={T.t.textDim} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש מתכון... (למשל: פנקייק, קינואה, חלבון)"
          className="w-full py-3 pr-10 pl-3.5 rounded-xl text-sm outline-none"
          style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
        />
      </div>

      {!searchTerm && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl mb-4" style={{ background: T.t.chipBg }}>
          {HACK_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="py-2 rounded-lg text-xs font-semibold"
              style={{ background: category === c.id ? T.accent : 'transparent', color: category === c.id ? '#07080B' : T.t.textSecondary }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((h) => (
          <HackCard
            key={h.id}
            hack={h}
            onLog={onLog}
            onEdit={h.isCustom ? () => onEditHack(h.id) : null}
          />
        ))}
        {visible.length === 0 && <p className="text-xs text-center py-6 col-span-2" style={{ color: T.t.textDim }}>לא נמצאו מתכונים</p>}
      </div>
    </div>
  );
}

/* ============================= WORKOUT TRACKER ============================= */

function RestTimer({ seconds, id, activeTimer, setActiveTimer }) {
  const T = useTheme();
  const isActive = activeTimer?.id === id;
  const secondsLeft = isActive ? activeTimer.secondsLeft : seconds;
  const pct = isActive ? 1 - secondsLeft / seconds : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-9 h-9">
        <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={18} cy={18} r={15} stroke={T.t.border} strokeWidth={3} fill="none" />
          <circle
            cx={18} cy={18} r={15} stroke={T.accent} strokeWidth={3} fill="none"
            strokeDasharray={2 * Math.PI * 15}
            strokeDashoffset={2 * Math.PI * 15 * (1 - pct)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <button
          onClick={() => setActiveTimer(isActive ? null : { id, secondsLeft: seconds, total: seconds })}
          className="absolute inset-0 flex items-center justify-center"
        >
          {isActive ? <Pause size={13} color={T.accent} /> : <Play size={13} color={T.t.textSecondary} />}
        </button>
      </div>
      <span className="text-xs" style={{ fontFamily: FONT_MONO, color: isActive ? T.accent : T.t.textDim }}>
        {isActive ? `${secondsLeft}s` : `${seconds}s מנוחה`}
      </span>
    </div>
  );
}

function ExerciseRow({ ex, idx, done, toggleSet, activeTimer, setActiveTimer, loggedSet, onLogSet, lastSet }) {
  const T = useTheme();
  const [pulseId, triggerPulse] = usePulse();
  const [weight, setWeight] = useState(loggedSet?.weight ?? '');
  const [reps, setReps] = useState(loggedSet?.reps ?? '');
  const doneCount = done?.length || 0;
  const handleSet = (i) => {
    toggleSet(ex.name, i);
    triggerPulse(i);
    T.playFeedback();
  };

  useEffect(() => {
    setWeight(loggedSet?.weight ?? '');
    setReps(loggedSet?.reps ?? '');
  }, [loggedSet?.weight, loggedSet?.reps]);

  const commitLog = () => {
    if (weight === '' && reps === '') return;
    onLogSet(ex.name, { weight: weight === '' ? null : Number(weight), reps: reps === '' ? null : Number(reps) });
  };

  const delta = lastSet && weight !== '' ? roundNum(Number(weight) - lastSet.weight) : null;
  const isPR = delta !== null && delta > 0;

  return (
    <div className="py-3" style={{ borderBottom: idx !== undefined ? `1px solid ${T.t.border}` : 'none' }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div>
          <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{ex.name}</span>
          <span className="text-xs mr-2" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
            {ex.sets} × {ex.reps}
          </span>
        </div>
        <RestTimer seconds={ex.rest} id={ex.name} activeTimer={activeTimer} setActiveTimer={setActiveTimer} />
      </div>
      <div className="flex items-center gap-2 mb-2">
        {Array.from({ length: ex.sets }).map((_, i) => {
          const setDone = done?.includes(i);
          return (
            <button
              key={i}
              onClick={() => handleSet(i)}
              className="flex items-center justify-center rounded-lg transition-all duration-300"
              style={{
                width: 30, height: 30,
                background: setDone ? T.accent : T.t.chipBg,
                border: `1px solid ${setDone ? T.accent : T.t.border}`,
                color: setDone ? '#07080B' : T.t.textDim,
                boxShadow: setDone ? glow(T.accent, 8, '30') : 'none',
                transform: pulseId === i ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              <span className="text-xs font-bold" style={{ fontFamily: FONT_MONO }}>{i + 1}</span>
            </button>
          );
        })}
        <span className="text-xs mr-1" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{doneCount}/{ex.sets}</span>
      </div>

      {/* Progressive overload: top-set weight/reps + PR delta vs last logged session */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <input
            type="number" inputMode="decimal" placeholder="ק״ג" value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onBlur={commitLog}
            className="text-xs text-center rounded-lg outline-none"
            style={{ width: 52, padding: '5px 2px', background: T.t.chipBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
          />
          <span className="text-xs" style={{ color: T.t.textDim }}>ק״ג ×</span>
          <input
            type="number" inputMode="numeric" placeholder="חז׳" value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={commitLog}
            className="text-xs text-center rounded-lg outline-none"
            style={{ width: 46, padding: '5px 2px', background: T.t.chipBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
          />
          <span className="text-xs" style={{ color: T.t.textDim }}>חז׳</span>
        </div>
        {lastSet && (
          <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
            פעם קודמת: {lastSet.weight}ק״ג
          </span>
        )}
        {delta !== null && delta !== 0 && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: isPR ? `${T.macro.protein}20` : `${T.macro.fat}20`, color: isPR ? T.macro.protein : T.macro.fat }}
          >
            {isPR ? `+${delta}ק״ג PR 🏆` : `${delta}ק״ג`}
          </span>
        )}
      </div>
    </div>
  );
}

function WorkoutPanel({ onWorkoutActivity, exerciseLogs, selectedDateKey, onLogSet }) {
  const T = useTheme();
  const [dayKey, setDayKey] = useState('A1');
  const [log, setLog] = useState({});
  const [activeTimer, setActiveTimer] = useState(null);

  useEffect(() => {
    if (!activeTimer) return;
    if (activeTimer.secondsLeft <= 0) {
      setActiveTimer(null);
      return;
    }
    const t = setTimeout(() => {
      setActiveTimer((cur) => (cur ? { ...cur, secondsLeft: cur.secondsLeft - 1 } : null));
    }, 1000);
    return () => clearTimeout(t);
  }, [activeTimer]);

  const workout = WORKOUTS[dayKey];

  const toggleSet = (exName, i) => {
    setLog((prev) => {
      const key = `${dayKey}-${exName}`;
      const cur = prev[key] || [];
      const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i];
      const anyDone = Object.values({ ...prev, [key]: next }).some((arr) => arr.length > 0);
      if (onWorkoutActivity) onWorkoutActivity(anyDone, dayKey);
      return { ...prev, [key]: next };
    });
  };

  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = workout.exercises.reduce((a, e) => a + ((log[`${dayKey}-${e.name}`] || []).length), 0);

  return (
    <GlassCard className={T.spacing.card}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow>ARENA 04 · TRAINING</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מעקב אימוני A/B עליון-תחתון</h3>
        </div>
        <Dumbbell size={22} color={T.accent} />
      </div>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {Object.keys(WORKOUTS).map((k) => (
          <SegBtn key={k} active={dayKey === k} onClick={() => { setDayKey(k); setActiveTimer(null); }} color={WORKOUTS[k].color}>
            {k}
          </SegBtn>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold" style={{ color: workout.color }}>{workout.label}</span>
        <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{doneSets}/{totalSets} סטים הושלמו</span>
      </div>
      <div>
        {workout.exercises.map((ex, i) => (
          <ExerciseRow
            key={ex.name}
            ex={ex}
            idx={i < workout.exercises.length - 1 ? i : undefined}
            done={log[`${dayKey}-${ex.name}`]}
            toggleSet={toggleSet}
            activeTimer={activeTimer}
            setActiveTimer={setActiveTimer}
            loggedSet={exerciseLogs?.[selectedDateKey]?.[ex.name]}
            lastSet={getLastLoggedSet(exerciseLogs || {}, ex.name, selectedDateKey)}
            onLogSet={(exName, patch) => onLogSet(exName, patch)}
          />
        ))}
      </div>
    </GlassCard>
  );
}

/* ============================= WEEKLY METRIC TRACKER ============================= */

function Sparkline({ data, color, unit }) {
  const w = 280, h = 70, pad = 6;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaPath = `${path} L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`;
  const last = data[data.length - 1];
  const first = data[0];
  const trendUp = last.value > first.value;
  const gradId = `grad-${color.replace('#', '')}`;
  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 2.5} fill={color} />
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ fontFamily: FONT_MONO }}>{formatShortDate(first.date)} → {formatShortDate(last.date)}</span>
        <div className="flex items-center gap-1">
          {trendUp ? <TrendingUp size={13} color={color} /> : <TrendingDown size={13} color={color} />}
          <span className="text-xs font-bold" style={{ color, fontFamily: FONT_MONO }}>
            {last.value}{unit}
          </span>
        </div>
      </div>
    </div>
  );
}

function MetricTracker({ entries, setEntries }) {
  const T = useTheme();
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');

  const addEntry = () => {
    const w = parseFloat(weight);
    const wa = parseFloat(waist);
    if (!w && !wa) return;
    const last = entries[entries.length - 1];
    setEntries([
      ...entries,
      { date: dateKey(new Date()), weight: w || last.weight, waist: wa || last.waist },
    ]);
    setWeight('');
    setWaist('');
    T.playFeedback();
  };

  return (
    <GlassCard className={T.spacing.card}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow>ARENA 05 · METRICS</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מעקב שבועי — משקל והיקף מותן</h3>
        </div>
        <Scale size={22} color={T.accent} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div style={{ color: T.t.textPrimary }}>
          <div className="flex items-center gap-2 mb-2">
            <Scale size={14} color={T.accent} />
            <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>משקל (ק״ג)</span>
          </div>
          <Sparkline data={entries.map((e) => ({ date: e.date, value: e.weight }))} color={T.accent} unit="kg" />
        </div>
        <div style={{ color: T.t.textPrimary }}>
          <div className="flex items-center gap-2 mb-2">
            <Ruler size={14} color={T.macro.kcal} />
            <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>היקף מותן (ס״מ)</span>
          </div>
          <Sparkline data={entries.map((e) => ({ date: e.date, value: e.waist }))} color={T.macro.kcal} unit="cm" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 items-center pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="משקל שבוע חדש"
          type="number"
          dir="ltr"
          className="flex-1 py-2.5 px-3.5 rounded-xl text-sm outline-none"
          style={{ minWidth: 130, background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, textAlign: 'left', color: T.t.textPrimary, fontFamily: FONT_MONO, fontWeight: 600 }}
        />
        <input
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          placeholder="היקף מותן חדש"
          type="number"
          dir="ltr"
          className="flex-1 py-2.5 px-3.5 rounded-xl text-sm outline-none"
          style={{ minWidth: 130, background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, textAlign: 'left', color: T.t.textPrimary, fontFamily: FONT_MONO, fontWeight: 600 }}
        />
        <button
          onClick={addEntry}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: T.accent, color: '#07080B', boxShadow: glow(T.accent, 12, '40') }}
        >
          <Plus size={15} /> הוסף
        </button>
      </div>
    </GlassCard>
  );
}

/* ============================= SPRINT 6 · PROFILE & SETTINGS ============================= */

function FieldInput({ label, value, onChange, type = 'text', suffix }) {
  const T = useTheme();
  const isNum = type === 'number';
  return (
    <div>
      <label
        className="text-xs font-semibold block mb-2"
        style={{ color: T.t.textDim, letterSpacing: '0.04em', fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          dir={isNum ? 'ltr' : 'rtl'}
          className="w-full py-3 rounded-xl text-sm outline-none"
          style={{
            background: T.t.inputBg,
            border: `1.5px solid ${T.t.border}`,
            textAlign: isNum ? 'left' : 'right',
            color: T.t.textPrimary,
            fontFamily: isNum ? FONT_MONO : FONT_BODY,
            fontWeight: isNum ? 600 : 400,
            paddingRight: isNum ? 14 : (suffix ? 14 : 14),
            paddingLeft: isNum && suffix ? 52 : 14,
          }}
        />
        {suffix && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-xs pointer-events-none px-2 py-1 rounded-md"
            style={{
              color: T.t.textSecondary,
              left: isNum ? 8 : 'auto',
              right: isNum ? 'auto' : 8,
              fontFamily: FONT_MONO,
              background: T.t.chipBg,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ProfileSwitcher({ profiles, activeId, setActiveId, addProfile, deleteProfile }) {
  const T = useTheme();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const active = profiles[activeId];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
        style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
      >
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: 24, height: 24, background: `${T.accent}22` }}
        >
          <User size={13} color={T.accent} />
        </div>
        <div className="text-right">
          <div className="text-xs font-bold leading-tight" style={{ color: T.t.textPrimary }}>{active.name}</div>
          <div className="text-xs leading-tight" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{active.weight}kg</div>
        </div>
        <ChevronDown size={14} color={T.t.textDim} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 rounded-xl backdrop-blur-xl z-30 overflow-hidden"
          style={{ width: 260, background: T.t.popover, border: `1px solid ${T.t.border}`, boxShadow: T.t.dropdownShadow }}
        >
          <div className="p-2 flex flex-col gap-1 max-h-56 overflow-y-auto">
            {Object.values(profiles).map((p) => (
              <div key={p.id} className="flex items-center gap-1">
                <button
                  onClick={() => { setActiveId(p.id); setOpen(false); }}
                  className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-right transition-colors duration-200"
                  style={{ background: p.id === activeId ? `${T.accent}18` : 'transparent' }}
                >
                  <span className="text-sm" style={{ color: T.t.textPrimary }}>{p.name}</span>
                  <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{p.weight}kg</span>
                </button>
                {!p.locked && (
                  <button
                    onClick={() => deleteProfile(p.id)}
                    className="p-2 rounded-lg transition-colors duration-200"
                    style={{ color: T.t.textDim }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-2" style={{ borderTop: `1px solid ${T.t.border}` }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם פרופיל חדש"
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
            />
            <button
              onClick={() => {
                if (!newName.trim()) return;
                addProfile(newName.trim());
                setNewName('');
              }}
              className="p-2.5 rounded-xl flex-shrink-0"
              style={{ background: T.accent, color: '#07080B' }}
            >
              <UserPlus size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================= SPRINT 7 · APPEARANCE SETTINGS ============================= */

function AppearanceSection({ mode, setMode, accentKey, setAccentKey, density, setDensity, feedback, setFeedback }) {
  const T = useTheme();
  return (
    <div className="flex flex-col gap-5">
      {/* Theme mode */}
      <div>
        <Eyebrow>ערכת נושא</Eyebrow>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('dark')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
            style={{
              background: mode === 'dark' ? T.accent : T.t.chipBg,
              color: mode === 'dark' ? '#07080B' : T.t.textSecondary,
              border: `1px solid ${mode === 'dark' ? T.accent : T.t.border}`,
            }}
          >
            <Moon size={15} /> אובסידיאן כהה
          </button>
          <button
            onClick={() => setMode('light')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
            style={{
              background: mode === 'light' ? T.accent : T.t.chipBg,
              color: mode === 'light' ? '#07080B' : T.t.textSecondary,
              border: `1px solid ${mode === 'light' ? T.accent : T.t.border}`,
            }}
          >
            <Sun size={15} /> ניהולי בהיר
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div>
        <Eyebrow>צבע דגש (Accent)</Eyebrow>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ACCENT_PRESETS).map(([key, a]) => {
            const hex = getAccentHex(T.mode, key);
            return (
              <button
                key={key}
                onClick={() => setAccentKey(key)}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300"
                style={{
                  background: accentKey === key ? `${hex}18` : T.t.chipBg,
                  border: `1px solid ${accentKey === key ? hex : T.t.border}`,
                }}
              >
                <span
                  className="rounded-full"
                  style={{ width: 22, height: 22, background: hex, boxShadow: accentKey === key ? glow(hex, 8, '30') : 'none' }}
                />
                <span className="text-xs" style={{ color: accentKey === key ? hex : T.t.textDim }}>{a.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Density */}
      <div>
        <Eyebrow>צפיפות תצוגה</Eyebrow>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(DENSITY_PRESETS).map(([key, d]) => (
            <button
              key={key}
              onClick={() => setDensity(key)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300"
              style={{
                background: density === key ? T.accent : T.t.chipBg,
                color: density === key ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${density === key ? T.accent : T.t.border}`,
              }}
            >
              <Gauge size={15} /> {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Haptic & sound feedback */}
      <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}>
        <div className="flex items-center gap-2">
          <Bell size={16} color={T.accent} />
          <div>
            <div className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>משוב הפטי וקולי</div>
            <div className="text-xs" style={{ color: T.t.textDim }}>פעימת רטט + צליל קצר + אנימציית פעימה בכל סימון</div>
          </div>
        </div>
        <ToggleSwitch checked={feedback} onChange={setFeedback} />
      </div>
    </div>
  );
}

function SettingsModal({
  open, onClose, profile, updateProfile, computed, onExport, onImport,
  mode, setMode, accentKey, setAccentKey, density, setDensity, feedback, setFeedback,
  apiConfig, setApiConfig, onOpenDocs, onOpenDiagnostics,
}) {
  const T = useTheme();
  const fileRef = useRef(null);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{
        background: T.t.overlayBg,
        backdropFilter: open ? 'blur(6px)' : 'none',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl backdrop-blur-xl overflow-hidden"
        style={{
          maxWidth: 560, maxHeight: '88vh', overflowY: 'auto',
          background: T.t.modalBg,
          border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 30, '22')}`,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <Settings size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>הגדרות ופרופיל</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <X size={16} color={T.t.textSecondary} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          {/* Appearance / Theme Engine */}
          <AppearanceSection
            mode={mode} setMode={setMode}
            accentKey={accentKey} setAccentKey={setAccentKey}
            density={density} setDensity={setDensity}
            feedback={feedback} setFeedback={setFeedback}
          />

          <div style={{ borderTop: `1px solid ${T.t.border}` }} />

          {/* Personal fields */}
          <div>
            <Eyebrow>פרטים אישיים</Eyebrow>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <FieldInput label="שם משתמש" value={profile.name} onChange={(v) => updateProfile({ name: v })} />
              </div>
              <FieldInput label="גיל" value={profile.age} onChange={(v) => updateProfile({ age: v })} type="number" suffix="שנים" />
              <FieldInput label="משקל נוכחי" value={profile.weight} onChange={(v) => updateProfile({ weight: v })} type="number" suffix="ק״ג" />
              <FieldInput label="גובה" value={profile.height} onChange={(v) => updateProfile({ height: v })} type="number" suffix="ס״מ" />
              <FieldInput label="היקף מותן" value={profile.waist} onChange={(v) => updateProfile({ waist: v })} type="number" suffix="ס״מ" />
            </div>
          </div>

          {/* Activity level */}
          <div>
            <Eyebrow>רמת פעילות יומית</Eyebrow>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ACTIVITY_LEVELS).map(([key, a]) => (
                <button
                  key={key}
                  onClick={() => updateProfile({ activity: key })}
                  className="py-2.5 px-2 rounded-lg text-xs font-semibold transition-all duration-300"
                  style={{
                    background: profile.activity === key ? T.accent : T.t.chipBg,
                    color: profile.activity === key ? '#07080B' : T.t.textSecondary,
                    border: `1px solid ${profile.activity === key ? T.accent : T.t.border}`,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <Eyebrow>יעד מטבולי</Eyebrow>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(GOALS).map(([key, g]) => (
                <button
                  key={key}
                  onClick={() => updateProfile({ goal: key })}
                  className="py-2.5 px-2 rounded-lg text-xs font-semibold transition-all duration-300"
                  style={{
                    background: profile.goal === key ? g.color : T.t.chipBg,
                    color: profile.goal === key ? '#07080B' : T.t.textSecondary,
                    border: `1px solid ${profile.goal === key ? g.color : T.t.border}`,
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live BMR / TDEE calculation */}
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={15} color={T.accent} />
              <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>חישוב מטבולי בזמן אמת · Mifflin-St Jeor</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="text-center p-2 rounded-lg" style={{ background: T.t.chipBg }}>
                <div className="text-xs" style={{ color: T.t.textDim }}>BMR</div>
                <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{computed.bmr}</div>
              </div>
              <div className="text-center p-2 rounded-lg" style={{ background: T.t.chipBg }}>
                <div className="text-xs" style={{ color: T.t.textDim }}>TDEE</div>
                <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{computed.tdee}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: T.t.textSecondary }}>
              <span>יעד יום מנוחה</span>
              <span style={{ fontFamily: FONT_MONO }}>
                <span style={{ color: T.macro.kcal }}>{computed.rest.kcal} קל׳</span>
                {'  ·  '}
                <span style={{ color: T.macro.protein }}>{computed.rest.protein}P</span>
                {'  '}
                <span style={{ color: T.macro.carbs }}>{computed.rest.carbs}C</span>
                {'  '}
                <span style={{ color: T.macro.fat }}>{computed.rest.fat}F</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs" style={{ color: T.t.textSecondary }}>
              <span>יעד יום אימון</span>
              <span style={{ fontFamily: FONT_MONO }}>
                <span style={{ color: T.macro.kcal }}>{computed.training.kcal} קל׳</span>
                {'  ·  '}
                <span style={{ color: T.macro.protein }}>{computed.training.protein}P</span>
                {'  '}
                <span style={{ color: T.macro.carbs }}>{computed.training.carbs}C</span>
                {'  '}
                <span style={{ color: T.macro.fat }}>{computed.training.fat}F</span>
              </span>
            </div>
          </GlassCard>

          {/* Optional AI / LLM connection (Sprint 9) */}
          <div>
            <Eyebrow>חיבור AI (אופציונלי)</Eyebrow>
            <p className="text-xs mb-3" style={{ color: T.t.textDim }}>
              המאמן ה-AI ומנוע הפענוח החופשי עובדים במלואם ללא כל מפתח — ההגדרה הזו נועדה למי שרוצה בעתיד לחבר מודל שפה חיצוני (Groq / OpenAI / HuggingFace) לתגובות צ׳אט חיות. המפתח נשמר במכשיר בלבד ולעולם לא מיוצא בקובץ הגיבוי.
            </p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {['none', 'groq', 'openai', 'huggingface'].map((prov) => (
                <button
                  key={prov}
                  onClick={() => setApiConfig((prev) => ({ ...prev, provider: prov }))}
                  className="py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: apiConfig.provider === prov ? T.accent : T.t.chipBg,
                    color: apiConfig.provider === prov ? '#07080B' : T.t.textSecondary,
                    border: `1px solid ${apiConfig.provider === prov ? T.accent : T.t.border}`,
                  }}
                >
                  {prov === 'none' ? 'ללא (ברירת מחדל)' : prov}
                </button>
              ))}
            </div>
            {apiConfig.provider !== 'none' && (
              <input
                value={apiConfig.key}
                onChange={(e) => setApiConfig((prev) => ({ ...prev, key: e.target.value }))}
                type="password"
                dir="ltr"
                placeholder="הדביקו מפתח API כאן"
                className="w-full py-2.5 px-3.5 rounded-xl text-sm outline-none"
                style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO, textAlign: 'left' }}
              />
            )}
          </div>

          {/* Export / Import */}
          <div>
            <Eyebrow color={T.t.textSecondary}>גיבוי וייצוא נתונים</Eyebrow>
            <div className="flex gap-2">
              <button
                onClick={onExport}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300"
                style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
              >
                <Download size={14} /> ייצוא נתונים
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-300"
                style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
              >
                <Upload size={14} /> ייבוא נתונים
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImport(file);
                  e.target.value = '';
                }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: T.t.textDim }}>
              הנתונים נשמרים אוטומטית ומסונכרנים לענן האישי של הארטיפקט.
            </p>
          </div>

          {/* System — docs viewer & diagnostics (Sprint 12) */}
          <div>
            <Eyebrow>מערכת · PROJECT SHRED v{APP_VERSION}</Eyebrow>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenDocs}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold"
                style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
              >
                <FileCode size={14} /> ארכיטקטורה ותיעוד
              </button>
              <button
                onClick={onOpenDiagnostics}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold"
                style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
              >
                <ShieldCheck size={14} /> דיאגנוסטיקת מערכת
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= SPRINT 8 · HELP, LEGEND & TOUR ============================= */

function AccordionItem({ item, isOpen, onToggle }) {
  const T = useTheme();
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.t.border}` }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 text-right transition-colors duration-200"
        style={{ background: isOpen ? `${T.accent}12` : T.t.chipBg }}
      >
        <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{item.q}</span>
        {isOpen ? <ChevronUp size={16} color={T.accent} /> : <ChevronDown size={16} color={T.t.textDim} />}
      </button>
      <div
        style={{
          maxHeight: isOpen ? 300 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
          background: T.t.card,
        }}
      >
        <p className="text-sm p-3.5 leading-relaxed" style={{ color: T.t.textSecondary }}>{item.a}</p>
      </div>
    </div>
  );
}

function LegendTab() {
  const T = useTheme();
  const legendColors = getLegendColors(T.macro);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Eyebrow>קוד צבעים</Eyebrow>
        <div className="flex flex-col gap-2">
          {legendColors.map((c) => (
            <div key={c.label} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: T.t.chipBg }}>
              <span className="rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: c.hex, boxShadow: glow(c.hex, 8, '55') }} />
              <div>
                <div className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{c.label}</div>
                <div className="text-xs" style={{ color: T.t.textSecondary }}>{c.desc}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <span className="rounded-full flex-shrink-0" style={{ width: 20, height: 20, background: T.accent, boxShadow: glow(T.accent, 8, '55') }} />
            <div>
              <div className="text-sm font-bold" style={{ color: T.t.textPrimary }}>Accent (הצבע הנבחר שלך)</div>
              <div className="text-xs" style={{ color: T.t.textSecondary }}>לשוניות פעילות, כפתורי פעולה, טיימר האימון וסימוני וי — ניתן להחלפה בהגדרות</div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Eyebrow>נוסחת 3 החלקים · שומשום</Eyebrow>
        <div className="flex rounded-xl overflow-hidden h-10" style={{ border: `1px solid ${T.t.border}` }}>
          <div className="flex items-center justify-center text-xs font-bold" style={{ flexBasis: '50%', background: `${T.accent}33`, color: T.t.textPrimary }}>ירקות ½</div>
          <div className="flex items-center justify-center text-xs font-bold" style={{ flexBasis: '25%', background: `${T.macro.protein}33`, color: T.t.textPrimary }}>חלבון ¼</div>
          <div className="flex items-center justify-center text-xs font-bold" style={{ flexBasis: '25%', background: `${T.macro.carbs}33`, color: T.t.textPrimary }}>פחמימה ¼</div>
        </div>
        <p className="text-xs mt-2" style={{ color: T.t.textSecondary }}>חצי צלחת ירקות, רבע חלבון (כדורי דגים/עוף, שווארמה), רבע פחמימה — 3-4 כפות אורז או פירה בלבד.</p>
      </div>

      <div>
        <Eyebrow>יום אימון מול יום מנוחה</Eyebrow>
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.t.chipBg }}>
          <div className="text-center flex-1">
            <div className="text-xs" style={{ color: T.t.textDim }}>יום מנוחה</div>
            <div className="text-sm font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>יעד בסיס</div>
          </div>
          <ArrowLeft size={18} color={T.macro.kcal} />
          <div className="text-center flex-1">
            <div className="text-xs" style={{ color: T.t.textDim }}>יום אימון</div>
            <div className="text-sm font-bold" style={{ color: T.macro.kcal, fontFamily: FONT_MONO }}>+300 קל׳ (+75g פחמימה)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlossaryTab() {
  const T = useTheme();
  return (
    <div className="flex flex-col gap-3">
      {GLOSSARY.map((g) => (
        <div key={g.term} className="p-3.5 rounded-xl" style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}>
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <span className="text-sm font-bold" style={{ color: T.accent }}>{g.term}</span>
            <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{g.full}</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: T.t.textSecondary }}>{g.desc}</p>
        </div>
      ))}
    </div>
  );
}

function FaqTab() {
  const [openIds, setOpenIds] = useState({});
  const toggle = (i) => setOpenIds((prev) => ({ ...prev, [i]: !prev[i] }));
  return (
    <div className="flex flex-col gap-2.5">
      {FAQ_ITEMS.map((item, i) => (
        <AccordionItem key={i} item={item} isOpen={!!openIds[i]} onToggle={() => toggle(i)} />
      ))}
    </div>
  );
}

function HelpModal({ open, onClose, onStartTour }) {
  const T = useTheme();
  const [tab, setTab] = useState('legend');
  const tabs = [
    { id: 'legend', label: 'מקרא ויזואלי', icon: Info },
    { id: 'glossary', label: 'מילון מושגים', icon: BookOpen },
    { id: 'faq', label: 'שאלות ותשובות', icon: LifeBuoy },
  ];
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{
        background: T.t.overlayBg,
        backdropFilter: open ? 'blur(6px)' : 'none',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 0.3s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl backdrop-blur-xl overflow-hidden"
        style={{
          maxWidth: 560, maxHeight: '88vh', overflowY: 'auto',
          background: T.t.modalBg,
          border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 30, '22')}`,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <HelpCircle size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>המדריך המנהלים ומקרא המערכת</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <X size={16} color={T.t.textSecondary} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <button
            onClick={onStartTour}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300"
            style={{ background: T.accent, color: '#07080B', boxShadow: glow(T.accent, 12, '35') }}
          >
            <Compass size={16} /> התחל סיור במערכת
          </button>

          <div className="flex gap-1 p-1 rounded-xl" style={{ background: T.t.chipBg }}>
            {tabs.map((tb) => {
              const Icon = tb.icon;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300"
                  style={{
                    background: tab === tb.id ? T.accent : 'transparent',
                    color: tab === tb.id ? '#07080B' : T.t.textSecondary,
                  }}
                >
                  <Icon size={14} /> {tb.label}
                </button>
              );
            })}
          </div>

          {tab === 'legend' && <LegendTab />}
          {tab === 'glossary' && <GlossaryTab />}
          {tab === 'faq' && <FaqTab />}
        </div>
      </div>
    </div>
  );
}

function TourCoachmark({ step, totalSteps, onNext, onBack, onSkip }) {
  const T = useTheme();
  const data = TOUR_STEPS[step - 1];
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: T.t.overlayBg, pointerEvents: 'none' }} />
      <div
        className="fixed bottom-4 left-1/2 z-50 w-full px-4"
        style={{ transform: 'translateX(-50%)', maxWidth: 420 }}
      >
        <GlassCard className="p-4" style={{ background: T.t.modalBg, boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 24, '33')}` }}>
          <div className="flex items-center gap-2 mb-2">
            <Compass size={16} color={T.accent} />
            <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>{data.title}</span>
          </div>
          <p className="text-xs mb-4 leading-relaxed" style={{ color: T.t.textSecondary }}>{data.desc}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {TOUR_STEPS.map((s) => (
                <span
                  key={s.id}
                  className="rounded-full transition-all duration-300"
                  style={{ width: s.id === step ? 18 : 6, height: 6, background: s.id === step ? T.accent : T.t.border }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onSkip} className="text-xs px-2 py-1.5" style={{ color: T.t.textDim }}>דלג</button>
              {step > 1 && (
                <button onClick={onBack} className="p-2 rounded-lg" style={{ background: T.t.chipBg }}>
                  <ArrowRight size={14} color={T.t.textSecondary} />
                </button>
              )}
              <button
                onClick={onNext}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold"
                style={{ background: T.accent, color: '#07080B' }}
              >
                {step === totalSteps ? 'סיום' : 'הבא'} <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

/* ============================= SPRINT 9 · AI COACH HUB ============================= */

function ScoreBadge({ score }) {
  const T = useTheme();
  const color = score >= 80 ? T.macro.protein : score >= 50 ? T.macro.kcal : T.macro.fat;
  return <Ring value={score} max={100} size={72} stroke={7} color={color} unit="%" icon={<BarChart3 size={13} color={color} />} />;
}

function ParsedItemRow({ item, onRemove }) {
  const T = useTheme();
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: T.t.chipBg }}>
      <div>
        <div className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{item.name}</div>
        <div className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{item.amount}</div>
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ fontFamily: FONT_MONO }}>
        <span style={{ color: T.macro.kcal }}>{item.kcal} קל׳</span>
        <span style={{ color: T.macro.protein }}>{item.protein}ח</span>
        <span style={{ color: T.macro.carbs }}>{item.carbs}פ</span>
        <span style={{ color: T.macro.fat }}>{item.fat}ש</span>
        {onRemove && (
          <button onClick={onRemove} style={{ color: T.t.textDim }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function SmartSwapAlerts({ consumed, targets }) {
  const T = useTheme();
  const [dismissed, setDismissed] = useState({});
  const hour = new Date().getHours();
  const proteinGap = targets.protein - consumed.protein;
  const alerts = [];

  if (hour >= 17 && proteinGap > 30) {
    alerts.push({
      id: 'protein-gap',
      icon: Lightbulb,
      color: T.macro.protein,
      text: `הצעת AI: פיגור של ${Math.round(proteinGap)} גרם חלבון מהיעד — הוסיפו מעדן חלבון (GO/PRO) + כ-50 גרם פסטרמה בארוחת הערב כדי לסגור את זה.`,
    });
  }
  if (consumed.kcal >= targets.kcal * 0.9) {
    alerts.push({
      id: 'kcal-limit',
      icon: AlertTriangle,
      color: T.macro.kcal,
      text: 'הצעת AI: אתם קרובים ליעד הקלורי היומי — עברו לארוחת ערב מבוססת חלבון וירקות בלבד, ללא תוספת פחמימה.',
    });
  }

  const visible = alerts.filter((a) => !dismissed[a.id]);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-4">
      {visible.map((a) => {
        const Icon = a.icon;
        return (
          <div key={a.id} className="flex items-start gap-2.5 p-3 rounded-xl" style={{ background: `${a.color}14`, border: `1px solid ${a.color}33` }}>
            <Icon size={16} color={a.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs flex-1 leading-relaxed" style={{ color: T.t.textPrimary }}>{a.text}</p>
            <button onClick={() => setDismissed((d) => ({ ...d, [a.id]: true }))} style={{ color: T.t.textDim, flexShrink: 0 }}>
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function AiCoachWidget({ consumed, targets, dayMode, onLogItems, aiReport, setAiReport, foodLibrary, defaultSlotId }) {
  const T = useTheme();
  const [analyzing, setAnalyzing] = useState(false);
  const [logText, setLogText] = useState('');
  const [preview, setPreview] = useState([]);
  const [noMatch, setNoMatch] = useState(false);
  const [swapResults, setSwapResults] = useState(null);
  const [slotId, setSlotId] = useState(defaultSlotId || 'lunch');

  const findSwaps = () => {
    const remainingKcal = targets.kcal - consumed.kcal;
    const remainingProtein = targets.protein - consumed.protein;
    setSwapResults({
      remainingKcal: Math.round(remainingKcal),
      remainingProtein: Math.round(remainingProtein),
      matches: findBestMatches(foodLibrary, remainingKcal, remainingProtein, 3),
    });
    T.playFeedback();
  };

  const logSwap = (item) => {
    onLogItems([{ name: item.name, calories: item.kcal, protein: item.protein, carbs: item.carbs, fats: item.fat, source: 'swap' }], slotId);
    T.playFeedback();
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAiReport(generateAiReport({ consumed, targets, dayMode }));
      setAnalyzing(false);
      T.playFeedback();
    }, 600);
  };

  const runParse = () => {
    const results = parseFoodText(logText);
    setPreview(results);
    setNoMatch(results.length === 0);
    T.playFeedback();
  };

  const confirmLog = () => {
    onLogItems(preview.map((p) => ({ name: p.name, calories: p.kcal, protein: p.protein, carbs: p.carbs, fats: p.fat, source: 'quicklog' })), slotId);
    setPreview([]);
    setLogText('');
    T.playFeedback();
  };

  const previewTotals = preview.reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 34, height: 34, background: `${T.accent}18` }}
          >
            <Brain size={18} color={T.accent} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>AI Performance Coach</h3>
            <p className="text-xs" style={{ color: T.t.textDim }}>מנוע היוריסטי מקומי · פועל 100% במכשיר, ללא מפתח API</p>
          </div>
        </div>
      </div>

      {/* ---- Analyze today ---- */}
      <div className="flex items-center gap-4 flex-wrap mt-4">
        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: T.accent, color: '#07080B', boxShadow: glow(T.accent, 12, '35'), opacity: analyzing ? 0.7 : 1 }}
        >
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkle size={16} />}
          {analyzing ? 'מנתח נתונים…' : 'ניתוח יום אולימפי'}
        </button>
        {aiReport && !analyzing && (
          <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
            עודכן {new Date(aiReport.generatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {aiReport && !analyzing && (
        <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 rounded-xl" style={{ background: T.t.chipBg }}>
          <ScoreBadge score={aiReport.score} />
          <div className="flex flex-col gap-3 flex-1">
            <div className="flex items-start gap-2">
              <BarChart3 size={15} color={T.accent} style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: T.t.textPrimary }}>
                <span className="font-bold">ציון היצמדות יומית: {aiReport.score}%</span> — משוקלל מדיוק חלבון (60%) ומדיוק קלורי (40%).
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Target size={15} color={T.macro.kcal} style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: T.t.textSecondary }}>{aiReport.tactical}</p>
            </div>
            <div className="flex items-start gap-2">
              <Zap size={15} color={T.macro.fat} style={{ flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm italic" style={{ color: T.t.textSecondary }}>{aiReport.mental}</p>
            </div>
          </div>
        </div>
      )}

      <SmartSwapAlerts consumed={consumed} targets={targets} />

      {/* ---- Shared slot selector for anything logged from this widget ---- */}
      <div className="mt-4">
        <p className="text-xs font-semibold mb-1.5" style={{ color: T.t.textSecondary }}>שיבוץ לחלון זמן</p>
        <div className="grid grid-cols-5 gap-1.5">
          {SLOT_DEFS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlotId(s.id)}
              className="py-2 px-1 rounded-lg text-xs font-semibold"
              style={{
                background: slotId === s.id ? T.accent : T.t.chipBg,
                color: slotId === s.id ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${slotId === s.id ? T.accent : T.t.border}`,
              }}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Context-aware Smart Swaps: "what should I eat now?" ---- */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <Eyebrow>מה לאכול עכשיו?</Eyebrow>
          <button
            onClick={findSwaps}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
          >
            <Utensils size={13} /> מצא לי משהו לאכול
          </button>
        </div>
        {swapResults && (
          <div className="flex flex-col gap-2">
            <p className="text-xs" style={{ color: T.t.textDim }}>
              נותרו לכם היום: <span style={{ color: T.macro.kcal, fontFamily: FONT_MONO }}>{Math.max(swapResults.remainingKcal, 0)} קל׳</span>
              {'  ·  '}
              <span style={{ color: T.macro.protein, fontFamily: FONT_MONO }}>{Math.max(swapResults.remainingProtein, 0)}g חלבון</span>
            </p>
            {swapResults.matches.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: T.t.chipBg }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{m.name}</div>
                  <div className="text-xs" style={{ color: T.t.textDim }}>{m.source}</div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ fontFamily: FONT_MONO }}>
                  <span style={{ color: T.macro.kcal }}>{m.kcal}</span>
                  <span style={{ color: T.macro.protein }}>{m.protein}ח</span>
                  <button onClick={() => logSwap(m)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-bold" style={{ background: T.macro.protein, color: '#07080B' }}>
                    <CheckCircle2 size={13} /> אשר ואכול
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Quick-log NLP parser ---- */}
      <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <Eyebrow>רישום חופשי מהיר</Eyebrow>
        <p className="text-xs mb-2" style={{ color: T.t.textDim }}>מה אכלת עכשיו? כתבו בלשון חופשית — לדוגמה: "אכלתי 200 גרם חזה עוף ואורז בצהריים"</p>
        <div className="flex gap-2 items-start flex-wrap">
          <textarea
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            rows={2}
            placeholder="במבה קטנה ומעדן GO..."
            className="flex-1 py-2.5 px-3.5 rounded-xl text-sm outline-none resize-none"
            style={{ minWidth: 200, background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
          />
          <button
            onClick={runParse}
            disabled={!logText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold self-stretch"
            style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1.5px solid ${T.t.border}`, opacity: logText.trim() ? 1 : 0.5 }}
          >
            <Wand2 size={15} /> פענח
          </button>
        </div>

        {noMatch && preview.length === 0 && (
          <p className="text-xs mt-2" style={{ color: T.macro.kcal }}>לא זוהו מאכלים ידועים בטקסט — נסו לנסח עם שם מאכל ברור (למשל "חזה עוף", "אורז", "במבה").</p>
        )}

        {preview.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {preview.map((item) => (
              <ParsedItemRow key={item.id} item={item} onRemove={() => setPreview((p) => p.filter((x) => x.id !== item.id))} />
            ))}
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
                סה״כ: {Math.round(previewTotals.kcal)} קל׳ · {roundNum(previewTotals.protein)}ח · {roundNum(previewTotals.carbs)}פ · {roundNum(previewTotals.fat)}ש
              </span>
              <button
                onClick={confirmLog}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: T.macro.protein, color: '#07080B' }}
              >
                <Send size={13} /> אשר והוסף ליומן
              </button>
            </div>
          </div>
        )}
      </div>

    </GlassCard>
  );
}

/* ============================= SPRINT 10 · EXECUTIVE ANALYTICS HUB ============================= */

function buildHeatmapColumns(dailyLogs, computed, weeks = HEATMAP_WEEKS) {
  const today = new Date();
  const totalDays = weeks * 7;
  const days = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = dateKey(d);
    const log = dailyLogs[key] || null;
    const dayTargets = log?.workoutDone ? computed.training : computed.rest;
    const score = log ? scoreDayLog(log, dayTargets) : null;
    days.push({ key, date: d, log, score });
  }
  const columns = [];
  for (let c = 0; c < weeks; c++) columns.push(days.slice(c * 7, (c + 1) * 7));
  return columns;
}

function HeatmapDetail({ cell, computed }) {
  const T = useTheme();
  if (!cell) {
    return <p className="text-xs" style={{ color: T.t.textDim }}>הצביעו או הקישו על יום כדי לראות פרטים.</p>;
  }
  const { log, score, key } = cell;
  const dayTargets = log?.workoutDone ? computed.training : computed.rest;
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <span className="text-sm font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>{formatShortDate(key)}</span>
        {score !== null ? (
          <span className="text-xs mr-2" style={{ color: T.t.textDim }}>ציון היצמדות: {score}%</span>
        ) : (
          <span className="text-xs mr-2" style={{ color: T.t.textDim }}>לא תועד יום זה</span>
        )}
      </div>
      {log && (
        <div className="flex items-center gap-3 text-xs" style={{ fontFamily: FONT_MONO }}>
          <span style={{ color: T.macro.kcal }}>{log.kcal}/{dayTargets.kcal} קל׳</span>
          <span style={{ color: T.macro.protein }}>{log.protein}/{dayTargets.protein}ח</span>
          <span style={{ color: log.workoutDone ? T.macro.protein : T.t.textDim }}>
            {log.workoutDone ? `✓ אימון ${log.workoutDay || ''}` : 'ללא אימון'}
          </span>
        </div>
      )}
    </div>
  );
}

function ComplianceHeatmap({ dailyLogs, setDailyLogs, computed }) {
  const T = useTheme();
  const [selectedKey, setSelectedKey] = useState(null);
  const [editing, setEditing] = useState(false);
  const columns = buildHeatmapColumns(dailyLogs, computed);
  const allCells = columns.flat();
  const selectedCell = allCells.find((c) => c.key === selectedKey) || null;

  const resetLastWeek = () => {
    setDailyLogs((prev) => {
      const next = { ...prev };
      const lastWeek = columns[columns.length - 1];
      lastWeek.forEach((c) => delete next[c.key]);
      return next;
    });
    setSelectedKey(null);
    T.playFeedback();
  };

  const saveEdit = (patch) => {
    if (!selectedCell) return;
    setDailyLogs((prev) => ({
      ...prev,
      [selectedCell.key]: {
        kcal: 0, protein: 0, carbs: 0, fat: 0, workoutDone: false, workoutDay: null,
        ...prev[selectedCell.key],
        ...patch,
      },
    }));
    T.playFeedback();
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <Eyebrow>מפת חום היצמדות · {HEATMAP_WEEKS} שבועות אחרונים</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מפת חום שבועית/חודשית</h3>
        </div>
        <button
          onClick={resetLastWeek}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
        >
          <RotateCcw size={13} /> איפוס נתוני שבוע אחרון
        </button>
      </div>

      <div dir="ltr" className="overflow-x-auto pb-1">
        <div className="flex gap-1 w-max">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell) => {
                const color = heatColor(cell.score, T.macro);
                const isSelected = cell.key === selectedKey;
                return (
                  <button
                    key={cell.key}
                    onMouseEnter={() => setSelectedKey(cell.key)}
                    onClick={() => { setSelectedKey(cell.key); setEditing(false); }}
                    className="rounded-sm flex-shrink-0"
                    style={{
                      width: 13, height: 13,
                      background: color || T.t.chipBg,
                      border: isSelected ? `1.5px solid ${T.accent}` : `1px solid ${T.t.border}`,
                      opacity: color ? 1 : 0.5,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: T.t.textDim }}>
        <span>פחות</span>
        <span className="rounded-sm" style={{ width: 11, height: 11, background: T.t.chipBg, display: 'inline-block' }} />
        <span className="rounded-sm" style={{ width: 11, height: 11, background: T.macro.fat, display: 'inline-block' }} />
        <span className="rounded-sm" style={{ width: 11, height: 11, background: T.macro.kcal, display: 'inline-block' }} />
        <span className="rounded-sm" style={{ width: 11, height: 11, background: T.macro.protein, display: 'inline-block' }} />
        <span>יותר</span>
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <HeatmapDetail cell={selectedCell} computed={computed} />
        {selectedCell && (
          <div className="mt-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
              >
                <Pencil size={12} /> ערוך יום זה (מילוי רטרואקטיבי)
              </button>
            ) : (
              <DayEditor cell={selectedCell} onSave={saveEdit} onClose={() => setEditing(false)} />
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function DayEditor({ cell, onSave, onClose }) {
  const T = useTheme();
  const [kcal, setKcal] = useState(cell.log?.kcal ?? '');
  const [protein, setProtein] = useState(cell.log?.protein ?? '');
  const [workoutDone, setWorkoutDone] = useState(cell.log?.workoutDone ?? false);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: T.t.chipBg }}>
      <div className="flex gap-2 flex-wrap">
        <input
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          type="number" dir="ltr" placeholder="קלוריות"
          className="flex-1 py-2 px-3 rounded-lg text-sm outline-none"
          style={{ minWidth: 110, background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
        />
        <input
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          type="number" dir="ltr" placeholder="חלבון (גרם)"
          className="flex-1 py-2 px-3 rounded-lg text-sm outline-none"
          style={{ minWidth: 110, background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
        />
      </div>
      <label className="flex items-center gap-2 text-xs" style={{ color: T.t.textSecondary }}>
        <input type="checkbox" checked={workoutDone} onChange={(e) => setWorkoutDone(e.target.checked)} />
        אימון בוצע ביום זה
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => { onSave({ kcal: Number(kcal) || 0, protein: Number(protein) || 0, workoutDone }); onClose(); }}
          className="flex-1 py-2 rounded-lg text-xs font-bold"
          style={{ background: T.accent, color: '#07080B' }}
        >
          שמור
        </button>
        <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs" style={{ background: T.t.inputBg, color: T.t.textSecondary }}>ביטול</button>
      </div>
    </div>
  );
}

function DualTrendChart({ entries }) {
  const T = useTheme();
  const w = 560, h = 180, pad = 24;
  const weights = entries.map((e) => e.weight);
  const waists = entries.map((e) => e.waist);
  const wMin = Math.min(...weights) - 1, wMax = Math.max(...weights) + 1;
  const waMin = Math.min(...waists, TARGET_WAIST_CM) - 2, waMax = Math.max(...waists) + 2;

  const x = (i) => pad + (i / Math.max(entries.length - 1, 1)) * (w - pad * 2);
  const yW = (v) => h - pad - ((v - wMin) / (wMax - wMin || 1)) * (h - pad * 2);
  const yWa = (v) => h - pad - ((v - waMin) / (waMax - waMin || 1)) * (h - pad * 2);

  const weightPath = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yW(e.weight)}`).join(' ');
  const waistPath = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yWa(e.waist)}`).join(' ');
  const targetY = yWa(TARGET_WAIST_CM);

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <line x1={pad} y1={targetY} x2={w - pad} y2={targetY} stroke={T.t.textDim} strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={waistPath} fill="none" stroke={T.macro.kcal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={weightPath} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {entries.map((e, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={yW(e.weight)} r={i === entries.length - 1 ? 4 : 2.5} fill={T.accent} />
            <circle cx={x(i)} cy={yWa(e.waist)} r={i === entries.length - 1 ? 4 : 2.5} fill={T.macro.kcal} />
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2 flex-wrap gap-2 text-xs" style={{ fontFamily: FONT_MONO }}>
        <div className="flex items-center gap-3">
          <span style={{ color: T.accent }}>● משקל</span>
          <span style={{ color: T.macro.kcal }}>● היקף מותן</span>
          <span style={{ color: T.t.textDim }}>┄ יעד {TARGET_WAIST_CM}cm</span>
        </div>
        <span style={{ color: T.t.textDim }}>{formatShortDate(entries[0].date)} → {formatShortDate(entries[entries.length - 1].date)}</span>
      </div>
    </div>
  );
}

function buildWeeklyReport(dailyLogs, metricEntries, computed) {
  const today = new Date();
  const last7Keys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(today, -i)));
  const last7Logs = last7Keys.map((k) => dailyLogs[k]).filter(Boolean);

  const scores = last7Logs.map((log) => scoreDayLog(log, log.workoutDone ? computed.training : computed.rest)).filter((s) => s !== null);
  const avgCompliance = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const avgProtein = last7Logs.length ? Math.round(last7Logs.reduce((a, l) => a + l.protein, 0) / last7Logs.length) : 0;
  const workoutDays = last7Logs.filter((l) => l.workoutDone).length;

  const recent = metricEntries.slice(-2);
  const weightDelta = recent.length === 2 ? roundNum(recent[1].weight - recent[0].weight) : 0;
  const waistDelta = recent.length === 2 ? Math.round(recent[1].waist - recent[0].waist) : 0;

  return { avgCompliance, avgProtein, workoutDays, weightDelta, waistDelta, loggedDays: last7Logs.length };
}

function WeeklyReportModal({ open, onClose, report, profile }) {
  const T = useTheme();
  const [copied, setCopied] = useState(false);

  const whatsappText = `📊 *דוח שבועי · PROJECT SHRED*
👤 ${profile.name}

📉 שינוי משקל השבוע: ${report.weightDelta > 0 ? '+' : ''}${report.weightDelta} ק"ג
📏 שינוי היקף מותן: ${report.waistDelta > 0 ? '+' : ''}${report.waistDelta} ס"מ
🎯 דיוק ממוצע שבועי: ${report.avgCompliance}%
🥩 ממוצע חלבון יומי: ${report.avgProtein} גרם
🏃‍♂️ ימי אימון שבוצעו: ${report.workoutDays}/7

נוצר אוטומטית ב-PROJECT SHRED`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      T.playFeedback();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard API unavailable — fail silently, text is still visible on screen.
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{
        background: T.t.overlayBg, backdropFilter: open ? 'blur(6px)' : 'none',
        opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.3s ease',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 460, maxHeight: '88vh', overflowY: 'auto',
          background: T.t.modalBg, border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 20, '30')}`,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>דוח שבועי מנהלים</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <X size={16} color={T.t.textSecondary} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>שינוי משקל</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.accent }}>{report.weightDelta > 0 ? '+' : ''}{report.weightDelta} ק״ג</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>שינוי היקף מותן</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.kcal }}>{report.waistDelta > 0 ? '+' : ''}{report.waistDelta} ס״מ</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>דיוק שבועי ממוצע</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.protein }}>{report.avgCompliance}%</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>ימי אימון</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.fat }}>{report.workoutDays}/7</div>
            </div>
          </div>

          <p className="text-xs" style={{ color: T.t.textDim }}>ממוצע חלבון יומי השבוע: <span style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>{report.avgProtein} גרם</span></p>

          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm mt-2"
            style={{ background: copied ? T.macro.protein : T.accent, color: '#07080B' }}
          >
            {copied ? <Check size={16} /> : <MessageCircle size={16} />}
            {copied ? 'הועתק!' : 'העתק דוח ל-WhatsApp'}
          </button>
          <p className="text-xs text-center" style={{ color: T.t.textDim }}>
            <Copy size={11} style={{ display: 'inline', marginLeft: 4 }} /> הטקסט מועתק ללוח והדבקה ב-WhatsApp/כל אפליקציה
          </p>
        </div>
      </div>
    </div>
  );
}



/* ============================= SPRINT 11 · BUILDER MODALS ============================= */

function ItemRowEditor({ item, onChange, onRemove }) {
  const T = useTheme();
  return (
    <div className="flex items-center gap-2 flex-wrap p-2 rounded-lg" style={{ background: T.t.chipBg }}>
      <input
        value={item.name}
        onChange={(e) => onChange({ ...item, name: e.target.value })}
        placeholder="שם"
        className="flex-1 py-2 px-2.5 rounded-lg text-sm outline-none"
        style={{ minWidth: 110, background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
      />
      {['kcal', 'protein', 'carbs', 'fat'].map((f) => (
        <input
          key={f}
          value={item[f]}
          onChange={(e) => onChange({ ...item, [f]: e.target.value })}
          type="number" dir="ltr"
          placeholder={f === 'kcal' ? 'קל׳' : f === 'protein' ? 'ח' : f === 'carbs' ? 'פ' : 'ש'}
          className="py-2 px-2 rounded-lg text-xs outline-none"
          style={{ width: 56, background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
        />
      ))}
      <button onClick={onRemove} style={{ color: T.macro.fat, flexShrink: 0 }}>
        <XCircle size={16} />
      </button>
    </div>
  );
}

function RestaurantBuilderModal({ open, onClose, restaurant, onSave, onDelete }) {
  const T = useTheme();
  const [draft, setDraft] = useState(restaurant || emptyRestaurant());

  useEffect(() => {
    if (open) setDraft(restaurant || emptyRestaurant());
  }, [open, restaurant]);

  if (!open) return null;

  const updateDishes = (list) => setDraft({ ...draft, dishes: list });
  const updatePlate = (cat, list) => setDraft({ ...draft, plateOptions: { ...draft.plateOptions, [cat]: list } });

  const save = () => {
    if (!draft.name.trim()) return;
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: T.t.overlayBg, backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: 560, maxHeight: '88vh', overflowY: 'auto', background: T.t.modalBg, border: `1px solid ${T.accent}33`, boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 20, '30')}` }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <Store size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{restaurant ? 'עריכת מסעדה' : 'הוספת מסעדה'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}><X size={16} color={T.t.textSecondary} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <FieldInput label="שם המסעדה" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />

          <div>
            <Eyebrow>סוג התפריט</Eyebrow>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDraft({ ...draft, type: 'simple' })}
                className="py-2.5 rounded-lg text-xs font-semibold"
                style={{ background: draft.type === 'simple' ? T.accent : T.t.chipBg, color: draft.type === 'simple' ? '#07080B' : T.t.textSecondary, border: `1px solid ${draft.type === 'simple' ? T.accent : T.t.border}` }}
              >
                רשימת מנות (כמו גומבה)
              </button>
              <button
                onClick={() => setDraft({ ...draft, type: 'plate3' })}
                className="py-2.5 rounded-lg text-xs font-semibold"
                style={{ background: draft.type === 'plate3' ? T.accent : T.t.chipBg, color: draft.type === 'plate3' ? '#07080B' : T.t.textSecondary, border: `1px solid ${draft.type === 'plate3' ? T.accent : T.t.border}` }}
              >
                נוסחת 3 חלקים (כמו שומשום)
              </button>
            </div>
          </div>

          {draft.type === 'simple' ? (
            <div>
              <Eyebrow>מנות</Eyebrow>
              <div className="flex flex-col gap-2">
                {draft.dishes.map((d, i) => (
                  <ItemRowEditor
                    key={d.id}
                    item={d}
                    onChange={(next) => updateDishes(draft.dishes.map((x, xi) => (xi === i ? next : x)))}
                    onRemove={() => updateDishes(draft.dishes.filter((_, xi) => xi !== i))}
                  />
                ))}
              </div>
              <button
                onClick={() => updateDishes([...draft.dishes, emptyFoodItem()])}
                className="flex items-center gap-1.5 text-xs font-semibold mt-2 px-3 py-1.5 rounded-lg"
                style={{ background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
              >
                <ListPlus size={13} /> הוסף מנה
              </button>
            </div>
          ) : (
            ['veg', 'protein', 'carb'].map((cat) => (
              <div key={cat}>
                <Eyebrow>{cat === 'veg' ? 'ירקות' : cat === 'protein' ? 'חלבון' : 'פחמימה'}</Eyebrow>
                <div className="flex flex-col gap-2">
                  {draft.plateOptions[cat].map((it, i) => (
                    <ItemRowEditor
                      key={it.id}
                      item={it}
                      onChange={(next) => updatePlate(cat, draft.plateOptions[cat].map((x, xi) => (xi === i ? next : x)))}
                      onRemove={() => updatePlate(cat, draft.plateOptions[cat].filter((_, xi) => xi !== i))}
                    />
                  ))}
                </div>
                <button
                  onClick={() => updatePlate(cat, [...draft.plateOptions[cat], emptyFoodItem()])}
                  className="flex items-center gap-1.5 text-xs font-semibold mt-2 px-3 py-1.5 rounded-lg"
                  style={{ background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
                >
                  <ListPlus size={13} /> הוסף אפשרות
                </button>
              </div>
            ))
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={save} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: T.accent, color: '#07080B' }}>שמור מסעדה</button>
            {restaurant && (
              <button
                onClick={() => { onDelete(restaurant.id); onClose(); }}
                className="px-4 py-3 rounded-xl font-bold text-sm"
                style={{ background: T.t.chipBg, color: T.macro.fat, border: `1px solid ${T.t.border}` }}
              >
                מחק
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HackBuilderModal({ open, onClose, hack, onSave, onDelete }) {
  const T = useTheme();
  const [draft, setDraft] = useState(hack || emptyHack());

  useEffect(() => {
    if (open) setDraft(hack || emptyHack());
  }, [open, hack]);

  if (!open) return null;

  const save = () => {
    if (!draft.name.trim()) return;
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: T.t.overlayBg, backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', background: T.t.modalBg, border: `1px solid ${T.accent}33`, boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 20, '30')}` }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <ChefHat size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{hack ? 'עריכת מתכון' : 'מתכון אישי חדש'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}><X size={16} color={T.t.textSecondary} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <FieldInput label="שם המתכון" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />

          <div>
            <Eyebrow>אייקון מייצג</Eyebrow>
            <div className="grid grid-cols-6 gap-2">
              {HACK_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setDraft({ ...draft, icon: e })}
                  className="text-xl py-2 rounded-lg"
                  style={{ background: draft.icon === e ? `${T.accent}22` : T.t.chipBg, border: `1.5px solid ${draft.icon === e ? T.accent : T.t.border}` }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="קלוריות" value={draft.kcal} onChange={(v) => setDraft({ ...draft, kcal: v })} type="number" suffix="קל׳" />
            <FieldInput label="חלבון" value={draft.protein} onChange={(v) => setDraft({ ...draft, protein: v })} type="number" suffix="גר׳" />
            <FieldInput label="פחמימה" value={draft.carbs} onChange={(v) => setDraft({ ...draft, carbs: v })} type="number" suffix="גר׳" />
            <FieldInput label="שומן" value={draft.fat} onChange={(v) => setDraft({ ...draft, fat: v })} type="number" suffix="גר׳" />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: T.accent, color: '#07080B' }}>שמור מתכון</button>
            {hack && (
              <button
                onClick={() => { onDelete(hack.id); onClose(); }}
                className="px-4 py-3 rounded-xl font-bold text-sm"
                style={{ background: T.t.chipBg, color: T.macro.fat, border: `1px solid ${T.t.border}` }}
              >
                מחק
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= SPRINT 15.11 · FAVORITES & ONE-TAP QUICK-ADD ============================= */

const FAVORITE_EMOJIS = ['⭐', '🥤', '🍗', '🥚', '🍚', '🥑', '🧀', '🍌', '☕', '🥜', '🍞', '🥩'];

function emptyFavorite() {
  return { id: newId('fav'), name: '', icon: '⭐', kcal: '', protein: '', carbs: '', fat: '' };
}

function FavoriteBuilderModal({ open, onClose, favorite, onSave, onDelete }) {
  const T = useTheme();
  const [draft, setDraft] = useState(favorite || emptyFavorite());

  useEffect(() => {
    if (open) setDraft(favorite || emptyFavorite());
  }, [open, favorite]);

  if (!open) return null;

  const save = () => {
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      kcal: Number(draft.kcal) || 0,
      protein: Number(draft.protein) || 0,
      carbs: Number(draft.carbs) || 0,
      fat: Number(draft.fat) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: T.t.overlayBg, backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', background: T.t.modalBg, border: `1px solid ${T.accent}33`, boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 20, '30')}` }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <Star size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{favorite ? 'עריכת מועדף' : 'מועדף חדש להוספה מהירה'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}><X size={16} color={T.t.textSecondary} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <p className="text-xs -mt-1" style={{ color: T.t.textDim }}>לדברים שאתם אוכלים כמעט כל יום — מעדן חלבון, שייק אבקה+מים, ביצים בבוקר. תיגע להוסיף — ותרשם ביום אחד.</p>
          <FieldInput label="שם" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />

          <div>
            <Eyebrow>אייקון</Eyebrow>
            <div className="grid grid-cols-6 gap-2">
              {FAVORITE_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setDraft({ ...draft, icon: e })}
                  className="text-xl py-2 rounded-lg"
                  style={{ background: draft.icon === e ? `${T.accent}22` : T.t.chipBg, border: `1.5px solid ${draft.icon === e ? T.accent : T.t.border}` }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="קלוריות" value={draft.kcal} onChange={(v) => setDraft({ ...draft, kcal: v })} type="number" suffix="קל׳" />
            <FieldInput label="חלבון" value={draft.protein} onChange={(v) => setDraft({ ...draft, protein: v })} type="number" suffix="גר׳" />
            <FieldInput label="פחמימה" value={draft.carbs} onChange={(v) => setDraft({ ...draft, carbs: v })} type="number" suffix="גר׳" />
            <FieldInput label="שומן" value={draft.fat} onChange={(v) => setDraft({ ...draft, fat: v })} type="number" suffix="גר׳" />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={save} className="flex-1 py-3 rounded-xl font-bold text-sm" style={{ background: T.accent, color: '#07080B' }}>שמור מועדף</button>
            {favorite && (
              <button
                onClick={() => { onDelete(favorite.id); onClose(); }}
                className="px-4 py-3 rounded-xl font-bold text-sm"
                style={{ background: T.t.chipBg, color: T.macro.fat, border: `1px solid ${T.t.border}` }}
              >
                מחק
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoriteChip({ fav, onLog, onEdit }) {
  const T = useTheme();
  const [justLogged, setJustLogged] = useState(false);

  const handle = () => {
    onLog(fav);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 1100);
  };

  return (
    <div
      className="flex flex-col items-center gap-1.5 flex-shrink-0 relative"
      style={{ width: 84 }}
    >
      <button
        onClick={handle}
        className="flex flex-col items-center justify-center gap-1 rounded-2xl w-full"
        style={{
          height: 76,
          background: justLogged ? `${T.macro.protein}18` : T.t.chipBg,
          border: `1.5px solid ${justLogged ? T.macro.protein : T.t.border}`,
          transform: justLogged ? 'scale(1.06)' : 'scale(1)',
          transition: 'all 0.22s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {justLogged ? <CircleCheck size={22} color={T.macro.protein} style={{ animation: 'popCheck 0.4s cubic-bezier(.34,1.56,.64,1)' }} /> : <span className="text-2xl">{fav.icon}</span>}
        <span className="text-xs font-semibold truncate w-full text-center px-1" style={{ color: justLogged ? T.macro.protein : T.t.textPrimary }}>
          {justLogged ? 'נוסף!' : fav.name}
        </span>
      </button>
      <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{fav.kcal} קל׳</span>
      <button onClick={() => onEdit(fav.id)} className="absolute -top-1.5 -left-1.5 p-1 rounded-full" style={{ background: T.t.modalBg, border: `1px solid ${T.t.border}` }}>
        <Pencil size={9} color={T.t.textDim} />
      </button>
    </div>
  );
}

function FavoritesQuickBar({ favorites, onLog, onEditFavorite, onAddFavorite }) {
  const T = useTheme();
  return (
    <div className="w-full mb-5">
      <div className="flex items-center justify-between mb-2">
        <Eyebrow>⚡ מועדפים · הוספה מהירה</Eyebrow>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {favorites.map((fav) => (
          <FavoriteChip key={fav.id} fav={fav} onLog={onLog} onEdit={onEditFavorite} />
        ))}
        <button
          onClick={onAddFavorite}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl flex-shrink-0"
          style={{ width: 84, height: 76, background: T.t.chipBg, border: `1.5px dashed ${T.t.border}` }}
        >
          <Plus size={18} color={T.accent} />
          <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>הוסף</span>
        </button>
      </div>
    </div>
  );
}



/* ============================= SPRINT 12 · DOCS VIEWER, DIAGNOSTICS & CERTIFICATE ============================= */

function renderInline(str, keyBase) {
  const parts = str.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter((p) => p !== '');
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) {
      return (
        <code key={`${keyBase}-${i}`} style={{ fontFamily: FONT_MONO, background: 'rgba(128,128,128,0.16)', padding: '1px 5px', borderRadius: 5, fontSize: '0.85em' }}>
          {p.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${keyBase}-${i}`}>{p}</span>;
  });
}

function MarkdownLite({ text }) {
  const T = useTheme();
  const lines = text.trim().split('\n');
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        if (trimmed.startsWith('## ')) {
          return <h3 key={i} className="text-base font-bold mt-2" style={{ color: T.accent, fontFamily: FONT_DISPLAY }}>{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start gap-2 mr-1">
              <span className="mt-1.5 rounded-full flex-shrink-0" style={{ width: 4, height: 4, background: T.t.textDim }} />
              <p className="text-xs leading-relaxed" style={{ color: T.t.textSecondary }}>{renderInline(trimmed.slice(2), i)}</p>
            </div>
          );
        }
        return <p key={i} className="text-xs leading-relaxed" style={{ color: T.t.textSecondary }}>{renderInline(trimmed, i)}</p>;
      })}
    </div>
  );
}

function DocsViewerModal({ open, onClose }) {
  const T = useTheme();
  const [tab, setTab] = useState('changelog');
  const tabs = [
    { id: 'changelog', label: 'יומן שינויים', icon: GitBranch, content: DOCS_CHANGELOG },
    { id: 'architecture', label: 'ארכיטקטורת מצב', icon: Layers, content: DOCS_ARCHITECTURE },
    { id: 'formulas', label: 'נוסחאות', icon: FileCode, content: DOCS_FORMULAS },
    { id: 'tree', label: 'עץ קומפוננטות', icon: Database, content: DOCS_COMPONENT_TREE },
  ];
  const active = tabs.find((t2) => t2.id === tab);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: T.t.overlayBg, backdropFilter: open ? 'blur(6px)' : 'none', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 600, maxHeight: '88vh', overflowY: 'auto',
          background: T.t.modalBg, border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 20, '30')}`,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <FileCode size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>ארכיטקטורה ותיעוד</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}><X size={16} color={T.t.textSecondary} /></button>
        </div>

        <div className="p-5">
          <div className="flex gap-1 p-1 rounded-xl mb-4 flex-wrap" style={{ background: T.t.chipBg }}>
            {tabs.map((tb) => {
              const Icon = tb.icon;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className="flex items-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold"
                  style={{ background: tab === tb.id ? T.accent : 'transparent', color: tab === tb.id ? '#07080B' : T.t.textSecondary }}
                >
                  <Icon size={13} /> {tb.label}
                </button>
              );
            })}
          </div>
          <MarkdownLite text={active.content} />
          <p className="text-xs mt-4 pt-3" style={{ color: T.t.textDim, borderTop: `1px solid ${T.t.border}` }}>
            PROJECT SHRED v{APP_VERSION} · תיעוד זה נטען ישירות מתוך קובץ ה-CLAUDE.md של הפרויקט.
          </p>
        </div>
      </div>
    </div>
  );
}

function IntegrityRow({ check }) {
  const T = useTheme();
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: T.t.chipBg }}>
      {check.pass ? <CheckCircle2 size={15} color={T.macro.protein} style={{ flexShrink: 0, marginTop: 1 }} /> : <XCircle size={15} color={T.macro.fat} style={{ flexShrink: 0, marginTop: 1 }} />}
      <div>
        <div className="text-xs font-bold" style={{ color: T.t.textPrimary }}>{check.label}</div>
        <div className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{check.detail}</div>
      </div>
    </div>
  );
}

function CertificateModal({ open, onClose, stats }) {
  const T = useTheme();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: T.t.overlayBg, backdropFilter: open ? 'blur(8px)' : 'none', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden text-center p-8"
        style={{
          maxWidth: 440, background: T.t.modalBg, border: `1.5px solid ${T.accent}55`,
          boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 30, '35')}`,
          transform: open ? 'scale(1)' : 'scale(0.92)', transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="flex items-center justify-center mx-auto mb-4 rounded-full" style={{ width: 64, height: 64, background: `${T.accent}18` }}>
          <Award size={30} color={T.accent} />
        </div>
        <h3 className="text-xl font-bold mb-1" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>PROJECT SHRED {APP_VERSION.split('.').slice(0, 2).join('.')}</h3>
        <p className="text-sm font-semibold mb-5" style={{ color: T.accent }}>Enterprise Ready · תעודת סיום מערכת</p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="p-3 rounded-xl" style={{ background: T.t.chipBg }}>
            <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.protein }}>{stats.totalWorkouts}</div>
            <div className="text-xs" style={{ color: T.t.textDim }}>אימונים שתועדו</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: T.t.chipBg }}>
            <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.accent }}>{stats.weightLost > 0 ? '-' : ''}{Math.abs(stats.weightLost)}</div>
            <div className="text-xs" style={{ color: T.t.textDim }}>ק"ג שהשתנו</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: T.t.chipBg }}>
            <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.kcal }}>{stats.adherence}%</div>
            <div className="text-xs" style={{ color: T.t.textDim }}>היצמדות מערכתית</div>
          </div>
        </div>

        <p className="text-xs mb-5" style={{ color: T.t.textDim }}>12 ספרינטים · 100% אינטראקטיבי · ללא מפתח API נדרש</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: T.accent, color: '#07080B' }}>סגור</button>
      </div>
    </div>
  );
}

function DiagnosticsModal({ open, onClose, profile, computed, storageSizeKb, onFactoryReset, onOpenCertificate }) {
  const T = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const checks = runIntegrityChecks(profile, computed);
  const allPass = checks.every((c) => c.pass);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: T.t.overlayBg, backdropFilter: open ? 'blur(6px)' : 'none', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.3s ease' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 520, maxHeight: '88vh', overflowY: 'auto',
          background: T.t.modalBg, border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 20, '30')}`,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
          transition: 'transform 0.3s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>דיאגנוסטיקת מערכת</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}><X size={16} color={T.t.textSecondary} /></button>
        </div>

        <div className="p-5 flex flex-col gap-5">
          <div>
            <Eyebrow>שימוש באחסון</Eyebrow>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.t.chipBg }}>
              <HardDrive size={20} color={T.accent} />
              <div>
                <div className="text-sm font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>{storageSizeKb} KB</div>
                <div className="text-xs" style={{ color: T.t.textDim }}>גודל מלוא מצב האפליקציה השמור (window.storage)</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Eyebrow>בדיקת תקינות פרופיל פעיל</Eyebrow>
              <span className="text-xs font-bold" style={{ color: allPass ? T.macro.protein : T.macro.fat }}>{allPass ? 'הכל תקין ✓' : 'נמצאו בעיות'}</span>
            </div>
            <div className="flex flex-col gap-2">
              {checks.map((c, i) => <IntegrityRow key={i} check={c} />)}
            </div>
          </div>

          <button
            onClick={onOpenCertificate}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
            style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
          >
            <Award size={16} /> הצג תעודת סיום מערכת
          </button>

          <div className="pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
            <Eyebrow color={T.macro.fat}>אזור סיכון</Eyebrow>
            {!confirmOpen ? (
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                style={{ background: `${T.macro.fat}14`, color: T.macro.fat, border: `1px solid ${T.macro.fat}44` }}
              >
                <ShieldAlert size={16} /> איפוס מלא להגדרות יצרן
              </button>
            ) : (
              <div className="p-3 rounded-xl flex flex-col gap-2" style={{ background: `${T.macro.fat}0F`, border: `1px solid ${T.macro.fat}44` }}>
                <p className="text-xs" style={{ color: T.t.textPrimary }}>
                  <AlertCircle size={13} style={{ display: 'inline', marginLeft: 4 }} />
                  פעולה זו תמחק את כל הפרופילים, ההיסטוריה, המסעדות והמתכונים המותאמים אישית — לצמיתות. מומלץ לגבות קודם. להמשיך?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onFactoryReset(); setConfirmOpen(false); onClose(); }}
                    className="flex-1 py-2 rounded-lg text-xs font-bold"
                    style={{ background: T.macro.fat, color: '#07080B' }}
                  >
                    כן, אפס הכל
                  </button>
                  <button onClick={() => setConfirmOpen(false)} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ background: T.t.chipBg, color: T.t.textSecondary }}>
                    ביטול
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================= SPRINT 13 · PLATE COMPOSER UI ============================= */

function PortionInput({ unit, qty, onUnitChange, onQtyChange }) {
  const T = useTheme();
  const unitDef = PORTION_UNITS.find((u) => u.id === unit) || PORTION_UNITS[0];
  const grams = Math.round(qty * unitDef.gramsPerUnit);
  const sliderMin = unit === 'gram' ? 5 : unitDef.step;
  const sliderMax = unit === 'gram' ? 500 : 20;
  const pct = Math.max(0, Math.min(((qty - sliderMin) / (sliderMax - sliderMin)) * 100, 100));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {PORTION_UNITS.map((u) => {
          const active = unit === u.id;
          return (
            <button
              key={u.id}
              onClick={() => onUnitChange(u.id, u.defaultQty)}
              className="flex-shrink-0 py-2 px-3 rounded-full text-xs font-bold whitespace-nowrap"
              style={{
                background: active ? T.accent : T.t.inputBg,
                color: active ? '#07080B' : T.t.textSecondary,
                border: `1.5px solid ${active ? T.accent : T.t.border}`,
                boxShadow: active ? glow(T.accent, 10, '35') : 'none',
                transition: 'all 0.22s cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              {u.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={unitDef.step}
          value={qty}
          onChange={(e) => onQtyChange(Number(e.target.value))}
          className="flex-1"
          style={{
            accentColor: T.accent,
            background: `linear-gradient(to left, ${T.accent} ${pct}%, ${T.t.border} ${pct}%)`,
          }}
        />
        {/* Free-text entry — type an exact quantity instead of dragging */}
        <input
          type="number"
          dir="ltr"
          value={qty}
          step={unitDef.step}
          min={0}
          onChange={(e) => onQtyChange(Math.max(0, Number(e.target.value) || 0))}
          className="text-sm font-bold text-center rounded-lg outline-none"
          style={{ width: 64, padding: '8px 4px', background: T.t.chipBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
        />
        <span className="text-xs flex-shrink-0" style={{ color: T.t.textDim, minWidth: 78, fontFamily: FONT_MONO }}>
          {unitDef.shortLabel}{unit !== 'gram' && ` (${grams}ג)`}
        </span>
      </div>
    </div>
  );
}

function CustomIngredientModal({ open, onClose, onSave }) {
  const T = useTheme();
  const [draft, setDraft] = useState(emptyCustomIngredient());

  useEffect(() => {
    if (open) setDraft(emptyCustomIngredient());
  }, [open]);

  if (!open) return null;

  const save = () => {
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      raw: {
        kcal: Number(draft.raw.kcal) || 0,
        protein: Number(draft.raw.protein) || 0,
        carbs: Number(draft.raw.carbs) || 0,
        fat: Number(draft.raw.fat) || 0,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: T.t.overlayBg, backdropFilter: 'blur(6px)' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{ maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', background: T.t.modalBg, border: `1px solid ${T.accent}33`, boxShadow: `${T.t.modalShadowExtra}, ${glow(T.accent, 20, '30')}` }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <PackagePlus size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>הוספת חומר גלם אישי</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}><X size={16} color={T.t.textSecondary} /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <FieldInput label="שם המוצר" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />

          <div>
            <Eyebrow>קטגוריה</Eyebrow>
            <div className="grid grid-cols-3 gap-2">
              {INGREDIENT_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDraft({ ...draft, category: c.id })}
                  className="py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: draft.category === c.id ? T.accent : T.t.chipBg,
                    color: draft.category === c.id ? '#07080B' : T.t.textSecondary,
                    border: `1px solid ${draft.category === c.id ? T.accent : T.t.border}`,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs" style={{ color: T.t.textDim }}>הזינו ערכים תזונתיים ל-100 גרם, בדיוק כפי שמופיע בתווית המזון.</p>
          <div className="grid grid-cols-2 gap-3">
            <FieldInput label="קלוריות ל-100 גר׳" value={draft.raw.kcal} onChange={(v) => setDraft({ ...draft, raw: { ...draft.raw, kcal: v } })} type="number" suffix="קל׳" />
            <FieldInput label="חלבון ל-100 גר׳" value={draft.raw.protein} onChange={(v) => setDraft({ ...draft, raw: { ...draft.raw, protein: v } })} type="number" suffix="גר׳" />
            <FieldInput label="פחמימה ל-100 גר׳" value={draft.raw.carbs} onChange={(v) => setDraft({ ...draft, raw: { ...draft.raw, carbs: v } })} type="number" suffix="גר׳" />
            <FieldInput label="שומן ל-100 גר׳" value={draft.raw.fat} onChange={(v) => setDraft({ ...draft, raw: { ...draft.raw, fat: v } })} type="number" suffix="גר׳" />
          </div>

          <button onClick={save} className="w-full py-3 rounded-xl font-bold text-sm mt-1" style={{ background: T.accent, color: '#07080B' }}>שמור חומר גלם</button>
        </div>
      </div>
    </div>
  );
}

function getCategoryTintColor(T, categoryId) {
  const cat = INGREDIENT_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return T.accent;
  if (cat.tint === 'accent') return T.accent;
  return T.macro[cat.tint] || T.accent;
}

function HighlightedText({ text, term, color }) {
  if (!term) return <>{text}</>;
  const idx = text.indexOf(term);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color, fontWeight: 800 }}>{text.slice(idx, idx + term.length)}</span>
      {text.slice(idx + term.length)}
    </>
  );
}

function IngredientPickerRow({ ingredient, selected, onSelect, index, searchTerm }) {
  const T = useTheme();
  const [hover, setHover] = useState(false);
  const tint = getCategoryTintColor(T, ingredient.category);

  return (
    <button
      onClick={() => onSelect(ingredient.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-right w-full relative overflow-hidden"
      style={{
        background: selected ? `${tint}16` : T.t.chipBg,
        border: `1.5px solid ${selected ? tint : T.t.border}`,
        boxShadow: selected ? `0 4px 16px -6px ${tint}55` : hover ? `0 6px 18px -10px rgba(0,0,0,0.25)` : 'none',
        transform: hover && !selected ? 'translateY(-1px) scale(1.005)' : 'translateY(0) scale(1)',
        transition: 'background 0.2s ease, box-shadow 0.2s ease, transform 0.18s ease, border-color 0.2s ease',
        animation: `rowFadeIn 0.32s ease ${Math.min(index * 0.035, 0.4)}s both`,
      }}
    >
      <span className="rounded-full flex-shrink-0" style={{ width: 5, height: 28, background: tint, opacity: selected ? 1 : 0.45, transition: 'opacity 0.2s ease' }} />
      <span className="flex-1 min-w-0">
        <span className="text-sm font-semibold block truncate" style={{ color: T.t.textPrimary }}>
          <HighlightedText text={ingredient.name} term={searchTerm} color={T.accent} />
          {ingredient.isCustom && <span className="text-xs mr-1.5 font-normal" style={{ color: T.accent }}>· אישי</span>}
        </span>
      </span>
      <span className="text-xs flex-shrink-0" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{Math.round(ingredient.raw.kcal)} קל׳/100ג</span>
      <span
        className="rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          width: 20, height: 20, background: selected ? tint : 'transparent', border: `1.5px solid ${selected ? tint : T.t.border}`,
          transform: selected ? 'scale(1)' : 'scale(0.85)', opacity: selected ? 1 : 0, transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <Check size={12} color="#07080B" strokeWidth={3} />
      </span>
    </button>
  );
}

function PlateComposerWidget({ consumed, targets, customIngredients, onSaveCustomIngredient, onAssignToSlot }) {
  const T = useTheme();
  const vh = useViewportHeight();
  const [category, setCategory] = useState('protein');
  const [selectedId, setSelectedId] = useState('chicken-breast');
  const [ingState, setIngState] = useState('cooked');
  const [unit, setUnit] = useState('gram');
  const [qty, setQty] = useState(100);
  const [plateItems, setPlateItems] = useState([]);
  const [slotId, setSlotId] = useState('lunch');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  const [justAssigned, setJustAssigned] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);

  const allIngredients = [...INGREDIENT_DB, ...customIngredients];
  const searchTerm = search.trim();
  const categoryIngredients = searchTerm
    ? allIngredients.filter((i) => i.name.includes(searchTerm))
    : allIngredients.filter((i) => i.category === category);
  const selected = allIngredients.find((i) => i.id === selectedId) || categoryIngredients[0] || allIngredients[0];
  const effectiveState = selected?.hasCookedVariant ? ingState : 'raw';
  const unitDef = PORTION_UNITS.find((u) => u.id === unit) || PORTION_UNITS[0];
  const grams = Math.round(qty * unitDef.gramsPerUnit);
  const currentMacros = selected ? getIngredientMacros(selected, effectiveState, grams) : { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const selectedTint = selected ? getCategoryTintColor(T, selected.category) : T.accent;

  const addToPlate = () => {
    if (!selected) return;
    setPlateItems((prev) => [...prev, {
      id: newId('plate'),
      name: selected.name,
      state: effectiveState,
      grams,
      unitLabel: unit === 'gram' ? `${grams} גר׳` : `${qty} ${unitDef.label} (${grams} גר׳)`,
      ...currentMacros,
    }]);
    T.playFeedback();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 900);
  };

  const removeFromPlate = (id) => setPlateItems((prev) => prev.filter((p) => p.id !== id));

  const plateTotals = plateItems.reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const assign = () => {
    if (!plateItems.length) return;
    const composedName = plateItems.map((i) => `${i.name} (${i.unitLabel || i.grams + 'ג'})`).join(' + ');
    onAssignToSlot(slotId, {
      name: composedName,
      kcal: Math.round(plateTotals.kcal),
      protein: roundNum(plateTotals.protein),
      carbs: roundNum(plateTotals.carbs),
      fat: roundNum(plateTotals.fat),
    });
    setJustAssigned(true);
    T.playFeedback();
    setTimeout(() => { setPlateItems([]); setJustAssigned(false); setFinalizeOpen(false); }, 650);
  };

  const remainingKcal = Math.round(targets.kcal - consumed.kcal);
  const remainingProtein = Math.round(targets.protein - consumed.protein);
  const remainingCarbs = Math.round(targets.carbs - consumed.carbs);
  const remainingFat = Math.round(targets.fat - consumed.fat);

  return (
    <div className="flex flex-col h-full">
      {/* ===== STICKY TOP — always visible: header, remaining budget, search, categories ===== */}
      <div className="flex-shrink-0 px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${T.t.border}` }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-2xl flex-shrink-0"
              style={{ width: 40, height: 40, background: `linear-gradient(135deg, ${T.accent}30, ${T.accent}10)`, border: `1px solid ${T.accent}30` }}
            >
              <Layers3 size={19} color={T.accent} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>בונה צלחת מודולרית</h3>
              <p className="text-xs" style={{ color: T.t.textDim }}>{allIngredients.length} חומרי גלם · גולמי/מבושל · IIFYM גמיש לחלוטין</p>
            </div>
          </div>
          <button
            onClick={() => setCustomModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
            style={{ background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
          >
            <PackagePlus size={13} /> אישי
          </button>
        </div>

        {plateItems.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold" style={{ color: T.macro.protein }}>
            <Layers3 size={12} /> בצלחת שלכם: {plateItems.length} פריטים · {Math.round(plateTotals.kcal)} קל׳ — גללו למטה לשיבוץ
          </div>
        )}

        {/* Remaining budget reference strip — one compact inline row instead of 4 tall boxes */}
        <div className="flex items-center gap-3 mt-2.5 px-3 py-2 rounded-xl flex-wrap" style={{ background: T.t.chipBg }}>
          {[
            { label: 'קלוריות', value: remainingKcal, color: T.macro.kcal, Icon: Flame },
            { label: 'חלבון', value: remainingProtein, color: T.macro.protein, Icon: Beef },
            { label: 'פחמימה', value: remainingCarbs, color: T.macro.carbs, Icon: Wheat },
            { label: 'שומן', value: remainingFat, color: T.macro.fat, Icon: Droplet },
          ].map((s) => (
            <span key={s.label} className="flex items-center gap-1 text-xs" style={{ color: T.t.textDim }}>
              <s.Icon size={12} color={s.color} />
              <span className="font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{s.value}</span>
              {s.label}
            </span>
          ))}
        </div>

        {/* Search across all ingredients */}
        <div className="relative mt-3">
          <Search size={15} color={T.t.textDim} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש חומר גלם… (למשל: גרנולה, עוף, קטשופ)"
            className="w-full py-2.5 pr-10 pl-3.5 rounded-xl text-sm outline-none"
            style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
          />
        </div>

        {/* Category tabs (hidden while searching, since search spans every category) */}
        {!searchTerm ? (
          <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {INGREDIENT_CATEGORIES.map((c) => {
              const Icon = c.icon;
              const active = category === c.id;
              const catColor = c.tint === 'accent' ? T.accent : T.macro[c.tint];
              return (
                <button
                  key={c.id}
                  onClick={() => { setCategory(c.id); const first = allIngredients.find((i) => i.category === c.id); if (first) setSelectedId(first.id); }}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-full flex-shrink-0"
                  style={{
                    background: active ? `${catColor}18` : T.t.chipBg,
                    border: `1.5px solid ${active ? catColor : T.t.border}`,
                    transition: 'all 0.2s cubic-bezier(.34,1.56,.64,1)',
                  }}
                >
                  <Icon size={14} color={active ? catColor : T.t.textDim} />
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: active ? catColor : T.t.textSecondary }}>{c.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs mt-3 flex items-center gap-1.5" style={{ color: T.t.textDim }}>
            <Search size={12} />
            {categoryIngredients.length > 0 ? `${categoryIngredients.length} תוצאות בכל הקטגוריות` : 'לא נמצאו תוצאות — נסו לחפש בעברית או הוסיפו כחומר גלם אישי'}
          </p>
        )}
      </div>

      {/* ===== SCROLLABLE MIDDLE — search/browse results come FIRST (always immediately visible), the composed-plate summary + assign flow comes after ===== */}
      <div className="flex-1 px-5" style={{ minHeight: 200, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="flex flex-col gap-2 py-3">
          {categoryIngredients.map((ing, idx) => (
            <IngredientPickerRow
              key={ing.id}
              ingredient={ing}
              selected={selected?.id === ing.id}
              onSelect={(id) => { setSelectedId(id); if (document.activeElement) document.activeElement.blur(); }}
              index={idx}
              searchTerm={searchTerm}
            />
          ))}
          {categoryIngredients.length === 0 && (
            <p className="text-xs text-center py-8" style={{ color: T.t.textDim }}>לא נמצאו תוצאות</p>
          )}

          {plateItems.length > 0 && (
            <div className="mt-2 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <Eyebrow>הצלחת המורכבת שלכם</Eyebrow>
                <span className="text-xs font-bold" style={{ color: T.accent, fontFamily: FONT_MONO }}>{plateItems.length} פריטים</span>
              </div>
              <div className="flex flex-col gap-2 mb-3">
                {plateItems.map((item) => {
                  const tint = getCategoryTintColor(T, allIngredients.find((i) => i.name === item.name)?.category || 'protein');
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl"
                      style={{ background: T.t.inputBg, borderRight: `3px solid ${tint}`, animation: 'plateItemIn 0.32s cubic-bezier(.34,1.56,.64,1)' }}
                    >
                      <div>
                        <div className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{item.name}</div>
                        <div className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{item.unitLabel || `${item.grams}ג`} · {item.state === 'raw' ? 'נא' : 'מבושל'}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ fontFamily: FONT_MONO }}>
                        <span style={{ color: T.macro.kcal, fontWeight: 700 }}>{item.kcal} קל׳</span>
                        <button onClick={() => removeFromPlate(item.id)} style={{ color: T.t.textDim }}><XCircle size={16} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <MacroStrip totals={plateTotals} />
              <p className="text-xs mt-2" style={{ color: T.t.textDim }}>👇 כפתור השיבוץ הסופי תמיד מחכה לכם למטה, קבוע על המסך.</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== FINALIZE BAR — its own independent, always-visible region. Never nested inside a scrollable
           area, so it can never be hidden or require extra scrolling to discover. ===== */}
      {plateItems.length > 0 && (
        <div className="flex-shrink-0 px-5 py-3" style={{ borderTop: `1px solid ${T.t.border}`, background: `${T.accent}0A` }}>
          {!finalizeOpen ? (
            <button
              onClick={() => setFinalizeOpen(true)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: T.t.chipBg, border: `1.5px dashed ${T.accent}66` }}
            >
              <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>
                🛒 {plateItems.length} פריטים · {Math.round(plateTotals.kcal)} קל׳
              </span>
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: T.accent }}>
                שיבוץ סופי לארוחה <ChevronUp size={13} />
              </span>
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold" style={{ color: T.t.textPrimary }}>שבצו את הצלחת ({plateItems.length} פריטים) לחלון זמן:</span>
                <button onClick={() => setFinalizeOpen(false)} className="text-xs" style={{ color: T.t.textDim }}>המשך להוסיף ✕</button>
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {PORTION_SLOTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSlotId(s.id)}
                    className="py-1.5 px-1 rounded-lg text-xs font-semibold"
                    style={{
                      background: slotId === s.id ? T.accent : T.t.chipBg,
                      color: slotId === s.id ? '#07080B' : T.t.textSecondary,
                      border: `1px solid ${slotId === s.id ? T.accent : T.t.border}`,
                      transition: 'all 0.2s ease',
                    }}
                    title={s.label}
                  >
                    {s.emoji}
                  </button>
                ))}
              </div>
              <button
                onClick={assign}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5"
                style={{
                  background: justAssigned ? T.macro.protein : '#0F1720',
                  color: justAssigned ? '#07080B' : '#F5F7FA',
                  border: `1.5px solid ${T.macro.protein}`,
                  opacity: justAssigned ? 0.85 : 1,
                }}
              >
                <CircleCheck size={15} color={justAssigned ? '#07080B' : T.macro.protein} />
                {justAssigned ? 'שובץ בהצלחה!' : `סופי — שבץ ${plateItems.length} פריטים לארוחת ${PORTION_SLOTS.find((s) => s.id === slotId)?.label}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== BOTTOM — the currently selected ingredient's quick-add panel. Deliberately NOT flex-shrink-0:
           it must be allowed to shrink and reveal its own scrollbar when space is tight, otherwise it can
           silently overflow past the panel's fixed height and get clipped regardless of its own overflow-y. ===== */}
      <div
        className="px-5 pt-3 pb-5"
        style={{
          flex: '0 1 auto', minHeight: 110,
          borderTop: plateItems.length > 0 ? 'none' : `1px solid ${T.t.border}`,
          maxHeight: Math.round(vh * 0.4), overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        }}
      >
        {selected && (
          <div
            className="p-4 rounded-2xl relative overflow-hidden"
            style={{ background: T.t.chipBg, border: `1.5px solid ${selectedTint}33` }}
          >
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-sm font-bold flex items-center gap-2" style={{ color: T.t.textPrimary }}>
                <span className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, background: selectedTint }} />
                {selected.name}
              </span>
              {selected.hasCookedVariant && (
                <div className="flex p-1 rounded-lg gap-1" style={{ background: T.t.inputBg }}>
                  <button
                    onClick={() => setIngState('raw')}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold"
                    style={{ background: ingState === 'raw' ? T.accent : 'transparent', color: ingState === 'raw' ? '#07080B' : T.t.textSecondary, transition: 'all 0.2s ease' }}
                  >
                    <ArrowRightLeft size={11} /> נא
                  </button>
                  <button
                    onClick={() => setIngState('cooked')}
                    className="px-2.5 py-1.5 rounded-md text-xs font-semibold"
                    style={{ background: ingState === 'cooked' ? T.accent : 'transparent', color: ingState === 'cooked' ? '#07080B' : T.t.textSecondary, transition: 'all 0.2s ease' }}
                  >
                    מבושל
                  </button>
                </div>
              )}
            </div>

            <PortionInput
              unit={unit}
              qty={qty}
              onUnitChange={(u, defaultQty) => { setUnit(u); setQty(defaultQty); }}
              onQtyChange={setQty}
            />

            <div className="flex items-center gap-3 mt-3 px-3 py-2 rounded-lg flex-wrap" style={{ background: T.t.inputBg }}>
              <span className="flex items-center gap-1 text-xs" style={{ color: T.t.textDim }}>
                <Flame size={12} color={T.macro.kcal} /> <span className="font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{currentMacros.kcal}</span> קל׳
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: T.t.textDim }}>
                <Beef size={12} color={T.macro.protein} /> <span className="font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{currentMacros.protein}g</span>
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: T.t.textDim }}>
                <Wheat size={12} color={T.macro.carbs} /> <span className="font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{currentMacros.carbs}g</span>
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: T.t.textDim }}>
                <Droplet size={12} color={T.macro.fat} /> <span className="font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{currentMacros.fat}g</span>
              </span>
            </div>

            <button
              onClick={addToPlate}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold mt-3"
              style={{
                background: justAdded ? T.macro.protein : T.accent,
                color: '#07080B',
                boxShadow: glow(justAdded ? T.macro.protein : T.accent, 14, '40'),
                transition: 'background 0.25s ease',
              }}
            >
              {justAdded ? (
                <span style={{ animation: 'popCheck 0.4s cubic-bezier(.34,1.56,.64,1)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CircleCheck size={16} /> נוסף לצלחת!
                </span>
              ) : (
                <>
                  <Plus size={15} /> הוסף לצלחת
                </>
              )}
            </button>
          </div>
        )}

        {plateItems.length > 0 && (
          <div className={selected ? 'mt-3 pt-3' : ''} style={selected ? { borderTop: `1px solid ${T.t.border}` } : {}}>
            <p className="text-xs text-center" style={{ color: T.t.textDim }}>👇 כפתור השיבוץ הסופי קבוע ממש מתחת לאזור הזה, תמיד גלוי</p>
          </div>
        )}
      </div>

      <CustomIngredientModal open={customModalOpen} onClose={() => setCustomModalOpen(false)} onSave={onSaveCustomIngredient} />
    </div>
  );
}

/* ============================= SPRINT 14 · PROGRESSIVE DISCLOSURE UI ============================= */

const NAV_TABS = [
  { id: 'today', label: 'היום', icon: Sunrise },
  { id: 'nutrition', label: 'תזונה', icon: UtensilsCrossed },
  { id: 'workouts', label: 'אימונים', icon: Dumbbell },
  { id: 'insights', label: 'תובנות', icon: BarChart3 },
];

function BottomNav({ activeTab, setActiveTab }) {
  const T = useTheme();
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 flex justify-center"
      style={{
        background: T.t.modalBg,
        borderTop: `1px solid ${T.t.border}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -8px 24px -16px rgba(0,0,0,0.25)',
      }}
    >
      <div className="w-full flex items-stretch justify-around" style={{ maxWidth: 640 }}>
      {NAV_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
          >
            <Icon size={20} color={active ? T.accent : T.t.textDim} strokeWidth={active ? 2.4 : 2} />
            <span className="text-xs font-semibold" style={{ color: active ? T.accent : T.t.textDim }}>{tab.label}</span>
          </button>
        );
      })}
      </div>
    </div>
  );
}

// Slide-up drawer used to move dense pickers (Cibus, Plate Composer, quick-log) out of the
// main scroll and into a focused, dismissible sheet — per the "effortless logging" principle.
function SheetModal({ open, onClose, title, children, bare }) {
  const T = useTheme();
  const vh = useViewportHeight();
  // Real pixels, measured directly from the browsing context — not a CSS vh/dvh guess.
  const panelHeight = Math.round(vh * 0.85);
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center"
      style={{ background: T.t.overlayBg, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.25s ease' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl flex flex-col"
        style={{
          maxWidth: 640,
          height: panelHeight, maxHeight: panelHeight,
          background: T.t.modalBg, borderTop: `1px solid ${T.t.border}`,
          boxShadow: '0 -20px 50px -20px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(.32,.72,0,1)',
        }}
      >
        <div className="flex-shrink-0 rounded-t-3xl" style={{ background: T.t.modalBg }}>
          <div className="flex justify-center pt-3 pb-1">
            <span className="rounded-full" style={{ width: 36, height: 4, background: T.t.border }} />
          </div>
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}><X size={15} color={T.t.textSecondary} /></button>
          </div>
        </div>
        {bare ? (
          <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden' }}>{children}</div>
        ) : (
          <div className="px-5 pb-8 flex-1" style={{ minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>{children}</div>
        )}
      </div>
    </div>
  );
}

// One large composite ring: calories as the bold outer arc, protein as a slimmer inner arc —
// this is the "hero" replacing four competing rings on the old dashboard.
/* ============================= SPRINT 16 · WATER & FASTING TRACKERS ============================= */
function CompositeHeroRing({ consumed, targets }) {
  const T = useTheme();
  const size = 220, strokeOuter = 16, strokeInner = 10;
  const rOuter = (size - strokeOuter) / 2;
  const rInner = rOuter - strokeOuter / 2 - strokeInner / 2 - 6;
  const circOuter = 2 * Math.PI * rOuter;
  const circInner = 2 * Math.PI * rInner;
  const kcalPct = Math.max(0, Math.min(consumed.kcal / targets.kcal, 1));
  const proteinPct = Math.max(0, Math.min(consumed.protein / targets.protein, 1));
  const remaining = Math.round(targets.kcal - consumed.kcal);
  const isOver = remaining < 0;

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={rOuter} stroke={T.t.border} strokeWidth={strokeOuter} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={rOuter} stroke={T.macro.kcal} strokeWidth={strokeOuter} fill="none"
          strokeDasharray={circOuter} strokeDashoffset={circOuter * (1 - kcalPct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
        <circle cx={size / 2} cy={size / 2} r={rInner} stroke={T.t.border} strokeWidth={strokeInner} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={rInner} stroke={T.macro.protein} strokeWidth={strokeInner} fill="none"
          strokeDasharray={circInner} strokeDashoffset={circInner * (1 - proteinPct)} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-semibold" style={{ color: T.t.textDim, letterSpacing: '0.03em' }}>נצרכו היום</span>
        <span className="text-5xl font-bold leading-none mt-1.5" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{Math.round(consumed.kcal)}</span>
        <span className="text-xs mt-1" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>מתוך {targets.kcal} קל׳</span>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full mt-2.5"
          style={{
            background: isOver ? `${T.macro.kcal}20` : `${T.macro.protein}20`,
            color: isOver ? T.macro.kcal : T.macro.protein,
          }}
        >
          {isOver ? `+${Math.abs(remaining)} מעל היעד` : `${remaining} נותרו`}
        </span>
      </div>
    </div>
  );
}

function MacroBar({ label, consumed, target, color, unit }) {
  const T = useTheme();
  const pct = target > 0 ? Math.max(0, Math.min(consumed / target, 1)) : 0;
  const over = consumed > target;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{label}</span>
        <span className="text-xs" style={{ fontFamily: FONT_MONO }}>
          <span style={{ color: over ? color : T.t.textPrimary, fontWeight: 700 }}>{Math.round(consumed)}</span>
          <span style={{ color: T.t.textDim }}> / {Math.round(target)}{unit}</span>
        </span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 8, background: T.t.border }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: color, borderRadius: 8, transition: 'width 0.5s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  );
}

function MathRow({ step, title, formula, result }) {
  const T = useTheme();
  return (
    <div className="flex gap-3">
      <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 26, height: 26, background: `${T.accent}18`, color: T.accent, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 12 }}>
        {step}
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold mb-1" style={{ color: T.t.textPrimary }}>{title}</div>
        <div className="text-xs mb-1" style={{ color: T.t.textSecondary, fontFamily: FONT_MONO, direction: 'ltr', textAlign: 'right' }}>{formula}</div>
        <div className="text-sm font-bold" style={{ color: T.accent, fontFamily: FONT_MONO }}>{result}</div>
      </div>
    </div>
  );
}

function CalorieMathSheetBody({ profile, computed, dayMode }) {
  const T = useTheme();
  const activity = ACTIVITY_LEVELS[profile.activity] || ACTIVITY_LEVELS.office;
  const goal = GOALS[profile.goal] || GOALS.maintain;
  const targets = computed[dayMode];
  const proteinKcal = targets.protein * 4;
  const fatKcal = targets.fat * 9;
  const carbKcal = targets.carbs * 4;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: T.t.textSecondary }}>
        היעד היומי שלכם לא שרירותי — הוא נגזר צעד-אחר-צעד מהנתונים שהזנתם בפרופיל. הנה בדיוק איך הגענו למספר.
      </p>

      <MathRow
        step={1}
        title="חילוף חומרים בסיסי (BMR) · נוסחת Mifflin-St Jeor"
        formula={`10×${profile.weight} + 6.25×${profile.height} − 5×${profile.age} + 5`}
        result={`BMR = ${computed.bmr} קל׳ ליום (בשכיבה מוחלטת)`}
      />
      <MathRow
        step={2}
        title={`הוצאה יומית כוללת (TDEE) · רמת פעילות: ${activity.label}`}
        formula={`${computed.bmr} × ${activity.mult}`}
        result={`TDEE = ${computed.tdee} קל׳ ליום`}
      />
      <MathRow
        step={3}
        title={`יעד לפי מטרה: ${goal.label} (${goal.pct >= 0 ? '+' : ''}${Math.round(goal.pct * 100)}%)`}
        formula={`${computed.tdee} × (1 ${goal.pct >= 0 ? '+' : '−'} ${Math.abs(goal.pct)})`}
        result={`יעד יום מנוחה = ${computed.rest.kcal} קל׳`}
      />
      <MathRow
        step={4}
        title="יום אימון: תדלוק פחמימה נוסף (Refeed)"
        formula="יעד יום מנוחה + 300 קל׳ (כ-75 גר׳ פחמימה נוספת)"
        result={`יעד יום אימון = ${computed.training.kcal} קל׳`}
      />

      <div className="pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <Eyebrow>פיצול המאקרו · {dayMode === 'training' ? 'יום אימון' : 'יום מנוחה'}</Eyebrow>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: T.t.textSecondary }}>חלבון · 2.0 גר׳ × {profile.weight} ק"ג</span>
            <span style={{ fontFamily: FONT_MONO, color: T.macro.protein, fontWeight: 700 }}>{targets.protein}g ({proteinKcal} קל׳)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: T.t.textSecondary }}>שומן · 0.7 גר׳ × {profile.weight} ק"ג</span>
            <span style={{ fontFamily: FONT_MONO, color: T.macro.fat, fontWeight: 700 }}>{targets.fat}g ({fatKcal} קל׳)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: T.t.textSecondary }}>פחמימה · השארית מהיעד הקלורי</span>
            <span style={{ fontFamily: FONT_MONO, color: T.macro.carbs, fontWeight: 700 }}>{targets.carbs}g ({carbKcal} קל׳)</span>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: T.t.textDim }}>
        לשינוי גיל/משקל/גובה/רמת פעילות/מטרה — הגדרות ← פרטים אישיים. כל היעדים יחושבו מחדש מיידית.
      </p>
    </div>
  );
}


function MacroBreakdownCard({ consumed, targets }) {
  const T = useTheme();
  return (
    <GlassCard className="p-5 w-full" accent={null}>
      <Eyebrow>פירוט מלא · היום</Eyebrow>
      <div className="flex flex-col gap-4 mt-1">
        <MacroBar label="קלוריות" consumed={consumed.kcal} target={targets.kcal} color={T.macro.kcal} unit=" קל׳" />
        <MacroBar label="חלבון" consumed={consumed.protein} target={targets.protein} color={T.macro.protein} unit="g" />
        <MacroBar label="פחמימה" consumed={consumed.carbs} target={targets.carbs} color={T.macro.carbs} unit="g" />
        <MacroBar label="שומן" consumed={consumed.fat} target={targets.fat} color={T.macro.fat} unit="g" />
      </div>
    </GlassCard>
  );
}

function HeroRingLegend() {
  const T = useTheme();
  return (
    <div className="flex items-center justify-center gap-5 text-xs mb-6" style={{ color: T.t.textDim }}>
      <span className="flex items-center gap-1.5">
        <span className="rounded-full" style={{ width: 9, height: 9, background: T.macro.kcal }} />
        טבעת חיצונית · קלוריות
      </span>
      <span className="flex items-center gap-1.5">
        <span className="rounded-full" style={{ width: 9, height: 9, background: T.macro.protein }} />
        טבעת פנימית · חלבון
      </span>
    </div>
  );
}

// Finds "now" among the 5 base slots by comparing the clock to each slot's HH:MM.
function getCurrentSlotId(items) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const withMinutes = SLOT_DEFS.map((s) => {
    const [h, m] = s.time.split(':').map(Number);
    const hasCompleted = items.some((i) => i.slotId === s.id && i.isCompleted);
    return { ...s, minutes: h * 60 + m, hasCompleted };
  });
  const nextEmpty = withMinutes.find((s) => !s.hasCompleted && s.minutes >= nowMinutes - 90);
  if (nextEmpty) return nextEmpty.id;
  const upcoming = withMinutes.find((s) => s.minutes >= nowMinutes);
  if (upcoming) return upcoming.id;
  return withMinutes[withMinutes.length - 1].id;
}

function SmartContextCard({ items, onQuickComplete, onEdit }) {
  const T = useTheme();
  const currentId = getCurrentSlotId(items);
  const slot = SLOT_DEFS.find((s) => s.id === currentId);
  if (!slot) return null;
  const Icon = slot.icon;
  const slotItems = items.filter((i) => i.slotId === slot.id);
  const done = slotItems.length > 0 && slotItems.every((i) => i.isCompleted);
  const summary = slotItems.length === 0 ? 'עדיין לא שובץ פריט לחלון הזה' : slotItems.map((i) => i.name).join(' · ');

  return (
    <GlassCard className="p-5" accent={null}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-2xl" style={{ width: 46, height: 46, background: done ? `${T.macro.protein}18` : `${T.accent}14` }}>
            <Icon size={20} color={done ? T.macro.protein : T.accent} />
          </div>
          <div>
            <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{slot.time} · עכשיו</span>
            <div className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{slot.emoji} {slot.label}</div>
            <div className="text-xs" style={{ color: T.t.textSecondary }}>{summary}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => onQuickComplete(slot.id)}
          disabled={slotItems.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: done ? `${T.macro.protein}18` : T.accent, color: done ? T.macro.protein : '#07080B', opacity: slotItems.length === 0 ? 0.5 : 1 }}
        >
          <Check size={14} /> {done ? 'סומן כבוצע' : 'סמן הכל כבוצע'}
        </button>
        <button
          onClick={() => onEdit(slot.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
        >
          <Pencil size={13} /> {slotItems.length === 0 ? 'הוסף' : 'ערוך'}
        </button>
      </div>
    </GlassCard>
  );
}

function QuickLogSheetBody({ onConfirm, defaultSlotId }) {
  const T = useTheme();
  const [logText, setLogText] = useState('');
  const [preview, setPreview] = useState([]);
  const [noMatch, setNoMatch] = useState(false);
  const [slotId, setSlotId] = useState(defaultSlotId || 'lunch');

  const runParse = () => {
    const results = parseFoodText(logText);
    setPreview(results);
    setNoMatch(results.length === 0);
    T.playFeedback();
  };

  const confirm = () => {
    onConfirm(preview.map((p) => ({ name: p.name, calories: p.kcal, protein: p.protein, carbs: p.carbs, fats: p.fat, source: 'quicklog' })), slotId);
    setPreview([]);
    setLogText('');
  };

  const totals = preview.reduce((a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: T.t.textSecondary }}>מה אכלתם? כתבו בלשון חופשית — לדוגמה "200 גרם חזה עוף ואורז".</p>
      <textarea
        value={logText}
        onChange={(e) => setLogText(e.target.value)}
        rows={2}
        placeholder="במבה קטנה ומעדן GO..."
        className="w-full py-3 px-3.5 rounded-xl text-sm outline-none resize-none"
        style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
      />
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: T.t.textSecondary }}>שיבוץ לחלון זמן</p>
        <div className="grid grid-cols-5 gap-1.5">
          {SLOT_DEFS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlotId(s.id)}
              className="py-2 px-1 rounded-lg text-xs font-semibold"
              style={{
                background: slotId === s.id ? T.accent : T.t.chipBg,
                color: slotId === s.id ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${slotId === s.id ? T.accent : T.t.border}`,
              }}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>
      <button onClick={runParse} disabled={!logText.trim()} className="py-3 rounded-xl text-sm font-bold" style={{ background: T.accent, color: '#07080B', opacity: logText.trim() ? 1 : 0.5 }}>
        פענח
      </button>
      {noMatch && preview.length === 0 && <p className="text-xs" style={{ color: T.macro.kcal }}>לא זוהו מאכלים ידועים — נסו שם מאכל ברור יותר.</p>}
      {preview.length > 0 && (
        <>
          {preview.map((item) => <ParsedItemRow key={item.id} item={item} onRemove={() => setPreview((p) => p.filter((x) => x.id !== item.id))} />)}
          <MacroStrip totals={totals} />
          <button onClick={confirm} className="py-3 rounded-xl text-sm font-bold" style={{ background: T.macro.protein, color: '#07080B' }}>אשר והוסף ליומן</button>
        </>
      )}
    </div>
  );
}

function FabMenu({ open, onClose, onPickAction }) {
  const T = useTheme();
  const actions = [
    { id: 'quicklog', label: 'רישום חופשי', icon: Wand2 },
    { id: 'cibus', label: 'בחר ב-Cibus', icon: UtensilsCrossed },
    { id: 'plate', label: 'בנה צלחת', icon: Layers3 },
  ];
  return (
    <div
      className="fixed inset-0 z-30"
      style={{ background: open ? T.t.overlayBg : 'transparent', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.2s ease' }}
      onClick={onClose}
    >
      <div
        className="fixed left-1/2 flex flex-col gap-2"
        style={{ bottom: 158, transform: `translateX(-50%) translateY(${open ? 0 : 20}px)`, opacity: open ? 1 : 0, transition: 'all 0.22s ease', width: 240 }}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => onPickAction(a.id)}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold w-full"
              style={{ background: T.t.modalBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}`, boxShadow: '0 8px 20px -10px rgba(0,0,0,0.3)' }}
            >
              <Icon size={16} color={T.accent} /> {a.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionFab({ open, onToggle }) {
  const T = useTheme();
  return (
    <button
      onClick={onToggle}
      className="fixed z-40 flex items-center justify-center rounded-full"
      style={{
        bottom: 84, left: '50%', transform: `translateX(-50%) rotate(${open ? 45 : 0}deg)`,
        width: 58, height: 58, background: T.accent, boxShadow: glow(T.accent, 16, '40'),
        transition: 'transform 0.25s ease',
      }}
      aria-label="הוסף"
    >
      <Plus size={26} color="#07080B" strokeWidth={2.5} />
    </button>
  );
}

function DateNavigator({ selectedDateKey, setSelectedDateKey }) {
  const T = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const isToday = selectedDateKey === dateKey(new Date());

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 p-2 rounded-2xl mb-4" style={{ background: T.t.card, border: `1px solid ${T.t.border}` }}>
        <button onClick={() => setSelectedDateKey(shiftDateKey(selectedDateKey, -1))} className="p-2 rounded-xl" style={{ background: T.t.chipBg }} aria-label="יום קודם">
          <ArrowRight size={16} color={T.t.textSecondary} />
        </button>
        <button onClick={() => setPickerOpen((o) => !o)} className="flex-1 flex flex-col items-center py-1">
          <span className="text-sm font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{formatHebrewDate(selectedDateKey)}</span>
          <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{formatShortDate(selectedDateKey)}</span>
        </button>
        <button onClick={() => setSelectedDateKey(shiftDateKey(selectedDateKey, 1))} className="p-2 rounded-xl" style={{ background: T.t.chipBg }} aria-label="יום הבא">
          <ArrowLeft size={16} color={T.t.textSecondary} />
        </button>
      </div>

      {!isToday && (
        <button
          onClick={() => setSelectedDateKey(dateKey(new Date()))}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full"
          style={{ background: T.accent, color: '#07080B', transform: 'translate(-50%, 50%)' }}
        >
          חזרה להיום
        </button>
      )}

      {pickerOpen && (
        <div className="p-3 rounded-2xl mb-4 mt-2" style={{ background: T.t.popover, border: `1px solid ${T.t.border}` }}>
          <div dir="ltr" className="grid grid-cols-7 gap-1">
            {Array.from({ length: 14 }).map((_, i) => {
              const key = shiftDateKey(dateKey(new Date()), i - 10);
              const isSelected = key === selectedDateKey;
              return (
                <button
                  key={key}
                  onClick={() => { setSelectedDateKey(key); setPickerOpen(false); }}
                  className="py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: isSelected ? T.accent : T.t.chipBg,
                    color: isSelected ? '#07080B' : T.t.textSecondary,
                    fontFamily: FONT_MONO,
                  }}
                >
                  {formatShortDate(key)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================= MAIN APP ============================= */

export default function ProjectShred() {
  const [dayMode, setDayMode] = useState('training');

  // Sprint 15 — date-first state engine: everything logged, for every date, lives in one place.
  const [selectedDateKey, setSelectedDateKey] = useState(() => dateKey(new Date()));
  const [itemsByDate, setItemsByDate] = useState({});
  const [customIngredients, setCustomIngredients] = useState([]);

  // Sprint 15.11 — Favorites: one-tap quick-add for things logged almost every day
  const [favorites, setFavorites] = useState(() => [
    { id: 'fav-protein-pudding', name: 'מעדן חלבון', icon: '🥤', kcal: 140, protein: 15, carbs: 13, fat: 3 },
    { id: 'fav-protein-shake', name: 'שייק אבקה + מים', icon: '🥤', kcal: 120, protein: 25, carbs: 3, fat: 1.5 },
    { id: 'fav-eggs', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5 },
  ]);
  const [favoriteModalOpen, setFavoriteModalOpen] = useState(false);
  const [editingFavoriteId, setEditingFavoriteId] = useState(null);
  const editingFavorite = favorites.find((f) => f.id === editingFavoriteId) || null;

  const saveFavorite = (draft) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === draft.id);
      return exists ? prev.map((f) => (f.id === draft.id ? draft : f)) : [...prev, draft];
    });
  };
  const deleteFavorite = (id) => setFavorites((prev) => prev.filter((f) => f.id !== id));

  // Sprint 16 — Progressive Overload: weight/reps per exercise, keyed by date, powering PR deltas
  const [exerciseLogs, setExerciseLogs] = useState({});
  const logExerciseSet = (exerciseName, patch) => {
    setExerciseLogs((prev) => ({
      ...prev,
      [selectedDateKey]: { ...(prev[selectedDateKey] || {}), [exerciseName]: { ...(prev[selectedDateKey]?.[exerciseName] || {}), ...patch } },
    }));
  };

  // Sprint 16 — Water tracker, keyed by date
  const todayKeyValue = dateKey(new Date());
  const isToday = selectedDateKey === todayKeyValue;
  const dayItems = itemsByDate[selectedDateKey] || [];

  // The one and only path anything ever takes to become a logged item — Cibus, Kitchen Hacks,
  // the Plate Composer, quick-log parsing, and Smart Swap all call this with plain
  // {name, calories, protein, carbs, fats} specs, and it's normalized here via makeLoggedItem.
  const logItems = (specs, slotId) => {
    const newOnes = specs.map((s) => makeLoggedItem({ dateKey: selectedDateKey, slotId, ...s }));
    setItemsByDate((prev) => ({ ...prev, [selectedDateKey]: [...(prev[selectedDateKey] || []), ...newOnes] }));
  };

  // One tap, zero decisions: logs straight to whichever slot is "now" per getCurrentSlotId.
  // If the guess is wrong, the item can still be re-slotted afterward via the Timeline's edit sheet.
  const logFavorite = (fav) => {
    const slotId = getCurrentSlotId(dayItems);
    logItems([{ name: fav.name, calories: fav.kcal, protein: fav.protein, carbs: fav.carbs, fats: fav.fat, source: 'favorite' }], slotId);
    playFeedback();
  };

  const toggleItemCompleted = (itemId) => {
    setItemsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).map((it) => (it.id === itemId ? { ...it, isCompleted: !it.isCompleted } : it)),
    }));
  };

  const deleteItem = (itemId) => {
    setItemsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).filter((it) => it.id !== itemId),
    }));
  };

  const markSlotCompleted = (slotId) => {
    setItemsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).map((it) => (it.slotId === slotId ? { ...it, isCompleted: true } : it)),
    }));
  };

  const updateItem = (itemId, patch) => {
    setItemsByDate((prev) => ({
      ...prev,
      [selectedDateKey]: (prev[selectedDateKey] || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    }));
  };

  const saveCustomIngredient = (ing) => setCustomIngredients((prev) => [...prev, ing]);

  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState('mine');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [syncState, setSyncState] = useState('idle'); // idle | saving | saved

  // Sprint 7 — theme / accent / density / feedback
  const [mode, setMode] = useState(DEFAULT_THEME_SETTINGS.mode);
  const [accentKey, setAccentKey] = useState(DEFAULT_THEME_SETTINGS.accentKey);
  const [density, setDensity] = useState(DEFAULT_THEME_SETTINGS.density);
  const [feedback, setFeedback] = useState(DEFAULT_THEME_SETTINGS.feedback);
  const synthRef = useRef(null);

  // Sprint 8 — help/legend modal + onboarding tour
  const [helpOpen, setHelpOpen] = useState(false);
  const [tourStep, setTourStep] = useState(null); // null = inactive, 1-4 = active step
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const tourRefs = {
    header: useRef(null),
    today: useRef(null),
    nutrition: useRef(null),
    workouts: useRef(null),
  };

  // Sprint 9 — AI Coach Hub: AI report, optional API config (logging itself now goes through logItems)
  const [aiReport, setAiReport] = useState(null);
  const [apiConfig, setApiConfig] = useState({ provider: 'none', key: '' });

  const activeProfile = profiles[activeProfileId] || profiles.mine;
  const computed = computeProfileTargets(activeProfile);
  const targets = computed[dayMode];

  // Sprint 10 — Executive Analytics Hub: heatmap history, weight/waist trend, weekly report
  const [dailyLogs, setDailyLogs] = useState(() => seedDailyLogs(computed));
  const [metricEntries, setMetricEntries] = useState(() => seedMetricEntries(activeProfile));
  const [reportOpen, setReportOpen] = useState(false);
  const [workoutActivity, setWorkoutActivity] = useState({ done: false, dayKey: null });

  // Sprint 11 — Custom Cibus restaurants, Kitchen Hacks, and the Smart Swap food library
  const [customRestaurants, setCustomRestaurants] = useState([]);
  const [customHacks, setCustomHacks] = useState([]);
  const [restaurantModalOpen, setRestaurantModalOpen] = useState(false);
  const [editingRestaurantId, setEditingRestaurantId] = useState(null);
  const [hackModalOpen, setHackModalOpen] = useState(false);
  const [editingHackId, setEditingHackId] = useState(null);

  const editingRestaurant = customRestaurants.find((r) => r.id === editingRestaurantId) || null;
  const editingHack = customHacks.find((h) => h.id === editingHackId) || null;
  const foodLibrary = buildFoodLibrary(customRestaurants, customHacks);

  const saveRestaurant = (draft) => {
    setCustomRestaurants((prev) => {
      const exists = prev.some((r) => r.id === draft.id);
      return exists ? prev.map((r) => (r.id === draft.id ? draft : r)) : [...prev, draft];
    });
  };
  const deleteRestaurant = (id) => setCustomRestaurants((prev) => prev.filter((r) => r.id !== id));
  const saveHack = (draft) => {
    setCustomHacks((prev) => {
      const exists = prev.some((h) => h.id === draft.id);
      return exists ? prev.map((h) => (h.id === draft.id ? draft : h)) : [...prev, draft];
    });
  };
  const deleteHack = (id) => setCustomHacks((prev) => prev.filter((h) => h.id !== id));

  // Sprint 12 — System docs viewer, diagnostics, factory reset, completion certificate
  const [docsOpen, setDocsOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [certificateOpen, setCertificateOpen] = useState(false);

  // Sprint 14 — progressive disclosure: bottom-nav tabs, slide-up sheets, FAB
  const [activeTab, setActiveTab] = useState('today');
  const [cibusSheetOpen, setCibusSheetOpen] = useState(false);
  const [plateSheetOpen, setPlateSheetOpen] = useState(false);
  const [quickLogSheetOpen, setQuickLogSheetOpen] = useState(false);
  const [calorieMathOpen, setCalorieMathOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);

  // Any bottom-anchored sheet or centered modal currently open — the FAB must never float
  // above one of these, since sheets in particular render their own action buttons right
  // where the FAB used to sit (this was a real, reported bug: the "+" covered "הוסף לצלחת").
  const anyOverlayOpen = cibusSheetOpen || plateSheetOpen || quickLogSheetOpen || calorieMathOpen || !!editingItem
    || settingsOpen || helpOpen || docsOpen || diagnosticsOpen || certificateOpen || reportOpen
    || restaurantModalOpen || hackModalOpen || favoriteModalOpen;

  const handleFabAction = (actionId) => {
    setFabOpen(false);
    setActiveTab('nutrition');
    if (actionId === 'quicklog') setQuickLogSheetOpen(true);
    else if (actionId === 'cibus') setCibusSheetOpen(true);
    else if (actionId === 'plate') setPlateSheetOpen(true);
  };

  const t = THEME_PRESETS[mode];
  const accent = getAccentHex(mode, accentKey);
  const macro = getMacroColors(mode);
  const spacing = DENSITY_PRESETS[density];

  const playTone = () => {
    try {
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.09, sustain: 0, release: 0.1 } }).toDestination();
      }
      Tone.start();
      synthRef.current.triggerAttackRelease('C6', '32n');
    } catch (err) {
      // Audio not available in this environment — fail silently.
    }
  };

  const playFeedback = () => {
    if (!feedback) return;
    try {
      if (navigator.vibrate) navigator.vibrate(12);
    } catch (err) {
      // Vibration API not available — fail silently.
    }
    playTone();
  };

  const theme = { mode, accent, spacing, t, macro, playFeedback };

  /* ---- Load persisted state once on mount (artifact key-value storage) ---- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await window.storage?.get(STORAGE_KEY);
        if (!cancelled && result?.value) {
          const parsed = JSON.parse(result.value);
          if (parsed.profiles) setProfiles(parsed.profiles);
          if (parsed.activeProfileId) setActiveProfileId(parsed.activeProfileId);
          if (parsed.theme) {
            setMode(parsed.theme.mode || DEFAULT_THEME_SETTINGS.mode);
            setAccentKey(parsed.theme.accentKey || DEFAULT_THEME_SETTINGS.accentKey);
            setDensity(parsed.theme.density || DEFAULT_THEME_SETTINGS.density);
            setFeedback(parsed.theme.feedback ?? DEFAULT_THEME_SETTINGS.feedback);
          }
          setHasSeenOnboarding(!!parsed.hasSeenOnboarding);
          if (parsed.aiReport) setAiReport(parsed.aiReport);
          if (parsed.apiConfig) setApiConfig(parsed.apiConfig);
          if (parsed.dailyLogs) setDailyLogs(parsed.dailyLogs);
          if (parsed.metricEntries) setMetricEntries(parsed.metricEntries);
          if (parsed.customRestaurants) setCustomRestaurants(parsed.customRestaurants);
          if (parsed.customHacks) setCustomHacks(parsed.customHacks);
          if (parsed.itemsByDate) setItemsByDate(parsed.itemsByDate);
          if (parsed.customIngredients) setCustomIngredients(parsed.customIngredients);
          if (parsed.favorites) setFavorites(parsed.favorites);
          if (parsed.exerciseLogs) setExerciseLogs(parsed.exerciseLogs);
        }
      } catch (err) {
        // No saved state yet — first run, defaults stand.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /* ---- Onboarding tour is opt-in only (via Help → "התחל סיור") — never auto-fires ---- */
  /* ---- Scroll the highlighted section into view whenever the tour step changes ---- */
  useEffect(() => {
    if (!tourStep) return;
    const step = TOUR_STEPS[tourStep - 1];
    if (step?.tab) setActiveTab(step.tab);
    const t4 = setTimeout(() => {
      const node = tourRefs[step?.ref]?.current;
      if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    return () => clearTimeout(t4);
  }, [tourStep]);

  /* ---- Auto-sync profile + appearance state to persistent storage ---- */
  const latestStateRef = useRef(null);
  latestStateRef.current = {
    profiles, activeProfileId,
    theme: { mode, accentKey, density, feedback },
    hasSeenOnboarding,
    aiReport, apiConfig,
    dailyLogs, metricEntries,
    customRestaurants, customHacks,
    itemsByDate,
    customIngredients,
    favorites,
    exerciseLogs,
  };

  useEffect(() => {
    if (!loaded) return;
    setSyncState('saving');
    const t2 = setTimeout(async () => {
      try {
        await window.storage?.set(STORAGE_KEY, JSON.stringify(latestStateRef.current));
        setSyncState('saved');
      } catch (err) {
        setSyncState('idle');
      }
    }, 80);
    return () => clearTimeout(t2);
  }, [profiles, activeProfileId, mode, accentKey, density, feedback, hasSeenOnboarding, aiReport, apiConfig, dailyLogs, metricEntries, customRestaurants, customHacks, itemsByDate, customIngredients, favorites, exerciseLogs, loaded]);

  // Safety net: the debounced save above can be lost if the person leaves the app before the
  // 350ms timer fires — extremely plausible on mobile (log something, immediately switch apps).
  // Flush an immediate, un-debounced save the instant the app is backgrounded or the page is
  // about to unload, using the ref so this always sees the very latest state regardless of when
  // this effect's own closure was created.
  useEffect(() => {
    if (!loaded) return;
    const flush = () => {
      try {
        window.storage?.set(STORAGE_KEY, JSON.stringify(latestStateRef.current));
      } catch (err) {
        // Best-effort — nothing more to do if this fails during teardown.
      }
    };
    const onVisibility = () => { if (document.hidden) flush(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);
    window.addEventListener('blur', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('blur', flush);
    };
  }, [loaded]);

  const updateActiveProfile = (patch) => {
    setProfiles((prev) => ({ ...prev, [activeProfileId]: { ...prev[activeProfileId], ...patch } }));
  };

  const addProfile = (name) => {
    const id = `custom-${Date.now()}`;
    setProfiles((prev) => ({
      ...prev,
      [id]: { id, name, age: 28, weight: 75, height: 175, waist: 90, activity: 'office', goal: 'maintain', locked: false },
    }));
    setActiveProfileId(id);
  };

  const deleteProfile = (id) => {
    setProfiles((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeProfileId === id) setActiveProfileId('mine');
  };

  const fullBackupState = {
    profiles, activeProfileId, mode, accentKey, density, feedback, hasSeenOnboarding,
    aiReport, apiConfig, dailyLogs, metricEntries, customRestaurants, customHacks,
    itemsByDate, customIngredients, favorites, exerciseLogs,
  };
  const storageSizeKb = roundNum(JSON.stringify(buildFullBackup(fullBackupState)).length / 1024);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(buildFullBackup(fullBackupState), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-shred-backup-v${APP_VERSION}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const factoryReset = async () => {
    setProfiles(DEFAULT_PROFILES);
    setActiveProfileId('mine');
    setMode(DEFAULT_THEME_SETTINGS.mode);
    setAccentKey(DEFAULT_THEME_SETTINGS.accentKey);
    setDensity(DEFAULT_THEME_SETTINGS.density);
    setFeedback(DEFAULT_THEME_SETTINGS.feedback);
    setHasSeenOnboarding(false);
    setAiReport(null);
    setApiConfig({ provider: 'none', key: '' });
    setDailyLogs(seedDailyLogs(computeProfileTargets(DEFAULT_PROFILES.mine)));
    setMetricEntries(seedMetricEntries(DEFAULT_PROFILES.mine));
    setCustomRestaurants([]);
    setCustomHacks([]);
    setItemsByDate({});
    setSelectedDateKey(dateKey(new Date()));
    setCustomIngredients([]);
    setFavorites([
      { id: 'fav-protein-pudding', name: 'מעדן חלבון', icon: '🥤', kcal: 140, protein: 15, carbs: 13, fat: 3 },
      { id: 'fav-protein-shake', name: 'שייק אבקה + מים', icon: '🥤', kcal: 120, protein: 25, carbs: 3, fat: 1.5 },
      { id: 'fav-eggs', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5 },
    ]);
    setExerciseLogs({});
    try {
      await window.storage?.delete(STORAGE_KEY);
    } catch (err) {
      // Nothing was saved yet, or the key is already gone — either way, defaults now stand.
    }
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.profiles) setProfiles(parsed.profiles);
        if (parsed.activeProfileId) setActiveProfileId(parsed.activeProfileId);
        if (parsed.theme) {
          setMode(parsed.theme.mode || DEFAULT_THEME_SETTINGS.mode);
          setAccentKey(parsed.theme.accentKey || DEFAULT_THEME_SETTINGS.accentKey);
          setDensity(parsed.theme.density || DEFAULT_THEME_SETTINGS.density);
          setFeedback(parsed.theme.feedback ?? DEFAULT_THEME_SETTINGS.feedback);
        }
        if (parsed.hasSeenOnboarding !== undefined) setHasSeenOnboarding(!!parsed.hasSeenOnboarding);
        if (parsed.aiReport) setAiReport(parsed.aiReport);
        if (parsed.apiConfig?.provider) setApiConfig((prev) => ({ ...prev, provider: parsed.apiConfig.provider })); // key intentionally never imported
        if (parsed.dailyLogs) setDailyLogs(parsed.dailyLogs);
        if (parsed.metricEntries) setMetricEntries(parsed.metricEntries);
        if (parsed.customRestaurants) setCustomRestaurants(parsed.customRestaurants);
        if (parsed.customHacks) setCustomHacks(parsed.customHacks);
        if (parsed.itemsByDate) setItemsByDate(parsed.itemsByDate);
        if (parsed.customIngredients) setCustomIngredients(parsed.customIngredients);
        if (parsed.favorites) setFavorites(parsed.favorites);
        if (parsed.exerciseLogs) setExerciseLogs(parsed.exerciseLogs);
      } catch (err) {
        // Invalid file — silently ignore, keep current state intact.
      }
    };
    reader.readAsText(file);
  };

  const consumed = sumItems(dayItems);
  const trainingRefeedNotice = dayMode === 'training';

  /* ---- Keep the analytics heatmap in sync with real logged history for every date ---- */
  useEffect(() => {
    setDailyLogs((prev) => {
      const next = { ...prev };
      Object.keys(itemsByDate).forEach((key) => {
        const dayTotals = sumItems(itemsByDate[key]);
        const prevEntry = prev[key];
        next[key] = {
          kcal: Math.round(dayTotals.kcal),
          protein: Math.round(dayTotals.protein),
          carbs: Math.round(dayTotals.carbs),
          fat: Math.round(dayTotals.fat),
          workoutDone: key === todayKeyValue ? workoutActivity.done : (prevEntry?.workoutDone ?? false),
          workoutDay: key === todayKeyValue ? workoutActivity.dayKey : (prevEntry?.workoutDay ?? null),
        };
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsByDate, workoutActivity.done, workoutActivity.dayKey]);

  const certificateStats = (() => {
    const logs = Object.values(dailyLogs);
    const totalWorkouts = logs.filter((l) => l.workoutDone).length;
    const scores = logs.map((l) => scoreDayLog(l, l.workoutDone ? computed.training : computed.rest)).filter((s) => s !== null);
    const adherence = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const weightLost = metricEntries.length >= 2 ? roundNum(metricEntries[0].weight - metricEntries[metricEntries.length - 1].weight) : 0;
    return { totalWorkouts, adherence, weightLost };
  })();

  const spotlight = (refKey) => {
    if (!tourStep || TOUR_STEPS[tourStep - 1].ref !== refKey) return {};
    return {
      position: 'relative',
      zIndex: 45,
      boxShadow: `0 0 0 3px ${accent}, 0 0 60px ${accent}55`,
      borderRadius: 20,
      transition: 'box-shadow 0.3s ease',
    };
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div dir="rtl" className="min-h-screen w-full transition-colors duration-500" style={{ background: t.bgGrad, fontFamily: FONT_BODY, color: t.textPrimary }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;600;700;800;900&family=Heebo:wght@300;400;500;600;700;800&family=IBM+Plex+Sans+Hebrew:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; font-variant-numeric: tabular-nums; }
          p, span, div, button, input, textarea, li { line-height: 1.5; }
          h1, h2, h3 { line-height: 1.25; }
          input::placeholder, textarea::placeholder { color: ${t.textDim}; opacity: 1; }
          input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 0.35; }
          input, textarea {
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
          }
          input:hover, textarea:hover { border-color: ${accent}66 !important; }
          input:focus, textarea:focus {
            outline: none !important;
            border-color: ${accent} !important;
            box-shadow: 0 0 0 3px ${accent}20 !important;
          }
          button { transition: transform 0.16s cubic-bezier(0.32, 0.72, 0, 1), filter 0.16s ease, box-shadow 0.2s ease; }
          button:hover { filter: brightness(1.05); }
          button:active { transform: scale(0.96); }
          ::selection { background: ${accent}45; color: ${t.textPrimary}; }
          ::-webkit-scrollbar { width: 9px; height: 9px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 8px; }
          ::-webkit-scrollbar-thumb:hover { background: ${accent}88; }
          input[type=range] { height: 6px; border-radius: 3px; background: ${t.border}; -webkit-appearance: none; }
          input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: ${accent}; cursor: pointer; box-shadow: 0 2px 8px ${accent}66, 0 0 0 4px ${t.card}; transition: transform 0.15s ease; }
          input[type=range]::-webkit-slider-thumb:active { transform: scale(1.15); }
          input[type=range]::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: ${accent}; cursor: pointer; border: none; box-shadow: 0 2px 8px ${accent}66, 0 0 0 4px ${t.card}; }

          @keyframes rowFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes plateItemIn { from { opacity: 0; transform: translateY(-8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
          @keyframes popCheck { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
          @keyframes shimmerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        `}</style>

        <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-8" style={{ paddingBottom: 132 }}>

          {/* ===== HEADER (decluttered) ===== */}
          <div ref={tourRefs.header} className="flex items-center justify-between flex-wrap gap-3 mb-6 p-2" style={spotlight('header')}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{ width: 42, height: 42, background: `linear-gradient(135deg, ${accent}, ${macro.protein})`, boxShadow: glow(accent, 14, '30') }}
              >
                <Sparkles size={20} color="#07080B" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight" style={{ color: t.textPrimary, fontFamily: FONT_DISPLAY }}>PROJECT SHRED</h1>
                <p className="text-xs" style={{ color: t.textDim }}>{activeProfile.name} · {targets.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex p-1 rounded-xl gap-1" style={{ background: t.inputBg, border: `1px solid ${t.border}` }}>
                <SegBtn active={dayMode === 'training'} onClick={() => setDayMode('training')} color="#06B6D4">אימון</SegBtn>
                <SegBtn active={dayMode === 'rest'} onClick={() => setDayMode('rest')} color="#A855F7">מנוחה</SegBtn>
              </div>
              <ProfileSwitcher
                profiles={profiles}
                activeId={activeProfileId}
                setActiveId={setActiveProfileId}
                addProfile={addProfile}
                deleteProfile={deleteProfile}
              />
              <button
                onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
                className="flex items-center justify-center rounded-xl transition-all duration-300"
                style={{ width: 38, height: 38, background: t.inputBg, border: `1px solid ${t.border}` }}
                aria-label="מצב תצוגה"
              >
                {mode === 'dark' ? <Moon size={16} color={t.textSecondary} /> : <Sun size={16} color={t.textSecondary} />}
              </button>
            </div>
          </div>

          {/* ---- sync indicator ---- */}
          <div className="flex justify-end -mt-4 mb-3">
            <span className="text-xs flex items-center gap-1" style={{ color: t.textDim }}>
              {syncState === 'saving' && (<><Loader2 size={11} className="animate-spin" /> שומר…</>)}
              {syncState === 'saved' && (<><CircleCheck size={11} color={macro.protein} /> נשמר</>)}
            </span>
          </div>

          {/* ===== TAB: היום ===== */}
          {activeTab === 'today' && (
            <div ref={tourRefs.today} className="p-2 flex flex-col items-center" style={spotlight('today')}>
              <div className="w-full">
                <DateNavigator selectedDateKey={selectedDateKey} setSelectedDateKey={setSelectedDateKey} />
              </div>
              <FavoritesQuickBar
                favorites={favorites}
                onLog={logFavorite}
                onEditFavorite={(id) => { setEditingFavoriteId(id); setFavoriteModalOpen(true); }}
                onAddFavorite={() => { setEditingFavoriteId(null); setFavoriteModalOpen(true); }}
              />
              <div className="mt-2 mb-3">
                <CompositeHeroRing consumed={consumed} targets={targets} />
              </div>
              <HeroRingLegend />
              <button
                onClick={() => setCalorieMathOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold mb-5 -mt-3"
                style={{ color: accent }}
              >
                <Info size={13} /> מאיפה היעד הקלורי הזה? הצגת החישוב המלא
              </button>
              <div className="w-full mb-6">
                <MacroBreakdownCard consumed={consumed} targets={targets} />
              </div>
              <div className="w-full">
                <SmartContextCard
                  items={dayItems}
                  onQuickComplete={markSlotCompleted}
                  onEdit={(slotId) => {
                    setActiveTab('nutrition');
                    if (slotId === 'lunch') setCibusSheetOpen(true);
                    else setPlateSheetOpen(true);
                  }}
                />
              </div>
            </div>
          )}

          {/* ===== TAB: תזונה ===== */}
          {activeTab === 'nutrition' && (
            <div ref={tourRefs.nutrition} className="p-2" style={spotlight('nutrition')}>
              <DateNavigator selectedDateKey={selectedDateKey} setSelectedDateKey={setSelectedDateKey} />
              <div className={spacing.section}>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays size={16} color={accent} />
                  <Eyebrow>לוח זמנים יומי · 08:00–20:00</Eyebrow>
                </div>
                <Timeline
                  items={dayItems}
                  onToggle={toggleItemCompleted}
                  onDelete={deleteItem}
                  onEdit={(item) => setEditingItem(item)}
                  trainingRefeedNotice={trainingRefeedNotice}
                />
              </div>

              <div className={spacing.section}>
                <Eyebrow>Cibus ובניית צלחת</Eyebrow>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCibusSheetOpen(true)}
                    className="flex flex-col items-start gap-2 p-4 rounded-2xl text-right"
                    style={{ background: t.card, border: `1.5px solid ${t.border}` }}
                  >
                    <UtensilsCrossed size={20} color={accent} />
                    <span className="text-sm font-bold" style={{ color: t.textPrimary }}>מטריצת Cibus</span>
                    <span className="text-xs" style={{ color: t.textDim }}>שומשום, צ'יקן סטיישן, גומבה, קנסאי</span>
                  </button>
                  <button
                    onClick={() => setPlateSheetOpen(true)}
                    className="flex flex-col items-start gap-2 p-4 rounded-2xl text-right"
                    style={{ background: t.card, border: `1.5px solid ${t.border}` }}
                  >
                    <Layers3 size={20} color={accent} />
                    <span className="text-sm font-bold" style={{ color: t.textPrimary }}>בנה צלחת אישית</span>
                    <span className="text-xs" style={{ color: t.textDim }}>גולמי/מבושל · גרם מדויק</span>
                  </button>
                </div>
              </div>

              <div className={spacing.section}>
                <KitchenHacksSection
                  customHacks={customHacks}
                  onLog={(hack, slotId) => logItems([{ name: hack.name, calories: hack.kcal, protein: hack.protein, carbs: hack.carbs, fats: hack.fat, source: 'hack' }], slotId)}
                  onEditHack={(id) => { setEditingHackId(id); setHackModalOpen(true); }}
                  onAddHack={() => { setEditingHackId(null); setHackModalOpen(true); }}
                />
              </div>
            </div>
          )}

          {/* ===== TAB: אימונים ===== */}
          {activeTab === 'workouts' && (
            <div ref={tourRefs.workouts} className="p-2" style={spotlight('workouts')}>
              <WorkoutPanel
                onWorkoutActivity={(done, dayKey) => setWorkoutActivity({ done, dayKey })}
                exerciseLogs={exerciseLogs}
                selectedDateKey={selectedDateKey}
                onLogSet={logExerciseSet}
              />
            </div>
          )}

          {/* ===== TAB: תובנות ===== */}
          {activeTab === 'insights' && (
            <div className="flex flex-col gap-6">
              <AiCoachWidget
                consumed={consumed}
                targets={targets}
                dayMode={dayMode}
                onLogItems={logItems}
                aiReport={aiReport}
                setAiReport={setAiReport}
                foodLibrary={foodLibrary}
              />

              <div>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <Eyebrow>אנליטיקה ומגמות</Eyebrow>
                  <button
                    onClick={() => setReportOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: accent, color: '#07080B', boxShadow: glow(accent, 10, '30') }}
                  >
                    <ClipboardList size={15} /> דוח שבועי
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <ComplianceHeatmap dailyLogs={dailyLogs} setDailyLogs={setDailyLogs} computed={computed} />
                  <GlassCard className="p-5">
                    <Eyebrow>מגמת משקל מול היקף מותן</Eyebrow>
                    <DualTrendChart entries={metricEntries} />
                  </GlassCard>
                  <MetricTracker entries={metricEntries} setEntries={setMetricEntries} />
                </div>
              </div>

              <div>
                <Eyebrow>מערכת</Eyebrow>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setHelpOpen(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ background: t.chipBg, color: t.textPrimary, border: `1px solid ${t.border}` }}>
                    <HelpCircle size={15} /> עזרה ומקרא
                  </button>
                  <button onClick={() => setSettingsOpen(true)} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold" style={{ background: t.chipBg, color: t.textPrimary, border: `1px solid ${t.border}` }}>
                    <Settings size={15} /> הגדרות
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ===== Progressive disclosure chrome: sheets, FAB, bottom nav ===== */}
        <SheetModal open={cibusSheetOpen} onClose={() => setCibusSheetOpen(false)} title="מטריצת מסעדות סיבוס">
          <CibusMatrix
            onLogItem={(meal, slotId) => { logItems([{ name: meal.name, calories: meal.kcal, protein: meal.protein, carbs: meal.carbs, fats: meal.fat, source: 'cibus' }], slotId); }}
            customRestaurants={customRestaurants}
            onAddRestaurant={() => { setEditingRestaurantId(null); setRestaurantModalOpen(true); }}
            onEditRestaurant={(id) => { setEditingRestaurantId(id); setRestaurantModalOpen(true); }}
            onDeleteRestaurant={deleteRestaurant}
            defaultSlotId="lunch"
          />
        </SheetModal>

        <SheetModal open={plateSheetOpen} onClose={() => setPlateSheetOpen(false)} title="בונה צלחת מודולרית" bare>
          <PlateComposerWidget
            consumed={consumed}
            targets={targets}
            customIngredients={customIngredients}
            onSaveCustomIngredient={saveCustomIngredient}
            onAssignToSlot={(slotId, meal) => { logItems([{ name: meal.name, calories: meal.kcal, protein: meal.protein, carbs: meal.carbs, fats: meal.fat, source: 'plate' }], slotId); setPlateSheetOpen(false); }}
          />
        </SheetModal>

        <SheetModal open={quickLogSheetOpen} onClose={() => setQuickLogSheetOpen(false)} title="רישום חופשי מהיר">
          <QuickLogSheetBody onConfirm={(items, slotId) => { logItems(items, slotId); setQuickLogSheetOpen(false); }} />
        </SheetModal>

        <SheetModal open={calorieMathOpen} onClose={() => setCalorieMathOpen(false)} title="מאיפה היעד הקלורי נגזר">
          <CalorieMathSheetBody profile={activeProfile} computed={computed} dayMode={dayMode} />
        </SheetModal>

        <SheetModal open={!!editingItem} onClose={() => setEditingItem(null)} title="עריכת פריט">
          {editingItem && <ItemEditSheetBody item={editingItem} onSave={updateItem} onClose={() => setEditingItem(null)} />}
        </SheetModal>

        {!anyOverlayOpen && <FabMenu open={fabOpen} onClose={() => setFabOpen(false)} onPickAction={handleFabAction} />}
        {!anyOverlayOpen && <ActionFab open={fabOpen} onToggle={() => setFabOpen((o) => !o)} />}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

        <WeeklyReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          report={buildWeeklyReport(dailyLogs, metricEntries, computed)}
          profile={activeProfile}
        />

        <RestaurantBuilderModal
          open={restaurantModalOpen}
          onClose={() => setRestaurantModalOpen(false)}
          restaurant={editingRestaurant}
          onSave={saveRestaurant}
          onDelete={deleteRestaurant}
        />

        <HackBuilderModal
          open={hackModalOpen}
          onClose={() => setHackModalOpen(false)}
          hack={editingHack}
          onSave={saveHack}
          onDelete={deleteHack}
        />

        <FavoriteBuilderModal
          open={favoriteModalOpen}
          onClose={() => setFavoriteModalOpen(false)}
          favorite={editingFavorite}
          onSave={saveFavorite}
          onDelete={deleteFavorite}
        />

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          profile={activeProfile}
          updateProfile={updateActiveProfile}
          computed={computed}
          onExport={handleExport}
          onImport={handleImport}
          mode={mode} setMode={setMode}
          accentKey={accentKey} setAccentKey={setAccentKey}
          density={density} setDensity={setDensity}
          feedback={feedback} setFeedback={setFeedback}
          apiConfig={apiConfig} setApiConfig={setApiConfig}
          onOpenDocs={() => { setSettingsOpen(false); setDocsOpen(true); }}
          onOpenDiagnostics={() => { setSettingsOpen(false); setDiagnosticsOpen(true); }}
        />

        <DocsViewerModal open={docsOpen} onClose={() => setDocsOpen(false)} />

        <DiagnosticsModal
          open={diagnosticsOpen}
          onClose={() => setDiagnosticsOpen(false)}
          profile={activeProfile}
          computed={computed}
          storageSizeKb={storageSizeKb}
          onFactoryReset={factoryReset}
          onOpenCertificate={() => { setDiagnosticsOpen(false); setCertificateOpen(true); }}
        />

        <CertificateModal open={certificateOpen} onClose={() => setCertificateOpen(false)} stats={certificateStats} />

        <HelpModal
          open={helpOpen}
          onClose={() => setHelpOpen(false)}
          onStartTour={() => { setHelpOpen(false); setTourStep(1); }}
        />

        {tourStep && (
          <TourCoachmark
            step={tourStep}
            totalSteps={TOUR_STEPS.length}
            onNext={() => setTourStep((s) => (s >= TOUR_STEPS.length ? null : s + 1))}
            onBack={() => setTourStep((s) => Math.max(1, s - 1))}
            onSkip={() => setTourStep(null)}
          />
        )}
      </div>
    </ThemeContext.Provider>
  );
}
