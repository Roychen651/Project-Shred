// Sprint 8 — the real read (hydrate) + write (persist) halves of Supabase sync
// for logged_items, day_meta, exercise_logs, metric_entries (all keyed by
// user_id alone, no dependency on which profile is active).
//
// Sprint 9 adds profiles + user_settings, resolving the id-reconciliation this
// file's Sprint 8 header used to defer: the client now keys EVERY profile
// (builtin or custom) by its real Postgres uuid post-hydration — see the
// Profile.builtinKey note in shred-store.ts. That removes the mismatch
// entirely instead of working around it, which is what unblocks these two
// tables. profiles must be upserted BEFORE user_settings on every persist
// flush: user_settings.active_profile_id is a real FK to profiles.id, so
// writing it first (or in the same parallel batch) risks a foreign-key
// violation if that profile row doesn't exist yet — see createShredPersist.
//
// favorites/custom_ingredients/custom_hacks/custom_restaurants remain
// deliberately unwired — lower-frequency, no UI to create them yet in most
// cases, and not the blocking problem this sprint was about.
//
// IMPORTANT HONESTY NOTE, same as Milestone 2's persist.ts stub: this has been
// written to match supabase/migrations/*.sql exactly and passes typecheck/
// build, but there is no live Supabase project reachable from this sandbox
// (no .env.local, no network path to a real project) to run it against. It
// has NOT been exercised against a real database. Treat it as reviewed-but-
// unverified until tested with real credentials.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoggedItem, SlotId, ItemSource } from '../domain/items';
import type {
  DayMeta, DayMetaByDate, ExerciseLogsByDate, ExerciseSet, MetricEntry,
  Profile, ThemeMode, AccentKey, Density,
} from './shred-store';
import type { ActivityKey, GoalKey } from '../domain/targets';

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

interface ProfileRow {
  id: string;
  name: string;
  age: number | null;
  weight: number | null;
  height: number | null;
  waist: number | null;
  activity: ActivityKey;
  goal: GoalKey;
  is_builtin: boolean;
  builtin_key: 'mine' | 'guest' | null;
}

interface UserSettingsRow {
  active_profile_id: string | null;
  theme_mode: ThemeMode;
  accent_key: AccentKey;
  density: Density;
  feedback_enabled: boolean;
  has_seen_onboarding: boolean;
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

function rowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    age: row.age ?? 0,
    weight: row.weight ?? 0,
    height: row.height ?? 0,
    waist: row.waist ?? 0,
    activity: row.activity,
    goal: row.goal,
    locked: row.is_builtin,
    builtinKey: row.builtin_key,
  };
}

