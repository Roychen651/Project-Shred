// The core state engine. ProjectShred.artifact.jsx:5754-6169 (the App component's
// state + actions), lifted out of React into a standalone Zustand store.
//
// WHY: the artifact is instant — every log is a setState, with persistence as a
// background concern (a debounced write plus the Sprint 16.2 flush safety net).
// That's already the right architecture; porting it to "every checkbox tap is a
// network round-trip with a spinner" would make the product worse even though no
// product logic changed. So Supabase is a SYNC TARGET here, not the read path:
// the client is the source of truth for what's on screen, mutating optimistically,
// with writes flowing out on the same debounce+flush schedule the artifact used.
// See lib/store/sync-scheduler.ts for that mechanism and lib/store/persist.ts for
// where it writes to.
//
// ABSOLUTE COMPATIBILITY: logItems(specs, slotId) keeps the artifact's exact
// signature and behavior — it is the one function every logging surface in the
// app (Restaurant Matrix, Kitchen Hacks, Plate Composer, quick-log parser, Smart
// Swap, Favorites) calls, and nothing about porting the UI should need to touch it.

import { create } from 'zustand';
import { makeLoggedItem, sumItems, type LoggedItem, type MacroTotals, type SlotId, type ItemSource } from '../domain/items';
import { getCurrentSlotId } from '../domain/slots';
import { dateKey } from '../domain/dates';
import { genUuid } from '../domain/util';
import type { ActivityKey, GoalKey } from '../domain/targets';

// ---------------------------------------------------------------------------
// Profiles. ProjectShred.artifact.jsx:1023-1032, 6067-6087.
// ---------------------------------------------------------------------------
export interface Profile {
  id: string;
  name: string;
  age: number;
  weight: number;
  height: number;
  waist: number;
  activity: ActivityKey;
  goal: GoalKey;
  locked: boolean;
  // Sprint 9 — resolves the id-mismatch this app shipped with since Sprint 6:
  // the artifact (and this port, until now) keyed builtin profiles by the
  // literal strings 'mine'/'guest', but profiles.id in Postgres is a real
  // uuid with 'mine'/'guest' living in a SEPARATE builtin_key column. Once
  // hydrated from the server, `id` for every profile (builtin or custom) IS
  // that real uuid; `builtinKey` is the only remaining way to ask "which one
  // is the non-deletable default to fall back to" — see deleteProfile below.
  builtinKey: 'mine' | 'guest' | null;
}

