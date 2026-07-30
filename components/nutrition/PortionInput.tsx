'use client';

// ProjectShred.artifact.jsx:4671-4734 (Sprint 15.3). The unit selector is a
// horizontal-scroll pill row (not a fixed grid) so all of PORTION_UNITS'
// entries fit without wrapping to a second row — the same pattern the
// category tabs elsewhere in the app already use. A slider AND a free-text
// number field both drive the same quantity, so a person can either drag or
// type an exact value.
//
// Ported for real this time — PORTION_UNITS existed in lib/data/ since
// Sprint 8 but nothing in the Next port actually rendered it; the Plate
// Composer only ever had a grams-only slider. This closes that gap.

import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { PORTION_UNITS } from '@/lib/data/portionUnits';

export interface PortionInputProps {
  unit: string;
  qty: number;
  onUnitChange: (unit: string, defaultQty: number) => void;
  onQtyChange: (qty: number) => void;
}

export function PortionInput({ unit, qty, onUnitChange, onQtyChange }: PortionInputProps) {
  const T = useTheme();
  const unitDef = PORTION_UNITS.find((u) => u.id === unit) || PORTION_UNITS[0];
  const grams = Math.round(qty * unitDef.gramsPerUnit);
  const sliderMin = unit === 'gram' ? 5 : unitDef.step;
  const sliderMax = unit === 'gram' ? 500 : 20;
  const pct = Math.max(0, Math.min(((qty - sliderMin) / (sliderMax - sliderMin)) * 100, 100));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {PORTION_UNITS.map((u) => {
          const active = unit === u.id;
          return (
            <button
              key={u.id}
              onClick={() => onUnitChange(u.id, u.defaultQty)}
              className="flex-shrink-0 py-2 px-3 rounded-full text-xs font-bold whitespace-nowrap"
              style={{
                background: active ? T.accent : T.t.inputBg,
                color: active ? '#07080B' : T.t.textSecondary,
                border: `1.5px solid ${active ? T.accent : T.t.border}`,
                boxShadow: active ? T.glow(T.accent, 10, '35') : 'none',
                transition: 'all 0.22s cubic-bezier(.34,1.56,.64,1)',
              }}
            >
              {u.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={sliderMin}
          max={sliderMax}
          step={unitDef.step}
          value={qty}
          onChange={(e) => onQtyChange(Number(e.target.value))}
          className="flex-1"
          style={{
            accentColor: T.accent,
            background: `linear-gradient(to left, ${T.accent} ${pct}%, ${T.t.border} ${pct}%)`,
          }}
        />
        {/* Free-text entry — type an exact quantity instead of dragging */}
        <input
          type="number"
          dir="ltr"
          aria-label="כמות"
          value={qty}
          step={unitDef.step}
          min={0}
          onChange={(e) => onQtyChange(Math.max(0, Number(e.target.value) || 0))}
          className="text-sm font-bold text-center rounded-lg outline-none"
          style={{ width: 64, padding: '8px 4px', background: T.t.chipBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
        />
        <span className="text-xs flex-shrink-0" style={{ color: T.t.textDim, minWidth: 78, fontFamily: FONT_MONO }}>
          {unitDef.shortLabel}{unit !== 'gram' && ` (${grams}ג)`}
        </span>
      </div>
    </div>
  );
}

export function gramsForPortion(unit: string, qty: number): number {
  const unitDef = PORTION_UNITS.find((u) => u.id === unit) || PORTION_UNITS[0];
  return Math.round(qty * unitDef.gramsPerUnit);
}

// Geresh (׳), matching PORTION_UNITS' own shortLabel field and
// CalorieMathSheetBody's convention — the linguistically correct Hebrew
// abbreviation mark, not an ASCII apostrophe standing in for it.
export function formatPortionLabel(unit: string, qty: number): string {
  const unitDef = PORTION_UNITS.find((u) => u.id === unit) || PORTION_UNITS[0];
  const grams = gramsForPortion(unit, qty);
  return unit === 'gram' ? `${grams} גר׳` : `${qty} ${unitDef.shortLabel} (${grams} גר׳)`;
}
