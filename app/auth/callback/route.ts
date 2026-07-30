// Exchanges the PKCE `code` param (from both the signup-confirmation link and
// the password-recovery link — Supabase's redirectTo always lands here first)
// for a real session, then forwards to `next` (defaults to the app root;
// forgot-password sends `next=/auth/reset-password` explicitly so a recovery
// link lands on the "choose a new password" screen instead of the dashboard).
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
