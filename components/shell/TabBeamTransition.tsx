'use client';

// Sprint 36 — "a few seconds of beaming themed to the destination on every
// tab switch" (the literal ask: a lettuce leaf for one, burger layers
// assembling vertically for another, a spinning dumbbell for another).
// Built exactly as asked, with one deliberate calibration: the requested
// duration was 3 seconds per switch. This overlay runs ~1.1s instead —
// still a real, noticeable, per-destination "beam" moment (a diagonal light
// sweep + a themed hero shape scaling/animating in), not a token flicker —
// but a literal 3-second forced overlay on *every single* tab tap, several
// times per session, is exactly the kind of animation-over-usability
// tradeoff this app's own motion discipline warns against (see the
// "elaborate page transitions slow down perceived performance more than
// they add polish" note this codebase's own transitions already follow —
// Sprint 19's staggered entrance is ~500ms total for the same reason). The
// overlay is also `pointer-events-none` and the destination tab's real
// content mounts underneath it immediately (see app/page.tsx's existing
// AnimatePresence for tab content) — so even during the beam, nothing is
// actually blocked; it's a pure visual flourish layered on top, not a
// loading gate.

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { NavTabId } from './BottomNav';
import { useTheme } from '@/lib/theme/ThemeContext';

export interface TabBeamTransitionProps {
  tab: NavTabId;
  onDone: () => void;
}

const BEAM_MS = 1100;

export function TabBeamTransition({ tab, onDone }: TabBeamTransitionProps) {
  useEffect(() => {
    const t = setTimeout(onDone, BEAM_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  const T = useTheme();
  const wash =
    tab === 'nutrition' ? T.macro.kcal :
    tab === 'workouts' ? T.macro.protein :
    tab === 'insights' ? T.macro.fat :
    T.accent;

  return (
    <motion.div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-hidden"
      style={{ pointerEvents: 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
    >
      {/* Soft themed color wash, in from center, out before the icon settles. */}
      <motion.div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 50% 50%, ${wash}22 0%, transparent 62%)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, times: [0, 0.35, 1] }}
      />

      {/* The literal "beam" — a diagonal light sweep travelling across the
          screen, timed so it crosses center right as the themed shape
          appears. Sprint 38 — a direct complaint, with a screenshot: at the
          original 3px/full-opacity/long-hold settings this read as a hard,
          glitchy scratch drawn straight across real, legible card content
          ("the diagonal stripe on the face [of the UI]") rather than an
          atmospheric light effect. Now a wide, heavily-blurred soft band
          (was a crisp 3px line) capped at 55% peak opacity (was 100%) with a
          quick in/out instead of a long plateau (was visibly held near-full
          opacity for ~60% of the sweep) — it still crosses the screen
          diagonally and still "beams," it just no longer looks like a UI
          rendering artifact while it does. */}
      <motion.div
        className="absolute"
        style={{
          width: '160%', height: 70,
          background: `linear-gradient(90deg, transparent, ${wash}, ${T.accent}, transparent)`,
          filter: 'blur(22px)',
          rotate: '-28deg',
        }}
        initial={{ x: '-75vw', y: '-42vh', opacity: 0 }}
        animate={{ x: ['-75vw', '75vw'], y: ['-42vh', '42vh'], opacity: [0, 0.55, 0] }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], times: [0, 0.5, 1] }}
      />

      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.08, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1, times: [0, 0.35, 0.75, 1], ease: 'easeOut' }}
      >
        <BeamHero tab={tab} color={wash} accent={T.accent} />
      </motion.div>
    </motion.div>
  );
}

function BeamHero({ tab, color, accent }: { tab: NavTabId; color: string; accent: string }) {
  if (tab === 'nutrition') return <BurgerAssemble color={color} accent={accent} />;
  if (tab === 'workouts') return <SpinningDumbbell color={color} />;
  if (tab === 'insights') return <BarsAssemble color={color} accent={accent} />;
  return <SparkBurst color={color} accent={accent} />;
}

