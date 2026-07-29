'use client';

// Connects the live shred-store to the Sprint 16.2 debounce+flush scheduler
// (sync-scheduler.ts) and the still-stubbed write side (persist.ts). Every
// state mutation — including exerciseLogs from the new Workout Arena — now
// flows through the same "debounce normally, flush immediately on
// visibilitychange/pagehide/blur" lifecycle the artifact used, not just a
// mocked concept sitting unused next to the store.
//
// WHY A SEPARATE useSyncStatusStore INSTEAD OF A FIELD ON ShredState: the
// scheduler's onSaving/onSaved/onError callbacks fire as a *result* of a
// shred-store change (that's what triggers notify() below). If those
// callbacks wrote syncStatus back onto shred-store itself, that write would
// itself be a shred-store change, re-triggering the same subscription and
// scheduling another flush — an infinite debounce loop that never settles,
// long after the user stopped doing anything. Keeping sync status in its own
// store means updating it never re-enters this subscription at all.
import { useEffect } from 'react';
import { useShredStore } from './shred-store';
import { createSyncScheduler } from './sync-scheduler';
import { persistShredState } from './persist';
import { useSyncStatusStore } from './sync-status';

export function useWireSync(): void {
  useEffect(() => {
    const scheduler = createSyncScheduler({
      getLatestState: () => useShredStore.getState(),
      persist: persistShredState,
      onSaving: () => useSyncStatusStore.getState().setStatus('saving'),
      onSaved: () => useSyncStatusStore.getState().setStatus('saved'),
      onError: () => useSyncStatusStore.getState().setStatus('error'),
    });

    const unsubscribe = useShredStore.subscribe(() => scheduler.notify());

    return () => {
      unsubscribe();
      scheduler.dispose();
    };
  }, []);
}
