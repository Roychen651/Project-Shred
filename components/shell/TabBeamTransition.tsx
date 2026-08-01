'use client';

// Sprint 36 — "a few seconds of beaming themed to the destination on every
// tab switch." Sprint 38-40 fixed two real bugs in this transition (a
// diagonal sweep line, then the burger-assembly layers themselves, both
// reading as a stray "stripe" over content) by keeping every travelling
// shape CONTAINED — never isolated far from where it's landing while still
// translucent. That constraint stands; it's why this rewrite still reads
// clean. What Sprint 41 changes is everything else, per direct feedback
// that the beam was too short to register ("it's over in a second") and
// that two of the four destination animations didn't obviously say what
// they were about:
//
// - BEAM_MS: 650ms -> 1600ms — genuinely longer, not just "less snappy."
//   Every per-tab animation below was re-timed to use the extra time for a
//   real second stage (an impact flash, a garnish burst, a spin, a trend
//   sweep) rather than just playing the old animation slower.
// - Today's SparkBurst (abstract rays — the actual complaint: "not clear
//   what this is, not really related to the topic") is replaced by
//   ShredFlameAssemble, which reuses the *exact* three shard paths from
//   ShredLogo.tsx. Today's transition is now, literally, the app's own
//   brand mark assembling itself from its shattered pieces — unambiguous
//   and on-theme by construction, since it's a second use of a shape the
//   person already recognizes from the header.
// - Nutrition's burger gained two more layers (tomato, onion — closer to
//   the full stack in the burger reference sheet) and a garnish burst of
//   hand-drawn vegetable doodles (VeggieDoodleIcons.tsx, built from the
//   second reference sheet) flying outward once it lands — a much more
//   direct, visible use of that reference than the confetti mix-in alone.
// - Workouts' dumbbell now assembles (plates sliding onto the bar) before
//   it spins, instead of just spinning from frame one.
// - Insights' bars now get a trend-line sweep across their tops after they
//   land, which is what actually reads as "analytics" rather than "some
//   bars."

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { NavTabId } from './BottomNav';
import { useTheme } from '@/lib/theme/ThemeContext';
import { VEGGIE_DOODLES } from '@/components/ui/VeggieDoodleIcons';

export interface TabBeamTransitionProps {
  tab: NavTabId;
  onDone: () => void;
}

const BEAM_MS = 1600;

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
      exit={{ opacity: 0, transition: { duration: 0.22 } }}
    >
      {/* A single centered radiant flash — contained to one spot instead of
          travelling across the screen, so it can never cross over content
          elsewhere the way the old sweeping line did (Sprint 39/40). */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: 260, height: 260, background: `radial-gradient(circle, ${wash}33 0%, transparent 70%)`, filter: 'blur(20px)' }}
        initial={{ opacity: 0, scale: 0.55 }}
        animate={{ opacity: [0, 1, 0.7, 0], scale: [0.55, 1.1, 1.25, 1.4] }}
        transition={{ duration: 1.4, times: [0, 0.3, 0.7, 1], ease: 'easeOut' }}
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.06, 1, 1, 0.96], opacity: [0, 1, 1, 1, 0] }}
        transition={{ duration: 1.5, times: [0, 0.28, 0.4, 0.85, 1], ease: 'easeOut' }}
      >
        <BeamHero tab={tab} color={wash} accent={T.accent} protein={T.macro.protein} />
      </motion.div>
    </motion.div>
  );
}

function BeamHero({ tab, color, accent, protein }: { tab: NavTabId; color: string; accent: string; protein: string }) {
  if (tab === 'nutrition') return <BurgerAssemble color={color} accent={accent} />;
  if (tab === 'workouts') return <SpinningDumbbell color={color} />;
  if (tab === 'insights') return <BarsAssemble color={color} accent={accent} />;
  return <ShredFlameAssemble accent={accent} protein={protein} />;
}

