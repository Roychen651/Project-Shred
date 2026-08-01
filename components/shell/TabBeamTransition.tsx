'use client';

// Sprint 36 — "a few seconds of beaming themed to the destination on every
// tab switch" (the literal ask: a lettuce leaf for one, burger layers
// assembling vertically for another, a spinning dumbbell for another).
// Sprint 38 tried softening a diagonal light-sweep line that was drawing
// itself across real, legible content ("the diagonal stripe on the face").
// That still wasn't enough — Sprint 39, same complaint again, with a fuller
// picture from more screenshots: the *actual* root cause was never really
// the line's hardness, it was TIMING. app/page.tsx's tab content uses
// `AnimatePresence mode="wait"` with its own staggered 3D entrance
// (tabContainerVariants/tabItemVariants) — the destination tab's cards
// don't reach full opacity instantly, they ramp in over several hundred ms,
// child by child. This overlay used to run ~1.1s independently of that, so
// for a real chunk of its lifetime the beam was playing brightly *on top
// of* content that was itself still semi-transparent mid-entrance — which
// reads as "the whole page looks washed out and broken, with a stripe on
// it," exactly what the screenshots showed, not a hardness/blur problem.
// Fixed at the root this time: the diagonal sweep is gone entirely (a
// travelling line can never fully avoid this class of "crossing over
// something else's unfinished animation" problem) in favor of a single,
// brief, centered radiant flash — no travel, nothing that can visually
// collide with content elsewhere on screen — and the whole overlay is
// shortened to ~650ms, comfortably inside the tab content's own entrance
// window, so by the time the flash fades the destination cards are already
// legible underneath it rather than half-rendered.

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { NavTabId } from './BottomNav';
import { useTheme } from '@/lib/theme/ThemeContext';

export interface TabBeamTransitionProps {
  tab: NavTabId;
  onDone: () => void;
}

const BEAM_MS = 650;

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
      exit={{ opacity: 0, transition: { duration: 0.15 } }}
    >
      {/* A single centered radiant flash — the "beam," contained to one
          spot instead of travelling across the screen, so it can never
          cross over content elsewhere the way a sweeping line did. */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 220, height: 220, background: `radial-gradient(circle, ${wash}33 0%, transparent 70%)`, filter: 'blur(18px)' }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 1, 0], scale: [0.6, 1.15, 1.3] }}
        transition={{ duration: 0.55, times: [0, 0.4, 1], ease: 'easeOut' }}
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.05, 1], opacity: [0, 1, 0] }}
        transition={{ duration: 0.6, times: [0, 0.45, 1], ease: 'easeOut' }}
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
  // Sprint 40 — the previous travel distances (up to 76 units) sent each
  // layer far enough from the stack that, mid-flight and still only
  // partially opaque, an individual layer (wide ~60 units, short ~12) read
  // as its own isolated horizontal bar floating over the content behind it
  // — i.e. exactly the "stripe" complaint this transition was rebuilt in
  // Sprint 39 to eliminate, just relocated from the removed diagonal sweep
  // into the burger assembly itself. Fixed the same way: shrink the travel
  // so no layer is ever more than ~24 units from its landing spot — still
  // visibly "converging" (the literal ask: layers move apart and together
  // vertically) but never isolated far enough from the stack to read as an
  // unrelated line.
  const offsets = [-22, -18, 20, 22, 24];

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      {offsets.map((offset, i) => {
        const settleY = 6 + i * 13;
        const startY = settleY + offset;
        return (
          <motion.g
            key={i}
            initial={{ y: startY, opacity: 0 }}
            animate={{ y: [startY, settleY, settleY - 2, settleY], opacity: [0, 1, 1, 1] }}
            transition={{ duration: 0.4, delay: 0.02 + i * 0.025, times: [0, 0.7, 0.85, 1], ease: 'easeOut' }}
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
      transition={{ duration: 0.5, ease: 'easeInOut' }}
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
          transition={{ duration: 0.35, delay: 0.05 + i * 0.035, ease: [0.34, 1.56, 0.64, 1] }}
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
          transition={{ duration: 0.4, delay: 0.02 * i, ease: 'easeOut' }}
          style={{ transformOrigin: '44px 44px', rotate: `${deg}deg` }}
        />
      ))}
      <motion.circle
        cx={44} cy={44} r={10}
        fill={accent}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 10px ${accent}aa)` }}
      />
    </svg>
  );
}
