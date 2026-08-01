import { describe, it, expect } from 'vitest';
import { parseFoodText, buildParserCorpus, type ParserDishLike } from '@/lib/domain/foodParser';
import { INGREDIENT_DB } from '@/lib/data/ingredients';
import { ISRAELI_INGREDIENTS } from '@/lib/data/israeli-ingredients';
import { BEVERAGES } from '@/lib/data/beverages';
import { HACKS } from '@/lib/data/hacks';
import { EATING_OUT_MENU } from '@/lib/data/eatingOut';
import type { Ingredient } from '@/lib/domain/ingredients';

// Tested against the REAL, shipped corpus (not a toy fixture) — this is the
// actual recognition surface QuickLogSheetBody builds via buildParserCorpus(),
// so a passing test here means the real app really resolves these sentences,
// not just an idealized stand-in for it.
const REAL_CORPUS = buildParserCorpus(
  [...INGREDIENT_DB, ...ISRAELI_INGREDIENTS, ...BEVERAGES],
  [...HACKS, ...EATING_OUT_MENU]
);

describe('parseFoodText — against the real production corpus', () => {
  it('returns nothing for empty or whitespace-only input', () => {
    expect(parseFoodText('', REAL_CORPUS)).toEqual([]);
    expect(parseFoodText('   ', REAL_CORPUS)).toEqual([]);
  });

  it('parses an explicit gram quantity on the COOKED basis (a person means "as eaten")', () => {
    // chicken-breast: raw {kcal:120, protein:22.5, fat:2.6}, cookedFactor 0.75
    // -> cooked/100g = kcal 160, protein 30, fat 3.4667. At 200g (factor 2):
    // kcal round(320), protein roundNum(60), fat roundNum(6.9333)=6.9.
    const result = parseFoodText('אכלתי 200 גרם חזה עוף', REAL_CORPUS);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'חזה עוף', amount: '200 גרם', kcal: 320, protein: 60, carbs: 0, fat: 6.9 });
  });

  it('estimates a category-based default portion when no quantity is given, and marks it estimated', () => {
    const result = parseFoodText('אכלתי חזה עוף על הצהריים', REAL_CORPUS);
    expect(result[0].amount).toBe('150 גרם (משוער)');
    expect(result[0]).toMatchObject({ kcal: 240, protein: 45, carbs: 0, fat: 5.2 });
  });

  it('applies the "גדולה" (large) and "קטנה" (small) size multipliers to a fruit\'s default portion', () => {
    // banana: raw {kcal:89, protein:1.1, carbs:23, fat:0.3}, fruit default 120g.
    const big = parseFoodText('אכלתי בננה גדולה', REAL_CORPUS);
    expect(big[0]).toMatchObject({ amount: '168 גרם (משוער)', kcal: 150 });
    const small = parseFoodText('בננה קטנה', REAL_CORPUS);
    expect(small[0]).toMatchObject({ amount: '78 גרם (משוער)', kcal: 69 });
  });

  it('logs a repeated food only once', () => {
    const result = parseFoodText('חזה עוף וגם חזה עוף שוב', REAL_CORPUS);
    expect(result).toHaveLength(1);
  });

  it('parses multiple distinct foods, a plural alias (ביצים), and a Hebrew number word (שתי) for a countable item', () => {
    const result = parseFoodText('אכלתי בננה ושתי ביצים', REAL_CORPUS);
    const names = result.map((r) => r.name);
    expect(names).toEqual(['בננה', 'ביצים']); // sentence order, not corpus order
    // eggs: raw {kcal:155,...} per 100g, unitWeight 50g/egg -> 2 eggs = 100g.
    expect(result[1]).toMatchObject({ amount: '100 גרם', kcal: 155, protein: 13 });
  });

  it('resolves generic bare words (חלב/סוכר) via aliases with correct ml/teaspoon quantities, including a vav-prefixed unit ("וכפית")', () => {
    // The exact sentence from the reported bug: espresso + explicit-ml milk +
    // an unspaced "and a teaspoon" of sugar.
    const result = parseFoodText('אספרסו עם 150 מ"ל חלב וכפית סוכר', REAL_CORPUS);
    const byName = Object.fromEntries(result.map((r) => [r.name, r]));
    expect(byName['אספרסו']).toBeDefined();
    expect(byName['חלב 3%']).toMatchObject({ amount: '150 גרם', kcal: 90 });
    expect(byName['סוכר לבן']).toMatchObject({ amount: '5 גרם', kcal: 19 }); // 1 tsp = 5g, no number needed
  });

  it('resolves a bare generic word via a longer specific corpus name once literally present ("קפה" -> "כוס קפה")', () => {
    const result = parseFoodText('שתיתי כוס קפה', REAL_CORPUS);
    expect(result[0]).toMatchObject({ name: 'קפה שחור (פילטר)', amount: '200 גרם' });
  });

  it('recognizes the Hebrew construct ("smichut") form of a unit — "פרוסת לחם," not just "פרוסה לחם"', () => {
    const result = parseFoodText('אכלתי פרוסת לחם', REAL_CORPUS);
    expect(result[0]).toMatchObject({ name: 'לחם לבן', amount: '25 גרם' });
  });

  it('treats a bare fraction word with no unit as a portion multiplier, not literal grams ("חצי אבוקדו")', () => {
    // avocado has a curated default-grams override (100g) since its category
    // ("fat") default (15g, sized for a spoonful of oil) would be nonsense
    // for a whole fruit; חצי -> 50g.
    const result = parseFoodText('חצי אבוקדו', REAL_CORPUS);
    expect(result[0]).toMatchObject({ name: 'אבוקדו', amount: '50 גרם (משוער)' });
  });

  it('handles "unit וחצי" (the half trailing the UNIT, e.g. "כוס וחצי אורז" = a cup and a half of rice)', () => {
    const result = parseFoodText('כוס וחצי אורז', REAL_CORPUS);
    expect(result[0]).toMatchObject({ name: 'אורז בסמטי', amount: '300 גרם' });
  });

  it('attributes a size adjective to the immediately adjacent food only, not a different food several words later', () => {
    // Regression for a real bug found while building this: a loose,
    // unanchored "does the word 'גדול' appear anywhere in the lookback
    // window" check let an adjective meant for "שניצל" leak onto "אורז
    // בסמטי" two words later. It must land on the schnitzel only.
    const result = parseFoodText('שניצל גדול עם אורז בסמטי', REAL_CORPUS);
    const byName = Object.fromEntries(result.map((r) => [r.name, r]));
    expect(byName['שניצל עוף'].amount).toBe('210 גרם (משוער)'); // 150 * 1.4
    expect(byName['אורז בסמטי'].amount).toBe('150 גרם (משוער)'); // unaffected, plain category default
  });

  it('recognizes dish-kind entries (eating-out items) via a generic alias and counts multiple servings', () => {
    // "פיצה" alone doesn't literally appear in any EATING_OUT_MENU dish name
    // (they're all specific, e.g. "משולש פיצה (רגילה)") — only the alias
    // makes the bare word resolve at all.
    const result = parseFoodText('2 פרוסות פיצה', REAL_CORPUS);
    expect(result[0]).toMatchObject({ name: 'משולש פיצה (רגילה)', amount: '2 מנות', kcal: 570 });
  });

  it('parses a dish and a condiment together via two different aliases in one sentence', () => {
    const result = parseFoodText('שווארמה עם חומוס', REAL_CORPUS);
    const byName = Object.fromEntries(result.map((r) => [r.name, r]));
    expect(byName['שווארמה בלאפה מלאה']).toMatchObject({ amount: '1 מנה', kcal: 650 });
    expect(byName['חומוס טחינה מוכן']).toMatchObject({ amount: '120 גרם (משוער)' });
  });
});

