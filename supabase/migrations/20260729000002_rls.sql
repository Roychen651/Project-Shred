-- ============================================================================
-- PROJECT SHRED — 0002 · Row Level Security
--
-- Enabled BEFORE any client code touches these tables. Never developed with RLS
-- off "temporarily" — a table that has ever been reachable without a policy is a
-- table nobody can prove was never read.
--
-- Two deviations from the template in MIGRATION_BRIEF.md, both deliberate:
--
--  1. `(select auth.uid())` instead of bare `auth.uid()`.
--     Wrapping the call in a scalar subquery lets the planner evaluate it ONCE as
--     an InitPlan instead of re-invoking the function per candidate row. On
--     `logged_items` — the only table here that will ever hold tens of thousands
--     of rows — that is the difference between an index scan and a per-row
--     function call. This is Supabase's own documented RLS performance guidance.
--
--  2. `to authenticated` on every policy.
--     Without it the policy is also evaluated for the `anon` role on every
--     request. It is not a security hole (auth.uid() is null for anon, so nothing
--     matches) but it is wasted work on every unauthenticated hit, and being
--     explicit about who a policy is for makes the intent auditable.
--
-- `for all` (rather than four separate policies) is correct here: every one of
-- these tables has exactly one rule — you own your row or you cannot see it.
-- Splitting them would be four times the surface for the same semantics.
--
-- The `with check` clause is what stops a user from INSERTing or UPDATEing a row
-- with someone else's user_id. `using` alone only filters reads and the pre-image
-- of writes — omitting `with check` is the classic RLS hole.
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.user_settings       enable row level security;
alter table public.logged_items        enable row level security;
alter table public.day_meta            enable row level security;
alter table public.metric_entries      enable row level security;
alter table public.exercise_logs       enable row level security;
alter table public.favorites           enable row level security;
alter table public.custom_ingredients  enable row level security;
alter table public.custom_hacks        enable row level security;
alter table public.custom_restaurants  enable row level security;


create policy "Users manage their own profiles"
  on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own settings"
  on public.user_settings for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own logged_items"
  on public.logged_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own day_meta"
  on public.day_meta for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own metric_entries"
  on public.metric_entries for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own exercise_logs"
  on public.exercise_logs for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own favorites"
  on public.favorites for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own custom_ingredients"
  on public.custom_ingredients for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own custom_hacks"
  on public.custom_hacks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users manage their own custom_restaurants"
  on public.custom_restaurants for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------------
-- The `anon` role has no policy on any table above, so it can read nothing.
-- Revoking table privileges outright as well means an accidentally-added
-- permissive policy in some future migration still cannot expose data to
-- unauthenticated callers — defence in depth, not a substitute for RLS.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
