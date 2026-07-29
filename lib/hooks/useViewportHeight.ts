'use client';

// ProjectShred.artifact.jsx:1478-1506 (Sprint 15.15, fixed further in 16.1).
//
// CSS vh/dvh units are unreliable in some embedded/iframe hosting contexts — they
// can resolve against a taller "virtual" document than what's actually visible,
// which is what caused sheets to render cut off regardless of how the vh
// percentage was tuned. Measuring the real, current visible height directly in
// JS — and re-measuring on resize — is the fix.
//
// window.visualViewport is preferred over window.innerHeight specifically because
// innerHeight often does NOT shrink when the on-screen keyboard opens on mobile,
// which is what caused sheet content (e.g. the portion input, the "add" button)
// to end up hidden behind the keyboard (Sprint 16.1).
//
// Implemented with useSyncExternalStore rather than useState+useEffect: this is
// exactly "subscribe to a value that lives outside React" — visualViewport isn't
// React state, so deriving it via an effect that calls setState synchronously on
// mount (the artifact's original shape) is the pattern React's own
// react-hooks/set-state-in-effect lint rule now flags. useSyncExternalStore is
// the built-in, tearing-safe primitive for this exact case, with no behavior
// change: same listeners, same measured value, same SSR fallback (800).

import { useSyncExternalStore } from 'react';

function getHeight(): number {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}

function getServerHeight(): number {
  return 800;
}

function subscribe(onChange: () => void): () => void {
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onChange);
    window.visualViewport.addEventListener('scroll', onChange);
  }
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  return () => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', onChange);
      window.visualViewport.removeEventListener('scroll', onChange);
    }
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
  };
}

export function useViewportHeight(): number {
  return useSyncExternalStore(subscribe, getHeight, getServerHeight);
}
