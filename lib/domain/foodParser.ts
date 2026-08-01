// Free-text quick-log parser. ProjectShred.artifact.jsx:1119-1201 (Sprint 9),
// rebuilt in Sprint 30 to recognize the app's real, ~640-item food surface
// instead of a bespoke 19-entry FOOD_DB, after a direct report that common
// words ("קפה", "אספרסו", "חלב", "סוכר") came back as "not recognized."
//
// Still 100% client-side and deterministic — no network call, no external NLP
// service, no API key. That's an explicit, repeatedly-documented architectural
// choice (see CLAUDE.md's Sprint 9 note on the AI Coach): this build has no
// live backend credential anywhere, so a "real LLM parse" would either ship a
// dead, honestly-inert field (like the Sprint 9 API-key setting already is)
// or silently fail. What follows is the responsible ceiling for a fully
// offline parser — recognition against the ENTIRE real ingredient/hack/
// eating-out corpus (not a hand-picked subset), a much richer quantity
// grammar (all 12 PORTION_UNITS, Hebrew number words, halves/quarters/
// thirds), longest-match-first + span-claiming so specific names always win
// over generic ones, and a curated alias table for the common bare words
// (milk, sugar, chicken, rice, coffee...) that don't literally appear as a
// full ingredient name. It is still a heuristic, not comprehension — see the
// Known Simplifications note this sprint adds to CLAUDE.md for exactly what
// it still can't do.

import { getPer100, type Ingredient, type IngredientCategory } from './ingredients';
import { roundNum, genId } from './util';

// ---------------------------------------------------------------------------
// Corpus — built by the caller from real reference + custom data (the same
// "pass data in, don't import lib/data here" discipline lib/domain/smartSwap.ts
// already established for buildFoodLibrary(), so this file stays testable
// with plain fixtures and never reaches sideways into lib/data itself).
// ---------------------------------------------------------------------------

