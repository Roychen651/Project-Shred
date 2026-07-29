// The write side of the sync scheduler (lib/store/sync-scheduler.ts).
//
// Sprint 6 status, stated plainly: there is no authenticated Supabase client
// anywhere in this app yet — Milestone 5 (Auth) hasn't shipped. Every table
// this would write to has RLS keyed on `auth.uid()` (see supabase/migrations/
// 20260729000002_rls.sql), so an anonymous write would either be silently
// rejected or require weakening RLS that was deliberately built first. Neither
// is acceptable just to make this function "do something."
//
// What IS real: the debounce + visibility/pagehide/blur flush lifecycle
// (lib/store/sync-scheduler.ts, wired to the live store in wireSync.ts) is
// fully connected and running against this function on every state change,
// exactly the way it will run against a real Supabase client once Milestone 5
// lands. That milestone only needs to fill in the body below — the scheduling
// around it doesn't change.
import type { ShredState } from './shred-store';

export async function persistShredState(state: ShredState): Promise<void> {
  // No-op until an authenticated Supabase client exists (Milestone 5 — Auth).
  void state;
}
