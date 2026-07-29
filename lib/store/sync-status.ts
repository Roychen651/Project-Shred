// A small, DELIBERATELY SEPARATE store from shred-store.ts — see wireSync.ts
// for why. Mirrors the artifact's Sprint 6 header "שומר… / נשמר" indicator; no
// component consumes it yet (there's nothing to show progress for until
// Milestone 5 gives persist.ts a real Supabase client to write through), but
// the shape is here so a future status pill just reads this store.
import { create } from 'zustand';

export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SyncStatusState {
  status: SyncStatus;
  setStatus: (status: SyncStatus) => void;
}

export const useSyncStatusStore = create<SyncStatusState>((set) => ({
  status: 'idle',
  setStatus: (status) => set({ status }),
}));
