'use client';

// Sprint 45 — "Custom Macro & Target Tuning" from the mandate: manual
// override of calorie/protein/fat targets with live dynamic rebalancing.
// Carbs is deliberately NOT a Stepper here — it's shown read-only, because
// it's always the remainder (kcal - protein*4 - fat*9)/4, exactly the same
// "carbs absorb whatever calories remain" rule computeProfileTargets() uses
// for the default targets (see lib/domain/targetOverride.ts's header). A
// carbs Stepper would let the four numbers go arithmetically inconsistent
// with each other — showing it as derived, not editable, is what keeps the
// tuning panel honest about what's actually happening under a kcal/protein/
// fat edit.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, tactileGradient } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Stepper } from '@/components/ui/Stepper';
import type { DayTargets } from '@/lib/domain/targets';
import type { TargetOverrideInput } from '@/lib/domain/targetOverride';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export interface TargetTuningPanelProps {
  defaultRest: DayTargets;
  effectiveRest: DayTargets;
  hasOverride: boolean;
  onApply: (override: TargetOverrideInput) => void;
  onReset: () => void;
}

export function TargetTuningPanel({ defaultRest, effectiveRest, hasOverride, onApply, onReset }: TargetTuningPanelProps) {
  const T = useTheme();
  const [kcal, setKcal] = useState(effectiveRest.kcal);
  const [protein, setProtein] = useState(effectiveRest.protein);
  const [fat, setFat] = useState(effectiveRest.fat);

  const carbs = Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 0);
  const dirty = kcal !== effectiveRest.kcal || protein !== effectiveRest.protein || fat !== effectiveRest.fat;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Eyebrow>שליטה ידנית</Eyebrow>
          <h3 className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>כיוונון יעדים אישי</h3>
        </div>
        <SlidersHorizontal size={18} color={T.accent} />
      </div>

      <p className="text-xs mb-4" style={{ color: T.t.textDim }}>
        לא מרוצים מהיעד המחושב? קבעו קלוריות/חלבון/שומן משלכם — הפחמימה תמיד תושלם אוטומטית מהשאר, בדיוק כמו במנוע המקורי.
      </p>

      <div className="grid grid-cols-3 gap-2">
        <Stepper label="קל׳ מנוחה" suffix="קל׳" value={kcal} onChange={setKcal} step={25} min={800} max={6000} />
        <Stepper label="חלבון" suffix="ג׳" value={protein} onChange={setProtein} step={5} min={0} max={500} />
        <Stepper label="שומן" suffix="ג׳" value={fat} onChange={setFat} step={5} min={0} max={300} />
      </div>

      <div className="flex items-center justify-between mt-3 p-3 rounded-xl" style={{ background: T.t.chipBg }}>
        <span className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>פחמימה (נגזרת אוטומטית)</span>
        <span className="text-sm font-black" style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>{carbs} ג׳</span>
      </div>

      {defaultRest.kcal !== kcal || defaultRest.protein !== protein || defaultRest.fat !== fat ? (
        <p className="text-[11px] mt-2" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>
          ברירת מחדל מהנוסחה: {defaultRest.kcal} קל׳ · {defaultRest.protein}ג׳ חלבון · {defaultRest.fat}ג׳ שומן
        </p>
      ) : null}

      <div className="flex gap-2 mt-4">
        <motion.button
          onClick={() => onApply({ kcal, protein, fat })}
          disabled={!dirty}
          whileTap={dirty ? { scale: 0.97 } : undefined}
          whileHover={dirty ? { scale: 1.01 } : undefined}
          transition={tapSpring}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold"
          style={{ ...tactileGradient(T.accent), color: '#07080B', opacity: dirty ? 1 : 0.5 }}
        >
          החל שינויים
        </motion.button>
        {hasOverride && (
          <motion.button
            onClick={() => { onReset(); setKcal(defaultRest.kcal); setProtein(defaultRest.protein); setFat(defaultRest.fat); }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.06 }}
            transition={tapSpring}
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 44, background: T.t.chipBg, border: `1px solid ${T.t.border}` }}
            aria-label="איפוס לברירת המחדל"
            title="איפוס לברירת המחדל"
          >
            <RotateCcw size={15} color={T.t.textSecondary} />
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
}
