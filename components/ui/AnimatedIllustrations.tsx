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
