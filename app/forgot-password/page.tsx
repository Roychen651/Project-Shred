'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { KeyRound, MailCheck } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO, tactileGradient } from '@/lib/theme/tokens';
import { createClient } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/supabase/authErrors';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthError } from '@/components/auth/AuthError';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export default function ForgotPasswordPage() {
  const T = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Same guard as login/signup — createClient() throws synchronously when
    // the Supabase env vars aren't live, which would otherwise leave the
    // button stuck on "שולח…" forever with no visible error.
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (resetError) {
        setError(translateAuthError(resetError.message));
        return;
      }
      setSentTo(email);
    } catch {
      setError('לא ניתן לשלוח כרגע — האפליקציה לא מחוברת לשרת. פנו למנהל המערכת.');
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <AuthShell title="בדקו את האימייל" subtitle="שלחנו קישור לאיפוס סיסמה">
        <div className="flex flex-col items-center gap-3 text-center py-2">
          <MailCheck size={36} color={T.accent} />
          <p className="text-sm font-bold" style={{ fontFamily: FONT_MONO, color: T.t.textPrimary }}>{sentTo}</p>
          <p className="text-xs" style={{ color: T.t.textDim }}>
            אם הכתובת רשומה אצלנו, קיבלתם קישור לבחירת סיסמה חדשה. הקישור בתוקף למשך זמן מוגבל.
          </p>
          <Link href="/login" className="text-xs font-bold mt-2" style={{ color: T.accent }}>חזרה להתחברות</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="שכחתם סיסמה?" subtitle="נשלח לכם קישור לבחירת סיסמה חדשה">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField label="אימייל" type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="you@example.com" />
        <AuthError message={error} />
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          transition={tapSpring}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
          style={{ ...tactileGradient(T.accent), color: '#07080B', opacity: loading ? 0.6 : 1 }}
        >
          <KeyRound size={16} /> {loading ? 'שולח…' : 'שליחת קישור איפוס'}
        </motion.button>
        <p className="text-xs text-center" style={{ color: T.t.textDim }}>
          <Link href="/login" style={{ color: T.accent, fontWeight: 700 }}>חזרה להתחברות</Link>
        </p>
      </form>
    </AuthShell>
  );
}
