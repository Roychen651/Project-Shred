// Server-side Supabase client — used in Server Components, Route Handlers,
// and the auth callback route. Mirrors lib/supabase/client.ts's env vars
// (same two public values; RLS is what protects data, not key secrecy).
//
// The try/catch around cookieStore.set is the standard Next.js App Router
// caveat: a Server Component can't write cookies (Next throws if you try),
// which is fine here because middleware.ts already refreshes the session on
// every request — a Server Component only ever needs to READ the session,
// never renew it.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — safe to ignore, see file header.
          }
        },
      },
    }
  );
}
