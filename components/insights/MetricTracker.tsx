'use client';

// ProjectShred.artifact.jsx:2587-2660. Weekly weight/waist entry + two compact
// sparklines. The artifact could always fall back to the previous entry's
// value when only one field was filled in (`weight: w || last.weight`)
// because every profile was seeded with a real first data point on creation.
// This port deliberately starts every account with an EMPTY metricEntries
// (see docs/MIGRATION.md — the Sprint 10 synthetic seed was dropped on
// purpose).
//
// Sprint 37 — the plain number inputs here had a real, reported bug: both
// used `dir="ltr"` (to make the numeral read left-to-right) with a Hebrew
// placeholder string ("משקל שבוע חדש") — a Hebrew (RTL-script) run inside an
// LTR-direction box gets laid out per the Unicode bidi algorithm as an RTL
// segment anchored at the container's logical start, and once the flex-item
// width got tight (three flex-1 items with a shared minWidth in one row) the
// placeholder's leading characters were clipped, exactly matching the
// screenshot ("ל שבוע חדש" / "ְף מותן חדש" — missing the first couple of
// glyphs on each). It also came with a separate, non-bug complaint: "make
// this feel technological, weight/training-themed, with a premium
// slider/+- control" — both are fixed together here by replacing the plain
// inputs with WeighInDial: a proper Hebrew `<label>` OUTSIDE the numeric
// display (labels don't have this bidi-clipping failure mode — Stepper,
// this app's other custom numeric control, already proved that pattern
// safe), a dark "device screen" numeral readout with a text-glow, and a
// gradient-filled range slider (the same track-fill technique
// PortionInput's sliders already use) for fast coarse adjustment. Every
// entry now always carries both weight and waist since the dials never
// start blank (defaulting to the last known entry, or a neutral first-time
// baseline) — the previous "first entry needs both fields explicitly typed"
// rule doesn't apply to a control that never renders empty in the first
// place.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Ruler, Dumbbell, Minus, Plus } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, tactileGradient } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Sparkline } from '@/components/ui/Sparkline';
import { dateKey } from '@/lib/domain/dates';
import type { MetricEntry } from '@/lib/store/shred-store';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

// Neutral first-time baselines — the same numbers DEFAULT_PROFILES already
// seeds a brand-new profile's own weight/waist with (lib/store/shred-store.ts),
// so a person who has never logged a metric entry sees a dial starting from
// a value this app already considers "a plausible generic person," not an
// arbitrary new constant.
const DEFAULT_WEIGHT = 75;
const DEFAULT_WAIST = 90;

interface WeighInDialProps {
  icon: typeof Scale;
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  min: number;
  max: number;
  color: string;
}

