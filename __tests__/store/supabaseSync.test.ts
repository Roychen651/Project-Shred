import { describe, it, expect } from 'vitest';
import { hydrateShredData, createShredPersist } from '@/lib/store/supabaseSync';
import type { LoggedItem } from '@/lib/domain/items';
import type { Profile } from '@/lib/store/shred-store';

// Sprint 8 fields every persist() call needs, unrelated to whatever a given
// test is actually exercising — spread this in and override just the slice
// under test, instead of repeating all eleven fields in every call site.
function basePersistState() {
  return {
    itemsByDate: {} as Record<string, LoggedItem[]>,
    dayMeta: {},
    exerciseLogs: {},
    metricEntries: [] as { id: string; date: string; weight?: number; waist?: number }[],
    profiles: {} as Record<string, Profile>,
    activeProfileId: '',
    mode: 'dark' as const,
    accentKey: 'emerald' as const,
    density: 'comfortable' as const,
    feedback: true,
    hasSeenOnboarding: false,
  };
}

// A minimal fake matching just the chained shape supabaseSync.ts actually
// calls (.from(table).select(...) / .upsert(rows, opts) / .delete().in(...)).
// Not a real Supabase client — this exercises OUR mapping/diffing logic, the
// one part of Sprint 8's DB wiring verifiable without a live project (see
// supabaseSync.ts's file header for why the rest can't be from this sandbox).
function makeFakeSupabase(tableData: Record<string, unknown[]>) {
  const calls: { table: string; op: string; args: unknown[] }[] = [];

  const client = {
    from(table: string) {
      return {
        select: (cols: string) => {
          calls.push({ table, op: 'select', args: [cols] });
          return Promise.resolve({ data: tableData[table] ?? [], error: null });
        },
        order: () => ({
          then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
            resolve({ data: tableData[table] ?? [], error: null }),
        }),
        upsert: (rows: unknown[], opts: unknown) => {
          calls.push({ table, op: 'upsert', args: [rows, opts] });
          return Promise.resolve({ data: rows, error: null });
        },
        delete: () => ({
          in: (col: string, ids: unknown[]) => {
            calls.push({ table, op: 'delete', args: [col, ids] });
            return Promise.resolve({ data: null, error: null });
          },
        }),
      };
    },
  };

  return { client, calls };
}

// hydrateShredData chains .order() after .select() (metric_entries) and
// .maybeSingle() after .select() (user_settings) — the fake's `select` above
// resolves immediately without either, so give the hydrate-side tables their
// own shape supporting all three call patterns. `tableData.user_settings`, if
// present, is a one-element array whose single row .maybeSingle() unwraps.
function makeFakeSupabaseWithOrder(tableData: Record<string, unknown[]>) {
  const calls: { table: string; op: string; args: unknown[] }[] = [];
  const client = {
    from(table: string) {
      const rows = tableData[table] ?? [];
      const resolved = Promise.resolve({ data: rows, error: null });
      return {
        select: (cols: string) => {
          calls.push({ table, op: 'select', args: [cols] });
          return {
            order: (col: string, opts: unknown) => {
              calls.push({ table, op: 'order', args: [col, opts] });
              return resolved;
            },
            maybeSingle: () => {
              calls.push({ table, op: 'maybeSingle', args: [] });
              return Promise.resolve({ data: rows[0] ?? null, error: null });
            },
            then: resolved.then.bind(resolved),
            catch: resolved.catch.bind(resolved),
          };
        },
        upsert: (rowsArg: unknown[], opts: unknown) => {
          calls.push({ table, op: 'upsert', args: [rowsArg, opts] });
          return Promise.resolve({ data: rowsArg, error: null });
        },
        delete: () => ({
          in: (col: string, ids: unknown[]) => {
            calls.push({ table, op: 'delete', args: [col, ids] });
            return Promise.resolve({ data: null, error: null });
          },
        }),
      };
    },
  };
  return { client, calls };
}

