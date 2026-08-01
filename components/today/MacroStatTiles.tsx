'use client';

// Sprint 25 — a real gap, not a cosmetic one: CompositeHeroRing only ever
// showed calories/protein (the two ring arcs); carbs and fat had no surface
// anywhere in this ported app's Today tab at all (the artifact's Sprint 15.2
// MacroBreakdownCard was never carried over — see docs/MIGRATION.md's
// remaining-work notes). This closes that gap and, per the new Dribbble
// reference screenshots (Biosora's protein/carbs/fat stat tiles with a
// floating delta badge on each), does it in the requested register: a
// pastel-tinted "neumorphic" card per macro (soft colored shadow derived
// from that macro's own fixed hex, not the accent — matching the app's
// long-standing rule that macro colors encode data meaning, not brand
// identity) with a small percentage-delta pill that floats OVER the tile's
// own top-right corner via absolute positioning, the literal "floating
// badge overlap" pattern from the reference.

import { motion } from 'framer-motion';
import { Beef, Wheat, Droplet } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import type { MacroTotals } from '@/lib/domain/items';
import type { DayTargets } from '@/lib/domain/targets';

export interface MacroStatTilesProps {
  consumed: Pick<MacroTotals, 'protein' | 'carbs' | 'fat'>;
  targets: Pick<DayTargets, 'protein' | 'carbs' | 'fat'>;
}

const TILES = [
  { key: 'protein' as const, label: 'חלבון', icon: Beef },
  { key: 'carbs' as const, label: 'פחמימה', icon: Wheat },
  { key: 'fat' as const, label: 'שומן', icon: Droplet },
];

export function MacroStatTiles({ consumed, targets }: MacroStatTilesProps) {
  const T = useTheme();
  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {TILES.map(({ key, label, icon: Icon }, i) => {
        const color = T.macro[key];
        const value = Math.round(consumed[key]);
        const target = Math.round(targets[key]);
        const pct = target > 0 ? Math.round((value / target) * 100) : 0;
        const delta = pct - 100;
        const isOver = delta > 0;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="relative flex flex-col gap-2 p-3 rounded-[28px]"
            style={{
              background: `${color}14`,
              border: `1px solid ${color}22`,
              // layered, colored, soft shadow — the "neumorphic tinted card"
              // request, derived from this tile's own macro hex.
              boxShadow: `${T.glow(color, 20, '26')}, 0 10px 22px -10px ${color}55`,
            }}
          >
            {target > 0 && (
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
              className="flex items-center justify-center rounded-full"
              style={{ width: 26, height: 26, background: `${color}26` }}
            >
              <Icon size={13} color={color} />
            </span>
            <div>
              <div
                className="text-lg font-black leading-none"
                style={{ fontFamily: FONT_DISPLAY, color: T.t.textPrimary, letterSpacing: '-0.02em' }}
              >
                {value}
                <span className="text-[11px] font-light" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>/{target}גר&apos;</span>
              </div>
              <div className="text-[10px] font-light uppercase mt-0.5" style={{ color: T.t.textDim, letterSpacing: '0.1em' }}>{label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
