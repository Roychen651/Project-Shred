'use client';

// Email/password input — a sibling to components/settings/FieldInput.tsx, not
// a reuse of it: email/password values are always LTR/ASCII regardless of the
// app's RTL direction (an @-address or a password reads left-to-right even in
// a Hebrew UI), which FieldInput doesn't special-case since none of its own
// callers needed it.

import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';

export interface AuthFieldProps {
  label: string;
  type: 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
}

export function AuthField({ label, type, value, onChange, autoComplete, placeholder }: AuthFieldProps) {
  const T = useTheme();
  return (
    <div>
      <label className="text-xs font-semibold block mb-2" style={{ color: T.t.textDim, letterSpacing: '0.04em' }}>
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        dir="ltr"
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className="w-full py-3 px-3.5 rounded-xl text-sm outline-none"
        style={{
          background: T.t.inputBg,
          border: `1px solid ${T.t.border}`,
          textAlign: 'left',
          color: T.t.textPrimary,
          fontFamily: FONT_MONO,
        }}
      />
    </div>
  );
}
