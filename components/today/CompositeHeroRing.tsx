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
//
// Sprint 16: two changes per direct reference-driven feedback (health/wearable
// app UI — huge, bold, flat black numerals, no glow). (1) The center number
// now renders in FONT_DISPLAY (Rubik, black weight) at a substantially larger
// size instead of the tabular mono face — reads as the single dominant
// element the reference treats it as, rather than a data-table figure.
// FONT_MONO is still used everywhere else numerals appear (unchanged; this is
// one deliberately special-cased element, not a token change). (2) The glow
// filter is now dark-mode only — light mode renders the crisp stroke with no
// bloom, matching the reference's flat, shadow-only depth language; dark mode
// keeps the full neon treatment from Sprint 14 unchanged.

// Sprint 19: "extreme typography" pass — the center numeral jumped from
// text-6xl to text-7xl (with the ring itself widened 220->248 to keep a
// 4-digit calorie count from crowding the inner stroke), gained a top-to-
// bottom white-to-dim gradient via bg-clip-text (a real linear-gradient
// text fill, not a flat color), and tighter negative tracking. The "נצרכו
// היום" micro-label above it went the opposite direction — font-light,
// uppercase, 0.25em letter-spacing — so the two sit at deliberately opposite
// ends of the weight scale instead of both being mid-weight, which is what
// actually reads as "designed contrast" rather than "two labels."
//
// Sprint 20: "Apple Fitness ring" pass — strokes thickened (16/10 -> 20/13,
// closer to Activity Rings' actual stroke-to-diameter ratio) and each
// gradient gained a real third stop (light tint -> base hue -> a hue
// deepened toward black) instead of a two-stop light-to-base sweep. SVG has
// no native conic-gradient, so a true Apple-style sweep isn't reachable
// without rasterizing a mask — a 3-stop linear gradient across the arc's
// bounding box is the honest approximation used here, matching what other
// production fitness-ring implementations do for the same reason. Track
// alpha nudged from 0.05 to 0.04 for a slightly deeper, more "recessed"
// groove.
//
// Sprint 17: direct feedback that the ring/chip language reads as "generic
// bootstrap" — flat single-hue strokes, a plain outline pill for the delta.
// Three changes, none touching the ring's actual data logic: (1) both arcs
// now stroke from a `<linearGradient>` (light tint -> full hex) instead of a
// flat color, the same technique that gives premium fitness-app rings visual
// depth without adding a literal glow; (2) a soft radial color-wash sits
// behind the ring in BOTH modes now (previously dark-mode-only via the page
// background blobs) so the ring has real presence instead of floating on a
// flat card; (3) the delta pill at the bottom gained an icon and a gradient
// fill instead of a flat 20%-alpha wash, matching the "crafted chip, not a
// default badge" direction.
import { useId, useEffect } from 'react';
import { TrendingDown } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import { AnimatedFlame } from '@/components/ui/AnimatedIllustrations';
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
  const gradOuterId = `hero-grad-outer-${uid}`;
  const gradInnerId = `hero-grad-inner-${uid}`;
  // Sprint 19 — bumped 220 -> 248 to make room for the much larger center
  // numeral (text-7xl) requested; at the old size a 4-digit calorie count in
  // Rubik Black would have pressed right up against the inner stroke.
  const size = 248, strokeOuter = 20, strokeInner = 13;
  const rOuter = (size - strokeOuter) / 2;
  const rInner = rOuter - strokeOuter / 2 - strokeInner / 2 - 6;
  const circOuter = 2 * Math.PI * rOuter;
  const circInner = 2 * Math.PI * rInner;
  const kcalPct = Math.max(0, Math.min(targets.kcal > 0 ? consumed.kcal / targets.kcal : 0, 1));
  const proteinPct = Math.max(0, Math.min(targets.protein > 0 ? consumed.protein / targets.protein : 0, 1));
  const remaining = Math.round(targets.kcal - consumed.kcal);
  const isOver = remaining < 0;
  const isDark = T.mode === 'dark';
  // Sprint 26 — direct "this graph looks bad" feedback, checked for a real
  // rendering bug first (there wasn't one: strokeDashoffset math was
  // re-verified against the DOM and matches the percentages exactly). The
  // actual problem was contrast: T.t.border in light mode (#E4DAC8, a warm
  // tan tuned for card edges) sits close in hue AND lightness to the
  // lightened start of the kcal gradient (a whitened bronze), so the
  // fill-vs-track boundary was genuinely hard to read at a glance — a
  // legitimate "muddy" complaint, not a matter of taste. A dedicated,
  // neutral warm-gray track (not color-matched to any macro hue) restores
  // real contrast without touching the fill gradients themselves.
  const trackColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(122,108,90,0.16)';
  // A crisp leading-edge marker (the same "value dot" wearable-app rings use)
  // so progress reads unambiguously even before comparing hues/lengths.
  // Computed in the SVG's own pre-rotation coordinate space (the <svg> itself
  // carries `rotate(-90deg)`), so the marker rotates correctly for free —
  // circle stroke-dasharray/offset always starts at angle 0 (3 o'clock) and
  // advances clockwise, which is exactly what this mirrors.
  const markerPoint = (r: number, pct: number) => {
    const theta = pct * Math.PI * 2;
    return { x: size / 2 + r * Math.cos(theta), y: size / 2 + r * Math.sin(theta) };
  };
  const kcalMarker = markerPoint(rOuter, kcalPct);
  const proteinMarker = markerPoint(rInner, proteinPct);

  // Sprint 22 — the center number used to snap instantly on every item
  // toggle/edit. A spring-driven count-up (the standard framer-motion
  // "animated counter" pattern: an external MotionValue kept in sync via
  // effect, fed through a spring, then rendered as a MotionValue child —
  // framer-motion subscribes to it directly, no per-frame setState) reads as
  // a genuinely premium touch on the single most-looked-at figure in the app.
  const kcalTarget = useMotionValue(consumed.kcal);
  const kcalSpring = useSpring(kcalTarget, { stiffness: 90, damping: 20, mass: 0.5 });
  const kcalDisplay = useTransform(kcalSpring, (v) => Math.round(v).toString());
  useEffect(() => {
    kcalTarget.set(consumed.kcal);
  }, [consumed.kcal, kcalTarget]);

  return (
    <div className="relative flex items-center justify-center mx-auto" style={{ width: size, height: size }}>
      {/* ambient color wash behind the ring — present in both modes now, not
          just borrowed from the dark-mode page-level blobs */}
      <div
        aria-hidden
        className="absolute rounded-full pointer-events-none"
        style={{
          width: size * 1.55, height: size * 1.55,
          background: `radial-gradient(circle, ${T.macro.kcal}${isDark ? '2e' : '20'} 0%, ${T.macro.protein}${isDark ? '20' : '14'} 45%, transparent 72%)`,
          filter: 'blur(28px)',
        }}
      />
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible', position: 'relative' }}>
        <defs>
          <linearGradient id={gradOuterId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`color-mix(in srgb, ${T.macro.kcal}, white 35%)`} />
            <stop offset="55%" stopColor={T.macro.kcal} />
            <stop offset="100%" stopColor={`color-mix(in srgb, ${T.macro.kcal}, black 20%)`} />
          </linearGradient>
          <linearGradient id={gradInnerId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`color-mix(in srgb, ${T.macro.protein}, white 35%)`} />
            <stop offset="55%" stopColor={T.macro.protein} />
            <stop offset="100%" stopColor={`color-mix(in srgb, ${T.macro.protein}, black 20%)`} />
          </linearGradient>
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
        <circle cx={size / 2} cy={size / 2} r={rOuter} stroke={trackColor} strokeWidth={strokeOuter} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={rOuter} stroke={`url(#${gradOuterId})`} strokeWidth={strokeOuter} fill="none"
          strokeDasharray={circOuter} strokeDashoffset={circOuter * (1 - kcalPct)} strokeLinecap="round"
          filter={isDark ? `url(#${glowOuterId})` : undefined}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
        <circle cx={size / 2} cy={size / 2} r={rInner} stroke={trackColor} strokeWidth={strokeInner} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={rInner} stroke={`url(#${gradInnerId})`} strokeWidth={strokeInner} fill="none"
          strokeDasharray={circInner} strokeDashoffset={circInner * (1 - proteinPct)} strokeLinecap="round"
          filter={isDark ? `url(#${glowInnerId})` : undefined}
          style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)' }}
        />
        {kcalPct > 0.02 && (
          <circle cx={kcalMarker.x} cy={kcalMarker.y} r={strokeOuter / 2 + 2.5} fill={T.macro.kcal} stroke={T.t.bg} strokeWidth={3} />
        )}
        {proteinPct > 0.02 && (
          <circle cx={proteinMarker.x} cy={proteinMarker.y} r={strokeInner / 2 + 2} fill={T.macro.protein} stroke={T.t.bg} strokeWidth={2.5} />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Sprint 19 — extreme typographic contrast: an almost weightless,
            widely-tracked uppercase micro-label set directly against a
            massive, black-weight, gradient-filled numeral right below it. */}
        <span className="text-[10px] font-light uppercase" style={{ color: T.t.textDim, letterSpacing: '0.25em' }}>נצרכו היום</span>
        <motion.span
          className="text-7xl font-black leading-none mt-2"
          style={{
            fontFamily: FONT_DISPLAY,
            letterSpacing: '-0.04em',
            backgroundImage: `linear-gradient(to bottom, ${T.t.textPrimary}, ${T.t.textDim})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {kcalDisplay}
        </motion.span>
        <span className="text-xs mt-1" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>מתוך {targets.kcal} קל׳</span>
        <span
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full mt-2.5"
          style={{
            background: isOver
              ? `linear-gradient(135deg, color-mix(in srgb, ${T.macro.kcal}, white 20%), ${T.macro.kcal})`
              : `linear-gradient(135deg, color-mix(in srgb, ${T.macro.protein}, white 20%), ${T.macro.protein})`,
            color: '#07080B',
            boxShadow: `0 4px 14px -4px ${isOver ? T.macro.kcal : T.macro.protein}70`,
          }}
        >
          {isOver ? <AnimatedFlame size={16} color="#07080B" /> : <TrendingDown size={12} />}
          {isOver ? `+${Math.abs(remaining)} מעל היעד` : `${remaining} נותרו`}
        </span>
      </div>
    </div>
  );
}