export interface ParserDishLike {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface ParserCorpusEntry {
  id: string;
  name: string;
  keywords: string[]; // name + any generic/plural aliases that should also resolve to it
  kind: 'ingredient' | 'dish';
  category?: IngredientCategory;
  // 'ingredient': macros per 100g/ml, on whichever basis a person would
  // actually describe a finished portion in (see COOKED-BASIS note below).
  // 'dish': macros per one serving, exactly as HACKS/EATING_OUT_MENU/custom
  // hacks/custom restaurant dishes already store them.
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Bare generic words a person actually types ("חלב", "סוכר", "עוף", "קפה")
// that don't literally appear inside any specific ingredient's full name
// ("חלב 3%", "סוכר לבן", "חזה עוף", "קפה שחור (פילטר)") — plus the plural
// forms of a handful of common countable foods, since Hebrew pluralization
// isn't a simple suffix rule this parser can derive automatically (e.g.
// "בננה" -> "בננות" drops the trailing ה entirely). Each maps to a single,
// reasonable default ingredient id. Not exhaustive — a deliberate, documented
// simplification, the same spirit as FOOD_DB's original curated scope.
const ALIASES: { keyword: string; targetId: string }[] = [
  { keyword: 'עוף', targetId: 'chicken-breast' },
  { keyword: 'בשר טחון', targetId: 'beef-10' },
  { keyword: 'בקר טחון', targetId: 'beef-10' },
  { keyword: 'בקר', targetId: 'beef-10' },
  { keyword: 'בשר', targetId: 'beef-10' },
  { keyword: 'הודו', targetId: 'turkey-breast' },
  { keyword: 'טונה', targetId: 'tuna-water' },
  { keyword: 'ביצה', targetId: 'eggs' },
  { keyword: 'אורז', targetId: 'rice-basmati' },
  { keyword: 'לחם', targetId: 'bread-white' },
  { keyword: 'גבינה', targetId: 'cheese-9' },
  { keyword: 'חלב', targetId: 'milk-3' },
  { keyword: 'סוכר', targetId: 'sugar-white' },
  { keyword: 'שמן', targetId: 'olive-oil' },
  { keyword: 'ירקות', targetId: 'il-israeli-salad-chopped' },
  { keyword: 'סלט', targetId: 'il-israeli-salad-chopped' },
  { keyword: 'פרי', targetId: 'apple' },
  { keyword: 'תפוח', targetId: 'apple' },
  { keyword: 'קפה', targetId: 'bev-coffee-black' },
  { keyword: 'תה', targetId: 'bev-tea-black' },
  { keyword: 'שניצל', targetId: 'schnitzel' },
  { keyword: 'פיצה', targetId: 'pizza-slice' },
  { keyword: 'שווארמה', targetId: 'shawarma-laffa' },
  { keyword: 'פלאפל', targetId: 'falafel-pita' },
  { keyword: 'חומוס', targetId: 'il-hummus-plain' },
  // plural forms
  { keyword: 'בננות', targetId: 'banana' },
  { keyword: 'תפוחים', targetId: 'apple' },
  { keyword: 'תפוזים', targetId: 'orange' },
  { keyword: 'עגבניות', targetId: 'tomato' },
  { keyword: 'עגבניה', targetId: 'tomato' },
  { keyword: 'מלפפונים', targetId: 'cucumber' },
  { keyword: 'תמרים', targetId: 'dates-medjool' },
  { keyword: 'פיתות', targetId: 'pita' },
];

// Average single-piece weight for foods people naturally count rather than
// weigh ("2 ביצים", "בננה" with no number meaning one) — a bare number with
// no unit word is interpreted as a COUNT for these ids, and as literal grams
// for everything else (raw ingredients' base unit is grams everywhere else in
// this app). Honest, hand-estimated averages, not a per-brand claim.
const COUNTABLE_UNIT_WEIGHTS: Record<string, number> = {
  eggs: 50,
  banana: 120,
  apple: 180,
  orange: 200,
  'dates-medjool': 24,
  pita: 60,
  tomato: 120,
  cucumber: 100,
  'il-clementine': 70,
};

const CATEGORY_DEFAULT_GRAMS: Record<IngredientCategory, number> = {
  protein: 150,
  carb: 150,
  fat: 15,
  veg: 100,
  fruit: 120,
  dairy_snacks: 100,
  condiments: 10,
  beverages: 200,
};

// A handful of named outliers where the category default above is honestly
// wrong for that specific food: avocado (category 'fat', but eaten as a
// whole fruit — half an avocado is nowhere near the ~15g a spoonful of oil
// would be) and the hummus dips (category 'condiments', but eaten as a real
// side portion, not a ketchup-sized squeeze). Small and deliberately not
// exhaustive — the same curated-scope spirit as ALIASES/COUNTABLE_UNIT_WEIGHTS.
const DEFAULT_GRAMS_OVERRIDE: Record<string, number> = {
  avocado: 100,
  'il-hummus-plain': 120,
  'il-hummus-parsley': 120,
};

export function buildParserCorpus(
  ingredients: Ingredient[],
  dishes: ParserDishLike[]
): ParserCorpusEntry[] {
  const entries: ParserCorpusEntry[] = [];
  const seenIds = new Set<string>();
  const aliasesById = new Map<string, string[]>();
  for (const a of ALIASES) {
    const list = aliasesById.get(a.targetId) || [];
    list.push(a.keyword);
    aliasesById.set(a.targetId, list);
  }

  for (const ing of ingredients) {
    if (seenIds.has(ing.id)) continue;
    seenIds.add(ing.id);
    // A person describing a portion in grams almost always means "as eaten,"
    // not raw pre-cooked weight — so an ingredient with a cooked variant is
    // quick-logged on its cooked basis (matches how the original FOOD_DB's
    // hand-tuned chicken/rice/pasta numbers were already cooked-basis values).
    // Single-state ingredients have only one basis to begin with.
    const per100 = getPer100(ing, ing.hasCookedVariant ? 'cooked' : 'raw');
    entries.push({
      id: ing.id,
      name: ing.name,
      keywords: [ing.name, ...(aliasesById.get(ing.id) || [])],
      kind: 'ingredient',
      category: ing.category,
      kcal: per100.kcal,
      protein: per100.protein,
      carbs: per100.carbs,
      fat: per100.fat,
    });
  }

  for (const d of dishes) {
    if (seenIds.has(d.id)) continue;
    seenIds.add(d.id);
    entries.push({
      id: d.id,
      name: d.name,
      keywords: [d.name, ...(aliasesById.get(d.id) || [])],
      kind: 'dish',
      kcal: d.kcal,
      protein: d.protein,
      carbs: d.carbs,
      fat: d.fat,
    });
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Quantity grammar — every PORTION_UNITS unit (mirrored here on purpose: this
// stays a self-contained domain file the same way the original FOOD_DB
// "ships alongside the algorithm," per that entry's own header), Hebrew
// integer words 2-10, and חצי/רבע/שליש/וחצי fractions.
// ---------------------------------------------------------------------------

interface UnitSynonym {
  text: string;
  gramsPerUnit: number;
}

// Longest-first so "כף יד" is tried before the "כף" it starts with, "מ״ל"
// before "מ", etc. Values mirror lib/data/portionUnits.ts's PORTION_UNITS.
const UNIT_SYNONYMS: UnitSynonym[] = [
  { text: 'כף יד', gramsPerUnit: 90 },
  { text: 'גרם', gramsPerUnit: 1 },
  { text: "גר'", gramsPerUnit: 1 },
  { text: 'גר׳', gramsPerUnit: 1 },
  { text: 'מ״ל', gramsPerUnit: 1 },
  { text: 'מ"ל', gramsPerUnit: 1 },
  // Plain Hebrew letters with no punctuation ("150 מל חלב") — extremely
  // common casually, since most people don't bother typing the gershayim
  // mark on a phone keyboard. WORD_START still requires a real boundary
  // right before it, so this can't false-match the end of an unrelated word
  // like "קרמל" (caramel).
  { text: 'מל', gramsPerUnit: 1 },
  { text: 'כפיות', gramsPerUnit: 5 },
  { text: 'כפית', gramsPerUnit: 5 },
  { text: 'כפות', gramsPerUnit: 15 },
  { text: 'כף', gramsPerUnit: 15 },
  { text: 'כוסות', gramsPerUnit: 200 },
  { text: 'כוס', gramsPerUnit: 200 },
  { text: 'חופנים', gramsPerUnit: 30 },
  { text: 'חופן', gramsPerUnit: 30 },
  { text: 'פרוסות', gramsPerUnit: 25 },
  { text: 'פרוסה', gramsPerUnit: 25 },
  { text: 'קופסאות', gramsPerUnit: 150 },
  { text: 'קופסה', gramsPerUnit: 150 },
  { text: 'פחיות', gramsPerUnit: 150 },
  { text: 'פחית', gramsPerUnit: 150 },
  { text: 'צלחות', gramsPerUnit: 380 },
  { text: 'צלחת', gramsPerUnit: 380 },
  { text: 'יחידות', gramsPerUnit: 100 },
  { text: 'יחידה', gramsPerUnit: 100 },
  { text: "יח'", gramsPerUnit: 100 },
  { text: 'יח׳', gramsPerUnit: 100 },
  { text: 'קורט', gramsPerUnit: 0.5 },
  { text: 'ml', gramsPerUnit: 1 },
  { text: 'g', gramsPerUnit: 1 },
  // Hebrew construct-state ("smichut") forms — a feminine noun ending in ה
  // changes that ה to ת when it directly governs the next noun ("פרוסה" +
  // "לחם" -> "פרוסת לחם", not "פרוסה לחם"). Extremely common for exactly
  // these measurement words, so without these forms "פרוסת לחם" (a slice OF
  // bread) would silently fail to match the "פרוסה" unit at all.
  { text: 'פרוסת', gramsPerUnit: 25 },
  { text: 'קופסת', gramsPerUnit: 150 },
  { text: 'יחידת', gramsPerUnit: 100 },
  { text: 'כמות', gramsPerUnit: 100 },
].sort((a, b) => b.text.length - a.text.length);

const HEBREW_NUMBER_WORDS: Record<string, number> = {
  שתיים: 2, שני: 2, שתי: 2,
  שלושה: 3, שלוש: 3,
  ארבעה: 4, ארבע: 4,
  חמישה: 5, חמש: 5,
  שישה: 6, שש: 6,
  שבעה: 7, שבע: 7,
  שמונה: 8,
  תשעה: 9, תשע: 9,
  עשרה: 10, עשר: 10,
};

const FRACTION_WORDS: Record<string, number> = {
  רבע: 0.25,
  שליש: 1 / 3,
  חצי: 0.5,
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A word boundary that also accepts an unspaced leading "ו" (vav hachibur,
// Hebrew's "and") — Hebrew attaches that conjunction directly onto the next
// word with no space ("וכפית" = "and a teaspoon", not "ו כפית"), which is
// extremely common in a natural free-text sentence (e.g. "...וכפית סוכר").
// Without this, every unit/number word after a Hebrew "and" would silently
// fail to be recognized.
const WORD_START = '(?:^|[\\s\\d]|ו)';

// Reads a plain count off the END of a text fragment: digits ("200", "1.5"),
// Hebrew integer words ("שלוש"), or an integer/word plus a trailing "וחצי"
// ("2 וחצי" -> 2.5). Deliberately does NOT match a bare fraction word
// ("חצי"/"רבע"/"שליש") on its own — "3 תפוחים" is a real count, but a bare
// "חצי X" with no unit ("חצי אבוקדו") means "half of the usual portion," a
// size multiplier applied afterward, not "0.5 grams." See extractTrailingNumber
// below for the one context (right after a matched unit) where a bare
// fraction word IS a real quantity ("חצי כוס" = half a cup).
function extractTrailingCount(fragment: string): number | null {
  let rest = fragment;
  let halfBonus = 0;
  const vavHalfMatch = rest.match(/(?:^|\s)וחצי\s*$/);
  if (vavHalfMatch) {
    halfBonus = 0.5;
    rest = rest.slice(0, vavHalfMatch.index);
  }

  const digitMatch = rest.match(/(\d+(?:\.\d+)?)\s*$/);
  if (digitMatch) return parseFloat(digitMatch[1]) + halfBonus;

  for (const [word, num] of Object.entries(HEBREW_NUMBER_WORDS)) {
    if (new RegExp(`${WORD_START}${word}\\s*$`).test(rest)) return num + halfBonus;
  }
  if (halfBonus > 0) return halfBonus; // "וחצי" with nothing before it: just "half"
  return null;
}

// Same as extractTrailingCount, but also accepts a bare fraction word
// ("חצי"/"רבע"/"שליש") — only called from inside parseQuantity's
// matched-unit branch, where "fraction of the unit" is unambiguous
// ("חצי כוס" = half a cup = 100g, not "0.5 grams").
function extractTrailingNumber(fragment: string): number | null {
  const count = extractTrailingCount(fragment);
  if (count != null) return count;
  for (const [word, frac] of Object.entries(FRACTION_WORDS)) {
    if (new RegExp(`${WORD_START}${word}\\s*$`).test(fragment)) return frac;
  }
  return null;
}

interface ParsedQuantity {
  qty: number | null; // null = nothing found at all
  unitGrams: number | null; // set when an explicit unit word (כפית/כוס/גרם/...) was found
}

function parseQuantity(before: string): ParsedQuantity {
  // Hebrew allows the "half" to trail either the NUMBER ("2 וחצי כוסות" —
  // already handled below, via extractTrailingCount's own vav-half check on
  // the text before the unit) or the UNIT itself ("כוס וחצי" = a cup and a
  // half, with nothing between "כוס" and "וחצי"). The second form has to be
  // checked first and separately: by the time the generic unit-at-the-end
  // search below runs, "כוס" wouldn't even be at the end of `before` — "וחצי"
  // is — so it would never be found any other way.
  for (const syn of UNIT_SYNONYMS) {
    const unitHalfRe = new RegExp(`${WORD_START}${escapeRegex(syn.text)}\\s+וחצי\\s*$`);
    if (unitHalfRe.test(before)) return { qty: 1.5, unitGrams: syn.gramsPerUnit };
  }

  let matchedUnit: UnitSynonym | null = null;
  let unitStart = -1;
  for (const syn of UNIT_SYNONYMS) {
    const re = new RegExp(`${WORD_START}${escapeRegex(syn.text)}\\s*$`);
    const m = before.match(re);
    if (m && m.index !== undefined) {
      matchedUnit = syn;
      unitStart = before.lastIndexOf(syn.text);
      break;
    }
  }

  const numberSource = matchedUnit ? before.slice(0, unitStart) : before;

  if (matchedUnit) {
    const qty = extractTrailingNumber(numberSource);
    return { qty: qty ?? 1, unitGrams: matchedUnit.gramsPerUnit };
  }
  return { qty: extractTrailingCount(numberSource), unitGrams: null };
}

// ---------------------------------------------------------------------------
// The parser itself.
// ---------------------------------------------------------------------------

export interface ParsedFoodItem {
  id: string;
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const BEFORE_WINDOW = 24;
const AFTER_WINDOW = 12;

// Restricts a check to the single word immediately touching the food
// keyword, not "somewhere in the lookback window" — quantity extraction is
// already safe here because its regexes are anchored with \s*$ (so a number
// meant for an earlier food never leaks across a "ו"/space gap into a later
// one), but the old, unanchored `/קטנ/.test(before)` size-adjective check was
// not: in "שניצל גדול עם אורז בסמטי," a loose window let "גדול" (meant for
// the schnitzel) also get attributed to the rice several words later. Adjectives
// modify the noun right next to them, so only the adjacent word is checked.
function lastWord(s: string): string {
  const trimmed = s.replace(/\s+$/, '');
  const idx = trimmed.lastIndexOf(' ');
  return idx === -1 ? trimmed : trimmed.slice(idx + 1);
}
function firstWord(s: string): string {
  const trimmed = s.replace(/^\s+/, '');
  const idx = trimmed.search(/\s/);
  return idx === -1 ? trimmed : trimmed.slice(0, idx);
}

export function parseFoodText(text: string, corpus: ParserCorpusEntry[]): ParsedFoodItem[] {
  if (!text || !text.trim()) return [];

  // Longest keyword first: a specific full name ("אורז בסמטי") must claim its
  // span before a shorter generic alias ("אורז") gets a chance to match a
  // different entry over the same characters.
  const pairs: { keyword: string; entry: ParserCorpusEntry }[] = [];
  for (const entry of corpus) {
    for (const kw of entry.keywords) {
      if (kw) pairs.push({ keyword: kw, entry });
    }
  }
  pairs.sort((a, b) => b.keyword.length - a.keyword.length);

  const found: { pos: number; item: ParsedFoodItem }[] = [];
  const seenEntryIds = new Set<string>();
  const claimed: [number, number][] = [];
  const isClaimed = (start: number, end: number) => claimed.some(([s, e]) => start < e && end > s);

  for (const { keyword, entry } of pairs) {
    if (seenEntryIds.has(entry.id)) continue;
    const idx = text.indexOf(keyword);
    if (idx === -1) continue;
    const end = idx + keyword.length;
    if (isClaimed(idx, end)) continue;

    const before = text.slice(Math.max(0, idx - BEFORE_WINDOW), idx);
    const after = text.slice(end, end + AFTER_WINDOW);
    const { qty, unitGrams } = parseQuantity(before);

    const beforeWord = lastWord(before);
    const afterWord = firstWord(after);
    let sizeMult = 1;
    if (/קטנ/.test(beforeWord) || /קטנ/.test(afterWord)) sizeMult = 0.65;
    else if (/גדול/.test(beforeWord) || /גדול/.test(afterWord)) sizeMult = 1.4;
    else if (unitGrams == null && qty == null) {
      // Nothing else was found — check for a bare fraction word directly
      // touching the food ("חצי אבוקדו" = half an avocado) as a multiplier
      // on the usual portion, not a literal "0.5 grams" (see
      // extractTrailingCount's note on why this is handled separately).
      if (/חצי/.test(beforeWord)) sizeMult = 0.5;
      else if (/רבע/.test(beforeWord)) sizeMult = 0.25;
      else if (/שליש/.test(beforeWord)) sizeMult = 1 / 3;
    }

    seenEntryIds.add(entry.id);
    claimed.push([idx, end]);

    if (entry.kind === 'ingredient') {
      const unitWeight = COUNTABLE_UNIT_WEIGHTS[entry.id];
      let grams: number;
      let estimated = false;
      if (unitGrams != null) {
        grams = unitGrams * (qty ?? 1);
      } else if (qty != null && unitWeight) {
        grams = qty * unitWeight;
      } else if (qty != null) {
        grams = qty;
      } else {
        grams = DEFAULT_GRAMS_OVERRIDE[entry.id] ?? CATEGORY_DEFAULT_GRAMS[entry.category as IngredientCategory] ?? 100;
        estimated = true;
      }
      grams = Math.round(Math.max(1, grams * sizeMult));
      const factor = grams / 100;
      found.push({
        pos: idx,
        item: {
          id: genId(entry.name),
          name: entry.name,
          amount: `${grams} גרם${estimated ? ' (משוער)' : ''}`,
          kcal: Math.round(entry.kcal * factor),
          protein: roundNum(entry.protein * factor),
          carbs: roundNum(entry.carbs * factor),
          fat: roundNum(entry.fat * factor),
        },
      });
    } else {
      const count = Math.max(0.25, (qty ?? 1) * sizeMult);
      found.push({
        pos: idx,
        item: {
          id: genId(entry.name),
          name: entry.name,
          amount: count === 1 ? '1 מנה' : `${roundNum(count)} מנות`,
          kcal: Math.round(entry.kcal * count),
          protein: roundNum(entry.protein * count),
          carbs: roundNum(entry.carbs * count),
          fat: roundNum(entry.fat * count),
        },
      });
    }
  }

  // Report items in the order they appear in the sentence, not corpus order.
  return found.sort((a, b) => a.pos - b.pos).map((f) => f.item);
}
