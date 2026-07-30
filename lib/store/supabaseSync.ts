// Sprint 8 — the real read (hydrate) + write (persist) halves of Supabase sync
// for the four tables that don't depend on the profiles id-reconciliation
// problem (see the file-level note in wireSync.ts and the Sprint 8 CLAUDE.md
// summary for why profiles/user_settings/favorites/custom_* are deliberately
// NOT wired here yet): logged_items, day_meta, exercise_logs, metric_entries.
// All four are keyed by user_id alone — no dependency on which profile is
// active — so they can sync correctly without solving that problem first.
//
// IMPORTANT HONESTY NOTE, same as Milestone 2's persist.ts stub: this has been
// written to match supabase/migrations/*.sql exactly and passes typecheck/
// build, but there is no live Supabase project reachable from this sandbox
// (no .env.local, no network path to a real project) to run it against. It
// has NOT been exercised against a real database. Treat it as reviewed-but-
// unverified until tested with real credentials.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoggedItem, SlotId, ItemSource } from '../domain/items';
import type { DayMeta, DayMetaByDate, ExerciseLogsByDate, ExerciseSet, MetricEntry } from './shred-store';

// ---------------------------------------------------------------------------
// Row <-> client shape mapping. Deliberately explicit (no generic object-key
// transformer) so a schema drift shows up as a type error here, not a silent
// runtime mismatch.
// ---------------------------------------------------------------------------
interface LoggedItemRow {
  id: string;
  date_key: string;
  slot_id: SlotId;
  name: string;
  base_calories: number;
  base_protein: number;
  base_carbs: number;
  base_fats: number;
  grams: number;
  is_completed: boolean;
  source: ItemSource;
}

interface DayMetaRow {
  date_key: string;
  workout_done: boolean;
  workout_day: string | null;
  manual_kcal: number | null;
  manual_protein: number | null;
  manual_carbs: number | null;
  manual_fat: number | null;
}

interface ExerciseLogRow {
  date_key: string;
  exercise_name: string;
  weight: number | null;
  reps: number | null;
}

interface MetricEntryRow {
  id: string;
  date: string;
  weight: number | null;
  waist: number | null;
}

function itemToRow(item: LoggedItem): LoggedItemRow {
  return {
    id: item.id,
    date_key: item.dateKey,
    slot_id: item.slotId,
    name: item.name,
    base_calories: item.baseCalories,
    base_protein: item.baseProtein,
    base_carbs: item.baseCarbs,
    base_fats: item.baseFats,
    grams: item.grams,
    is_completed: item.isCompleted,
    source: item.source,
  };
}

function rowToItem(row: LoggedItemRow): LoggedItem {
  return {
    id: row.id,
    dateKey: row.date_key,
    slotId: row.slot_id,
    name: row.name,
    baseCalories: row.base_calories,
    baseProtein: row.base_protein,
    baseCarbs: row.base_carbs,
    baseFats: row.base_fats,
    grams: row.grams,
    isCompleted: row.is_completed,
    source: row.source,
  };
}

function rowToDayMeta(row: DayMetaRow): DayMeta {
  return {
    workoutDone: row.workout_done,
    workoutDay: row.workout_day,
    manualKcal: row.manual_kcal,
    manualProtein: row.manual_protein,
    manualCarbs: row.manual_carbs,
    manualFat: row.manual_fat,
  };
}

// ---------------------------------------------------------------------------
// Hydration — runs once after a session is confirmed (see useWireSync). Fetches
// all four tables for the signed-in user and returns plain state slices ready
// to hand to the store, rather than writing to the store directly, so this
// module stays independently testable without a Zustand instance.
// ---------------------------------------------------------------------------
export interface HydratedShredData {
  itemsByDate: Record<string, LoggedItem[]>;
  dayMeta: DayMetaByDate;
  exerciseLogs: ExerciseLogsByDate;
  metricEntries: MetricEntry[];
  /** Every logged_items.id fetched — seeds the delete-diff in createPersist(). */
  syncedItemIds: Set<string>;
}

