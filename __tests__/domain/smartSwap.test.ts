import { describe, it, expect } from 'vitest';
import { buildFoodLibrary, findBestMatches, type StaticFoodData, type FoodLibraryItem } from '@/lib/domain/smartSwap';

describe('findBestMatches', () => {
  const library: FoodLibraryItem[] = [
    { id: 'a', name: 'A', source: 'x', kcal: 500, protein: 40, carbs: 0, fat: 0 },
    { id: 'b', name: 'B', source: 'x', kcal: 300, protein: 20, carbs: 0, fat: 0 },
    { id: 'c', name: 'C', source: 'x', kcal: 800, protein: 60, carbs: 0, fat: 0 },
  ];

  it('ranks by distance from the remaining gap and returns the closest n', () => {
    // a: diff (0,0) -> score 0. b: diff (200,20) -> 200/40+20/6 = 8.333. c: diff (300,20) -> 300/40+20/6 = 10.833
    const top2 = findBestMatches(library, 500, 40, 2);
    expect(top2.map((i) => i.id)).toEqual(['a', 'b']);
    expect(top2[0].matchScore).toBe(0);
    expect(top2[1].matchScore).toBeCloseTo(8.3333, 3);
  });

  it('floors the target at 50kcal / 5g protein so a near-zero remaining budget does not skew scoring', () => {
    // targetKcal=max(10,50)=50, targetProtein=max(1,5)=5
    // a: (450,35) -> 450/40+35/6 = 17.083. b: (250,15) -> 250/40+15/6 = 8.75. c: (750,55) -> 750/40+55/6 = 27.917
    const ranked = findBestMatches(library, 10, 1, 3);
    expect(ranked.map((i) => i.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('buildFoodLibrary', () => {
  // Small synthetic fixture standing in for the real 279/64/73-item reference
  // data, which lib/data/ ports in milestone 3. The algorithm — what gets
  // enumerated, and how — is identical to the artifact; only the data source
  // changed from a module constant to a parameter (see the file-level comment
  // in lib/domain/smartSwap.ts for why).
  const opt = (id: string, kcal: number, protein = 0, carbs = 0, fat = 0) => ({ id, name: id, kcal, protein, carbs, fat });

  const staticData: StaticFoodData = {
    shumshum: { veg: [opt('v1', 10)], protein: [opt('p1', 200, 30)], carb: [opt('c1', 150, 5)] },
    chickenStation: { protein: [opt('cp1', 250, 40)], carb: [opt('cc1', 150)], veg: opt('cv', 20) },
    goomba: [opt('g1', 400, 25)],
    kansai: { protein: [opt('kp1', 300, 35)], rice: opt('kr', 150), veg: opt('kv', 10), sauce: opt('ks', 50) },
    hacks: [{ id: 'h1', name: 'Hack1', kcal: 350, protein: 20, carbs: 30, fat: 10 }],
    eatingOutMenu: [{ id: 'e1', name: 'Eat1', category: 'pizza', kcal: 300, protein: 12, carbs: 36, fat: 10 }],
  };

  it('enumerates the shumshum veg x protein x carb combination with summed macros', () => {
    const lib = buildFoodLibrary([], [], staticData);
    const shumshum = lib.find((i) => i.id === 'shumshum-v1-p1-c1');
    expect(shumshum).toMatchObject({ kcal: 360, protein: 35, name: 'שומשום · p1' }); // 10+200+150, 0+30+5
  });

  it('includes chicken station (single fixed veg), goomba, kansai, hacks and eating-out items', () => {
    const lib = buildFoodLibrary([], [], staticData);
    expect(lib.find((i) => i.id === 'chicken-cp1-cc1')).toMatchObject({ kcal: 420 }); // 250+150+20
    expect(lib.find((i) => i.id === 'goomba-g1')).toMatchObject({ kcal: 400 });
    expect(lib.find((i) => i.id === 'kansai-kp1')).toMatchObject({ kcal: 510 }); // 300+150+10+50
    expect(lib.find((i) => i.id === 'hack-h1')).toMatchObject({ kcal: 350, source: 'Kitchen Hack' });
    expect(lib.find((i) => i.id === 'eatingout-e1')).toMatchObject({ kcal: 300, source: 'אוכל בחוץ' });
  });

  it('includes custom hacks alongside built-in ones', () => {
    const customHack = { id: 'ch1', name: 'CustomHack', kcal: 500, protein: 30, carbs: 40, fat: 15 };
    const lib = buildFoodLibrary([], [customHack], staticData);
    expect(lib.find((i) => i.id === 'hack-ch1')).toMatchObject({ kcal: 500 });
  });

  it('a "simple" custom restaurant contributes one entry per named dish', () => {
    const restaurant = {
      id: 'r1', name: 'MyPlace', type: 'simple' as const,
      dishes: [{ id: 'd1', name: 'Dish1', kcal: 600, protein: 45, carbs: 50, fat: 20 }],
      plateOptions: { veg: [], protein: [], carb: [] },
    };
    const lib = buildFoodLibrary([restaurant], [], staticData);
    expect(lib.find((i) => i.id === 'custom-r1-d1')).toMatchObject({ kcal: 600, source: 'MyPlace' });
  });

  it('a "plate3" custom restaurant enumerates its own veg x protein x carb combinations', () => {
    const restaurant = {
      id: 'r2', name: 'MyPlate', type: 'plate3' as const,
      dishes: [],
      plateOptions: {
        veg: [opt('rv', 15)],
        protein: [opt('rp', 220, 32)],
        carb: [opt('rc', 130, 4)],
      },
    };
    const lib = buildFoodLibrary([restaurant], [], staticData);
    const item = lib.find((i) => i.id === 'custom-r2-rv-rp-rc');
    expect(item).toMatchObject({ kcal: 365, protein: 36 }); // 15+220+130, 0+32+4
  });

  it('skips a plate3 option with an empty name (matches the artifact\'s guard)', () => {
    const restaurant = {
      id: 'r3', name: 'Partial', type: 'plate3' as const,
      dishes: [],
      plateOptions: { veg: [opt('', 0)], protein: [opt('rp', 100)], carb: [opt('rc', 100)] },
    };
    const lib = buildFoodLibrary([restaurant], [], staticData);
    expect(lib.some((i) => i.source === 'Partial')).toBe(false);
  });
});
