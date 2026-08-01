'use client';

// Sprint 36 — a real brand mark instead of a generic lucide-react <Sparkles>
// icon sitting in a gradient box (which is what the header used since
// Sprint 4's rebrand and never revisited). "Shred" reads two ways at once —
// getting lean (the app's whole premise) and literally torn/shattered — so
// the mark is a flame built from three angular, offset shards instead of one
// smooth glyph: it reads as "flame" at a glance (calorie burn) but the gaps
// between the shards are the actual logo idea, not a rendering accident.
// Each shard carries its own point on the accent->protein gradient already
// used for the header's old box-fill, so recoloring the accent still
// recolors the mark automatically — no hardcoded brand hex was introduced.
//
// The shards drift independently (different phase/duration per shard) on a
// slow, continuous loop — this is the one hero brand element on screen, the
// single "at most one cursor-aware/continuous-motion element per page"
// allowance the motion-microinteractions discipline calls for elsewhere in
// this app (TiltCard's cursor glare is the other One). A `feGaussianBlur`+
// `feMerge` glow filter (the same stroke-glow technique already used on
// CompositeHeroRing/Sparkline since Sprint 5/14) makes the mark actually
// glow in dark mode instead of just sitting flat on the gradient box.

import { useId } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';

export interface ShredLogoProps {
  size?: number;
}

export function ShredLogo({ size = 42 }: ShredLogoProps) {
  const T = useTheme();
  const uid = useId();
  const gradId = `shred-logo-grad-${uid}`;
  const glowId = `shred-logo-glow-${uid}`;

  return (
    <div
      className="flex items-center justify-center rounded-2xl flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: T.mode === 'dark' ? 'rgba(255,255,255,0.04)' : `${T.t.card}FA`,
        border: `1px solid ${T.t.border}`,
        boxShadow: T.glow(T.accent, 16, T.mode === 'dark' ? '3a' : '22'),
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={gradId} x1="8" y1="6" x2="52" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={T.accent} />
            <stop offset="100%" stopColor={T.macro.protein} />
          </linearGradient>
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Top shard — the "tip" of the flame, tilts and drifts on its own. */}
        <motion.path
          d="M33 3 L44 22 L30 27 L26 12 Z"
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          animate={{ x: [0, 1.4, 0], y: [0, -1.6, 0], rotate: [0, 2.2, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '35px 15px' }}
        />
        {/* Middle shard — the flame's widest belly. */}
        <motion.path
          d="M30 27 L45 24 L48 40 L28 46 L20 34 Z"
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          opacity={0.92}
          animate={{ x: [0, -1.2, 0], y: [0, 1.4, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
          style={{ transformOrigin: '34px 34px' }}
        />
        {/* Base shard — the flame's foot, anchors the mark visually. */}
        <motion.path
          d="M28 46 L48 40 L44 56 L24 60 L18 50 Z"
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          opacity={0.85}
          animate={{ x: [0, 1, 0], y: [0, 1.8, 0], rotate: [0, -1.6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          style={{ transformOrigin: '32px 52px' }}
        />
      </svg>
    </div>
  );
}
