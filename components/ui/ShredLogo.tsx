'use client';

// Sprint 46 — full rebuild, not a tweak. The Sprint 36 mark (three angular
// shards with visible gaps between them) was a legible idea at large
// preview sizes but fell apart at the actual header size it's rendered at
// (~26px): the gaps between shards just read as blur/noise, not as a
// deliberate "shredded" silhouette — confirmed directly against a
// screenshot of the live header, not assumed.
//
// The fix is a genuinely different construction, not a recolor: a single
// faceted, low-poly flame silhouette (one closed path, straight angular
// segments only — no bezier curves, which is what actually turned the
// previous version blurry at small size) with two flat internal facet
// triangles layered on top (a light highlight near the tip, a dark shade
// near the base) to read as cut glass/a gem catching light — a precision/
// strength point of view, not a soft rounded blob. The facets are simple
// opacity-only overlay shapes, not cutouts, so the overall silhouette
// stays one solid readable shape at icon size.
//
// Still carries the same accent->protein gradient (recoloring the accent
// still recolors the mark, no hardcoded brand hex), and the same
// feGaussianBlur+feMerge stroke-glow technique already used on
// CompositeHeroRing/Sparkline. Motion is a single slow opacity flicker on
// the outer shape — subtler than the old three-shards drift, and doesn't
// fight the mark's legibility at small size.

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
        background: T.mode === 'dark' ? 'rgba(255,255,255,0.05)' : `${T.t.card}FA`,
        border: `1px solid ${T.t.border}`,
        boxShadow: T.glow(T.accent, 16, T.mode === 'dark' ? '40' : '26'),
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={gradId} x1="10" y1="4" x2="48" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={T.accent} />
            <stop offset="100%" stopColor={T.macro.protein} />
          </linearGradient>
          <filter id={glowId} x="-70%" y="-70%" width="240%" height="240%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* A faceted, low-poly flame — straight angular segments only, no
            bezier curves, which is what actually keeps a mark crisp at
            24-30px (curves with many control points are what turned the
            previous version into a blur at that size). One solid outer
            silhouette + one lighter internal facet triangle to read as
            "cut glass/gem catching light," which is the mark's real point
            of view: strength/precision, not softness. */}
        <motion.path
          d="M32 3 L44 22 L57 29 L47 45 L52 60 L32 53 L12 60 L17 45 L7 29 L20 22 Z"
          fill={`url(#${gradId})`}
          filter={`url(#${glowId})`}
          animate={{ opacity: [1, 0.9, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '32px 32px' }}
        />
        <path d="M32 3 L44 22 L32 30 L20 22 Z" fill="#FFFFFF" opacity={0.28} />
        <path d="M32 30 L47 45 L32 53 L17 45 Z" fill="#000000" opacity={0.1} />
      </svg>
    </div>
  );
}
