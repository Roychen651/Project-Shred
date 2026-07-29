// Smart Swap recommendation engine. ProjectShred.artifact.jsx:930-1004 (Sprint 11).
//
// buildFoodLibrary() enumerates every combination the built-in Restaurant Matrix builders can
// produce, plus custom restaurants, Kitchen Hacks and Eating-Out items; findBestMatches()
// ranks the resulting library by distance from the day's remaining calorie/protein gap.
//
// DEVIATION FROM THE ARTIFACT, DELIBERATE: the artifact's buildFoodLibrary() reads
// SHUMSHUM/CHICKEN_STATION/GOOMBA/KANSAI/HACKS/EATING_OUT_MENU as module-level
// constants. Those 279+64+73-item reference tables are ported in milestone 3
// (lib/data/), not this one — so here they're function parameters instead of
// module imports. The algorithm — what combinations get enumerated and how they're
// scored — is unchanged; only where the data comes from is different. Once
// lib/data/ exists, the app wires the real constants in at the call site; this
// file needs no further changes.

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface PlateOption extends Macros {
  id: string;
  name: string;
}

export interface ShumshumData {
  veg: PlateOption[];
  protein: PlateOption[];
  carb: PlateOption[];
}

// Chicken Station's veg component is a single fixed side (not a pick-list) —
// matches the artifact, where `CHICKEN_STATION.veg` is used directly as one item.
export interface ChickenStationData {
  protein: PlateOption[];
  carb: PlateOption[];
  veg: PlateOption;
}

export type GoombaData = PlateOption[];

// rice/veg/sauce are fixed, unnamed components in the artifact's own KANSAI
// constant (e.g. `rice: { kcal: 150, protein: 3, fat: 0, carbs: 33 }` — no id/name),
// and buildFoodLibrary() only ever reads their macros, never an id or name off
// them. Typing them as bare Macros rather than PlateOption matches the real data
// shape instead of silently requiring fields that don't exist on it.
export interface KansaiData {
  protein: PlateOption[];
  rice: Macros;
  veg: Macros;
  sauce: Macros;
}

export interface HackData {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface EatingOutItem {
  id: string;
  name: string;
  category: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CustomRestaurant {
  id: string;
  name: string;
  type: 'simple' | 'plate3';
  dishes: PlateOption[];
  plateOptions: { veg: PlateOption[]; protein: PlateOption[]; carb: PlateOption[] };
}

export interface StaticFoodData {
  shumshum: ShumshumData;
  chickenStation: ChickenStationData;
  goomba: GoombaData;
  kansai: KansaiData;
  hacks: HackData[];
  eatingOutMenu: EatingOutItem[];
}

export interface FoodLibraryItem {
  id: string;
  name: string;
  source: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function buildFoodLibrary(
  customRestaurants: CustomRestaurant[],
  customHacks: HackData[],
  staticData: StaticFoodData
): FoodLibraryItem[] {
  const { shumshum, chickenStation, goomba, kansai, hacks, eatingOutMenu } = staticData;
  const lib: FoodLibraryItem[] = [];

  shumshum.veg.forEach((v) => shumshum.protein.forEach((p) => shumshum.carb.forEach((c) => {
    lib.push({
      id: `shumshum-${v.id}-${p.id}-${c.id}`, name: `שומשום · ${p.name}`, source: 'שומשום',
      kcal: v.kcal + p.kcal + c.kcal, protein: v.protein + p.protein + c.protein,
      carbs: v.carbs + p.carbs + c.carbs, fat: v.fat + p.fat + c.fat,
    });
  })));

  chickenStation.protein.forEach((p) => chickenStation.carb.forEach((c) => {
    const veg = chickenStation.veg;
    lib.push({
      id: `chicken-${p.id}-${c.id}`, name: `צ'יקן סטיישן · ${p.name}`, source: "צ'יקן סטיישן",
      kcal: p.kcal + c.kcal + veg.kcal, protein: p.protein + c.protein + veg.protein,
      carbs: p.carbs + c.carbs + veg.carbs, fat: p.fat + c.fat + veg.fat,
    });
  }));

  goomba.forEach((g) => lib.push({ id: `goomba-${g.id}`, name: `גומבה · ${g.name}`, source: 'גומבה', kcal: g.kcal, protein: g.protein, carbs: g.carbs, fat: g.fat }));

  kansai.protein.forEach((p) => {
    const { rice, veg, sauce } = kansai;
    lib.push({
      id: `kansai-${p.id}`, name: `קנסאי · ${p.name}`, source: 'קנסאי',
      kcal: p.kcal + rice.kcal + veg.kcal + sauce.kcal, protein: p.protein + rice.protein + veg.protein + sauce.protein,
      carbs: p.carbs + rice.carbs + veg.carbs + sauce.carbs, fat: p.fat + rice.fat + veg.fat + sauce.fat,
    });
  });

  [...hacks, ...customHacks].forEach((h) => lib.push({ id: `hack-${h.id}`, name: h.name, source: 'Kitchen Hack', kcal: Number(h.kcal) || 0, protein: Number(h.protein) || 0, carbs: Number(h.carbs) || 0, fat: Number(h.fat) || 0 }));

  eatingOutMenu.forEach((e) => lib.push({ id: `eatingout-${e.id}`, name: e.name, source: 'אוכל בחוץ', kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat }));

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

export interface ScoredFoodLibraryItem extends FoodLibraryItem {
  matchScore: number;
}

// Ranks the food library by closeness to the remaining calorie/protein gap for the day.
export function findBestMatches(
  library: FoodLibraryItem[],
  remainingKcal: number,
  remainingProtein: number,
  n = 3
): ScoredFoodLibraryItem[] {
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