// ---------------------------------------------------------------------------
// Favorites. ProjectShred.artifact.jsx:4256-4344, 5763-5778.
// ---------------------------------------------------------------------------
export interface Favorite {
  id: string;
  name: string;
  icon: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

// ---------------------------------------------------------------------------
// Exercise logs. ProjectShred.artifact.jsx:5780-5787.
// ---------------------------------------------------------------------------
export interface ExerciseSet {
  weight?: number;
  reps?: number;
}
export type ExerciseLogsByDate = Record<string, Record<string, ExerciseSet>>;

// ---------------------------------------------------------------------------
// Custom ingredients / hacks / restaurants. ProjectShred.artifact.jsx:815-817, 926-928, 915-924.
// ---------------------------------------------------------------------------
export interface CustomIngredient {
  id: string;
  name: string;
  category: string;
  hasCookedVariant: boolean;
  cookedFactor?: number;
  raw: { kcal: number; protein: number; carbs: number; fat: number };
}
export interface CustomHack {
  id: string;
  name: string;
  detail: string;
  icon: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}
export interface PlateOption { id: string; name: string; kcal: number; protein: number; carbs: number; fat: number }
export interface CustomRestaurant {
  id: string;
  name: string;
  type: 'simple' | 'plate3';
  dishes: PlateOption[];
  plateOptions: { veg: PlateOption[]; protein: PlateOption[]; carb: PlateOption[] };
}

// ---------------------------------------------------------------------------
// Metric entries. ProjectShred.artifact.jsx:63-72 (schema), 2587-2662 (MetricTracker).
// ---------------------------------------------------------------------------
export interface MetricEntry {
  id: string;
  date: string;
  weight?: number;
  waist?: number;
}

// ---------------------------------------------------------------------------
// Theme settings. ProjectShred.artifact.jsx:1034.
// ---------------------------------------------------------------------------
export type ThemeMode = 'dark' | 'light';
export type AccentKey = 'emerald' | 'cyan' | 'violet' | 'gold';
export type Density = 'comfortable' | 'compact';

// ---------------------------------------------------------------------------
// Day metadata — the non-derivable half of the old `dailyLogs`. Maps directly to
// the `day_meta` table (supabase/migrations/0001_init.sql), not to a client-side
// recomputation of `dailyLogs` — daily totals are derived from itemsByDate via
// sumItems() wherever needed, exactly like the artifact's live `consumed` object.
// ---------------------------------------------------------------------------
export interface DayMeta {
  workoutDone: boolean;
  workoutDay: string | null;
  manualKcal: number | null;
  manualProtein: number | null;
  manualCarbs: number | null;
  manualFat: number | null;
}
export type DayMetaByDate = Record<string, DayMeta>;

const EMPTY_DAY_META: DayMeta = { workoutDone: false, workoutDay: null, manualKcal: null, manualProtein: null, manualCarbs: null, manualFat: null };

export interface ShredState {
  // Sprint 15 — date-first state engine. `selectedDateKey` is real, persisted-free
  // UI state (the artifact never wrote it to window.storage either — it's re-derived
  // as "today" on every load), but it lives in the store rather than a component
  // because logItems()/logFavorite() close over it, exactly as the artifact's
  // component did (ProjectShred.artifact.jsx:5758, 5797-5808).
  selectedDateKey: string;
  itemsByDate: Record<string, LoggedItem[]>;
  dayMeta: DayMetaByDate;

  // Profiles
  profiles: Record<string, Profile>;
  activeProfileId: string;

  // Sprint 15.11 — favorites
  favorites: Favorite[];

  // Sprint 16 — progressive overload
  exerciseLogs: ExerciseLogsByDate;

  // Sprint 13 — custom ingredients
  customIngredients: CustomIngredient[];

  // Sprint 11 — custom restaurants/Hacks
  customRestaurants: CustomRestaurant[];
  customHacks: CustomHack[];

  // Sprint 10 — metric tracker (weight/waist)
  metricEntries: MetricEntry[];

  // Sprint 7 — theme/accent/density/feedback
  mode: ThemeMode;
  accentKey: AccentKey;
  density: Density;
  feedback: boolean;

  // Sprint 8 — onboarding
  hasSeenOnboarding: boolean;

  // Sprint 9 — AI Coach (provider only; the key is never stored — see
  // supabase/migrations/0001_init.sql's comment on user_settings)
  aiProvider: 'none' | 'groq' | 'openai' | 'huggingface';

  // ----- actions -----

  setSelectedDateKey: (dateKey: string) => void;

  /** Sprint 8 (food/workout data), extended Sprint 9 (profiles/settings) —
   * bulk-replaces the Supabase-backed slices after a successful
   * hydrateShredData() read on sign-in. Never used for anything else (no
   * per-field partial semantics), so it stays a single blunt replace rather
   * than a merge — merging server truth with default-empty local state has no
   * correct general answer, and at sign-in local state IS still the
   * untouched defaults (this app has no local persistence layer of its own
   * to reconcile against — see supabaseSync.ts's file header).
   * profiles/activeProfileId/theme fields are OPTIONAL: if the profiles/
   * user_settings fetch comes back empty (e.g. hydration racing the
   * handle_new_user() trigger on a brand-new account), the caller omits them
   * so the local placeholder defaults stay in place rather than being wiped
   * to nothing. */
  hydrateFromServer: (data: {
    itemsByDate: Record<string, LoggedItem[]>;
    dayMeta: DayMetaByDate;
    exerciseLogs: ExerciseLogsByDate;
    metricEntries: MetricEntry[];
    profiles?: Record<string, Profile>;
    activeProfileId?: string;
    mode?: ThemeMode;
    accentKey?: AccentKey;
    density?: Density;
    feedback?: boolean;
    hasSeenOnboarding?: boolean;
  }) => void;

