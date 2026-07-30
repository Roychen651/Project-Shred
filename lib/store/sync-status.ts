// A small, DELIBERATELY SEPARATE store from shred-store.ts — see wireSync.ts
// for why. Mirrors the artifact's Sprint 6 header "שומר… / נשמר" indicator.
//
// Sprint 10 additions:
//  - 'offline' status — set when the browser reports no connectivity, so the
//    UI can show a distinct "not saving because you're offline" state
//    instead of lumping it in with 'error' (a real failure the person might
//    want to act on).
//  - `hydrationSettled` — flips true once useWireSync's initial hydrate
//    attempt has resolved, one way or another (real data loaded, or gave up
//    because there's no session/no Supabase config). Exists so the
//    onboarding wizard (app/page.tsx) can tell "we don't know yet whether
//    this account has completed onboarding" apart from "we checked, and it
//    hasn't" — showing the wizard before that distinction is known would
//    flash it at returning users on every load, however briefly.
import { create } from 'zustand';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface SyncStatusState {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
  hydrationSettled: boolean;
  setHydrationSettled: (settled: boolean) => void;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
  hydrationSettled: false,
  setHydrationSettled: (settled) => set({ hydrationSettled: settled }),
}));
