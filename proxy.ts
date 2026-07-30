// Sprint 8 — session refresh + route protection, the standard @supabase/ssr
// middleware pattern for the Next.js App Router (file named proxy.ts, not
// middleware.ts — Next 16 renamed the convention; the exported function must
// be named `proxy`, not `middleware`, or the build rejects the file outright).
// Runs on every request:
// refreshes the auth cookie (Supabase access tokens expire; without this, a
// long-idle tab silently loses its session on the next server read) and
// redirects signed-out visitors to /login, signed-in ones away from /login
// and /signup.
//
// Public routes are the auth flow itself (/login, /signup, /forgot-password)
// plus the two links that arrive from an email the user didn't click while
// "signed in" in this browser (/auth/callback exchanges the code; a password
// reset link also lands signed-out until the code exchange completes).
//
// FAIL OPEN, NOT CLOSED, when Supabase isn't configured. createServerClient()
// throws synchronously if the URL/key env vars are missing or empty — and
// since this proxy runs before EVERY route (including /login itself), an
// unguarded throw here would 500 the entire app, forever, until someone adds
// real credentials. That's a strictly worse outcome than "auth gating is
// temporarily off" — this sandbox has no .env.local, and neither does the
// live Vercel deployment yet (nobody has been told to add one there), so this
// isn't a hypothetical edge case, it's the exact state both are in today.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/forgot-password', '/auth/callback', '/auth/reset-password'];

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
