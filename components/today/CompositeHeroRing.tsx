'use client';

// ProjectShred.artifact.jsx:5333-5377 (Sprint 14, redesigned Sprint 15.2). One
// composite ring: calories as the bold outer arc, protein as the slimmer inner
// arc. The center leads with calories CONSUMED (not remaining) as the primary
// number — Sprint 15.2's fix for "unclear how much I've eaten" — with a colored
// pill showing the signed delta against target below it.
//
// Sprint 5: each progress arc now renders twice — once through an SVG <filter>
// (feGaussianBlur + feMerge) for a soft neon-tube glow, once crisp on top — the
// standard SVG technique for glow-on-a-stroke, since `filter: drop-shadow` alone
// blurs the whole element including its sharp edge. `useId()` keeps the filter
// ids collision-safe if this ring is ever rendered more than once on a page.
//
// Sprint 14: with dark mode now permanent, the glow went from a single soft
// blur pass to a genuine two-layer neon-tube halo — a wide, soft outer bloom
// (large stdDeviation) merged with a tighter inner bloom (small stdDeviation)
// before the crisp source stroke, the same layering real neon signage photos
// show (a broad ambient glow plus a brighter near-tube halo), rather than one
// blur radius doing both jobs at once.

import { useId } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import type { MacroTotals } from '@/lib/domain/items';
import type { DayTargets } from '@/lib/domain/targets';

export interface CompositeHeroRingProps {
  consumed: Pick<MacroTotals, 'kcal' | 'protein'>;
  targets: Pick<DayTargets, 'kcal' | 'protein'>;
}

export function CompositeHeroRing({ consumed, targets }: CompositeHeroRingProps) {
  const T = useTheme();
  const uid = useId().replace(/:/g, '');
  const glowOuterId = `hero-glow-outer-${uid}`;
  const glowInnerId = `hero-glow-inner-${uid}`;
  const size = 220, strokeOuter = 16, strokeInner = 10;
  const rOuter = (size - strokeOuter) / 2;
  const rInner = rOuter - strokeOuter / 2 - strokeInner / 2 - 6;
  const circOuter = 2 * Math.PI * rOuter;
  const circInner = 2 * Math.PI * rInner;
  const kcalPct = Math.max(0, Math.min(targets.kcal > 0 ? consumed.kcal / targets.kcal : 0, 1));
  const proteinPct = Math.max(0, Math.min(targets.protein > 0 ? consumed.protein / targets.protein : 0, 1));
  const remaining = Math.round(targets.kcal - consumed.kcal);
  const isOver = remaining < 0;

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <filter id={glowOuterId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="wideBloom" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="tightBloom" />
            <feMerge>
              <feMergeNode in="wideBloom" />
              <feMergeNode in="tightBloom" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={glowInnerId} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="wideBloom" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="tightBloom" />
            <feMerge>
              <feMergeNode in="wideBloom" />
              <feMergeNode in="tightBloom" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={rOuter} stroke={T.t.border} strokeWidth={strokeOuter} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={rOuter} stroke={T.macro.kcal} strokeWidth={strokeOuter} fill="none"
          strokeDasharray={circOuter} strokeDashoffset={circOuter * (1 - kcalPct)} strokeLinecap="round"
          filter={`url(#${glowOuterId})`}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
        <circle cx={size / 2} cy={size / 2} r={rInner} stroke={T.t.border} strokeWidth={strokeInner} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={rInner} stroke={T.macro.protein} strokeWidth={strokeInner} fill="none"
          strokeDasharray={circInner} strokeDashoffset={circInner * (1 - proteinPct)} strokeLinecap="round"
          filter={`url(#${glowInnerId})`}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-semibold" style={{ color: T.t.textDim, letterSpacing: '0.03em' }}>נצרכו היום</span>
        <span className="text-5xl font-bold leading-none mt-1.5" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{Math.round(consumed.kcal)}</span>
        <span className="text-xs mt-1" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>מתוך {targets.kcal} קל׳</span>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full mt-2.5"
          style={{
            background: isOver ? `${T.macro.kcal}20` : `${T.macro.protein}20`,
            color: isOver ? T.macro.kcal : T.macro.protein,
          }}
        >
          {isOver ? `+${Math.abs(remaining)} מעל היעד` : `${remaining} נותרו`}
        </span>
      </div>
    </div>
  );
}
