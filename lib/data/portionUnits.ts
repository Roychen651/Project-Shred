// Generic volume/piece → gram approximations. ProjectShred.artifact.jsx:777-791
// (Sprint 13, expanded Sprint 15.24). A cup of rice and a cup of olive oil don't
// actually weigh the same — a deliberate, documented simplification that trades
// perfect per-ingredient density for a simple, transparent, universally-usable
// system, not an oversight.
export interface PortionUnit {
  id: string;
  label: string;
  shortLabel: string;
  gramsPerUnit: number;
  step: number;
  defaultQty: number;
}

export const PORTION_UNITS: PortionUnit[] = [
  { id: 'gram', label: 'גרם', shortLabel: 'גר׳', gramsPerUnit: 1, step: 5, defaultQty: 100 },
  { id: 'ml', label: 'מ״ל', shortLabel: 'מ״ל', gramsPerUnit: 1, step: 5, defaultQty: 100 },
  { id: 'tbsp', label: 'כף', shortLabel: 'כף', gramsPerUnit: 15, step: 0.5, defaultQty: 1 },
  { id: 'tsp', label: 'כפית', shortLabel: 'כפית', gramsPerUnit: 5, step: 0.5, defaultQty: 1 },
  { id: 'pinch', label: 'קורט', shortLabel: 'קורט', gramsPerUnit: 0.5, step: 1, defaultQty: 1 },
  { id: 'cup', label: 'כוס', shortLabel: 'כוס', gramsPerUnit: 200, step: 0.25, defaultQty: 1 },
  { id: 'piece', label: 'יחידה', shortLabel: 'יח׳', gramsPerUnit: 100, step: 1, defaultQty: 1 },
  { id: 'handful', label: 'חופן', shortLabel: 'חופן', gramsPerUnit: 30, step: 0.5, defaultQty: 1 },
  { id: 'slice', label: 'פרוסה', shortLabel: 'פרוסה', gramsPerUnit: 25, step: 0.5, defaultQty: 1 },
  { id: 'can', label: 'קופסה/פחית', shortLabel: 'קופסה', gramsPerUnit: 150, step: 0.25, defaultQty: 1 },
  { id: 'palm', label: 'כף יד', shortLabel: 'כף יד', gramsPerUnit: 90, step: 0.5, defaultQty: 1 },
  { id: 'plate', label: 'צלחת', shortLabel: 'צלחת', gramsPerUnit: 380, step: 0.25, defaultQty: 1 },
];
