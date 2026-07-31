'use client';

// Sprint 11 — replaces the native browser spin-button experience on the
// app's highest-visibility numeric fields (onboarding, profile settings)
// with a real custom control: minus/plus buttons flanking a center-aligned,
// still-directly-typeable input (so precise entry — "82.5kg" — isn't lost
// in favor of pure incrementing). globals.css hides the native spinner
// arrows on every OTHER number input in the app, so this isn't the only fix
// for the "1999 arrows" complaint — it's the upgraded control for the fields
// that deserve the extra weight of a dedicated component.
//
// Sprint 17: bumped to the app's larger 24px card radius, added a real
// shadow instead of a flat bordered box, and tinted press/hover states on
// the +/- buttons — direct feedback called this exact "flat bordered number
// frame" pattern out as one of the generic-looking elements.

import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';

export interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}

function roundToStep(n: number, step: number): number {
  const decimals = (String(step).split('.')[1] || '').length;
  return Number((Math.round(n / step) * step).toFixed(decimals));
}

const tapSpring = { type: 'spring' as const, stiffness: 420, damping: 22 };

export function Stepper({ label, value, onChange, step = 1, min = 0, max = 999, suffix }: StepperProps) {
  const T = useTheme();

  const dec = () => onChange(Math.max(min, roundToStep(value - step, step)));
  const inc = () => onChange(Math.min(max, roundToStep(value + step, step)));

  return (
    <div>
      <label
        className="text-xs font-semibold block mb-2"
        style={{ color: T.t.textDim, letterSpacing: '0.04em', fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-2xl overflow-hidden"
        style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, boxShadow: T.t.shadowCard }}
      >
        <motion.button
          type="button"
          onClick={dec}
          whileTap={{ scale: 0.86, background: `${T.accent}22` }}
          whileHover={{ scale: 1.08, background: `${T.accent}14` }}
          transition={tapSpring}
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 44, height: 50, color: T.t.textSecondary }}
          aria-label={`הפחת ${label}`}
        >
          <Minus size={16} />
        </motion.button>

        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0" style={{ borderInline: `1px solid ${T.t.border}` }}>
          <input
            value={value}
            onChange={(e) => {
              const n = Number(e.target.value);
              onChange(Number.isFinite(n) ? n : 0);
            }}
            type="number"
            dir="ltr"
            className="w-full text-center outline-none bg-transparent"
            style={{ color: T.t.textPrimary, fontFamily: FONT_MONO, fontWeight: 700, fontSize: 15, padding: '13px 2px' }}
          />
          {suffix && (
            <span className="text-xs flex-shrink-0" style={{ color: T.t.textDim, fontFamily: FONT_MONO, paddingInlineEnd: 10 }}>
              {suffix}
            </span>
          )}
        </div>

        <motion.button
          type="button"
          onClick={inc}
          whileTap={{ scale: 0.86, background: `${T.accent}22` }}
          whileHover={{ scale: 1.08, background: `${T.accent}14` }}
          transition={tapSpring}
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: 44, height: 50, color: T.t.textSecondary }}
          aria-label={`הוסף ${label}`}
        >
          <Plus size={16} />
        </motion.button>
      </div>
    </div>
  );
}
