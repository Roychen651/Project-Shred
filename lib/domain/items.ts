// The unified logged-item schema. ProjectShred.artifact.jsx:819-874 (Sprint 15).
//
// Every logging surface (Restaurant Matrix, Kitchen Hacks, Plate Composer,
// quick-log parser, Smart Swap, Favorites) normalizes through makeLoggedItem()
// into this exact shape.
// `grams` is a PORTION INDEX, not a literal weight, for anything that isn't a raw
// ingredient: 100 = "the portion exactly as originally logged". Displayed macros
// are always base * (grams / 100) via scaleLoggedItem() — never re-derived any
// other way, and never computed in the database (see supabase/migrations/0003).

import { roundNum, genId } from './util';
import type { SlotId } from './slots';

export type { SlotId };
export type ItemSource = 'restaurant' | 'hack' | 'plate' | 'quicklog' | 'favorite' | 'swap' | 'manual';

export interface LoggedItem {
  id: string;
  dateKey: string;
  slotId: SlotId;
  name: string;
  baseCalories: number;
  baseProtein: number;
  baseCarbs: number;
  baseFats: number;
  grams: number;
  isCompleted: boolean;
  source: ItemSource;
}

export interface MakeLoggedItemInput {
  dateKey: string;
  slotId: SlotId;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  source?: ItemSource;
  isCompleted?: boolean;
}

export function makeLoggedItem({
  dateKey,
  slotId,
  name,
  calories,
  protein,
  carbs,
  fats,
  source,
  isCompleted = true,
}: MakeLoggedItemInput): LoggedItem {
  return {
    id: genId('log'),
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

export interface ScaledMacros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function scaleLoggedItem(item: LoggedItem): ScaledMacros {
  const factor = (item.grams ?? 100) / 100;
  return {
    calories: Math.round(item.baseCalories * factor),
    protein: roundNum(item.baseProtein * factor),
    carbs: roundNum(item.baseCarbs * factor),
    fats: roundNum(item.baseFats * factor),
  };
}

export interface MacroTotals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Uncompleted items are excluded — this is the exact rule supabase's
// `daily_totals` view (`where is_completed`) exists to mirror server-side.
export function sumItems(items: LoggedItem[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, item) => {
      if (!item.isCompleted) return acc;
      const m = scaleLoggedItem(item);
      return { kcal: acc.kcal + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fats };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
