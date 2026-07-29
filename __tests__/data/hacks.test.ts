import { describe, it, expect } from 'vitest';
import { HACKS, HACK_CATEGORIES } from '@/lib/data/hacks';

const VALID = new Set(HACK_CATEGORIES.map((c) => c.id));

describe('HACKS — structural integrity', () => {
  it('has exactly 64 entries, matching CLAUDE.md\'s Sprint 15.5 count', () => {
    expect(HACKS).toHaveLength(64);
  });

  it('has no duplicate ids', () => {
    const ids = HACKS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every hack has a valid category, non-empty name/detail/icon, and finite non-negative macros', () => {
    for (const h of HACKS) {
      expect(VALID.has(h.category), `${h.id}: invalid category`).toBe(true);
      expect(h.name.length).toBeGreaterThan(0);
      expect(h.detail.length).toBeGreaterThan(0);
      expect(h.icon.length).toBeGreaterThan(0);
      for (const field of ['kcal', 'protein', 'carbs', 'fat'] as const) {
        expect(Number.isFinite(h[field]), `${h.id}.${field}`).toBe(true);
        expect(h[field]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('HACKS — spot-checks against the artifact source', () => {
  it('שקשוקה (the original Sprint 3 hack)', () => {
    expect(HACKS.find((h) => h.id === 'shakshuka')).toMatchObject({ kcal: 320, protein: 18, fat: 20, carbs: 15, category: 'breakfast' });
  });

  it('פודינג אורז חלבון (the newest, Sprint 15.5 addition)', () => {
    expect(HACKS.find((h) => h.id === 'rice-pudding-protein')).toMatchObject({ kcal: 260, protein: 16, fat: 5, carbs: 40, category: 'dessert' });
  });
});

describe('HACK_CATEGORIES', () => {
  it('has all 4 categories, and every category used in HACKS is declared', () => {
    expect(HACK_CATEGORIES.map((c) => c.id).sort()).toEqual(['breakfast', 'dessert', 'main', 'snack']);
    const used = new Set(HACKS.map((h) => h.category));
    for (const c of used) expect(VALID.has(c)).toBe(true);
  });
});