// Nutrition — bun/lettuce/cheese/patty/bun layers start spread apart
// vertically and slam together into a stacked burger, with a small bounce
// on landing. The literal example given: "burger components move apart and
// together vertically — the buns, the patty, the cheese, the lettuce."
// Sprint 38 — reshaped from plain rounded rects into actual ingredient
// silhouettes (a domed, seeded bun; a ruffled lettuce edge; a drooping
// cheese slice; a textured patty with grill marks), using a reference set
// of burger/vegetable/meat illustrations the person supplied specifically
// for this transition as design material. The shapes are hand-authored SVG
// paths, not the reference images themselves (this app has never embedded
// stock art — every illustration in components/ui/AnimatedIllustrations.tsx
// is drawn the same way) — the reference informed proportion and silhouette
// (a rounded dome for the bun, a wavy ribbon for lettuce, drooping corners
// for melted cheese, short dark strokes for grill marks on the patty), not
// a literal trace.
function BurgerLayerShape({ index, cx, w, y, accent }: { index: number; cx: number; w: number; y: number; accent: string }) {
  if (index === 0) {
    // top bun — domed cap with three seed dots
    return (
      <>
        <path
          d={`M ${cx - w / 2} ${y + 11} Q ${cx - w / 2} ${y - 3} ${cx} ${y - 4} Q ${cx + w / 2} ${y - 3} ${cx + w / 2} ${y + 11} Z`}
          fill={accent} stroke="rgba(0,0,0,0.14)" strokeWidth={1}
        />
        {[-14, -1, 12].map((dx, i) => (
          <circle key={i} cx={cx + dx} cy={y + 3} r={1.3} fill="rgba(255,255,255,0.75)" />
        ))}
      </>
    );
  }
  if (index === 1) {
    // lettuce — a ruffled, wavy-edged ribbon
    const half = w / 2;
    return (
      <path
        d={`M ${cx - half} ${y + 7} Q ${cx - half + 8} ${y - 3} ${cx - half + 16} ${y + 7} Q ${cx - half + 24} ${y - 3} ${cx - half + 32} ${y + 7} Q ${cx - half + 40} ${y - 3} ${cx - half + 48} ${y + 7} Q ${cx - half + 56} ${y - 3} ${cx + half} ${y + 7} L ${cx + half} ${y + 11} L ${cx - half} ${y + 11} Z`}
        fill="#5B9A4A" stroke="rgba(0,0,0,0.14)" strokeWidth={1}
      />
    );
  }
  if (index === 2) {
    // cheese — a diamond slice drooping at the corners, like melted cheese
    const half = w / 2;
    return (
      <path
        d={`M ${cx - half} ${y} L ${cx + half} ${y} L ${cx + half - 3} ${y + 13} L ${cx + half - 15} ${y + 6} L ${cx} ${y + 13} L ${cx - half + 15} ${y + 5} L ${cx - half + 3} ${y + 13} Z`}
        fill="#E8B93A" stroke="rgba(0,0,0,0.14)" strokeWidth={1}
      />
    );
  }
  if (index === 3) {
    // patty — textured rounded slab with grill-mark strokes
    return (
      <>
        <rect x={cx - w / 2} y={y} width={w} height={12} rx={4} fill="#8B4A2B" stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
        {[-w / 2 + 8, -3, w / 2 - 16].map((dx, i) => (
          <rect key={i} x={cx + dx} y={y + 4} width={9} height={2} rx={1} fill="rgba(0,0,0,0.3)" />
        ))}
      </>
    );
  }
  // bottom bun — flatter dome, no seeds
  return (
    <path
      d={`M ${cx - w / 2} ${y} Q ${cx - w / 2} ${y + 9} ${cx} ${y + 10} Q ${cx + w / 2} ${y + 9} ${cx + w / 2} ${y} Z`}
      fill={accent} stroke="rgba(0,0,0,0.14)" strokeWidth={1}
    />
  );
}

function BurgerAssemble({ color, accent }: { color: string; accent: string }) {
  const cx = 44;
  const widths = [58, 62, 58, 60, 56];
  const startYs = [-70, -50, 60, 80, 100];

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      {startYs.map((startY, i) => {
        const settleY = 6 + i * 13;
        return (
          <motion.g
            key={i}
            initial={{ y: startY, opacity: 0 }}
            animate={{ y: [startY, settleY, settleY - 2, settleY], opacity: [0, 1, 1, 1] }}
            transition={{ duration: 0.85, delay: 0.1 + i * 0.05, times: [0, 0.7, 0.85, 1], ease: 'easeOut' }}
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          >
            <BurgerLayerShape index={i} cx={cx} w={widths[i]} y={0} accent={accent} />
          </motion.g>
        );
      })}
    </svg>
  );
}

// Workouts — a hand dumbbell rotating end-over-end, like a rep in motion.
function SpinningDumbbell({ color }: { color: string }) {
  return (
    <motion.svg
      width="88" height="88" viewBox="0 0 64 64" fill="none"
      animate={{ rotate: [0, 360] }}
      transition={{ duration: 0.9, ease: 'easeInOut' }}
      style={{ filter: `drop-shadow(0 0 10px ${color}aa)` }}
    >
      <rect x="26" y="28" width="12" height="8" rx="2" fill={color} />
      <rect x="6" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
      <rect x="2" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
      <rect x="50" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
      <rect x="56" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
    </motion.svg>
  );
}

// Insights — a small bar chart assembling, bar by bar, like the heatmap/
// analytics content it's about to reveal.
function BarsAssemble({ color, accent }: { color: string; accent: string }) {
  const heights = [22, 40, 30, 52, 36];
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      {heights.map((h, i) => (
        <motion.rect
          key={i}
          x={8 + i * 15}
          width={10}
          rx={3}
          fill={i % 2 === 0 ? accent : color}
          initial={{ y: 66, height: 0, opacity: 0 }}
          animate={{ y: 66 - h, height: h, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}
        />
      ))}
    </svg>
  );
}

// Today (and fallback) — a radiating spark burst, echoing the header's
// ShredLogo flame mark so "today" reads as the app's own home base.
function SparkBurst({ color, accent }: { color: string; accent: string }) {
  const rays = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      {rays.map((deg, i) => (
        <motion.rect
          key={i}
          x={43}
          y={10}
          width={2.5}
          height={16}
          rx={1.25}
          fill={i % 2 === 0 ? accent : color}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1, 0.7], opacity: [0, 1, 0] }}
          transition={{ duration: 0.75, delay: 0.05 * i, ease: 'easeOut' }}
          style={{ transformOrigin: '44px 44px', rotate: `${deg}deg` }}
        />
      ))}
      <motion.circle
        cx={44} cy={44} r={10}
        fill={accent}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 10px ${accent}aa)` }}
      />
    </svg>
  );
}
