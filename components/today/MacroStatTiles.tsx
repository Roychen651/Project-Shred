'use client';

// Sprint 25 — closed a real gap: CompositeHeroRing only ever showed
// calories/protein; carbs and fat had no surface anywhere on the Today tab.
// Pastel-tinted "neumorphic" tile per macro (soft colored shadow derived
// from that macro's own fixed hex, not the accent) with a floating
// percentage-delta badge overlapping the tile's own top-right corner.
//
// Sprint 27 — refactored from a component that rendered its own internal
// 3-column grid into a single-tile export (`MacroStatTile`). The Bento grid
// mandate needs each metric to be its own independently-placed grid cell
// with its own column/row span (some square, some full-width) — that's not
// reachable if three tiles are locked into one nested grid-cols-3 wrapper.
// The page-level grid now places each tile directly, passing whatever
// className (col-span-1 / col-span-2) fits that tile's role in the layout.

import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';

export interface MacroStatTileProps {
  macroKey: 'protein' | 'carbs' | 'fat';
  label: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  value: number;
  target: number;
  className?: string;
  delay?: number;
}

export function MacroStatTile({ macroKey, label, icon: Icon, value, target, className = '', delay = 0 }: MacroStatTileProps) {
  const T = useTheme();
  const color = T.macro[macroKey];
  const roundedValue = Math.round(value);
  const roundedTarget = Math.round(target);
  const pct = roundedTarget > 0 ? Math.round((roundedValue / roundedTarget) * 100) : 0;
  const delta = pct - 100;
  const isOver = delta > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`relative flex flex-col justify-between gap-3 p-5 rounded-[32px] ${className}`}
      style={{
        background: `${color}14`,
        border: `1px solid ${color}22`,
        boxShadow: `${T.glow(color, 20, '26')}, 0 10px 22px -10px ${color}55`,
      }}
    >
      {roundedTarget > 0 && (
        <span
          className="absolute flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            top: -8,
            insetInlineEnd: -6,
            fontFamily: FONT_MONO,
            background: isOver ? '#07080B' : color,
            color: isOver ? '#fff' : '#07080B',
            boxShadow: '0 4px 10px -3px rgba(0,0,0,0.35)',
          }}
        >
          {isOver ? '+' : ''}{delta}%
        </span>
      )}
      <span
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 30, height: 30, background: `${color}26` }}
      >
        <Icon size={14} color={color} />
      </span>
      <div>
        <div
          className="text-xl font-black leading-none"
          style={{ fontFamily: FONT_DISPLAY, color: T.t.textPrimary, letterSpacing: '-0.02em' }}
        >
          {roundedValue}
          <span className="text-[11px] font-light" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>/{roundedTarget}גר&apos;</span>
        </div>
        <div className="text-[10px] font-light uppercase mt-0.5" style={{ color: T.t.textDim, letterSpacing: '0.1em' }}>{label}</div>
      </div>
    </motion.div>
  );
}
