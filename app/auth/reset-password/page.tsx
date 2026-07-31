'use client';

// Lands here after /auth/callback exchanges a recovery-link code for a real
// (temporary) session — the person IS authenticated at this point, just with
// a password they may not remember, which is exactly what supabase.auth.
// updateUser({ password }) is for: it sets a new password on the CURRENT
// session's user without needing the old one.

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { KeyRound } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { tactileGradient } from '@/lib/theme/tokens';
import { createClient } from '@/lib/supabase/client';
import { translateAuthError } from '@/lib/supabase/authErrors';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { AuthError } from '@/components/auth/AuthError';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export default function ResetPasswordPage() {
  const T = useTheme();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    // Same guard as the other auth pages — createClient() throws
    // synchronously when the Supabase env vars aren't live, which would
    // otherwise leave the button stuck on "מעדכן…" forever with no visible error.
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(translateAuthError(updateError.message));
        return;
      }
    } catch {
      setError('לא ניתן לעדכן כרגע — האפליקציה לא מחוברת לשרת. פנו למנהל המערכת.');
      return;
    } finally {
      setLoading(false);
    }
    router.push('/');
    router.refresh();
  };

  return (
    <AuthShell title="בחירת סיסמה חדשה" subtitle="הסיסמה החדשה תחליף את הקודמת מיידית">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField label="סיסמה חדשה" type="password" value={password} onChange={setPassword} autoComplete="new-password" placeholder="לפחות 8 תווים" />
        <AuthField label="אימות סיסמה" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        <AuthError message={error} />
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.95 }}
          transition={tapSpring}
          className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
          style={{ ...tactileGradient(T.accent), color: '#07080B', opacity: loading ? 0.6 : 1 }}
        >
          <KeyRound size={16} /> {loading ? 'מעדכן…' : 'עדכון סיסמה'}
        </motion.button>
      </form>
    </AuthShell>
  );
}
