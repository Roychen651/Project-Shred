// Diagnostic-only route, added to settle the live-site "no login / no memory"
// investigation with a direct fact instead of another round of dashboard
// screenshots. Reports whether the server process this specific deployment is
// running on actually sees the two Supabase env vars, and whether a real
// network call to the database succeeds — nothing here can be wrong the way a
// human reading a settings page can be wrong. Never exposes the anon key
// itself (only its length, which is not a secret), and the anon key is safe
// to have server-reachable to begin with — Row Level Security, not key
// secrecy, is what protects the data (see lib/supabase/client.ts).
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const result: Record<string, unknown> = {
    supabaseUrlConfigured: Boolean(url),
    supabaseUrlHost: url ? safeHost(url) : null,
    anonKeyConfigured: Boolean(key),
    anonKeyLength: key ? key.length : 0,
    dbReachable: null as boolean | null,
    dbError: null as string | null,
  };

  if (url && key) {
    try {
      const supabase = createServerClient(url, key, {
        cookies: { getAll: () => [], setAll: () => {} },
      });
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
      result.dbReachable = !error;
      result.dbError = error ? error.message : null;
    } catch (e) {
      result.dbReachable = false;
      result.dbError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json(result);
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return 'INVALID_URL';
  }
}
