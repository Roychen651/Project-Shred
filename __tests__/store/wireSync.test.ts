import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useShredStore } from '@/lib/store/shred-store';
import { useSyncStatusStore } from '@/lib/store/sync-status';
import { useWireSync } from '@/lib/store/wireSync';

// Sprint 13 — the real gap found while investigating a reported "onboarding
// reappears on refresh" complaint: hydrationFailed must be set true ONLY
// when a real backend was configured and the hydrate fetch still failed —
// never when there's simply no backend configured at all (this sandbox's
// permanent state, and a legitimate local-preview scenario). See
// sync-status.ts and wireSync.ts for the full reasoning.
//
// Static top-level imports deliberately, no vi.resetModules() — a dynamic
// re-import between tests would re-evaluate shred-store.ts/sync-status.ts as
// fresh module instances, disconnecting this file's top-level store
// references from the ones useWireSync actually mutates.

const hydrateShredDataMock = vi.fn();
vi.mock('@/lib/store/supabaseSync', () => ({
  hydrateShredData: (...args: unknown[]) => hydrateShredDataMock(...args),
  createShredPersist: vi.fn(() => vi.fn()),
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({})),
}));

describe('useWireSync — hydrationFailed', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    useSyncStatusStore.setState({ status: 'idle', hydrationSettled: false, hydrationFailed: false });
    hydrateShredDataMock.mockReset();
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it('does NOT set hydrationFailed when no backend is configured at all (env vars absent)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    hydrateShredDataMock.mockRejectedValue(new Error('no backend'));

    renderHook(() => useWireSync());

    await waitFor(() => expect(useSyncStatusStore.getState().hydrationSettled).toBe(true));
    expect(useSyncStatusStore.getState().hydrationFailed).toBe(false);
  });

  it('DOES set hydrationFailed when a backend is configured but the hydrate fetch fails', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    hydrateShredDataMock.mockRejectedValue(new Error('RLS denied / network blip'));

    renderHook(() => useWireSync());

    await waitFor(() => expect(useSyncStatusStore.getState().hydrationSettled).toBe(true));
    expect(useSyncStatusStore.getState().hydrationFailed).toBe(true);
  });

  it('does not touch hasSeenOnboarding when hydration fails — it stays at the pre-hydrate default', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    hydrateShredDataMock.mockRejectedValue(new Error('network blip'));
    useShredStore.setState({ hasSeenOnboarding: false });

    renderHook(() => useWireSync());

    await waitFor(() => expect(useSyncStatusStore.getState().hydrationSettled).toBe(true));
    // The onboarding gate in app/page.tsx is hydrationSettled && !hydrationFailed
    // && !hasSeenOnboarding — with hydrationFailed true, the gate stays closed
    // even though hasSeenOnboarding itself is still (unavoidably) false here.
    expect(useSyncStatusStore.getState().hydrationFailed).toBe(true);
    expect(useShredStore.getState().hasSeenOnboarding).toBe(false);
  });
});
