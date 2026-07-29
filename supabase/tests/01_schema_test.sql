-- ============================================================================
-- Schema tests. Run against a throwaway database that already has
-- 00_shim_supabase.sql plus the three migrations applied.
--
-- Every check raises an exception on failure, so a non-zero psql exit code
-- (via ON_ERROR_STOP=1) means the schema is wrong.
-- ============================================================================

\set ON_ERROR_STOP on

create or replace function tests.assert(cond boolean, label text)
returns void language plpgsql as $$
begin
  if cond is not true then
    raise exception 'FAIL: %', label;
  end if;
  raise notice '  ok  %', label;
end;
$$;

-- Section 5 runs assertions while acting as `authenticated`/`anon`, so those
-- roles need to be able to call the helper.
grant usage on schema tests to authenticated, anon;
grant execute on function tests.assert(boolean, text) to authenticated, anon;


-- ---------------------------------------------------------------------------
-- 1. New-user bootstrap fires and seeds a usable account.
-- ---------------------------------------------------------------------------
\echo '== bootstrap =='

insert into auth.users (id, email, raw_user_meta_data)
values ('11111111-1111-1111-1111-111111111111', 'roy@example.com',
        '{"full_name": "Roy Chen"}'::jsonb);

insert into auth.users (id, email, raw_user_meta_data)
values ('22222222-2222-2222-2222-222222222222', 'other@example.com', '{}'::jsonb);

select tests.assert(
  (select count(*) from public.profiles
    where user_id = '11111111-1111-1111-1111-111111111111') = 2,
  'bootstrap creates exactly two builtin profiles');

select tests.assert(
  (select name from public.profiles
    where user_id = '11111111-1111-1111-1111-111111111111'
      and builtin_key = 'mine') = 'Roy Chen',
  'the mine profile takes its name from Google OAuth full_name');

select tests.assert(
  (select name from public.profiles
    where user_id = '22222222-2222-2222-2222-222222222222'
      and builtin_key = 'mine') = 'הפרופיל שלי',
  'the mine profile falls back to the Hebrew default when OAuth sends no name');

-- Regression guard: a new account must NOT inherit the artifact author's body
-- metrics. 84kg/171cm/29y were single-user module constants, not sane defaults.
select tests.assert(
  (select weight = 75 and height = 175 and age = 28
     from public.profiles
    where user_id = '11111111-1111-1111-1111-111111111111'
      and builtin_key = 'mine'),
  'the mine profile seeds generic template metrics, not the author''s own');

select tests.assert(
  (select active_profile_id is not null from public.user_settings
    where user_id = '11111111-1111-1111-1111-111111111111'),
  'user_settings is created with the mine profile active');

select tests.assert(
  (select count(*) from public.favorites
    where user_id = '11111111-1111-1111-1111-111111111111') = 3,
  'the three default favorite chips are seeded');


-- ---------------------------------------------------------------------------
-- 2. daily_totals must match sumItems() exactly.
--
-- Fixture (all for 2026-07-20, user 1):
--   A  completed, base 500 kcal / 40 p, grams 100  -> 500  / 40.0
--   B  completed, base 300 kcal / 25 p, grams 150  -> 450  / 37.5
--   C  NOT completed, base 900 kcal / 90 p         -> excluded entirely
-- Expected: 950 kcal, 77.5 protein.
-- ---------------------------------------------------------------------------
\echo '== daily_totals =='

insert into public.logged_items
  (user_id, date_key, slot_id, name, base_calories, base_protein, base_carbs, base_fats, grams, is_completed, source)