  /** THE single path every logging surface in the app uses. Signature and
   * behavior are load-bearing — see the file header. Logs to `selectedDateKey`,
   * exactly like the artifact's closure-captured `logItems`. */
  logItems: (specs: LogItemSpec[], slotId: SlotId) => void;
  logFavorite: (fav: Favorite) => void;
  toggleItemCompleted: (dateKey: string, itemId: string) => void;
  deleteItem: (dateKey: string, itemId: string) => void;
  updateItem: (dateKey: string, itemId: string, patch: Partial<LoggedItem>) => void;
  markSlotCompleted: (dateKey: string, slotId: SlotId) => void;

  saveFavorite: (draft: Favorite) => void;
  deleteFavorite: (id: string) => void;

  logExerciseSet: (dateKey: string, exerciseName: string, patch: ExerciseSet) => void;

  saveCustomIngredient: (ing: CustomIngredient) => void;

  updateActiveProfile: (patch: Partial<Profile>) => void;
  addProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  setActiveProfileId: (id: string) => void;

  saveRestaurant: (draft: CustomRestaurant) => void;
  deleteRestaurant: (id: string) => void;
  saveHack: (draft: CustomHack) => void;
  deleteHack: (id: string) => void;

  addMetricEntry: (entry: Omit<MetricEntry, 'id'>) => void;

  setWorkoutActivity: (dateKey: string, done: boolean, dayKey: string | null) => void;
  setManualDayOverride: (dateKey: string, patch: Partial<Pick<DayMeta, 'manualKcal' | 'manualProtein' | 'manualCarbs' | 'manualFat'>>) => void;

  setMode: (mode: ThemeMode) => void;
  setAccentKey: (key: AccentKey) => void;
  setDensity: (density: Density) => void;
  setFeedback: (on: boolean) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setAiProvider: (provider: ShredState['aiProvider']) => void;

