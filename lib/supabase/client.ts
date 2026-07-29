// Browser Supabase client. Reads the two public env vars documented in
// .env.example — both are safe to ship to the client; Row Level Security
// (supabase/migrations/0002_rls.sql) is what actually protects the data, not
// the secrecy of the anon key. The service-role key must never appear here.
//
// This is plumbing only, ahead of milestone 4 (auth wiring). It compiles and
// can be imported today; it starts doing anything once .env.local is filled in
// from a real Supabase project.

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
