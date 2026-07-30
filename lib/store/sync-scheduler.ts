// The Sprint 16.2 save-safety pattern, extracted as a standalone, framework- and
// backend-agnostic utility. ProjectShred.artifact.jsx:6013-6065.
//
// THE BUG THIS EXISTS TO PREVENT: every save was originally debounced by a fixed
// delay to avoid writing on every keystroke. If the person left the app (backgrounded
// it, closed the tab, switched apps) BEFORE that timer fired, the pending save was
// simply lost — mobile browsers and app webviews routinely throttle or tear down JS
// timers the moment a page loses focus, and "log a meal, immediately switch apps" is
// an extremely normal, fast mobile interaction. This was a real, reported data-loss
// bug, not a hypothetical.
//
// THE FIX, preserved exactly: a ref-like `getLatestState()` always resolves to the
// current state (avoiding stale-closure bugs from a listener registered once), a
// normal debounced flush handles the common case, and `visibilitychange` / `pagehide`
// / `blur` listeners force an IMMEDIATE, un-debounced flush the instant the page is
// backgrounded or about to unload — the standard pattern for exactly this class of
// "save before the user leaves" problem.
//
// Sprint 10 — offline resilience. This app is a real PWA now (Sprint 9's
// manifest/install prompt), and a PWA that silently drops writes the moment
// a phone loses signal (a gym basement is the literal example that prompted
// this) isn't actually offline-resilient. Rather than building a separate
// discrete mutation queue, this leans on what's already true of this sync
// model: every flush re-sends the FULL current state (see supabaseSync.ts's
// upsert-everything-present approach), so "the thing to retry" is always
// just "flush again" — there's no queue of discrete operations to persist
// separately from the state itself. What was missing was purely the
// TRIGGER: nothing ever re-attempted a save after a failed one if the user
// made no further local changes. Two additions close that gap: flush() now
// checks connectivity before attempting a write at all (skips the network
// call and a guaranteed-failed request), and an `online` listener forces an
// immediate retry the instant connectivity returns — no more waiting for an
// unrelated future edit to accidentally re-trigger a sync.
export interface SyncScheduler {
  /** Call after every state mutation. Debounces, then flushes. */
  notify: () => void;
  /** Stop the debounce timer and remove the page-lifecycle/connectivity listeners. */
  dispose: () => void;
}

export interface SyncSchedulerOptions<T> {
  /** Resolves to the current state at flush time — never a stale closure. */
  getLatestState: () => T;
  /** Performs the actual write (e.g. Supabase upserts). Errors are swallowed —
   * best-effort persistence should never crash the UI; see onError. */
  persist: (state: T) => Promise<void>;
  /** Debounce delay for the common case (default matches the artifact: 350ms
   * originally, tightened to 80ms once the flush safety net existed — this
   * module keeps it configurable rather than re-guessing a number). */
  debounceMs?: number;
  onSaving?: () => void;
  onSaved?: () => void;
  onError?: (err: unknown) => void;
  /** Called whenever a flush is skipped (or the browser reports a fresh
   * disconnect) because there's no connectivity right now. Distinct from
   * onError — this isn't a failure the user needs to act on, just a status. */
  onOffline?: () => void;
  /** Injectable so this is testable without a real DOM/browser environment. */
  addPageHideListeners?: (flush: () => void) => () => void;
  /** Injectable connectivity source. Defaults to navigator.onLine + the
   * window 'online'/'offline' events. */
  isOffline?: () => boolean;
  addConnectivityListeners?: (onOnline: () => void, onOffline: () => void) => () => void;
}

function defaultAddPageHideListeners(flush: () => void): () => void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return () => {};
  }
  const onVisibility = () => { if (document.hidden) flush(); };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flush);
  window.addEventListener('blur', flush);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', flush);
    window.removeEventListener('blur', flush);
  };
}

function defaultIsOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function defaultAddConnectivityListeners(onOnline: () => void, onOffline: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

export function createSyncScheduler<T>(options: SyncSchedulerOptions<T>): SyncScheduler {
  const {
    getLatestState,
    persist,
    debounceMs = 350,
    onSaving,
    onSaved,
    onError,
    onOffline,
    addPageHideListeners = defaultAddPageHideListeners,
    isOffline = defaultIsOffline,
    addConnectivityListeners = defaultAddConnectivityListeners,
  } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  // True whenever a notify()->flush() cycle wanted to write but connectivity
  // wasn't there for it — the signal the 'online' handler retries against.
  let hasPendingWrite = false;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (disposed) return;
    if (isOffline()) {
      hasPendingWrite = true;
      onOffline?.();
      return;
    }
    onSaving?.();
    persist(getLatestState())
      .then(() => { if (!disposed) { hasPendingWrite = false; onSaved?.(); } })
      .catch((err) => { if (!disposed) onError?.(err); });
  };

  const notify = () => {
    if (disposed) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  const removeListeners = addPageHideListeners(flush);
  const removeConnectivityListeners = addConnectivityListeners(
    () => { if (hasPendingWrite) flush(); },
    () => onOffline?.()
  );

  const dispose = () => {
    disposed = true;
    if (timer !== null) clearTimeout(timer);
    removeListeners();
    removeConnectivityListeners();
  };

  return { notify, dispose };
}