  // ----- derived reads (mirror the artifact's inline `consumed`/`dayItems`) -----
  dayItems: (dateKey: string) => LoggedItem[];
  consumedForDate: (dateKey: string) => MacroTotals;
  dayMetaForDate: (dateKey: string) => DayMeta;
}

export interface LogItemSpec {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  source?: ItemSource;
}

// The pre-hydration placeholder shown for the instant between first paint and
// hydrateShredData() resolving — 'mine'/'guest' string keys here are purely
// local and get fully replaced by the server's real uuid-keyed rows once
// hydration lands (see hydrateFromServer below). Never persisted as-is.
const DEFAULT_PROFILES: Record<string, Profile> = {
  mine: { id: 'mine', name: 'הפרופיל שלי', age: 28, weight: 75, height: 175, waist: 90, activity: 'office', goal: 'maintain', locked: true, builtinKey: 'mine' },
  guest: { id: 'guest', name: 'פרופיל אורח / חבר', age: 30, weight: 78, height: 175, waist: 92, activity: 'sedentary', goal: 'maintain', locked: true, builtinKey: 'guest' },
};

const DEFAULT_FAVORITES: Favorite[] = [
  { id: 'fav-protein-pudding', name: 'מעדן חלבון', icon: '🥤', kcal: 140, protein: 15, carbs: 13, fat: 3 },
  { id: 'fav-protein-shake', name: 'שייק אבקה + מים', icon: '🥤', kcal: 120, protein: 25, carbs: 3, fat: 1.5 },
  { id: 'fav-eggs', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5 },
];

export function createShredStore(initial?: Partial<ShredState>) {
  return create<ShredState>()((set, get) => ({
    selectedDateKey: dateKey(new Date()),
    itemsByDate: {},
    dayMeta: {},
    profiles: DEFAULT_PROFILES,
    activeProfileId: 'mine',
    favorites: DEFAULT_FAVORITES,
    exerciseLogs: {},
    customIngredients: [],
    customRestaurants: [],
    customHacks: [],
    metricEntries: [],
    // Sprint 15 — Sprint 14's "permanent forced dark mode" was reverted: the
    // person who requested it changed direction after seeing reference
    // designs that were light-mode (warm neutrals, editorial typography).
    // Light is the default again; the toggle (app/page.tsx) and hydration
    // (below) both restore full user control over this.
    mode: 'light',
    accentKey: 'emerald',
    density: 'comfortable',
    feedback: true,
    hasSeenOnboarding: false,
    aiProvider: 'none',
    ...initial,

    setSelectedDateKey: (newDateKey) => set({ selectedDateKey: newDateKey }),

    // Sprint 15 — `data.mode` round-trips normally again. Sprint 14 had this
    // deliberately dropped to lock dark mode permanently; that direction was
    // reverted (see the `mode: 'light'` note above), so a saved preference
    // should apply on load like every other setting.
    hydrateFromServer: (data) => set({
      itemsByDate: data.itemsByDate,
      dayMeta: data.dayMeta,
      exerciseLogs: data.exerciseLogs,
      metricEntries: data.metricEntries,
      ...(data.profiles ? { profiles: data.profiles } : {}),
      ...(data.activeProfileId ? { activeProfileId: data.activeProfileId } : {}),
      ...(data.mode ? { mode: data.mode } : {}),
      ...(data.accentKey ? { accentKey: data.accentKey } : {}),
      ...(data.density ? { density: data.density } : {}),
      ...(data.feedback !== undefined ? { feedback: data.feedback } : {}),
      ...(data.hasSeenOnboarding !== undefined ? { hasSeenOnboarding: data.hasSeenOnboarding } : {}),
    }),

    logItems: (specs, slotId) => set((state) => {
      const dk = state.selectedDateKey;
      const newOnes = specs.map((s) => makeLoggedItem({ dateKey: dk, slotId, ...s }));
      return { itemsByDate: { ...state.itemsByDate, [dk]: [...(state.itemsByDate[dk] || []), ...newOnes] } };
    }),

    logFavorite: (fav) => {
      const state = get();
      const items = state.itemsByDate[state.selectedDateKey] || [];
      const slotId = getCurrentSlotId(items);
      get().logItems([{ name: fav.name, calories: fav.kcal, protein: fav.protein, carbs: fav.carbs, fats: fav.fat, source: 'favorite' }], slotId);
    },

    toggleItemCompleted: (dk, itemId) => set((state) => ({
      itemsByDate: {
        ...state.itemsByDate,
        [dk]: (state.itemsByDate[dk] || []).map((it) => (it.id === itemId ? { ...it, isCompleted: !it.isCompleted } : it)),
      },
    })),

    deleteItem: (dk, itemId) => set((state) => ({
      itemsByDate: { ...state.itemsByDate, [dk]: (state.itemsByDate[dk] || []).filter((it) => it.id !== itemId) },
    })),

    updateItem: (dk, itemId, patch) => set((state) => ({
      itemsByDate: {
        ...state.itemsByDate,
        [dk]: (state.itemsByDate[dk] || []).map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
      },
    })),

    markSlotCompleted: (dk, slotId) => set((state) => ({
      itemsByDate: {
        ...state.itemsByDate,
        [dk]: (state.itemsByDate[dk] || []).map((it) => (it.slotId === slotId ? { ...it, isCompleted: true } : it)),
      },
    })),

    saveFavorite: (draft) => set((state) => {
      const exists = state.favorites.some((f) => f.id === draft.id);
      return { favorites: exists ? state.favorites.map((f) => (f.id === draft.id ? draft : f)) : [...state.favorites, draft] };
    }),
    deleteFavorite: (id) => set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),

    logExerciseSet: (dk, exerciseName, patch) => set((state) => ({
      exerciseLogs: {
        ...state.exerciseLogs,
        [dk]: { ...(state.exerciseLogs[dk] || {}), [exerciseName]: { ...(state.exerciseLogs[dk]?.[exerciseName] || {}), ...patch } },
      },
    })),

    saveCustomIngredient: (ing) => set((state) => ({ customIngredients: [...state.customIngredients, ing] })),

    updateActiveProfile: (patch) => set((state) => ({
      profiles: { ...state.profiles, [state.activeProfileId]: { ...state.profiles[state.activeProfileId], ...patch } },
    })),
    addProfile: (name) => set((state) => {
      const id = genUuid();
      return {
        profiles: { ...state.profiles, [id]: { id, name, age: 28, weight: 75, height: 175, waist: 90, activity: 'office', goal: 'maintain', locked: false, builtinKey: null } },
        activeProfileId: id,
      };
    }),
    deleteProfile: (id) => set((state) => {
      const next = { ...state.profiles };
      delete next[id];
      // Sprint 9: 'mine' is no longer a reliable literal key post-hydration —
      // it's whichever profile's builtinKey says so, and its real id is a uuid.
      const mine = Object.values(next).find((p) => p.builtinKey === 'mine');
      const fallbackId = mine?.id ?? Object.keys(next)[0] ?? state.activeProfileId;
      return { profiles: next, activeProfileId: state.activeProfileId === id ? fallbackId : state.activeProfileId };
    }),
    setActiveProfileId: (id) => set({ activeProfileId: id }),

    saveRestaurant: (draft) => set((state) => {
      const exists = state.customRestaurants.some((r) => r.id === draft.id);
      return { customRestaurants: exists ? state.customRestaurants.map((r) => (r.id === draft.id ? draft : r)) : [...state.customRestaurants, draft] };
    }),
    deleteRestaurant: (id) => set((state) => ({ customRestaurants: state.customRestaurants.filter((r) => r.id !== id) })),
    saveHack: (draft) => set((state) => {
      const exists = state.customHacks.some((h) => h.id === draft.id);
      return { customHacks: exists ? state.customHacks.map((h) => (h.id === draft.id ? draft : h)) : [...state.customHacks, draft] };
    }),
    deleteHack: (id) => set((state) => ({ customHacks: state.customHacks.filter((h) => h.id !== id) })),

    addMetricEntry: (entry) => set((state) => ({ metricEntries: [...state.metricEntries, { ...entry, id: genUuid() }] })),

    setWorkoutActivity: (dk, done, dayKey) => set((state) => ({
      dayMeta: { ...state.dayMeta, [dk]: { ...(state.dayMeta[dk] || EMPTY_DAY_META), workoutDone: done, workoutDay: dayKey } },
    })),
    setManualDayOverride: (dk, patch) => set((state) => ({
      dayMeta: { ...state.dayMeta, [dk]: { ...(state.dayMeta[dk] || EMPTY_DAY_META), ...patch } },
    })),

    setMode: (mode) => set({ mode }),
    setAccentKey: (accentKey) => set({ accentKey }),
    setDensity: (density) => set({ density }),
    setFeedback: (feedback) => set({ feedback }),
    setHasSeenOnboarding: (hasSeenOnboarding) => set({ hasSeenOnboarding }),
    setAiProvider: (aiProvider) => set({ aiProvider }),

    dayItems: (dk) => get().itemsByDate[dk] || [],
    consumedForDate: (dk) => sumItems(get().itemsByDate[dk] || []),
    dayMetaForDate: (dk) => get().dayMeta[dk] || EMPTY_DAY_META,
  }));
}

// The default store instance the app uses. Tests that need isolated state should
// call createShredStore() directly instead of importing this singleton, so
// parallel test files never see each other's mutations.
export const useShredStore = createShredStore();
