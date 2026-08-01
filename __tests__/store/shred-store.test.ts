import { describe, it, expect, beforeEach } from 'vitest';
import { createShredStore, type ShredState } from '@/lib/store/shred-store';
import type { UseBoundStore, StoreApi } from 'zustand';

let store: UseBoundStore<StoreApi<ShredState>>;

beforeEach(() => {
  // A fresh store per test — createShredStore(), never the shared useShredStore
  // singleton, so tests never see each other's mutations.
  store = createShredStore({ selectedDateKey: '2026-07-20' });
});

describe('logItems — the single path every logging surface uses', () => {
  it('normalizes specs into logged items on the selected date, at the given slot', () => {
    store.getState().logItems([{ name: 'Chicken', calories: 500, protein: 40, carbs: 10, fats: 12, source: 'plate' }], 'lunch');
    const items = store.getState().dayItems('2026-07-20');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Chicken', slotId: 'lunch', dateKey: '2026-07-20', baseCalories: 500, grams: 100, isCompleted: true });
  });

  it('logs multiple specs in one call and appends to any items already logged that day', () => {
    store.getState().logItems([{ name: 'A', calories: 100, protein: 10, carbs: 5, fats: 2 }], 'breakfast');
    store.getState().logItems([{ name: 'B', calories: 200, protein: 20, carbs: 5, fats: 4 }, { name: 'C', calories: 300, protein: 15, carbs: 30, fats: 6 }], 'lunch');
    expect(store.getState().dayItems('2026-07-20').map((i) => i.name)).toEqual(['A', 'B', 'C']);
  });

  it('only ever writes to selectedDateKey, never leaks into another date', () => {
    store.getState().logItems([{ name: 'A', calories: 100, protein: 10, carbs: 5, fats: 2 }], 'breakfast');
    expect(store.getState().dayItems('2026-07-21')).toEqual([]);
  });
});

describe('toggle / delete / update — fully reversible per-item control (Sprint 15)', () => {
  beforeEach(() => {
    store.getState().logItems([{ name: 'X', calories: 400, protein: 30, carbs: 20, fats: 10 }], 'dinner');
  });

  it('toggleItemCompleted flips isCompleted with no shared slot state to desync', () => {
    const id = store.getState().dayItems('2026-07-20')[0].id;
    store.getState().toggleItemCompleted('2026-07-20', id);
    expect(store.getState().dayItems('2026-07-20')[0].isCompleted).toBe(false);
    store.getState().toggleItemCompleted('2026-07-20', id);
    expect(store.getState().dayItems('2026-07-20')[0].isCompleted).toBe(true);
  });

  it('deleteItem removes the item outright; totals update automatically since they are always a live sum', () => {
    const id = store.getState().dayItems('2026-07-20')[0].id;
    store.getState().deleteItem('2026-07-20', id);
    expect(store.getState().dayItems('2026-07-20')).toEqual([]);
    expect(store.getState().consumedForDate('2026-07-20')).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });

  it('updateItem handles both portion (grams) and slot reassignment through the same path', () => {
    const id = store.getState().dayItems('2026-07-20')[0].id;
    store.getState().updateItem('2026-07-20', id, { grams: 150, slotId: 'preworkout' });
    const item = store.getState().dayItems('2026-07-20')[0];
    expect(item.grams).toBe(150);
    expect(item.slotId).toBe('preworkout');
  });
});

describe('consumedForDate — a live sum, exactly like the artifact\'s `consumed` object', () => {
  it('excludes uncompleted items from the total', () => {
    store.getState().logItems([{ name: 'A', calories: 500, protein: 40, carbs: 50, fats: 10 }], 'lunch');
    store.getState().logItems([{ name: 'B', calories: 900, protein: 90, carbs: 90, fats: 30 }], 'dinner');
    const items = store.getState().dayItems('2026-07-20');
    store.getState().toggleItemCompleted('2026-07-20', items[1].id); // uncomplete B
    expect(store.getState().consumedForDate('2026-07-20')).toEqual({ kcal: 500, protein: 40, carbs: 50, fat: 10 });
  });
});

describe('logFavorite — one tap, zero decisions', () => {
  it('logs to whichever slot getCurrentSlotId picks for the current time, with source "favorite"', () => {
    // No items logged yet on the selected date, so getCurrentSlotId falls to the
    // first slot whose time is within the look-back window of "now" — the exact
    // slot depends on wall-clock time, so just assert the mechanics that don't.
    store.getState().logFavorite({ id: 'fav-1', name: 'Protein Pudding', icon: '🥤', kcal: 140, protein: 15, carbs: 13, fat: 3 });
    const items = store.getState().dayItems('2026-07-20');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ name: 'Protein Pudding', source: 'favorite', baseCalories: 140 });
  });

  // Sprint 42 — "logged 3 eggs by default, wanted 2, it was rigid." A
  // favorite's unitCount is the baseline its stored macros represent;
  // logging a different qty scales every macro by qty/unitCount.
  it('with no unitCount and no qty argument, logs the stored macros unscaled (backward compatible)', () => {
    store.getState().logFavorite({ id: 'fav-1', name: 'Shake', icon: '🥤', kcal: 120, protein: 25, carbs: 3, fat: 1.5 });
    const [item] = store.getState().dayItems('2026-07-20');
    expect(item).toMatchObject({ name: 'Shake', baseCalories: 120, baseProtein: 25 });
  });

  it('logging fewer units than the default (3 eggs -> 2) scales every macro down proportionally', () => {
    store.getState().logFavorite({ id: 'fav-eggs', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5, unitCount: 3 }, 2);
    const [item] = store.getState().dayItems('2026-07-20');
    // makeLoggedItem rounds calories to a whole number and other macros to
    // one decimal (roundNum) — match that same rounding, not the raw division.
    expect(item.baseCalories).toBe(Math.round((233 * 2) / 3));
    expect(item.baseProtein).toBeCloseTo((19 * 2) / 3, 1);
    expect(item.name).toBe('3 ביצים (2 מתוך 3)');
  });

  it('logging exactly the default unitCount does not append a quantity suffix to the name', () => {
    store.getState().logFavorite({ id: 'fav-eggs', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5, unitCount: 3 }, 3);
    const [item] = store.getState().dayItems('2026-07-20');
    expect(item.name).toBe('3 ביצים');
    expect(item.baseCalories).toBeCloseTo(233, 5);
  });

  it('logging MORE than the default (e.g. a double portion) scales up the same way', () => {
    store.getState().logFavorite({ id: 'fav-eggs', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5, unitCount: 3 }, 6);
    const [item] = store.getState().dayItems('2026-07-20');
    expect(item.baseCalories).toBeCloseTo(233 * 2, 5);
    expect(item.name).toBe('3 ביצים (6 מתוך 3)');
  });
});