describe('hydrateShredData', () => {
  it('maps every table\'s rows into the store\'s exact client shapes', async () => {
    const { client } = makeFakeSupabaseWithOrder({
      logged_items: [
        { id: 'aaaaaaaa-0000-0000-0000-000000000001', date_key: '2026-07-29', slot_id: 'lunch', name: 'עוף', base_calories: 300, base_protein: 40, base_carbs: 0, base_fats: 5, grams: 100, is_completed: true, source: 'manual' },
      ],
      day_meta: [
        { date_key: '2026-07-29', workout_done: true, workout_day: 'A1', manual_kcal: null, manual_protein: null, manual_carbs: null, manual_fat: null },
      ],
      exercise_logs: [
        { date_key: '2026-07-29', exercise_name: 'סקוואט גב', weight: 100, reps: 5 },
      ],
      metric_entries: [
        { id: 'bbbbbbbb-0000-0000-0000-000000000001', date: '2026-07-20', weight: 84, waist: 91 },
      ],
    });

    // @ts-expect-error - fake client only implements the chain this module calls
    const result = await hydrateShredData(client);

    expect(result.itemsByDate['2026-07-29']).toHaveLength(1);
    expect(result.itemsByDate['2026-07-29'][0]).toMatchObject({
      id: 'aaaaaaaa-0000-0000-0000-000000000001', dateKey: '2026-07-29', slotId: 'lunch', name: 'עוף', baseCalories: 300,
    } satisfies Partial<LoggedItem>);
    expect(result.syncedItemIds.has('aaaaaaaa-0000-0000-0000-000000000001')).toBe(true);

    expect(result.dayMeta['2026-07-29']).toEqual({
      workoutDone: true, workoutDay: 'A1', manualKcal: null, manualProtein: null, manualCarbs: null, manualFat: null,
    });

    expect(result.exerciseLogs['2026-07-29']['סקוואט גב']).toEqual({ weight: 100, reps: 5 });

    expect(result.metricEntries).toEqual([{ id: 'bbbbbbbb-0000-0000-0000-000000000001', date: '2026-07-20', weight: 84, waist: 91 }]);
  });

  it('returns empty slices, not a throw, when every table is empty', async () => {
    const { client } = makeFakeSupabaseWithOrder({});
    // @ts-expect-error - fake client
    const result = await hydrateShredData(client);
    expect(result.itemsByDate).toEqual({});
    expect(result.dayMeta).toEqual({});
    expect(result.exerciseLogs).toEqual({});
    expect(result.metricEntries).toEqual([]);
    expect(result.syncedItemIds.size).toBe(0);
    // No profiles fetched -> profiles/activeProfileId stay undefined so the
    // caller keeps its local placeholder defaults (see hydrateFromServer).
    expect(result.profiles).toBeUndefined();
    expect(result.activeProfileId).toBeUndefined();
  });

  it('Sprint 9: maps profiles keyed by their real uuid, resolving activeProfileId from user_settings', async () => {
    const { client } = makeFakeSupabaseWithOrder({
      profiles: [
        { id: '11111111-0000-0000-0000-000000000001', name: 'הפרופיל שלי', age: 28, weight: 75, height: 175, waist: 90, activity: 'office', goal: 'maintain', is_builtin: true, builtin_key: 'mine' },
        { id: '22222222-0000-0000-0000-000000000002', name: 'פרופיל אורח / חבר', age: 30, weight: 78, height: 175, waist: 92, activity: 'sedentary', goal: 'maintain', is_builtin: true, builtin_key: 'guest' },
      ],
      user_settings: [
        { active_profile_id: '22222222-0000-0000-0000-000000000002', theme_mode: 'light', accent_key: 'violet', density: 'compact', feedback_enabled: false, has_seen_onboarding: true },
      ],
    });
    // @ts-expect-error - fake client
    const result = await hydrateShredData(client);

    expect(Object.keys(result.profiles!)).toEqual(['11111111-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000002']);
    expect(result.profiles!['11111111-0000-0000-0000-000000000001']).toEqual({
      id: '11111111-0000-0000-0000-000000000001', name: 'הפרופיל שלי', age: 28, weight: 75, height: 175, waist: 90,
      activity: 'office', goal: 'maintain', locked: true, builtinKey: 'mine',
    });
    // user_settings.active_profile_id wins over the 'mine' fallback.
    expect(result.activeProfileId).toBe('22222222-0000-0000-0000-000000000002');
    expect(result.syncedProfileIds.has('11111111-0000-0000-0000-000000000001')).toBe(true);
    expect(result.mode).toBe('light');
    expect(result.accentKey).toBe('violet');
    expect(result.density).toBe('compact');
    expect(result.feedback).toBe(false);
    expect(result.hasSeenOnboarding).toBe(true);
  });

  it('falls back to the "mine"-builtin profile when user_settings has no active_profile_id yet', async () => {
    const { client } = makeFakeSupabaseWithOrder({
      profiles: [
        { id: '11111111-0000-0000-0000-000000000001', name: 'הפרופיל שלי', age: 28, weight: 75, height: 175, waist: 90, activity: 'office', goal: 'maintain', is_builtin: true, builtin_key: 'mine' },
      ],
    });
    // @ts-expect-error - fake client
    const result = await hydrateShredData(client);
    expect(result.activeProfileId).toBe('11111111-0000-0000-0000-000000000001');
  });
});