// Today (and fallback) — the app's own brand mark (ShredLogo.tsx) exploded
// into its three shards, flying in from off-screen and slamming together
// into the exact flame it forms in the header, then a bright impact ring
// and a handful of embers burst outward. Reusing the logo's own paths
// means this reads unmistakably as "home / the app itself," not an
// abstract shape — directly answering "not clear what this is."
const SHARDS = [
  { d: 'M33 3 L44 22 L30 27 L26 12 Z', origin: '35px 15px', fromX: -54, fromY: -34, fromRotate: -150, delay: 0.02 },
  { d: 'M30 27 L45 24 L48 40 L28 46 L20 34 Z', origin: '34px 34px', fromX: 56, fromY: -22, fromRotate: 140, delay: 0.11 },
  { d: 'M28 46 L48 40 L44 56 L24 60 L18 50 Z', origin: '32px 52px', fromX: -14, fromY: 58, fromRotate: -120, delay: 0.2 },
];

function ShredFlameAssemble({ accent, protein }: { accent: string; protein: string }) {
  return (
    <svg width="100" height="100" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="beamFlameGrad" x1="8" y1="6" x2="52" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={protein} />
        </linearGradient>
      </defs>
      {SHARDS.map((s, i) => (
        <motion.path
          key={i}
          d={s.d}
          fill="url(#beamFlameGrad)"
          initial={{ x: s.fromX, y: s.fromY, rotate: s.fromRotate, scale: 0.5, opacity: 0 }}
          animate={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: s.delay, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: s.origin, filter: `drop-shadow(0 0 9px ${accent}aa)` }}
        />
      ))}
      {/* impact ring — starts once the last shard has actually landed
          (~0.9s: the base shard's 0.2s delay + 0.7s travel) */}
      <motion.circle
        cx={33} cy={32} r={24}
        fill="none"
        stroke={accent}
        strokeWidth={2}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0.3, 1.25, 1.65] }}
        transition={{ duration: 0.55, delay: 0.88, ease: 'easeOut' }}
      />
      {/* embers scattering outward, right behind the ring */}
      {Array.from({ length: 7 }, (_, i) => (i * 360) / 7).map((deg, i) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <motion.circle
            key={i}
            cx={33} cy={32} r={2}
            fill={i % 2 === 0 ? accent : protein}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 0], x: Math.cos(rad) * 26, y: Math.sin(rad) * 26, scale: [0.6, 1, 0.5] }}
            transition={{ duration: 0.5, delay: 0.92 + i * 0.02, ease: 'easeOut' }}
          />
        );
      })}
    </svg>
  );
}

