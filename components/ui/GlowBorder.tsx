'use client';

// Sprint 27 — the actual technique behind Aceternity/Magic UI's "moving
// border" effect: an oversized div filled with a conic-gradient sits behind
// the card, rotating continuously; an inset layer carrying the card's own
// opaque/glass background sits on top of it, covering everything except a
// thin ring at the very edge — that visible sliver is what reads as a
// glowing, animated border. No external animation library needed (this app
// already uses framer-motion everywhere), and no CSS `mask`/`clip-path`
// dependency that would need extra browser-support hedging.
//
// Deliberately not applied to every card — a continuously-rotating gradient
// on every tile would compete for attention on a data-dense screen (the same
// restraint principle CLAUDE.md documents for AnimatedIllustrations: motion
// belongs at genuinely special/empty/celebratory spots, not sprinkled
// everywhere). Reserved for the single most important element per screen.

import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';

export interface GlowBorderProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
}

export function GlowBorder({ children, className = '', style = {}, borderRadius = 32, borderWidth = 2, duration = 7 }: GlowBorderProps) {
  const T = useTheme();
  const accent = T.accent;

  return (
    <div className={`relative ${className}`} style={{ borderRadius, padding: borderWidth, overflow: 'hidden', ...style }}>
      <motion.div
        aria-hidden
        className="absolute"
        style={{
          inset: '-60%',
          background: `conic-gradient(from 0deg, transparent 0%, ${accent} 12%, transparent 24%, transparent 76%, ${accent} 88%, transparent 100%)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration, repeat: Infinity, ease: 'linear' }}
      />
      <div
        className="relative"
        style={{ borderRadius: borderRadius - borderWidth, background: T.t.card, boxShadow: T.t.shadowCard, overflow: 'hidden' }}
      >
        {children}
      </div>
    </div>
  );
}
