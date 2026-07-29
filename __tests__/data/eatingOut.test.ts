import { describe, it, expect } from 'vitest';
import { EATING_OUT_MENU, EATING_OUT_CATEGORIES } from '@/lib/data/eatingOut';

const VALID = new Set(EATING_OUT_CATEGORIES.map((c) => c.id));

describe('EATING_OUT_MENU — structural integrity', () => {
  it('has exactly 73 entries, matching CLAUDE.md\'s Sprint 15.5 count', () => {
    expect(EATING_OUT_MENU).toHaveLength(73);
  });

  it('has no duplicate ids', () => {
    const ids = EATING_OUT_MENU.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every item has a valid category and finite non-negative macros', () => {
    for (const e of EATING_OUT_MENU) {
      expect(VALID.has(e.category), `${e.id}: invalid category`).toBe(true);
      for (const field of ['kcal', 'protein', 'carbs', 'fat'] as const) {
        expect(Number.isFinite(e[field]), `${e.id}.${field}`).toBe(true);
        expect(e[field]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('EATING_OUT_MENU — spot-checks against the artifact source', () => {
  it('both regular and zero-sugar drinks are present, per the Sprint 15.4 requirement', () => {
    expect(EATING_OUT_MENU.find((e) => e.id === 'coke-regular')).toMatchObject({ kcal: 139, carbs: 35 });
    expect(EATING_OUT_MENU.find((e) => e.id === 'coke-zero')).toMatchObject({ kcal: 1, carbs: 0.3 });
    expect(EATING_OUT_MENU.find((e) => e.id === 'sprite-regular')).toMatchObject({ kcal: 140 });
    expect(EATING_OUT_MENU.find((e) => e.id === 'sprite-zero')).toMatchObject({ kcal: 3 });
  });

  it('a Sprint 15.5 round-2 category item (grill/steakhouse) is present', () => {
    expect(EATING_OUT_MENU.find((e) => e.id === 'entrecote-200')).toMatchObject({ category: 'grill_steakhouse', kcal: 520, protein: 44 });
  });
});

describe('EATING_OUT_CATEGORIES', () => {
  it('has all 11 categories from Sprint 15.5', () => {
    expect(EATING_OUT_CATEGORIES).toHaveLength(11);
  });

  it('every category used in the menu is declared', () => {
    const used = new Set(EATING_OUT_MENU.map((e) => e.category));
    for (const c of used) expect(VALID.has(c)).toBe(true);
  });
});
