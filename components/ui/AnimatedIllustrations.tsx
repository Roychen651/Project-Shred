'use client';

// Sprint 20 — hand-drawn (not stock-icon) SVG illustrations with continuous
// framer-motion loops, per the explicit "engaging animated illustrations,
// not just static icons" mandate. Kept small and purpose-built rather than
// pulling in an illustration library: each is a handful of shapes animated
// with simple, readable motion (float, rotate, squash) — the same register
// premium fitness/health apps use for empty-state and celebration moments,
// not a hero graphic. Placed at genuinely empty/celebratory spots (an unlogged
// meal slot, onboarding) rather than sprinkled everywhere, since constant
// motion on a data-dense screen fights readability rather than helping it.

import { motion } from 'framer-motion';

export interface IllustrationProps {
  size?: number;
  color?: string;
}

// A dumbbell that slowly rotates end-over-end, like it's mid-rep.
export function AnimatedDumbbell({ size = 64, color = '#3F8D6E' }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      animate={{ rotate: [-8, 8, -8] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="26" y="28" width="12" height="8" rx="2" fill={color} />
      <rect x="6" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
      <rect x="2" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
      <rect x="50" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
      <rect x="56" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
    </motion.svg>
  );
}

// A leafy salad bowl that bounces gently — a "fresh/healthy" empty-state cue.
export function AnimatedSalad({ size = 64, color = '#3F8D6E' }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path d="M8 34a24 24 0 0 0 48 0Z" fill={color} opacity={0.18} />
      <path d="M8 34a24 24 0 0 0 48 0" stroke={color} strokeWidth="3" strokeLinecap="round" fill="none" />
      <motion.path
        d="M22 30c-2-8 2-14 8-16"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '30px 30px' }}
      />
      <motion.path
        d="M32 30c1-10 6-16 13-17"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        animate={{ rotate: [0, 5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        style={{ transformOrigin: '32px 30px' }}
      />
      <circle cx="44" cy="24" r="3" fill={color} />
      <circle cx="24" cy="22" r="2.5" fill={color} opacity={0.8} />
    </motion.svg>
  );
}

// Sprint 22 — four more illustrations for real, functional spots (not
// decoration for its own sake): a heartbeat-style pulsing dumbbell for the
// Workouts tab header, a single bouncing lettuce leaf for the restaurant
// card icon, a flickering flame for the "over calorie target" chip, and a
// pop-in trophy for the PR badge. Same register as the Sprint 20 set —
// small hand-built shapes, simple readable motion, no illustration library.

// A dumbbell that stays put but throbs like a heartbeat monitor: a quick
// double-beat scale (the literal "still lifting, still alive" cue) plus a
// soft expanding ring behind it, the same visual language as an ECG pulse.
export function AnimatedPulsingDumbbell({ size = 64, color = '#3F8D6E' }: IllustrationProps) {
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [0.75, 1.4, 0.75], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
      />
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        className="relative"
        animate={{ scale: [1, 1.14, 1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.18, 0.32, 0.48, 1], ease: 'easeInOut' }}
      >
        <rect x="26" y="28" width="12" height="8" rx="2" fill={color} />
        <rect x="6" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
        <rect x="2" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
        <rect x="50" y="20" width="8" height="24" rx="3" fill={color} opacity={0.9} />
        <rect x="56" y="24" width="6" height="16" rx="2" fill={color} opacity={0.7} />
      </motion.svg>
    </div>
  );
}

// A single ruffled lettuce leaf hopping with a real squash-and-stretch —
// distinct from AnimatedSalad's whole-bowl bounce, for spots where the food
// theme should read as "fresh produce" specifically, not "a finished dish."
export function AnimatedJumpingLettuce({ size = 64, color = '#3F8D6E' }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      animate={{ y: [0, -11, 0], scaleY: [1, 0.9, 1.06, 1], scaleX: [1, 1.06, 0.96, 1] }}
      transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
      style={{ transformOrigin: '32px 54px' }}
    >
      <path
        d="M32 52c-14 0-22-10-22-22 4 2 8 1 10-3 3 5 8 6 12 3 4 3 9 2 12-3 2 4 6 5 10 3 0 12-8 22-22 22Z"
        fill={color}
        opacity={0.22}
      />
      <path
        d="M32 52c-14 0-22-10-22-22 4 2 8 1 10-3 3 5 8 6 12 3 4 3 9 2 12-3 2 4 6 5 10 3 0 12-8 22-22 22Z"
        stroke={color}
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M32 52V30" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity={0.55} />
      <path d="M24 46c2-6 4-10 8-14" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.45} />
      <path d="M40 46c-2-6-4-10-8-14" stroke={color} strokeWidth="2" strokeLinecap="round" opacity={0.45} />
    </motion.svg>
  );
}

// A flame that flickers — breathing scale + opacity on the outer tongue,
// slightly out of phase with a lighter inner core, so it reads as a real
// unsteady flicker rather than one shape pulsing uniformly.
export function AnimatedFlame({ size = 64, color = '#CE8027' }: IllustrationProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <motion.path
        d="M32 6C20 20 14 28 14 38c0 12 8 20 18 20s18-8 18-20c0-10-6-18-18-32Z"
        fill={color}
        animate={{ scale: [1, 1.06, 0.97, 1.04, 1], opacity: [0.92, 1, 0.85, 1, 0.92] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '32px 40px' }}
      />
      <motion.path
        d="M32 24c-6 8-8 14-8 20 0 6 4 10 8 10s8-4 8-10c0-6-2-12-8-20Z"
        fill="#fff"
        opacity={0.3}
        animate={{ scale: [1, 1.14, 0.94, 1.08, 1], opacity: [0.22, 0.4, 0.2, 0.36, 0.22] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
        style={{ transformOrigin: '32px 44px' }}
      />
    </motion.svg>
  );
}

// A small trophy that pops in with a spring overshoot + a soft pulsing
// halo behind it — the celebration beat for a new PR, replacing a static
// emoji with something that actually announces the moment.
export function AnimatedTrophy({ size = 20, color = '#CE8027' }: IllustrationProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      initial={{ scale: 0.3, rotate: -20, opacity: 0 }}
      animate={{ scale: [0.3, 1.2, 1], rotate: [-20, 10, 0], opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <motion.circle
        cx="16"
        cy="14"
        r="13"
        fill={color}
        animate={{ opacity: [0.3, 0, 0.3], scale: [0.8, 1.3, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
      <path d="M11 4h10v7a5 5 0 0 1-10 0V4Z" fill={color} />
      <path d="M11 6H6a4 4 0 0 0 4 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M21 6h5a4 4 0 0 1-4 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <rect x="14" y="17" width="4" height="5" fill={color} />
      <rect x="9" y="23" width="14" height="3" rx="1.5" fill={color} />
    </motion.svg>
  );
}

// A running figure with alternating stride — used for "goal hit" celebration.
export function AnimatedRunner({ size = 64, color = '#3F8D6E' }: IllustrationProps) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="38" cy="12" r="6" fill={color} />
      <motion.g
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        animate={{ x: [0, 3, 0, -3, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M34 20L28 34L36 40" />
        <path d="M36 40L44 46L52 40" />
        <motion.path
          d="M28 34L16 40"
          animate={{ d: ['M28 34L16 40', 'M28 34L18 26', 'M28 34L16 40'] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M36 40L46 52"
          animate={{ d: ['M36 40L46 52', 'M36 40L48 34', 'M36 40L46 52'] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M44 46L54 56"
          animate={{ d: ['M44 46L54 56', 'M44 46L34 54', 'M44 46L54 56'] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>
    </motion.svg>
  );
}
