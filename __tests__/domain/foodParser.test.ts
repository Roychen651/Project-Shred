import { describe, it, expect } from 'vitest';
import { parseFoodText } from '@/lib/domain/foodParser';

describe('parseFoodText', () => {
  it('returns nothing for empty or whitespace-only input', () => {
    expect(parseFoodText('')).toEqual([]);
    expect(parseFoodText('   ')).toEqual([]);
  });

  it('parses an explicit gram quantity for a per100g food', () => {
    // The 14-char lookbehind window is exactly "אכלתי 200 גרם " here (5+1+3+1+3+1=14),
    // so the whole quantity phrase is visible to the regex.
    const result = parseFoodText('אכלתי 200 גרם חזה עוף');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'חזה עוף', amount: '200 גרם',
      kcal: 330, protein: 62, carbs: 0, fat: 7.2,
    });
  });

  it('estimates a default portion when no grams are given, and marks it as estimated', () => {
    const result = parseFoodText('אכלתי חזה עוף על הצהריים');
    expect(result[0].amount).toBe('150 גרם (משוער)');
    // defaultGrams 150, factor 1.5: kcal round(165*1.5)=248, protein roundNum(31*1.5)=46.5
    expect(result[0]).toMatchObject({ kcal: 248, protein: 46.5, carbs: 0, fat: 5.4 });
  });

  it('parses a perUnit food with a trailing size adjective ("גדולה" follows the noun in Hebrew)', () => {
    const result = parseFoodText('אכלתי בננה גדולה');
    expect(result).toHaveLength(1);
    // count = max(0.5, 1*1.4) = 1.4; kcal round(105*1.4)=147; protein roundNum(1.3*1.4)=1.8
    expect(result[0]).toMatchObject({
      name: 'בננה', amount: '1.4 יח׳',
      kcal: 147, protein: 1.8, carbs: 37.8, fat: 0.6,
    });
  });

  it('applies the "קטנה" (small) size multiplier', () => {
    const result = parseFoodText('בננה קטנה');
    // count = max(0.5, 1*0.65) = 0.65; kcal round(105*0.65)=68
    expect(result[0]).toMatchObject({ kcal: 68 });
  });

  it('logs a repeated food only once (one FOOD_DB entry can only ever produce one item)', () => {
    const result = parseFoodText('חזה עוף וגם חזה עוף שוב');
    expect(result).toHaveLength(1);
  });

  it('parses multiple distinct foods from one sentence', () => {
    const result = parseFoodText('אכלתי בננה ושתי ביצים');
    const names = result.map((r) => r.name).sort();
    expect(names).toEqual(['ביצה', 'בננה']);
  });
});
