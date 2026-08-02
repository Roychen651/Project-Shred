'use client';

// ProjectShred.artifact.jsx:2587-2660. Weekly weight/waist entry + compact
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
// placeholder's leading characters were clipped. Fixed by WeighInDial: a
// proper Hebrew <label> OUTSIDE the numeric display, a dark "device screen"
// numeral readout with a text-glow, and a gradient-filled range slider.
//
// Sprint 47 — three real, reported gaps closed together:
// (1) Logging a new weigh-in had NO visible effect anywhere — traced to
//     addMetricEntry (shred-store.ts) never updating profile.weight, the
//     only number computeProfileTargets() actually reads. That's now
//     wired at the store level; this component's job is just to SHOW the
//     effect once it happens, via a real before/after comparison instead
//     of silence. `profile` is now a required prop specifically so this
//     component can compute "what would the target have been with the
//     old weight" using the exact same formula, not an approximation.
// (2) Chest circumference, tracked the same way waist already is.
// (3) A one-data-point DualTrendChart draws literally nothing (a single
//     SVG "M" moveto with no line segment) — the parent (app/page.tsx)
//     now gates on >=2 entries and shows a real placeholder instead of an
//     empty-looking chart for the in-between "logged once" state.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Ruler, Dumbbell, Minus, Plus, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, tactileGradient } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Sparkline } from '@/components/ui/Sparkline';
import { dateKey } from '@/lib/domain/dates';
import { computeProfileTargets } from '@/lib/domain/targets';
import { roundNum } from '@/lib/domain/util';
import type { MetricEntry, Profile } from '@/lib/store/shred-store';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

// Neutral first-time baselines — the same numbers DEFAULT_PROFILES already
// seeds a brand-new profile's own weight/waist with (lib/store/shred-store.ts),
// so a person who has never logged a metric entry sees a dial starting from
// a value this app already considers "a plausible generic person," not an
// arbitrary new constant.
const DEFAULT_WEIGHT = 75;
const DEFAULT_WAIST = 90;
const DEFAULT_CHEST = 100;

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
  profile: Profile;
}

