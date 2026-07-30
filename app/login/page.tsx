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
import { LogIn } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { createClient } from '@/lib/supabase/client';
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים.' : signInError.message);
      return;
    }
    router.push(searchParams.get('next') || '/');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <AuthField label="אימייל" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
      <AuthField label="סיסמה" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
      <AuthError message={error} />
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
