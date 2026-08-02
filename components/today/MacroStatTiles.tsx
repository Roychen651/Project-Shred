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
//
// Sprint 46 — direct, repeated feedback that Arena 01 (this + the hero
// ring) needed a real design step-up, not another audit. The actual gap:
// these tiles told you the percentage as a floating number badge but never
// SHOWED fill state visually — a dashboard-viz miss (see
// dashboard-data-viz-design: "the ONE or TWO numbers that matter... give
// them real visual weight," and don't rely on numbers alone for a trend/
// state signal). Each tile now wraps its icon in a small radial progress
// ring — the same SVG stroke-arc technique CompositeHeroRing already uses,
// scaled down — so fill state reads at a glance from the ring alone, the
// number is a confirmation, not the only signal. The surface itself moved
// from a flat single-alpha wash to a two-stop gradient with a real top
// inner-highlight (glass catching light from above), and the percentage
// badge got a small trend arrow to match the icon+color dashboard-viz rule
// (never color alone).
import { useId, type ComponentType } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';

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
  const uid = useId().replace(/:/g, '');
  const color = T.macro[macroKey];
  const roundedValue = Math.round(value);
  const roundedTarget = Math.round(target);
  const pct = roundedTarget > 0 ? Math.round((roundedValue / roundedTarget) * 100) : 0;
  const delta = pct - 100;
  const isOver = delta > 0;
  const fillPct = Math.max(0, Math.min(roundedTarget > 0 ? roundedValue / roundedTarget : 0, 1));

  const ringSize = 40, stroke = 4.5;
  const r = (ringSize - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gradId = `macro-tile-grad-${macroKey}-${uid}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      // Sprint 48 — real regression, found from a screenshot: `overflow-
      // hidden` (added in Sprint 46 for the gradient background) also
      // clipped the delta-percentage badge below, which is DELIBERATELY
      // positioned outside the tile's own box (top:-8, a "floating overlap
      // badge" — see Sprint 19's header) to read as a chip stuck to the
      // card's corner. Clipped, only a tiny colored sliver survived —
      // exactly the "percentages running away" report. `overflow-hidden`
      // was never actually needed for the gradient in the first place:
      // `background` is always clipped to `border-radius` by the CSS box
      // model on its own, with no overflow property required at all.
      className={`relative flex flex-col justify-between gap-3 p-5 rounded-[32px] ${className}`}
      style={{
        background: `linear-gradient(160deg, ${color}20 0%, ${color}0A 60%)`,
        border: `1px solid ${color}28`,
        boxShadow: `${T.glow(color, 22, '2c')}, 0 12px 26px -12px ${color}5c, inset 0 1px 0 ${T.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)'}`,
      }}
    >
      {roundedTarget > 0 && (
        <span
          className="absolute flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{
            top: -8,
            insetInlineEnd: -6,
            fontFamily: FONT_MONO,
            background: isOver ? '#07080B' : color,
            color: isOver ? '#fff' : '#07080B',
            boxShadow: '0 4px 10px -3px rgba(0,0,0,0.35)',
          }}
        >
          {isOver ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
          {isOver ? '+' : ''}{delta}%
        </span>
      )}

      {/* Sprint 46 — the icon badge is now a real small progress ring, not a
          flat colored circle: fill state is visible without reading the
          number at all. */}
      <span className="relative flex items-center justify-center flex-shrink-0" style={{ width: ringSize, height: ringSize }}>
        <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={`color-mix(in srgb, ${color}, white 30%)`} />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          <circle cx={ringSize / 2} cy={ringSize / 2} r={r} stroke={`${color}22`} strokeWidth={stroke} fill="none" />
          <circle
            cx={ringSize / 2} cy={ringSize / 2} r={r} stroke={`url(#${gradId})`} strokeWidth={stroke} fill="none"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - fillPct)} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        <span className="absolute flex items-center justify-center rounded-full" style={{ width: 22, height: 22, background: `${color}26` }}>
          <Icon size={11} color={color} />
        </span>
      </span>

      <div>
        <div
          className="text-xl font-bold leading-none"
          style={{ fontFamily: FONT_MONO, color: T.t.textPrimary, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}
        >
          {roundedValue}
          <span className="text-[11px] font-light" style={{ color: T.t.textDim }}>/{roundedTarget}גר&apos;</span>
        </div>
        <div className="text-[10px] font-light uppercase mt-0.5" style={{ color: T.t.textDim, letterSpacing: '0.1em' }}>{label}</div>
      </div>
    </motion.div>
  );
}
