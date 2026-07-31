'use client';

// Email/password sign-in. Per the explicit Sprint 8 mandate this replaces the
// originally-planned Google OAuth (docs/MIGRATION.md's "Google sign-in" line
// predates this decision) — noted here plainly since it's a real deviation
// from what was previously documented, not a silent contradiction of it.
//
// useSearchParams() (reading `?next=`, set by middleware.ts when it bounces a
// signed-out visitor here) requires a Suspense boundary around whatever reads
// it, or `next build` fails prerendering this route — LoginForm is split out
// so the Suspense fallback only ever needs to cover a form that renders
// instantly anyway.

import { useState, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, RotateCw } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { createClient } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/supabase/authErrors';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthError } from '@/components/auth/AuthError';

function LoginForm() {
  const T = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Only offered on the exact failure it fixes — a real, recoverable path for
  // the account-exists-but-was-never-confirmed case, instead of a dead end.
  const [showResend, setShowResend] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setShowResend(false);
    setLoading(true);
    // createClient() throws SYNCHRONOUSLY if the Supabase env vars aren't
    // live — unguarded, that throw meant setLoading(false) never ran, so the
    // button was stuck on "מתחבר…" forever with no visible error. Wrapped so
    // a misconfigured/unreachable backend surfaces a real message instead.
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(translateAuthError(signInError.message));
        setShowResend(signInError.message === 'Email not confirmed');
        return;
      }
    } catch {
      setError('לא ניתן להתחבר כרגע — האפליקציה לא מחוברת לשרת. פנו למנהל המערכת.');
      return;
    } finally {
      setLoading(false);
    }
    router.push(searchParams.get('next') || '/');
    router.refresh();
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: 'signup', email });
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthField label="אימייל" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
      <AuthField label="סיסמה" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <AuthError message={error} />
      {showResend && (
        <button
          type="button"
          onClick={handleResend}
          disabled={resendState !== 'idle'}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
          style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
        >
          <RotateCw size={12} />
          {resendState === 'sent' ? 'קישור חדש נשלח ✓' : resendState === 'sending' ? 'שולח…' : 'שליחת קישור אימות חדש'}
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
        style={{ background: T.accent, color: '#07080B', opacity: loading ? 0.6 : 1 }}
      >
        <LogIn size={16} /> {loading ? 'מתחבר…' : 'התחברות'}
      </button>
      <div className="flex items-center justify-between text-xs" style={{ color: T.t.textDim }}>
        <Link href="/forgot-password" style={{ color: T.accent }}>שכחתי סיסמה</Link>
        <span>
          אין לך חשבון?{' '}
          <Link href="/signup" style={{ color: T.accent, fontWeight: 700 }}>הרשמה</Link>
        </span>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="התחברות" subtitle="ברוכים השבים ל-PROJECT SHRED">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
