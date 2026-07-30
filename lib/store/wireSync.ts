'use client';

// Connects the live shred-store to Supabase, in two ordered phases:
//
//  1. HYDRATE — once, on mount: fetch logged_items/day_meta/exercise_logs/
//     metric_entries/profiles/user_settings for the signed-in user and
//     replace the store's (empty default) state with them, via
//     hydrateFromServer(). Must happen BEFORE phase 2 starts, or the very
//     first debounced flush would upload the untouched defaults over
//     whatever was already saved.
//  2. SYNC — after hydration resolves: wires the Sprint 16.2 debounce+flush
//     scheduler (sync-scheduler.ts) to createShredPersist(), seeded with the
//     ids hydration just saw (so logged_items/profiles deletions diff
//     correctly from the start — see supabaseSync.ts's file header for why).
//
// Sprint 9 closes the profiles/user_settings gap Sprint 8 deliberately left
// open: every profile is now keyed by its real Postgres uuid post-hydration
// (see Profile.builtinKey in shred-store.ts), so there's no more id scheme to
// reconcile. favorites/custom_ingredients/custom_hacks/custom_restaurants
// remain unwired — lower-frequency, not what blocked this sprint.
//
// WHY A SEPARATE useSyncStatusStore INSTEAD OF A FIELD ON ShredState: the
// scheduler's onSaving/onSaved/onError callbacks fire as a *result* of a
// shred-store change (that's what triggers notify() below). If those
// callbacks wrote a status field back onto shred-store itself, that write
// would be a shred-store change too, re-triggering this same subscription —
// an infinite debounce loop that never settles. A separate store sidesteps
// that entirely.
import { useEffect } from 'react';
import { useShredStore } from './shred-store';
import { createSyncScheduler } from './sync-scheduler';
import { createShredPersist, hydrateShredData } from './supabaseSync';
import { useSyncStatusStore } from './sync-status';
import { createClient } from '@/lib/supabase/client';

export function useWireSync(): void {
  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | null = null;
    let scheduler: ReturnType<typeof createSyncScheduler> | null = null;

    // Known BEFORE the try/catch so the catch block can tell "no backend to
    // even attempt" apart from "a real backend call failed" — see
    // sync-status.ts's Sprint 13 note on hydrationFailed for why that
    // distinction is load-bearing for the onboarding gate.
    const hasBackendConfigured = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    (async () => {
      try {
        // createClient() throws synchronously if the two NEXT_PUBLIC_SUPABASE_*
        // env vars aren't set — deliberately INSIDE this try, not above it, so
        // a missing/misconfigured .env.local degrades to "stay fully local"
        // instead of crashing the effect (and therefore the whole app shell).
        const supabase = createClient();
        const hydrated = await hydrateShredData(supabase);
        if (disposed) return;
        useShredStore.getState().hydrateFromServer(hydrated);

        const persist = createShredPersist(supabase, hydrated.syncedItemIds, hydrated.syncedProfileIds);
        scheduler = createSyncScheduler({
          getLatestState: () => useShredStore.getState(),
          persist,
          onSaving: () => useSyncStatusStore.getState().setStatus('saving'),
          onSaved: () => useSyncStatusStore.getState().setStatus('saved'),
          onError: () => useSyncStatusStore.getState().setStatus('error'),
          onOffline: () => useSyncStatusStore.getState().setStatus('offline'),
        });
        if (disposed) {
          scheduler.dispose();
          return;
        }
        unsubscribe = useShredStore.subscribe(() => scheduler!.notify());
      } catch {
        // Hydration failed (no session, network error, or — in this sandbox —
        // no real Supabase project configured at all). The app keeps working
        // fully offline-local; nothing here should ever crash the UI.
        useSyncStatusStore.getState().setStatus('error');
        // A real backend WAS configured and the fetch still failed — this is
        // the case hydrationFailed exists for. If no backend is configured at
        // all, leave it false: there's no session concept to have "lost", so
        // the local-preview onboarding flow is still the reasonable default.
        if (hasBackendConfigured && !disposed) useSyncStatusStore.getState().setHydrationFailed(true);
      } finally {
        // Settles exactly once, success or failure — see sync-status.ts for
        // why the onboarding wizard needs this distinct from "checked, and
        // hasSeenOnboarding is false" rather than "haven't checked yet".
        if (!disposed) useSyncStatusStore.getState().setHydrationSettled(true);
      }
    })();

    return () => {
      disposed = true;
      unsubscribe?.();
      scheduler?.dispose();
    };
  }, []);
}