// Nutrition — bun/lettuce/tomato/cheese/onion/patty/bun layers start spread
// apart vertically and slam together into a stacked burger, with a small
// bounce on landing, then a burst of hand-drawn vegetable doodles flies
// outward as a "garnish" flourish. The literal example given: "burger
// components move apart and together vertically." Reshaped in Sprint 38
// from plain rects into ingredient silhouettes, using a reference set of
// burger/vegetable/meat illustrations supplied as design material. The
// shapes are hand-authored SVG paths, not the reference images themselves
// (this app has never embedded stock art) — the reference informed
// proportion and silhouette, not a literal trace. Sprint 40 fixed a real
// bug here: travel distances over ~24 units made an individual layer read
// as its own isolated floating stripe — every layer below still respects
// that limit, including the two new ones.
function BurgerLayerShape({ kind, cx, w, y, accent }: { kind: string; cx: number; w: number; y: number; accent: string }) {
  if (kind === 'bun-top') {
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
  if (kind === 'lettuce') {
    const half = w / 2;
    return (
      <path
        d={`M ${cx - half} ${y + 7} Q ${cx - half + 8} ${y - 3} ${cx - half + 16} ${y + 7} Q ${cx - half + 24} ${y - 3} ${cx - half + 32} ${y + 7} Q ${cx - half + 40} ${y - 3} ${cx - half + 48} ${y + 7} Q ${cx - half + 56} ${y - 3} ${cx + half} ${y + 7} L ${cx + half} ${y + 11} L ${cx - half} ${y + 11} Z`}
        fill="#5B9A4A" stroke="rgba(0,0,0,0.14)" strokeWidth={1}
      />
    );
  }
  if (kind === 'tomato') {
    // three overlapping round slices, seed dots inside each
    const offsets = [-w / 2 + 9, 1, w / 2 - 11];
    return (
      <>
        {offsets.map((dx, i) => (
          <g key={i}>
            <circle cx={cx + dx} cy={y + 5} r={7} fill="#D8382C" stroke="rgba(0,0,0,0.16)" strokeWidth={1} />
            <circle cx={cx + dx - 2} cy={y + 3.5} r={1} fill="rgba(255,255,255,0.5)" />
            <circle cx={cx + dx + 2.5} cy={y + 6} r={0.9} fill="rgba(255,255,255,0.4)" />
          </g>
        ))}
      </>
    );
  }
  if (kind === 'cheese') {
    const half = w / 2;
    return (
      <path
        d={`M ${cx - half} ${y} L ${cx + half} ${y} L ${cx + half - 3} ${y + 13} L ${cx + half - 15} ${y + 6} L ${cx} ${y + 13} L ${cx - half + 15} ${y + 5} L ${cx - half + 3} ${y + 13} Z`}
        fill="#E8B93A" stroke="rgba(0,0,0,0.14)" strokeWidth={1}
      />
    );
  }
  if (kind === 'onion') {
    // thin purple-white rings, matching the reference sheet's onion rings
    const offsets = [-w / 2 + 10, -w / 2 + 26, w / 2 - 14];
    return (
      <>
        {offsets.map((dx, i) => (
          <ellipse key={i} cx={cx + dx} cy={y + 5} rx={7} ry={4} fill="none" stroke="#B389C9" strokeWidth={2.4} />
        ))}
      </>
    );
  }
  if (kind === 'patty') {
    return (
      <>
        <rect x={cx - w / 2} y={y} width={w} height={12} rx={4} fill="#8B4A2B" stroke="rgba(0,0,0,0.18)" strokeWidth={1} />
        {[-w / 2 + 8, -3, w / 2 - 16].map((dx, i) => (
          <rect key={i} x={cx + dx} y={y + 4} width={9} height={2} rx={1} fill="rgba(0,0,0,0.3)" />
        ))}
      </>
    );
  }
  // bun-bottom — flatter dome, no seeds
  return (
    <path
      d={`M ${cx - w / 2} ${y} Q ${cx - w / 2} ${y + 9} ${cx} ${y + 10} Q ${cx + w / 2} ${y + 9} ${cx + w / 2} ${y} Z`}
      fill={accent} stroke="rgba(0,0,0,0.14)" strokeWidth={1}
    />
  );
}

const BURGER_LAYERS = ['bun-top', 'lettuce', 'tomato', 'cheese', 'onion', 'patty', 'bun-bottom'];
const GARNISH_ICONS = [
  VEGGIE_DOODLES[4], // tomato
  VEGGIE_DOODLES[5], // broccoli
  VEGGIE_DOODLES[7], // olive
  VEGGIE_DOODLES[0], // carrot
  VEGGIE_DOODLES[1], // chili
  VEGGIE_DOODLES[6], // pineapple
];

function BurgerAssemble({ color, accent }: { color: string; accent: string }) {
  const cx = 44;
  const widths = [58, 60, 56, 58, 54, 60, 56];
  // Sprint 40 — never more than ~24 units from a layer's landing spot (see
  // header note); still visibly "converging" without ever isolating far
  // enough to read as an unrelated stripe.
  const offsets = [-22, -18, 20, 18, -20, 22, 24];
  const stepY = 88 / (BURGER_LAYERS.length + 1);

  return (
    <div style={{ position: 'relative', width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 88 88" fill="none">
        {BURGER_LAYERS.map((kind, i) => {
          const settleY = stepY * i - 4;
          const startY = settleY + offsets[i];
          return (
            <motion.g
              key={kind}
              initial={{ y: startY, opacity: 0 }}
              animate={{ y: [startY, settleY, settleY - 2, settleY], opacity: [0, 1, 1, 1] }}
              transition={{ duration: 0.55, delay: 0.02 + i * 0.045, times: [0, 0.7, 0.85, 1], ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
            >
              <BurgerLayerShape kind={kind} cx={cx} w={widths[i]} y={0} accent={accent} />
            </motion.g>
          );
        })}
      </svg>
      {/* garnish burst — hand-drawn vegetable doodles radiating outward once
          the stack has landed, a direct, highly-visible use of the second
          reference sheet (not just the confetti mix-in). */}
      {GARNISH_ICONS.map((Icon, i) => {
        const deg = (360 / GARNISH_ICONS.length) * i - 90;
        const rad = (deg * Math.PI) / 180;
        const dist = 50;
        const x = Math.cos(rad) * dist;
        const y = Math.sin(rad) * dist;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: '50%', top: '48%', marginLeft: -9, marginTop: -9 }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.35, rotate: 0 }}
            animate={{ opacity: [0, 1, 1, 0], x: [0, x * 0.55, x], y: [0, y * 0.55, y], scale: [0.35, 1, 1, 0.75], rotate: [0, i % 2 === 0 ? 50 : -50] }}
            transition={{ duration: 0.65, delay: 0.8 + i * 0.03, ease: 'easeOut' }}
          >
            <Icon size={18} />
          </motion.div>
        );
      })}
    </div>
  );
}

// Workouts — a hand dumbbell that assembles first (two weight plates sliding
// onto the bar with a spring landing), then spins end-over-end like a rep in
// motion, settling back to level.
function SpinningDumbbell({ color }: { color: string }) {
  return (
    <svg width="100" height="100" viewBox="0 0 64 64" fill="none">
      <motion.g
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, 0, 405, 355, 360] }}
        transition={{ duration: 1.15, delay: 0.55, times: [0, 0.05, 0.72, 0.9, 1], ease: 'easeInOut' }}
        style={{ transformOrigin: '32px 32px', filter: `drop-shadow(0 0 10px ${color}aa)` }}
      >
        <rect x="26" y="28" width="12" height="8" rx="2" fill={color} />
        <motion.g
          initial={{ x: -36, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <rect x="6" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
          <rect x="2" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
        </motion.g>
        <motion.g
          initial={{ x: 36, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <rect x="50" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
          <rect x="56" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
        </motion.g>
      </motion.g>
    </svg>
  );
}

// Insights — a bar chart assembling bar by bar, then a trend-line sweep
// draws itself across their tops and lands on a highlighted point — the
// motif that actually reads as "analytics," not just "some bars."
function BarsAssemble({ color, accent }: { color: string; accent: string }) {
  const heights = [22, 40, 30, 52, 36];
  const tops = heights.map((h) => 66 - h);
  const points = heights.map((_, i) => `${8 + i * 15 + 5} ${tops[i] - 6}`).join(' L ');
  return (
    <svg width="100" height="100" viewBox="0 0 88 88" fill="none">
      {heights.map((h, i) => (
        <motion.rect
          key={i}
          x={8 + i * 15}
          width={10}
          rx={3}
          fill={i % 2 === 0 ? accent : color}
          initial={{ y: 66, height: 0, opacity: 0 }}
          animate={{ y: tops[i], height: h, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 + i * 0.08, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}
        />
      ))}
      <motion.path
        d={`M ${points}`}
        fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.65, delay: 0.62, ease: 'easeInOut' }}
        style={{ filter: `drop-shadow(0 0 6px ${accent}aa)` }}
      />
      <motion.circle
        cx={8 + 4 * 15 + 5} cy={tops[4] - 6} r={3.5}
        fill={accent}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1] }}
        transition={{ duration: 0.35, delay: 1.2, ease: 'easeOut' }}
        style={{ filter: `drop-shadow(0 0 8px ${accent}aa)` }}
      />
    </svg>
  );
}
