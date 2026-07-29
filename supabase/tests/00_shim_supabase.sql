-- ============================================================================
-- Local-only shim: the minimum slice of Supabase's managed `auth` schema that
-- our migrations depend on, so `supabase/migrations/*.sql` can be applied and
-- exercised against a plain Postgres instance (CI, or a laptop) without needing
-- Docker or a real Supabase project.
--
-- NOT part of the migration set — never applied to a real project, where all of
-- this already exists and is managed by Supabase.
-- ============================================================================

create schema if not exists auth;

-- Supabase's real roles. Our RLS policies name both.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
end
$$;

grant usage on schema public to anon, authenticated;

-- Only the columns our bootstrap trigger reads.
create table if not exists auth.users (
  id                    uuid primary key default gen_random_uuid(),
  email                 text,
  raw_user_meta_data    jsonb default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

-- Supabase derives auth.uid() from the request JWT. Locally we drive it from a
-- session GUC so a test can say "now act as this user".
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
