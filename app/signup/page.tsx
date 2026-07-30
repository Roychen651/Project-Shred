'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { UserPlus, MailCheck } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { createClient } from '@/lib/supabase/client';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';

export default function SignupPage() {
  const T = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים.');
      return;
    }
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <AuthShell title="כמעט סיימנו" subtitle="נותר רק לאשר את האימייל">
        <div className="flex flex-col items-center gap-3 text-center py-2">
          <MailCheck size={36} color={T.accent} />
          <p className="text-sm" style={{ color: T.t.textSecondary }}>
            שלחנו קישור אישור לכתובת
          </p>
          <p className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{sentTo}</p>
          <p className="text-xs" style={{ color: T.t.textDim }}>
            אחרי אישור האימייל תוכלו להתחבר עם הסיסמה שבחרתם.
          </p>
          <Link href="/login" className="text-xs font-bold mt-2" style={{ color: T.accent }}>חזרה להתחברות</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="הרשמה" subtitle="חשבון חדש ב-PROJECT SHRED">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField label="אימייל" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
        <AuthField label="סיסמה" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="לפחות 8 תווים" />
        <AuthField label="אימות סיסמה" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        {error && <p className="text-xs" style={{ color: T.macro.kcal }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
          style={{ background: T.accent, color: '#07080B', opacity: loading ? 0.6 : 1 }}
        >
          <UserPlus size={16} /> {loading ? 'נרשם…' : 'הרשמה'}
        </button>
        <p className="text-xs text-center" style={{ color: T.t.textDim }}>
          יש לכם כבר חשבון?{' '}
          <Link href="/login" style={{ color: T.accent, fontWeight: 700 }}>התחברות</Link>
        </p>
      </form>
    </AuthShell>
  );
}
