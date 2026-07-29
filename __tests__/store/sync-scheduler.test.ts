import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSyncScheduler } from '@/lib/store/sync-scheduler';

describe('createSyncScheduler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces: rapid notify() calls result in exactly one persist', async () => {
    let state = 0;
    const persist = vi.fn().mockResolvedValue(undefined);
    const s = createSyncScheduler({ getLatestState: () => state, persist, debounceMs: 100, addPageHideListeners: () => () => {} });

    state = 1; s.notify();
    state = 2; s.notify();
    state = 3; s.notify();

    expect(persist).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith(3); // always the LATEST state, not a stale closure
    s.dispose();
  });

  it('calls onSaving before persist resolves and onSaved after', async () => {
    const state = 'x';
    const onSaving = vi.fn();
    const onSaved = vi.fn();
    const persist = vi.fn().mockResolvedValue(undefined);
    const s = createSyncScheduler({ getLatestState: () => state, persist, debounceMs: 10, onSaving, onSaved, addPageHideListeners: () => () => {} });

    s.notify();
    await vi.advanceTimersByTimeAsync(10);
    expect(onSaving).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
    s.dispose();
  });

  it('a persist error calls onError, not onSaved, and does not throw', async () => {
    const state = 'x';
    const onSaved = vi.fn();
    const onError = vi.fn();
    const persist = vi.fn().mockRejectedValue(new Error('network down'));
    const s = createSyncScheduler({ getLatestState: () => state, persist, debounceMs: 10, onSaved, onError, addPageHideListeners: () => () => {} });

    s.notify();
    await vi.advanceTimersByTimeAsync(10);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
    s.dispose();
  });

  it('THE SAFETY NET: a page-hide flush fires immediately, bypassing the debounce entirely', async () => {
    // This is the exact bug from Sprint 16.2: leaving the app before the debounce
    // timer fires must not lose the pending write.
    let state = 'unsaved';
    const persist = vi.fn().mockResolvedValue(undefined);
    const captured: { flush: (() => void) | null } = { flush: null };
    const s = createSyncScheduler({
      getLatestState: () => state,
      persist,
      debounceMs: 10_000, // deliberately long — the page-hide flush must not wait for this
      addPageHideListeners: (flush) => { captured.flush = flush; return () => {}; },
    });

    state = 'about to leave';
    s.notify(); // debounce timer armed for 10s

    captured.flush?.(); // simulate visibilitychange/pagehide/blur firing immediately
    await Promise.resolve();
    expect(persist).toHaveBeenCalledTimes(1);
    expect(persist).toHaveBeenCalledWith('about to leave');

    // and the now-redundant debounce timer must not fire a second, stale save later
    await vi.advanceTimersByTimeAsync(10_000);
    expect(persist).toHaveBeenCalledTimes(1);
    s.dispose();
  });

  it('dispose() prevents any further saves, including an already-pending debounce', async () => {
    const state = 'x';
    const persist = vi.fn().mockResolvedValue(undefined);
    const s = createSyncScheduler({ getLatestState: () => state, persist, debounceMs: 50, addPageHideListeners: () => () => {} });

    s.notify();
    s.dispose();
    await vi.advanceTimersByTimeAsync(50);
    expect(persist).not.toHaveBeenCalled();
  });

  it('registers and unregisters real page-lifecycle listeners by default', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const windowAddSpy = vi.spyOn(window, 'addEventListener');
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');

    const s = createSyncScheduler({ getLatestState: () => null, persist: async () => {} });
    expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowAddSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));
    expect(windowAddSpy).toHaveBeenCalledWith('blur', expect.any(Function));

    s.dispose();
    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowRemoveSpy).toHaveBeenCalledWith('pagehide', expect.any(Function));
    expect(windowRemoveSpy).toHaveBeenCalledWith('blur', expect.any(Function));

    addSpy.mockRestore(); removeSpy.mockRestore(); windowAddSpy.mockRestore(); windowRemoveSpy.mockRestore();
  });
});