describe('buildParserCorpus', () => {
  const fixtureIngredients: Ingredient[] = [
    { id: 'x-chicken', name: 'עוף בדיקה', category: 'protein', hasCookedVariant: true, cookedFactor: 0.8, raw: { kcal: 100, protein: 20, carbs: 0, fat: 2 } },
    { id: 'x-rice', name: 'אורז בדיקה', category: 'carb', hasCookedVariant: false, raw: { kcal: 130, protein: 3, carbs: 28, fat: 0.3 } },
  ];
  const fixtureDishes: ParserDishLike[] = [
    { id: 'x-dish', name: 'מנה בדיקה', kcal: 300, protein: 10, carbs: 40, fat: 8 },
  ];

  it('builds one corpus entry per ingredient/dish, deduped by id', () => {
    const corpus = buildParserCorpus([...fixtureIngredients, fixtureIngredients[0]], fixtureDishes);
    const ids = corpus.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('x-chicken');
    expect(ids).toContain('x-dish');
  });

  it('reports an ingredient on its cooked basis when it has a cooked variant', () => {
    const corpus = buildParserCorpus(fixtureIngredients, []);
    const entry = corpus.find((e) => e.id === 'x-chicken')!;
    // raw kcal 100 / cookedFactor 0.8 = 125
    expect(entry.kcal).toBe(125);
  });

  it('reports a single-state ingredient unchanged', () => {
    const corpus = buildParserCorpus(fixtureIngredients, []);
    const entry = corpus.find((e) => e.id === 'x-rice')!;
    expect(entry.kcal).toBe(130);
  });
});
