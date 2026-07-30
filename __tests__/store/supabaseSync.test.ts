import { describe, it, expect } from 'vitest';
import { hydrateShredData, createShredPersist } from '@/lib/store/supabaseSync';
import type { LoggedItem } from '@/lib/domain/items';

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

// hydrateShredData chains .order() after .select() only for metric_entries —
// the fake's `select` above resolves immediately without `.order`, so give
// metric_entries its own shape that supports both call patterns.
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
    await persist({ itemsByDate: { '2026-07-29': [item()] }, dayMeta: {}, exerciseLogs: {}, metricEntries: [] });

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
    await persist({ itemsByDate: { '2026-07-29': [item({ id: 'dddddddd-0000-0000-0000-000000000002' })] }, dayMeta: {}, exerciseLogs: {}, metricEntries: [] });

    const deleteCall = calls.find((c) => c.table === 'logged_items' && c.op === 'delete');
    expect(deleteCall).toBeTruthy();
    expect(deleteCall!.args).toEqual(['id', ['cccccccc-0000-0000-0000-000000000001']]);
  });

  it('never deletes anything on the very first flush when nothing was previously synced', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist({ itemsByDate: {}, dayMeta: {}, exerciseLogs: {}, metricEntries: [] });
    expect(calls.some((c) => c.op === 'delete')).toBe(false);
  });

  it('upserts day_meta on the (user_id, date_key) natural key', async () => {
    const { client, calls } = makeFakeSupabase({});
    // @ts-expect-error - fake client
    const persist = createShredPersist(client, new Set());
    await persist({
      itemsByDate: {},
      dayMeta: { '2026-07-29': { workoutDone: true, workoutDay: 'B1', manualKcal: 1800, manualProtein: null, manualCarbs: null, manualFat: null } },
      exerciseLogs: {},
      metricEntries: [],
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
      itemsByDate: {}, dayMeta: {},
      exerciseLogs: { '2026-07-29': { 'סקוואט גב': { weight: 100, reps: 5 } } },
      metricEntries: [],
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
      itemsByDate: {}, dayMeta: {}, exerciseLogs: {},
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
      itemsByDate: { '2026-07-29': [item()] },
      dayMeta: { '2026-07-29': { workoutDone: true, workoutDay: 'A1', manualKcal: null, manualProtein: null, manualCarbs: null, manualFat: null } },
      exerciseLogs: {},
      metricEntries: [],
    });
    // day_meta still got its upsert call despite logged_items rejecting.
    expect(calls.some((c) => c.table === 'day_meta' && c.op === 'upsert')).toBe(true);
  });
});

