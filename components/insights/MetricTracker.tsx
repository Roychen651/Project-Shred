'use client';

// ProjectShred.artifact.jsx:2587-2660. Weekly weight/waist entry + two compact
// sparklines. The artifact could always fall back to the previous entry's
// value when only one field was filled in (`weight: w || last.weight`)
// because every profile was seeded with a real first data point on creation.
// This port deliberately starts every account with an EMPTY metricEntries
// (see docs/MIGRATION.md — the Sprint 10 synthetic seed was dropped on
// purpose), so that fallback can't work for the very first entry ever. The
// only adaptation here: the very first entry requires both fields; every
// entry after that keeps the artifact's exact fallback behavior.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Ruler, Plus } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, tactileGradient } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Sparkline } from '@/components/ui/Sparkline';
import { dateKey } from '@/lib/domain/dates';
import type { MetricEntry } from '@/lib/store/shred-store';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export interface MetricTrackerProps {
  entries: MetricEntry[];
  onAddEntry: (entry: Omit<MetricEntry, 'id'>) => void;
}

export function MetricTracker({ entries, onAddEntry }: MetricTrackerProps) {
  const T = useTheme();
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');

  const addEntry = () => {
    const w = parseFloat(weight);
    const wa = parseFloat(waist);
    if (!w && !wa) return;
    const last = entries[entries.length - 1];
    if (!last && (!w || !wa)) return; // first-ever entry needs both — nothing to fall back to
    onAddEntry({ date: dateKey(new Date()), weight: w || last.weight, waist: wa || last.waist });
    setWeight('');
    setWaist('');
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
        <Scale size={22} color={T.accent} />
      </div>

      {entries.length === 0 ? (
        <p className="text-sm py-6 text-center" style={{ color: T.t.textDim }}>עדיין אין נתונים — הזינו את המדידה הראשונה למטה.</p>
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

      <div className="flex flex-wrap gap-2 items-center pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <div className="relative flex-1" style={{ minWidth: 130 }}>
          <Scale size={13} color={T.t.textDim} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="משקל שבוע חדש"
            type="number"
            dir="ltr"
            className="w-full py-2.5 pr-3.5 rounded-xl text-sm outline-none"
            style={{ paddingLeft: 32, background: T.t.inputBg, border: `1px solid ${T.t.border}`, textAlign: 'left', color: T.t.textPrimary, fontFamily: FONT_MONO, fontWeight: 600 }}
          />
        </div>
        <div className="relative flex-1" style={{ minWidth: 130 }}>
          <Ruler size={13} color={T.t.textDim} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={waist}
            onChange={(e) => setWaist(e.target.value)}
            placeholder="היקף מותן חדש"
            type="number"
            dir="ltr"
            className="w-full py-2.5 pr-3.5 rounded-xl text-sm outline-none"
            style={{ paddingLeft: 32, background: T.t.inputBg, border: `1px solid ${T.t.border}`, textAlign: 'left', color: T.t.textPrimary, fontFamily: FONT_MONO, fontWeight: 600 }}
          />
        </div>
        <motion.button
          onClick={addEntry}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.03 }}
          transition={tapSpring}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ ...tactileGradient(T.accent), color: '#07080B' }}
        >
          <Plus size={15} /> הוסף
        </motion.button>
      </div>
      {entries.length === 0 && (
        <p className="text-xs mt-2" style={{ color: T.t.textDim }}>ברשומה הראשונה יש להזין גם משקל וגם היקף מותן.</p>
      )}
    </GlassCard>
  );
}