describe('createShredPersist', () => {
  function item(overrides: Partial<LoggedItem> = {}): LoggedItem {
    return {
      id: 'cccccccc-0000-0000-0000-000000000001', dateKey: '2026-07-29', slotId: 'lunch', name: 'Test',
      baseCalories: 500, baseProtein: 40, baseCarbs: 50, baseFats: 10,
      grams: 100, isCompleted: true, source: 'manual',
      ...overrides,
    };
  }

  it('upserts logged_items with onConflict: id, and no delete call when nothing was removed', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist({ ...basePersistState(), itemsByDate: { '2026-07-29': [item()] } });

    const upsertCall = calls.find((c) => c.table === 'logged_items' && c.op === 'upsert');
    expect(upsertCall).toBeTruthy();
    expect(upsertCall!.args[0]).toEqual([{
      id: 'cccccccc-0000-0000-0000-000000000001', date_key: '2026-07-29', slot_id: 'lunch', name: 'Test',
      base_calories: 500, base_protein: 40, base_carbs: 50, base_fats: 10, grams: 100, is_completed: true, source: 'manual',
    }]);
    expect(upsertCall!.args[1]).toEqual({ onConflict: 'id' });
    expect(calls.some((c) => c.table === 'logged_items' && c.op === 'delete')).toBe(false);
  });

  it('deletes a logged_items row that was previously synced but is no longer present locally', async () => {
    const { client, calls } = makeFakeSupabase({});
    const previouslySynced = new Set(['cccccccc-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002']);
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, previouslySynced);
    // Locally, only the second item still exists — the first was deleted by the user.
    await persist({ ...basePersistState(), itemsByDate: { '2026-07-29': [item({ id: 'dddddddd-0000-0000-0000-000000000002' })] } });

    const deleteCall = calls.find((c) => c.table === 'logged_items' && c.op === 'delete');
    expect(deleteCall).toBeTruthy();
    expect(deleteCall!.args).toEqual(['id', ['cccccccc-0000-0000-0000-000000000001']]);
  });

  it('never deletes anything on the very first flush when nothing was previously synced', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist(basePersistState());
    expect(calls.some((c) => c.op === 'delete')).toBe(false);
  });

  it('upserts day_meta on the (user_id, date_key) natural key', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist({
      ...basePersistState(),
      dayMeta: { '2026-07-29': { workoutDone: true, workoutDay: 'B1', manualKcal: 1800, manualProtein: null, manualCarbs: null, manualFat: null } },
    });
    const call = calls.find((c) => c.table === 'day_meta' && c.op === 'upsert');
    expect(call!.args[0]).toEqual([{
      date_key: '2026-07-29', workout_done: true, workout_day: 'B1', manual_kcal: 1800, manual_protein: null, manual_carbs: null, manual_fat: null,
    }]);
    expect(call!.args[1]).toEqual({ onConflict: 'user_id,date_key' });
  });

  it('upserts exercise_logs on the (user_id, date_key, exercise_name) natural key', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist({
      ...basePersistState(),
      exerciseLogs: { '2026-07-29': { 'סקוואט גב': { weight: 100, reps: 5 } } },
    });
    const call = calls.find((c) => c.table === 'exercise_logs' && c.op === 'upsert');
    expect(call!.args[0]).toEqual([{ date_key: '2026-07-29', exercise_name: 'סקוואט גב', weight: 100, reps: 5 }]);
    expect(call!.args[1]).toEqual({ onConflict: 'user_id,date_key,exercise_name' });
  });

  it('upserts metric_entries on the (user_id, date) natural key, without sending a client id', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist({
      ...basePersistState(),
      metricEntries: [{ id: 'local-only-id', date: '2026-07-20', weight: 84, waist: 91 }],
    });
    const call = calls.find((c) => c.table === 'metric_entries' && c.op === 'upsert');
    expect(call!.args[0]).toEqual([{ date: '2026-07-20', weight: 84, waist: 91 }]);
    expect(call!.args[1]).toEqual({ onConflict: 'user_id,date' });
  });

  it('one table failing does not stop the others from writing (best-effort isolation)', async () => {
    const { client, calls } = makeFakeSupabase({});
    // Force logged_items specifically to reject, to prove the other tables'
    // writes are isolated from it.
    client.from = new Proxy(client.from, {
      apply(target, thisArg, args) {
        const table = args[0];
        const real = Reflect.apply(target, thisArg, args);
        if (table === 'logged_items') {
          return { ...real, upsert: () => Promise.reject(new Error('network error')) };
        }
        return real;
      },
    });
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist({
      ...basePersistState(),
      itemsByDate: { '2026-07-29': [item()] },
      dayMeta: { '2026-07-29': { workoutDone: true, workoutDay: 'A1', manualKcal: null, manualProtein: null, manualCarbs: null, manualFat: null } },
    });
    // day_meta still got its upsert call despite logged_items rejecting.
    expect(calls.some((c) => c.table === 'day_meta' && c.op === 'upsert')).toBe(true);
  });

  function profile(overrides: Partial<Profile> = {}): Profile {
    return {
      id: '11111111-0000-0000-0000-000000000001', name: 'הפרופיל שלי', age: 28, weight: 75, height: 175, waist: 90,
      activity: 'office', goal: 'maintain', locked: true, builtinKey: 'mine',
      ...overrides,
    };
  }

  it('Sprint 9: upserts profiles with onConflict: id, mapping locked/builtinKey to is_builtin/builtin_key', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set(), new Set());
    await persist({ ...basePersistState(), profiles: { [profile().id]: profile() } });

    const call = calls.find((c) => c.table === 'profiles' && c.op === 'upsert');
    expect(call!.args[0]).toEqual([{
      id: '11111111-0000-0000-0000-000000000001', name: 'הפרופיל שלי', age: 28, weight: 75, height: 175, waist: 90,
      activity: 'office', goal: 'maintain', is_builtin: true, builtin_key: 'mine',
    }]);
    expect(call!.args[1]).toEqual({ onConflict: 'id' });
  });

  it('deletes a custom profile that was previously synced but is no longer present locally', async () => {
    const { client, calls } = makeFakeSupabase({});
    const previouslySynced = new Set(['11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003']);
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set(), previouslySynced);
    // The custom profile (…003) was deleted locally; only the builtin remains.
    await persist({ ...basePersistState(), profiles: { [profile().id]: profile() } });

    const deleteCall = calls.find((c) => c.table === 'profiles' && c.op === 'delete');
    expect(deleteCall).toBeTruthy();
    expect(deleteCall!.args).toEqual(['id', ['33333333-0000-0000-0000-000000000003']]);
  });

  it('upserts user_settings on onConflict: user_id, mapping every theme/profile field', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set(), new Set());
    await persist({
      ...basePersistState(),
      activeProfileId: '11111111-0000-0000-0000-000000000001',
      mode: 'light', accentKey: 'violet', density: 'compact', feedback: false, hasSeenOnboarding: true,
    });

    const call = calls.find((c) => c.table === 'user_settings' && c.op === 'upsert');
    expect(call!.args[0]).toEqual({
      active_profile_id: '11111111-0000-0000-0000-000000000001',
      theme_mode: 'light', accent_key: 'violet', density: 'compact', feedback_enabled: false, has_seen_onboarding: true,
    });
    expect(call!.args[1]).toEqual({ onConflict: 'user_id' });
  });

  it('always commits the profiles upsert before the user_settings upsert (the FK ordering guarantee)', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set(), new Set());
    await persist({
      ...basePersistState(),
      profiles: { [profile().id]: profile() },
      activeProfileId: profile().id,
    });

    const profilesIdx = calls.findIndex((c) => c.table === 'profiles' && c.op === 'upsert');
    const settingsIdx = calls.findIndex((c) => c.table === 'user_settings' && c.op === 'upsert');
    expect(profilesIdx).toBeGreaterThanOrEqual(0);
    expect(settingsIdx).toBeGreaterThan(profilesIdx);
  });
});

