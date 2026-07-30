'use client';

// ProjectShred.artifact.jsx:2664-2710. A tracked mono caption label + chip-
// style unit suffix, fixing the two silently-broken spots documented in
// CLAUDE.md's Design System section (flat labels, a bracket-syntax Tailwind
// class that never worked without a JIT compiler).

import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO, FONT_BODY } from '@/lib/theme/tokens';

export interface FieldInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  suffix?: string;
}

export function FieldInput({ label, value, onChange, type = 'text', suffix }: FieldInputProps) {
  const T = useTheme();
  const isNum = type === 'number';
  return (
    <div>
      <label
        className="text-xs font-semibold block mb-2"
        style={{ color: T.t.textDim, letterSpacing: '0.04em', fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          type={type}
          dir={isNum ? 'ltr' : 'rtl'}
          className="w-full py-3 rounded-xl text-sm outline-none"
          style={{
            background: T.t.inputBg,
            border: `1.5px solid ${T.t.border}`,
            textAlign: isNum ? 'left' : 'right',
            color: T.t.textPrimary,
            fontFamily: isNum ? FONT_MONO : FONT_BODY,
            fontWeight: isNum ? 600 : 400,
            paddingRight: 14,
            paddingLeft: isNum && suffix ? 52 : 14,
          }}
        />
        {suffix && (
          <span
            className="absolute top-1/2 -translate-y-1/2 text-xs pointer-events-none px-2 py-1 rounded-md"
            style={{
              color: T.t.textSecondary,
              left: isNum ? 8 : 'auto',
              right: isNum ? 'auto' : 8,
              fontFamily: FONT_MONO,
              background: T.t.chipBg,
            }}
          >
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