export function MetricTracker({ entries, onAddEntry, profile }: MetricTrackerProps) {
  const T = useTheme();
  const last = entries[entries.length - 1];
  const [weight, setWeight] = useState(last?.weight ?? DEFAULT_WEIGHT);
  const [waist, setWaist] = useState(last?.waist ?? DEFAULT_WAIST);
  const [chest, setChest] = useState(last?.chest ?? DEFAULT_CHEST);
  const [justAdded, setJustAdded] = useState(false);

  // Sprint 47 — a submitted-entry-count "snapshot" instead of comparing
  // live entries.length directly in the effect body: this fires once per
  // actual submission (entries growing) without ever calling setState
  // synchronously inside the render body itself — the standard fix for
  // this codebase's recurring react-hooks/set-state-in-effect trap (see
  // CLAUDE.md — AddToHomeScreenPrompt/ExerciseRow/WorkoutPanel).
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 8000);
    return () => clearTimeout(t);
  }, [justAdded]);

  const addEntry = () => {
    onAddEntry({ date: dateKey(new Date()), weight, waist, chest });
    setJustAdded(true);
  };

  const weightPoints = entries.filter((e) => e.weight !== undefined).map((e) => ({ date: e.date, value: e.weight! }));
  const waistPoints = entries.filter((e) => e.waist !== undefined).map((e) => ({ date: e.date, value: e.waist! }));
  const chestPoints = entries.filter((e) => e.chest !== undefined).map((e) => ({ date: e.date, value: e.chest! }));

  // The real "you lost X, so now Y" comparison — computed from the actual
  // Mifflin-St Jeor chain (computeProfileTargets), swapping only the
  // weight, not approximated from a flat kcal-per-kg rule of thumb. `last`
  // here is the entry BEFORE the one just submitted (entries[len-2]),
  // since by the time this renders, `entries`/`profile.weight` already
  // reflect the new submission.
  const prevEntry = entries.length >= 2 ? entries[entries.length - 2] : null;
  const insight = justAdded && prevEntry && prevEntry.weight !== undefined && last?.weight !== undefined
    ? (() => {
        const weightDelta = roundNum(last.weight! - prevEntry.weight!);
        const newTargets = computeProfileTargets(profile);
        const oldTargets = computeProfileTargets({ ...profile, weight: prevEntry.weight });
        const kcalDelta = newTargets.rest.kcal - oldTargets.rest.kcal;
        return { weightDelta, kcalDelta, newKcal: newTargets.rest.kcal };
      })()
    : null;

  return (
    <GlassCard className={T.spacing.card}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Eyebrow>ARENA 05 · METRICS</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מעקב שבועי — משקל, היקף מותן וחזה</h3>
        </div>
        <Dumbbell size={22} color={T.accent} />
      </div>

      <AnimatePresence>
        {insight && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-2xl"
              style={{ background: `${T.accent}14`, border: `1px solid ${T.accent}30` }}
            >
              <Sparkles size={16} color={T.accent} className="flex-shrink-0 mt-0.5" />
              <div className="text-sm" style={{ color: T.t.textPrimary }}>
                {insight.weightDelta === 0 ? (
                  <span>המשקל נשאר יציב מהמדידה הקודמת.</span>
                ) : (
                  <span className="flex items-center gap-1 flex-wrap">
                    {insight.weightDelta < 0 ? <TrendingDown size={13} color={T.macro.protein} /> : <TrendingUp size={13} color={T.macro.kcal} />}
                    <b style={{ fontFamily: FONT_MONO }}>{insight.weightDelta > 0 ? '+' : ''}{insight.weightDelta} ק״ג</b>
                    מהמדידה הקודמת —
                    {insight.kcalDelta !== 0 ? (
                      <span>
                        יעד הקלוריות היומי {insight.kcalDelta < 0 ? 'ירד' : 'עלה'} ב-
                        <b style={{ fontFamily: FONT_MONO }}>{Math.abs(insight.kcalDelta)} קל&apos;</b>, ל-
                        <b style={{ fontFamily: FONT_MONO }}>{insight.newKcal} קל&apos;</b> ביום מנוחה.
                      </span>
                    ) : (
                      <span>יעד הקלוריות לא השתנה (שינוי קטן מדי כדי להשפיע על הנוסחה).</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: T.t.textDim }}>עדיין אין נתונים — כווננו את הדיילים למטה ולחצו &quot;הוסף&quot; כדי לרשום את המדידה הראשונה.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div style={{ color: T.t.textPrimary }}>
            <div className="flex items-center gap-2 mb-2">
              <Scale size={14} color={T.accent} />
              <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>משקל (ק״ג)</span>
            </div>
            {weightPoints.length > 1
              ? <Sparkline data={weightPoints} color={T.accent} unit="kg" />
              : <p className="text-xs" style={{ color: T.t.textDim }}>עוד מדידה אחת כדי לראות מגמה.</p>}
          </div>
          <div style={{ color: T.t.textPrimary }}>
            <div className="flex items-center gap-2 mb-2">
              <Ruler size={14} color={T.macro.kcal} />
              <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>היקף מותן (ס״מ)</span>
            </div>
            {waistPoints.length > 1
              ? <Sparkline data={waistPoints} color={T.macro.kcal} unit="cm" />
              : <p className="text-xs" style={{ color: T.t.textDim }}>עוד מדידה אחת כדי לראות מגמה.</p>}
          </div>
          <div style={{ color: T.t.textPrimary }}>
            <div className="flex items-center gap-2 mb-2">
              <Ruler size={14} color={T.macro.protein} />
              <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>היקף חזה (ס״מ)</span>
            </div>
            {chestPoints.length > 1
              ? <Sparkline data={chestPoints} color={T.macro.protein} unit="cm" />
              : <p className="text-xs" style={{ color: T.t.textDim }}>עוד מדידה אחת כדי לראות מגמה.</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 items-end pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <WeighInDial icon={Scale} label="משקל" unit="ק״ג" value={weight} onChange={setWeight} step={0.1} min={30} max={200} color={T.accent} />
        <WeighInDial icon={Ruler} label="היקף מותן" unit="ס״מ" value={waist} onChange={setWaist} step={0.5} min={40} max={160} color={T.macro.kcal} />
        <WeighInDial icon={Ruler} label="היקף חזה" unit="ס״מ" value={chest} onChange={setChest} step={0.5} min={60} max={180} color={T.macro.protein} />
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