function WeighInDial({ icon: Icon, label, unit, value, onChange, step, min, max, color }: WeighInDialProps) {
  const T = useTheme();
  const decimals = step < 1 ? 1 : 0;
  const bump = (delta: number) => onChange(Math.min(max, Math.max(min, Number((value + delta).toFixed(decimals)))));
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 flex-1" style={{ minWidth: 148 }}>
      <div className="flex items-center gap-1.5">
        <Icon size={12} color={color} />
        <span className="text-[10px] font-bold uppercase" style={{ color: T.t.textDim, letterSpacing: '0.1em' }}>{label}</span>
      </div>

      {/* A device "screen" — deliberately dark regardless of app theme, the
          same way a real digital scale/gym-equipment display always is,
          which is the concrete visual cue that reads as "technological"
          rather than just another form field. */}
      <div
        className="flex items-center justify-between gap-1.5 rounded-2xl px-2 py-2"
        style={{ background: '#111112', border: `1px solid ${color}40`, boxShadow: `inset 0 2px 6px rgba(0,0,0,0.6), 0 0 16px -6px ${color}55` }}
      >
        <motion.button
          type="button"
          onClick={() => bump(-step)}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          transition={tapSpring}
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 28, height: 28, ...tactileGradient(color) }}
          aria-label={`הפחת ${label}`}
        >
          <Minus size={13} color="#07080B" />
        </motion.button>

        <span
          dir="ltr"
          className="text-xl font-black tabular-nums leading-none"
          style={{ fontFamily: FONT_MONO, color, textShadow: `0 0 10px ${color}99` }}
        >
          {value.toFixed(decimals)}
          <span className="text-[10px] font-bold" style={{ color: `${color}bb`, marginInlineStart: 2 }}>{unit}</span>
        </span>

        <motion.button
          type="button"
          onClick={() => bump(step)}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.08 }}
          transition={tapSpring}
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width: 28, height: 28, ...tactileGradient(color) }}
          aria-label={`הוסף ${label}`}
        >
          <Plus size={13} color="#07080B" />
        </motion.button>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} — כוונון גס`}
        style={{ accentColor: color, background: `linear-gradient(to left, ${color} ${pct}%, ${T.t.border} ${pct}%)` }}
      />
    </div>
  );
}

export interface MetricTrackerProps {
  entries: MetricEntry[];
  onAddEntry: (entry: Omit<MetricEntry, 'id'>) => void;
}

export function MetricTracker({ entries, onAddEntry }: MetricTrackerProps) {
  const T = useTheme();
  const last = entries[entries.length - 1];
  const [weight, setWeight] = useState(last?.weight ?? DEFAULT_WEIGHT);
  const [waist, setWaist] = useState(last?.waist ?? DEFAULT_WAIST);

  const addEntry = () => {
    onAddEntry({ date: dateKey(new Date()), weight, waist });
  };

  const weightPoints = entries.filter((e) => e.weight !== undefined).map((e) => ({ date: e.date, value: e.weight! }));
  const waistPoints = entries.filter((e) => e.waist !== undefined).map((e) => ({ date: e.date, value: e.waist! }));

  return (
    <GlassCard className={T.spacing.card}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow>ARENA 05 · METRICS</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מעקב שבועי — משקל והיקף מותן</h3>
        </div>
        <Dumbbell size={22} color={T.accent} />
      </div>

      {entries.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: T.t.textDim }}>עדיין אין נתונים — כווננו את הדיילים למטה ולחצו &quot;הוסף&quot; כדי לרשום את המדידה הראשונה.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div style={{ color: T.t.textPrimary }}>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={14} color={T.accent} />
              <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>משקל (ק״ג)</span>
            </div>
            {weightPoints.length > 0
              ? <Sparkline data={weightPoints} color={T.accent} unit="kg" />
              : <p className="text-xs" style={{ color: T.t.textDim }}>אין עדיין נתוני משקל.</p>}
          </div>
          <div style={{ color: T.t.textPrimary }}>
            <div className="flex items-center gap-2 mb-2">
              <Ruler size={14} color={T.macro.kcal} />
              <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>היקף מותן (ס״מ)</span>
            </div>
            {waistPoints.length > 0
              ? <Sparkline data={waistPoints} color={T.macro.kcal} unit="cm" />
              : <p className="text-xs" style={{ color: T.t.textDim }}>אין עדיין נתוני היקף מותן.</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-end pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <WeighInDial icon={Scale} label="משקל" unit="ק״ג" value={weight} onChange={setWeight} step={0.1} min={30} max={200} color={T.accent} />
        <WeighInDial icon={Ruler} label="היקף מותן" unit="ס״מ" value={waist} onChange={setWaist} step={0.5} min={40} max={160} color={T.macro.kcal} />
        <motion.button
          onClick={addEntry}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.03 }}
          transition={tapSpring}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold flex-shrink-0"
          style={{ ...tactileGradient(T.macro.protein), color: '#07080B' }}
        >
          <Plus size={15} /> הוסף
        </motion.button>
      </div>
    </GlassCard>
  );
}
