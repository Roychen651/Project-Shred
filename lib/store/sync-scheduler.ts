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

export interface SyncScheduler {
  /** Call after every state mutation. Debounces, then flushes. */
  notify: () => void;
  /** Stop the debounce timer and remove the page-lifecycle listeners. */
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
  /** Injectable so this is testable without a real DOM/browser environment. */
  addPageHideListeners?: (flush: () => void) => () => void;
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

export function createSyncScheduler<T>(options: SyncSchedulerOptions<T>): SyncScheduler {
  const {
    getLatestState,
    persist,
    debounceMs = 350,
    onSaving,
    onSaved,
    onError,
    addPageHideListeners = defaultAddPageHideListeners,
  } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  const flush = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (disposed) return;
    onSaving?.();
    persist(getLatestState())
      .then(() => { if (!disposed) onSaved?.(); })
      .catch((err) => { if (!disposed) onError?.(err); });
  };

  const notify = () => {
    if (disposed) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(flush, debounceMs);
  };

  const removeListeners = addPageHideListeners(flush);

  const dispose = () => {
    disposed = true;
    if (timer !== null) clearTimeout(timer);
    removeListeners();
  };

  return { notify, dispose };
}