export async function hydrateShredData(supabase: SupabaseClient): Promise<HydratedShredData> {
  const [itemsRes, dayMetaRes, exerciseRes, metricsRes] = await Promise.all([
    supabase.from('logged_items').select('id,date_key,slot_id,name,base_calories,base_protein,base_carbs,base_fats,grams,is_completed,source'),
    supabase.from('day_meta').select('date_key,workout_done,workout_day,manual_kcal,manual_protein,manual_carbs,manual_fat'),
    supabase.from('exercise_logs').select('date_key,exercise_name,weight,reps'),
    supabase.from('metric_entries').select('id,date,weight,waist').order('date', { ascending: true }),
  ]);

  const itemsByDate: Record<string, LoggedItem[]> = {};
  const syncedItemIds = new Set<string>();
  for (const row of (itemsRes.data as LoggedItemRow[] | null) || []) {
    const item = rowToItem(row);
    (itemsByDate[item.dateKey] ||= []).push(item);
    syncedItemIds.add(item.id);
  }

  const dayMeta: DayMetaByDate = {};
  for (const row of (dayMetaRes.data as DayMetaRow[] | null) || []) {
    dayMeta[row.date_key] = rowToDayMeta(row);
  }

  const exerciseLogs: ExerciseLogsByDate = {};
  for (const row of (exerciseRes.data as ExerciseLogRow[] | null) || []) {
    (exerciseLogs[row.date_key] ||= {})[row.exercise_name] = {
      weight: row.weight ?? undefined,
      reps: row.reps ?? undefined,
    };
  }

  const metricEntries: MetricEntry[] = ((metricsRes.data as MetricEntryRow[] | null) || []).map((row) => ({
    id: row.id,
    date: row.date,
    weight: row.weight ?? undefined,
    waist: row.waist ?? undefined,
  }));

  return { itemsByDate, dayMeta, exerciseLogs, metricEntries, syncedItemIds };
}

// ---------------------------------------------------------------------------
// Persist — called by the debounce+flush scheduler (sync-scheduler.ts) with
// the FULL current state on every flush. day_meta/exercise_logs/metric_entries
// are pure upserts (nothing ever deletes them). logged_items also needs
// deletion: `lastSyncedItemIds` (seeded from hydration, updated after every
// flush) is diffed against the current id set so a locally deleted item's row
// actually gets removed remotely, not just abandoned.
//
// Every table's write is best-effort and isolated in its own try/catch — one
// table failing (e.g. a stale session) must not stop the others from saving.
// ---------------------------------------------------------------------------
export function createShredPersist(supabase: SupabaseClient, initialSyncedItemIds: Set<string> = new Set()) {
  let lastSyncedItemIds = initialSyncedItemIds;

  return async function persist(state: {
    itemsByDate: Record<string, LoggedItem[]>;
    dayMeta: DayMetaByDate;
    exerciseLogs: ExerciseLogsByDate;
    metricEntries: MetricEntry[];
  }): Promise<void> {
    const allItems = Object.values(state.itemsByDate).flat();

    await Promise.all([
      (async () => {
        try {
          if (allItems.length) {
            await supabase.from('logged_items').upsert(allItems.map(itemToRow), { onConflict: 'id' });
          }
          const currentIds = new Set(allItems.map((i) => i.id));
          const toDelete = [...lastSyncedItemIds].filter((id) => !currentIds.has(id));
          if (toDelete.length) {
            await supabase.from('logged_items').delete().in('id', toDelete);
          }
          lastSyncedItemIds = currentIds;
        } catch {
          // Best-effort — see file header. The client stays the source of truth.
        }
      })(),
      (async () => {
        try {
          const rows: DayMetaRow[] = Object.entries(state.dayMeta).map(([dateKey, meta]) => ({
            date_key: dateKey,
            workout_done: meta.workoutDone,
            workout_day: meta.workoutDay,
            manual_kcal: meta.manualKcal,
            manual_protein: meta.manualProtein,
            manual_carbs: meta.manualCarbs,
            manual_fat: meta.manualFat,
          }));
          if (rows.length) await supabase.from('day_meta').upsert(rows, { onConflict: 'user_id,date_key' });
        } catch {
          // Best-effort.
        }
      })(),
      (async () => {
        try {
          const rows: ExerciseLogRow[] = [];
          for (const [dateKey, exercises] of Object.entries(state.exerciseLogs)) {
            for (const [exerciseName, set] of Object.entries(exercises) as [string, ExerciseSet][]) {
              rows.push({ date_key: dateKey, exercise_name: exerciseName, weight: set.weight ?? null, reps: set.reps ?? null });
            }
          }
          if (rows.length) await supabase.from('exercise_logs').upsert(rows, { onConflict: 'user_id,date_key,exercise_name' });
        } catch {
          // Best-effort.
        }
      })(),
      (async () => {
        try {
          const rows = state.metricEntries.map((e) => ({ date: e.date, weight: e.weight ?? null, waist: e.waist ?? null }));
          if (rows.length) await supabase.from('metric_entries').upsert(rows, { onConflict: 'user_id,date' });
        } catch {
          // Best-effort.
        }
      })(),
    ]);
  };
}
