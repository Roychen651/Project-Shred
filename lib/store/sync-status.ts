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
//
// Sprint 13 addition — `hydrationFailed`:
//  A real gap found while investigating a reported "onboarding reappears on
//  refresh" complaint: `hydrationSettled` alone conflates two very different
//  situations — (a) no Supabase project is configured at all (this sandbox's
//  permanent state; proxy.ts fails open, so there's no session to hydrate in
//  the first place, and showing onboarding is a reasonable local-preview
//  default), and (b) Supabase IS configured, the person IS authenticated
//  (proxy.ts already redirects anyone who isn't), but the hydrate fetch
//  itself failed — a network blip, an RLS misconfiguration, anything. In
//  case (b), `hasSeenOnboarding` never got a chance to load and stays at its
//  local default (false) — so without this flag, a real returning user could
//  see the onboarding wizard again purely because of a transient fetch
//  failure, which is exactly the "amnesia" symptom, just narrower than "every
//  refresh". `hydrationFailed` is only ever set true when env vars WERE
//  present (a real backend exists) and the hydrate call still threw — see
//  wireSync.ts. The onboarding gate treats this as "don't know, so don't
//  show it" rather than defaulting to showing it.
import { create } from 'zustand';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface SyncStatusState {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
  hydrationSettled: boolean;
  setHydrationSettled: (settled: boolean) => void;
  hydrationFailed: boolean;
  setHydrationFailed: (failed: boolean) => void;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
  hydrationSettled: false,
  setHydrationSettled: (settled) => set({ hydrationSettled: settled }),
  hydrationFailed: false,
  setHydrationFailed: (failed) => set({ hydrationFailed: failed }),
}));