function profileToRow(p: Profile): Omit<ProfileRow, 'is_builtin'> & { is_builtin: boolean } {
  return {
    id: p.id,
    name: p.name,
    age: p.age,
    weight: p.weight,
    height: p.height,
    waist: p.waist,
    activity: p.activity,
    goal: p.goal,
    is_builtin: p.locked,
    builtin_key: p.builtinKey,
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
  /** Undefined (not an empty object) when the profiles fetch came back empty —
   * see hydrateFromServer's optional-field contract in shred-store.ts: the
   * caller must be able to tell "no server profiles yet" apart from "server
   * profiles exist and are empty," since only the former should keep the
   * local placeholder defaults instead of wiping them. */
  profiles?: Record<string, Profile>;
  activeProfileId?: string;
  mode?: ThemeMode;
  accentKey?: AccentKey;
  density?: Density;
  feedback?: boolean;
  hasSeenOnboarding?: boolean;
  /** Every profiles.id fetched — seeds the delete-diff for custom profiles. */
  syncedProfileIds: Set<string>;
}

export async function hydrateShredData(supabase: SupabaseClient): Promise<HydratedShredData> {
  const [itemsRes, dayMetaRes, exerciseRes, metricsRes, profilesRes, settingsRes] = await Promise.all([
    supabase.from('logged_items').select('id,date_key,slot_id,name,base_calories,base_protein,base_carbs,base_fats,grams,is_completed,source'),
    supabase.from('day_meta').select('date_key,workout_done,workout_day,manual_kcal,manual_protein,manual_carbs,manual_fat'),
    supabase.from('exercise_logs').select('date_key,exercise_name,weight,reps'),
    supabase.from('metric_entries').select('id,date,weight,waist').order('date', { ascending: true }),
    supabase.from('profiles').select('id,name,age,weight,height,waist,activity,goal,is_builtin,builtin_key'),
    supabase.from('user_settings').select('active_profile_id,theme_mode,accent_key,density,feedback_enabled,has_seen_onboarding').maybeSingle(),
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

  const profileRows = (profilesRes.data as ProfileRow[] | null) || [];
  const syncedProfileIds = new Set(profileRows.map((r) => r.id));
  const settings = settingsRes.data as UserSettingsRow | null;
  let profiles: Record<string, Profile> | undefined;
  let activeProfileId: string | undefined;
  if (profileRows.length) {
    profiles = {};
    for (const row of profileRows) profiles[row.id] = rowToProfile(row);
    const mineProfile = profileRows.find((r) => r.builtin_key === 'mine');
    activeProfileId = settings?.active_profile_id ?? mineProfile?.id ?? profileRows[0].id;
  }

  return {
    itemsByDate, dayMeta, exerciseLogs, metricEntries, syncedItemIds,
    profiles, activeProfileId, syncedProfileIds,
    mode: settings?.theme_mode,
    accentKey: settings?.accent_key,
    density: settings?.density,
    feedback: settings?.feedback_enabled,
    hasSeenOnboarding: settings?.has_seen_onboarding,
  };
}

// ---------------------------------------------------------------------------
// Persist — called by the debounce+flush scheduler (sync-scheduler.ts) with
// the FULL current state on every flush. day_meta/exercise_logs/metric_entries/
// profiles are pure upserts (nothing ever deletes day_meta/exercise_logs/
// metric_entries rows). logged_items AND profiles also need deletion:
// `lastSyncedItemIds`/`lastSyncedProfileIds` (seeded from hydration, updated
// after every flush) are diffed against the current id sets so a locally
// deleted item or custom profile actually gets removed remotely.
//
// ORDERING: profiles is awaited BEFORE user_settings starts, deliberately not
// run in the same Promise.all batch as everything else — user_settings.
// active_profile_id is a real FK to profiles.id, so writing it before (or
// concurrently with, racily) the referenced profile row exists risks a
// foreign-key violation. Every other table has no such dependency and stays
// parallel for speed.
//
// Every table's write is best-effort and isolated in its own try/catch — one
// table failing (e.g. a stale session) must not stop the others from saving.
// ---------------------------------------------------------------------------
export function createShredPersist(
  supabase: SupabaseClient,
  initialSyncedItemIds: Set<string> = new Set(),
  initialSyncedProfileIds: Set<string> = new Set()
) {
  let lastSyncedItemIds = initialSyncedItemIds;
  let lastSyncedProfileIds = initialSyncedProfileIds;

  return async function persist(state: {
    itemsByDate: Record<string, LoggedItem[]>;
    dayMeta: DayMetaByDate;
    exerciseLogs: ExerciseLogsByDate;
    metricEntries: MetricEntry[];
    profiles: Record<string, Profile>;
    activeProfileId: string;
    mode: ThemeMode;
    accentKey: AccentKey;
    density: Density;
    feedback: boolean;
    hasSeenOnboarding: boolean;
  }): Promise<void> {
    const allItems = Object.values(state.itemsByDate).flat();
    const allProfiles = Object.values(state.profiles);

    const itemsTask = (async () => {
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
    })();

    const dayMetaTask = (async () => {
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
    })();

    const exerciseTask = (async () => {
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
    })();

    const metricsTask = (async () => {
      try {
        const rows = state.metricEntries.map((e) => ({ date: e.date, weight: e.weight ?? null, waist: e.waist ?? null }));
        if (rows.length) await supabase.from('metric_entries').upsert(rows, { onConflict: 'user_id,date' });
      } catch {
        // Best-effort.
      }
    })();

    // Awaited on its own — see the ordering note above.
    await (async () => {
      try {
        if (allProfiles.length) {
          await supabase.from('profiles').upsert(allProfiles.map(profileToRow), { onConflict: 'id' });
        }
        const currentIds = new Set(allProfiles.map((p) => p.id));
        const toDelete = [...lastSyncedProfileIds].filter((id) => !currentIds.has(id));
        if (toDelete.length) {
          await supabase.from('profiles').delete().in('id', toDelete);
        }
        lastSyncedProfileIds = currentIds;
      } catch {
        // Best-effort.
      }
    })();

    const settingsTask = (async () => {
      try {
        const row: UserSettingsRow = {
          active_profile_id: state.activeProfileId,
          theme_mode: state.mode,
          accent_key: state.accentKey,
          density: state.density,
          feedback_enabled: state.feedback,
          has_seen_onboarding: state.hasSeenOnboarding,
        };
        await supabase.from('user_settings').upsert(row, { onConflict: 'user_id' });
      } catch {
        // Best-effort.
      }
    })();

    await Promise.all([itemsTask, dayMetaTask, exerciseTask, metricsTask, settingsTask]);
  };
}