values
  ('11111111-1111-1111-1111-111111111111', '2026-07-20', 'lunch',  'A', 500, 40, 50, 10, 100, true,  'restaurant'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-20', 'dinner', 'B', 300, 25, 30,  8, 150, true,  'plate'),
  ('11111111-1111-1111-1111-111111111111', '2026-07-20', 'dinner', 'C', 900, 90, 90, 30, 100, false, 'hack');

select tests.assert(
  (select kcal = 950 and protein = 77.5
     from public.daily_totals
    where user_id = '11111111-1111-1111-1111-111111111111'
      and date_key = '2026-07-20'),
  'daily_totals scales by the portion index and excludes uncompleted items');

-- The bug this guards against: MIGRATION_BRIEF.md's plain SUM would have returned
-- 1850 kcal here by folding in the unticked item.
select tests.assert(
  (select kcal from public.daily_totals
    where user_id = '11111111-1111-1111-1111-111111111111'
      and date_key = '2026-07-20') <> 1850,
  'uncompleted items are not silently included');

-- Per-item rounding, not sum-then-round. Three items at base 10.05 -> each rounds
-- to 10.1 -> 30.3. Summing raw and rounding once would give 30.2.
insert into public.logged_items
  (user_id, date_key, slot_id, name, base_calories, base_protein, grams)
values
  ('11111111-1111-1111-1111-111111111111', '2026-07-21', 'breakfast', 'R1', 0, 10.05, 100),
  ('11111111-1111-1111-1111-111111111111', '2026-07-21', 'breakfast', 'R2', 0, 10.05, 100),
  ('11111111-1111-1111-1111-111111111111', '2026-07-21', 'breakfast', 'R3', 0, 10.05, 100);

select tests.assert(
  (select protein = 30.3 from public.daily_totals
    where user_id = '11111111-1111-1111-1111-111111111111'
      and date_key = '2026-07-21'),
  'macros are rounded per item before summing, matching scaleLoggedItem()');


-- ---------------------------------------------------------------------------
-- 3. daily_log merges the two sources and honours DayEditor overrides.
-- ---------------------------------------------------------------------------
\echo '== daily_log =='

insert into public.day_meta (user_id, date_key, workout_done, workout_day)
values ('11111111-1111-1111-1111-111111111111', '2026-07-20', true, 'A1');

select tests.assert(
  (select kcal = 950 and workout_done and workout_day = 'A1'
     from public.daily_log
    where user_id = '11111111-1111-1111-1111-111111111111'
      and date_key = '2026-07-20'),
  'daily_log joins derived totals to workout flags');

-- A workout logged on a day with no food at all still has to produce a row,
-- otherwise the heatmap would lose the workout.
insert into public.day_meta (user_id, date_key, workout_done, workout_day)
values ('11111111-1111-1111-1111-111111111111', '2026-07-19', true, 'B1');

select tests.assert(
  (select kcal = 0 and workout_done and not has_items
     from public.daily_log
    where user_id = '11111111-1111-1111-1111-111111111111'
      and date_key = '2026-07-19'),
  'a day with a workout but no items still appears (full outer join)');

-- DayEditor writes a manual figure; it must beat the derived sum.
update public.day_meta set manual_kcal = 1800, manual_protein = 120
 where user_id = '11111111-1111-1111-1111-111111111111'
   and date_key = '2026-07-20';

select tests.assert(
  (select kcal = 1800 and protein = 120
     from public.daily_log
    where user_id = '11111111-1111-1111-1111-111111111111'
      and date_key = '2026-07-20'),
  'a DayEditor manual override wins over the derived total');


-- ---------------------------------------------------------------------------
-- 4. Constraints that protect the domain logic.
-- ---------------------------------------------------------------------------
\echo '== constraints =='

do $$
begin
  begin
    insert into public.logged_items (user_id, date_key, slot_id, name)
    values ('11111111-1111-1111-1111-111111111111', '2026-07-20', 'brunch', 'bad slot');
    raise exception 'FAIL: an unknown slot_id was accepted';
  exception when check_violation then
    raise notice '  ok  slot_id is constrained to the five SLOT_DEFS';
  end;

  begin
    insert into public.metric_entries (user_id, date, weight)
    values ('11111111-1111-1111-1111-111111111111', '2026-07-20', 84);
    insert into public.metric_entries (user_id, date, weight)
    values ('11111111-1111-1111-1111-111111111111', '2026-07-20', 83);
    raise exception 'FAIL: duplicate metric entries for one date were accepted';
  exception when unique_violation then
    raise notice '  ok  metric_entries is unique per (user, date)';
  end;

  begin
    insert into public.exercise_logs (user_id, date_key, exercise_name, weight, reps)
    values ('11111111-1111-1111-1111-111111111111', '2026-07-20', 'סקוואט גב', 100, 5);
    insert into public.exercise_logs (user_id, date_key, exercise_name, weight, reps)
    values ('11111111-1111-1111-1111-111111111111', '2026-07-20', 'סקוואט גב', 105, 5);
    raise exception 'FAIL: duplicate exercise rows for one date were accepted';
  exception when unique_violation then
    raise notice '  ok  exercise_logs is unique per (user, date, exercise) for getLastLoggedSet';
  end;

  -- getPer100() divides by cooked_factor; a cooked variant without one would
  -- return NULL macros rather than failing loudly.
  begin
    insert into public.custom_ingredients (user_id, name, has_cooked_variant, cooked_factor)
    values ('11111111-1111-1111-1111-111111111111', 'bad', true, null);
    raise exception 'FAIL: a cooked variant without a cooked_factor was accepted';
  exception when check_violation then
    raise notice '  ok  a cooked variant requires a cooked_factor';
  end;
end
$$;

-- Deleting the active profile must not error; the client then resolves 'mine'.
delete from public.profiles
 where user_id = '11111111-1111-1111-1111-111111111111' and builtin_key = 'guest';

update public.user_settings
   set active_profile_id = (select id from public.profiles
                             where user_id = '11111111-1111-1111-1111-111111111111'
                               and builtin_key = 'mine')
 where user_id = '11111111-1111-1111-1111-111111111111';

delete from public.profiles
 where user_id = '11111111-1111-1111-1111-111111111111' and builtin_key = 'mine';

select tests.assert(
  (select active_profile_id is null from public.user_settings
    where user_id = '11111111-1111-1111-1111-111111111111'),
  'deleting the active profile nulls the reference instead of raising');


-- ---------------------------------------------------------------------------
-- 5. RLS actually isolates users.
--
-- Runs as the real `authenticated` role with a JWT sub GUC, which is exactly how
-- PostgREST invokes queries — asserting the policies from the outside rather than
-- trusting that they were declared.
-- ---------------------------------------------------------------------------
\echo '== RLS =='

-- Supabase grants these to `authenticated` by default; the local shim does not.
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;

-- These MUST run inside an explicit transaction. `set local` outside one is a
-- silent no-op, which would leave the session as the superuser table owner —
-- and an owner bypasses RLS entirely, so every assertion below would pass
-- against unprotected tables and prove nothing.
begin;

set local role authenticated;
set local "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';

-- Sanity check on the harness itself before trusting anything it reports.
select tests.assert(
  current_user = 'authenticated' and auth.uid() = '22222222-2222-2222-2222-222222222222',
  'harness: acting as the authenticated role with a JWT subject');

select tests.assert(
  (select count(*) from public.logged_items) = 0,
  'a user cannot read another user''s logged_items');

select tests.assert(
  (select count(*) from public.daily_totals) = 0,
  'the daily_totals view respects RLS (security_invoker)');

select tests.assert(
  (select count(*) from public.daily_log) = 0,
  'the daily_log view respects RLS (security_invoker)');

select tests.assert(
  (select count(*) from public.favorites) = 3,
  'a user does see their own seeded favorites');

-- Writing a row under someone else's user_id must be refused by `with check`.
do $$
begin
  insert into public.logged_items (user_id, date_key, slot_id, name)
  values ('11111111-1111-1111-1111-111111111111', '2026-07-22', 'lunch', 'forged');
  raise exception 'FAIL: a user forged a row under another user_id';
exception when insufficient_privilege then
  raise notice '  ok  with check blocks writing under another user_id';
end
$$;

-- user_id defaults to auth.uid(), so an insert that omits it lands correctly
-- rather than writing NULL and failing the policy with a confusing error.
insert into public.logged_items (date_key, slot_id, name, base_calories)
values ('2026-07-22', 'lunch', 'mine', 400);

select tests.assert(
  (select user_id = '22222222-2222-2222-2222-222222222222'
     from public.logged_items where name = 'mine'),
  'user_id defaults to auth.uid() when the client omits it');

commit;

-- anon sees nothing anywhere.
begin;
set local role anon;
do $$
declare n int;
begin
  begin
    select count(*) into n from public.logged_items;
    if n <> 0 then
      raise exception 'FAIL: anon read % logged_items rows', n;
    end if;
    raise notice '  ok  anon reads no logged_items';
  exception when insufficient_privilege then
    raise notice '  ok  anon has no privilege on logged_items at all';
  end;
end
$$;
commit;


-- ---------------------------------------------------------------------------
-- 6. Account deletion cascades. Without `on delete cascade` on every auth.users
--    FK, deleting an account fails on a foreign key violation.
-- ---------------------------------------------------------------------------
\echo '== cascade =='

delete from auth.users where id = '11111111-1111-1111-1111-111111111111';

select tests.assert(
  (select count(*) from public.logged_items
    where user_id = '11111111-1111-1111-1111-111111111111') = 0
  and (select count(*) from public.favorites
    where user_id = '11111111-1111-1111-1111-111111111111') = 0
  and (select count(*) from public.user_settings
    where user_id = '11111111-1111-1111-1111-111111111111') = 0,
  'deleting an auth user cascades to every owned table');

\echo ''
\echo 'ALL SCHEMA TESTS PASSED'
