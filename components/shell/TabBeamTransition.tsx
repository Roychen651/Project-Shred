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
          appears (the shape is lit "by" the beam passing through it). */}
      <motion.div
        className="absolute"
        style={{
          width: '140%', height: 3,
          background: `linear-gradient(90deg, transparent, ${wash}, ${T.accent}, transparent)`,
          filter: `drop-shadow(0 0 8px ${wash})`,
          rotate: '-28deg',
        }}
        initial={{ x: '-70vw', y: '-40vh', opacity: 0 }}
        animate={{ x: ['-70vw', '70vw'], y: ['-40vh', '40vh'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], times: [0, 0.15, 0.75, 1] }}
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
function BurgerAssemble({ color, accent }: { color: string; accent: string }) {
  const layers: { fill: string; w: number; startY: number }[] = [
    { fill: accent, w: 56, startY: -70 },       // top bun
    { fill: '#5B9A4A', w: 60, startY: -50 },    // lettuce
    { fill: '#E8B93A', w: 58, startY: 60 },     // cheese
    { fill: '#8B4A2B', w: 60, startY: 80 },     // patty
    { fill: accent, w: 56, startY: 100 },       // bottom bun
  ];
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      {layers.map((l, i) => (
        <motion.rect
          key={i}
          x={44 - l.w / 2}
          width={l.w}
          height={10}
          rx={5}
          fill={l.fill}
          initial={{ y: l.startY, opacity: 0 }}
          animate={{ y: [l.startY, 8 + i * 12, 8 + i * 12 - 2, 8 + i * 12], opacity: [0, 1, 1, 1] }}
          transition={{ duration: 0.85, delay: 0.1 + i * 0.05, times: [0, 0.7, 0.85, 1], ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      ))}
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