describe('markSlotCompleted', () => {
  it('completes every item in a slot, leaving other slots untouched', () => {
    store.getState().logItems([{ name: 'A', calories: 100, protein: 10, carbs: 10, fats: 5 }, { name: 'B', calories: 200, protein: 20, carbs: 10, fats: 5 }], 'breakfast');
    store.getState().logItems([{ name: 'C', calories: 300, protein: 30, carbs: 10, fats: 5 }], 'lunch');
    const [a, b] = store.getState().dayItems('2026-07-20');
    store.getState().toggleItemCompleted('2026-07-20', a.id);
    store.getState().toggleItemCompleted('2026-07-20', b.id); // both breakfast items now uncompleted
    store.getState().markSlotCompleted('2026-07-20', 'breakfast');
    const items = store.getState().dayItems('2026-07-20');
    expect(items.filter((i) => i.slotId === 'breakfast').every((i) => i.isCompleted)).toBe(true);
    expect(items.find((i) => i.slotId === 'lunch')?.isCompleted).toBe(true); // untouched, was already true
  });
});

describe('favorites CRUD', () => {
  it('seeds the 3 default favorites', () => {
    expect(store.getState().favorites).toHaveLength(3);
  });

  it('saveFavorite inserts a new favorite or updates an existing one by id', () => {
    store.getState().saveFavorite({ id: 'new-1', name: 'New', icon: '⭐', kcal: 100, protein: 10, carbs: 10, fat: 5 });
    expect(store.getState().favorites).toHaveLength(4);
    store.getState().saveFavorite({ id: 'new-1', name: 'Renamed', icon: '⭐', kcal: 100, protein: 10, carbs: 10, fat: 5 });
    expect(store.getState().favorites).toHaveLength(4);
    expect(store.getState().favorites.find((f) => f.id === 'new-1')?.name).toBe('Renamed');
  });

  it('deleteFavorite removes by id', () => {
    store.getState().deleteFavorite('fav-eggs');
    expect(store.getState().favorites.some((f) => f.id === 'fav-eggs')).toBe(false);
  });
});

describe('profiles', () => {
  it('deleting the active profile falls back to "mine", matching the artifact', () => {
    store.getState().addProfile('Custom');
    const customId = store.getState().activeProfileId;
    expect(customId).not.toBe('mine');
    store.getState().deleteProfile(customId);
    expect(store.getState().activeProfileId).toBe('mine');
    expect(store.getState().profiles[customId]).toBeUndefined();
  });

  it('deleting a non-active profile does not change activeProfileId', () => {
    store.getState().setActiveProfileId('mine');
    store.getState().deleteProfile('guest');
    expect(store.getState().activeProfileId).toBe('mine');
  });

  it('updateActiveProfile patches only the currently active profile', () => {
    store.getState().updateActiveProfile({ weight: 90 });
    expect(store.getState().profiles.mine.weight).toBe(90);
    expect(store.getState().profiles.guest.weight).toBe(78);
  });
});

describe('exercise logs', () => {
  it('logExerciseSet merges into any existing entry for the same date/exercise', () => {
    store.getState().logExerciseSet('2026-07-20', 'סקוואט גב', { weight: 100 });
    store.getState().logExerciseSet('2026-07-20', 'סקוואט גב', { reps: 5 });
    expect(store.getState().exerciseLogs['2026-07-20']['סקוואט גב']).toEqual({ weight: 100, reps: 5 });
  });
});

describe('day meta — workout flags and DayEditor-style manual overrides', () => {
  it('setWorkoutActivity and setManualDayOverride both upsert independently', () => {
    store.getState().setWorkoutActivity('2026-07-19', true, 'A1');
    store.getState().setManualDayOverride('2026-07-19', { manualKcal: 1800 });
    expect(store.getState().dayMetaForDate('2026-07-19')).toEqual({
      workoutDone: true, workoutDay: 'A1', manualKcal: 1800, manualProtein: null, manualCarbs: null, manualFat: null,
    });
  });

  it('an untouched date returns the empty default, not undefined', () => {
    expect(store.getState().dayMetaForDate('2099-01-01')).toEqual({
      workoutDone: false, workoutDay: null, manualKcal: null, manualProtein: null, manualCarbs: null, manualFat: null,
    });
  });
});
