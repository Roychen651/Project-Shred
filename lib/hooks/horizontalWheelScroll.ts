// Sprint 45 — real, well-known web-platform gap: an `overflow-x-auto` pill
// strip (category tabs, portion units, the date-picker strip, etc.) works
// fine with touch drag or a trackpad's two-finger horizontal swipe, but a
// plain vertical mouse wheel does NOT scroll a horizontal-overflow
// container by default in any browser — there's no CSS for this, it has to
// be done in JS. This app has nine such strips (category tabs across the
// Plate Composer/Restaurant Matrix/Kitchen Hacks/custom-ingredient picker,
// portion units, the date-picker strip, the favorites bar, the workout-
// exercise picker, the compliance heatmap), and every one of them shared
// the same gap. One handler, applied everywhere a horizontal strip exists,
// rather than nine ad-hoc reimplementations (or restructuring these into
// wrapped grids on desktop, which would undo the compact horizontal-pill
// pattern this app deliberately chose — see the Sprint 15.23/23 compaction
// notes in CLAUDE.md).
import type { WheelEvent } from 'react';

// Found the hard way while verifying the desktop fix, not assumed: this
// app is dir="rtl" throughout, and most of these strips (every category-tab
// pill row) inherit that direction rather than force dir="ltr" the way
// DateNavigator/ComplianceHeatmap's chronological strips deliberately do.
// In an RTL container, Chromium's `scrollLeft` uses the "negative" model —
// 0 at the start (visually the right edge) counting DOWN to
// -(scrollWidth - clientWidth) at the end — not the 0..max range a LTR
// container uses. A plain `scrollLeft += deltaY` pushes an RTL strip toward
// positive values, which the browser just clamps back to 0, so the strip
// silently never moves. Checked directly against the real DOM (scrollLeft
// stayed pinned at ~0/1 no matter how large a delta was applied) before
// writing this fix — not inferred from spec reading alone.
export function scrollHorizontallyOnWheel(e: WheelEvent<HTMLElement>) {
  // Only hijack the wheel when it's predominantly vertical (a normal mouse
  // wheel) — a trackpad's native horizontal gesture already reports a
  // meaningful deltaX and should pass through untouched.
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    const el = e.currentTarget;
    const isRtl = getComputedStyle(el).direction === 'rtl';
    el.scrollLeft += isRtl ? -e.deltaY : e.deltaY;
  }
}
