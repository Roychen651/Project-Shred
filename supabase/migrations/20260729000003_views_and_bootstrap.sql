-- ============================================================================
-- PROJECT SHRED — 0003 · Derived views + new-user bootstrap
-- ============================================================================


-- ---------------------------------------------------------------------------
-- daily_totals — the aggregate replacement for the derived half of `dailyLogs`.
--
-- TWO THINGS HERE ARE EASY TO GET WRONG, AND MIGRATION_BRIEF.md GOT BOTH WRONG:
--
--  1. `where is_completed` is REQUIRED.
--     `sumItems()` skips items whose checkbox is unticked (ProjectShred.jsx:868).
--     A plain `SUM(...) GROUP BY date_key` would silently fold in every planned-
--     but-not-eaten item, inflating totals and shifting every heatmap score and
--     weekly-report average. This is not a rounding nit — it changes the numbers.
--
--  2. Rounding happens PER ITEM, then sums — not the other way round.
--     `scaleLoggedItem()` rounds each item's macros before `sumItems()` adds them
--     (calories to a whole number, the rest to one decimal via `roundNum`).
--     Summing first and rounding once would drift from what the client shows on
--     the Today tab, and the two numbers must agree — the heatmap's rightmost cell
--     is the same day the hero ring is displaying.
--
-- security_invoker = true is load-bearing. Postgres views run as their OWNER by
-- default, which on Supabase is a superuser — the view would BYPASS RLS entirely
-- and happily return every user's totals to anyone who could select from it.
-- ---------------------------------------------------------------------------
create view public.daily_totals
with (security_invoker = true) as
select
  li.user_id,
  li.date_key,
  sum(round(li.base_calories * li.grams / 100.0, 0))   as kcal,
  sum(round(li.base_protein  * li.grams / 100.0, 1))   as protein,
  sum(round(li.base_carbs    * li.grams / 100.0, 1))   as carbs,
  sum(round(li.base_fats     * li.grams / 100.0, 1))   as fat,
  count(*)                                             as item_count
from public.logged_items li
where li.is_completed
group by li.user_id, li.date_key;

comment on view public.daily_totals is
  'Per-date macro totals derived from completed logged_items. Mirrors sumItems() exactly: '
  'completed-only, rounded per item before summing.';


-- ---------------------------------------------------------------------------
-- daily_log — the full `dailyLogs[dateKey]` shape the heatmap, weekly report and
-- completion certificate used to read, reassembled from its two real sources.
--
-- A FULL OUTER JOIN is deliberate: a date can have items but no day_meta (logged
-- food, no workout recorded), or day_meta but no items (a workout logged on a day
-- nothing was eaten, or a DayEditor manual backfill with no underlying items).
-- Either side alone is a legitimate row.
--
-- coalesce order encodes the override rule: a non-null manual_* from DayEditor
-- wins over the derived sum; otherwise the derived sum; otherwise zero.
-- ---------------------------------------------------------------------------
create view public.daily_log
with (security_invoker = true) as
select
  coalesce(dt.user_id, dm.user_id)                       as user_id,
  coalesce(dt.date_key, dm.date_key)                     as date_key,
  coalesce(dm.manual_kcal,    dt.kcal,    0)             as kcal,
  coalesce(dm.manual_protein, dt.protein, 0)             as protein,
  coalesce(dm.manual_carbs,   dt.carbs,   0)             as carbs,
  coalesce(dm.manual_fat,     dt.fat,     0)             as fat,
  coalesce(dm.workout_done, false)                       as workout_done,
  dm.workout_day                                         as workout_day,
  coalesce(dt.item_count, 0)                             as item_count,
  -- lets the UI tell "a day with real logged food" apart from "a day that only
  -- exists because a workout or a manual override was recorded on it"
  (dt.date_key is not null)                              as has_items
from public.daily_totals dt
full outer join public.day_meta dm
  on dm.user_id = dt.user_id and dm.date_key = dt.date_key;

comment on view public.daily_log is
  'Direct replacement for the artifact''s dailyLogs[dateKey] object: derived totals '
  'merged with non-derivable workout flags and DayEditor manual overrides.';


-- ---------------------------------------------------------------------------
-- New-user bootstrap.
--
-- Runs on auth.users insert so a first login lands on a working dashboard rather
-- than a NaN-riddled empty state. Mirrors what the artifact had as module
-- constants: two profiles (DEFAULT_PROFILES) and three favorite chips.
--
-- IMPORTANT — the seeded 'mine' profile uses the app's GENERIC template values
-- (28y / 75kg / 175cm / 90cm / office / maintain — the same defaults `addProfile()`
-- used, chosen so Mifflin-St Jeor never divides by zero or renders NaN), NOT the
-- artifact author's personal measurements. Those were a single-user constant;
-- seeding a stranger's account with someone else's body metrics would be a real
-- bug, not fidelity to the original. Real numbers come from Settings, or from
-- importing an existing JSON backup.
--
-- security definer is required — the trigger fires inside auth's context where the
-- caller has no rights on public tables. `set search_path = ''` with fully
-- qualified names is the standard hardening for a definer function: it stops a
-- caller-controlled search_path from resolving `profiles` to something else.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mine_id uuid;
  v_display_name text;
begin
  -- Google OAuth populates one of these; fall back to the artifact's own label.
  v_display_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    'הפרופיל שלי'
  );

  insert into public.profiles
    (user_id, name, age, weight, height, waist, activity, goal, is_builtin, builtin_key)
  values
    (new.id, v_display_name, 28, 75, 175, 90, 'office', 'maintain', true, 'mine')
  returning id into v_mine_id;

  insert into public.profiles
    (user_id, name, age, weight, height, waist, activity, goal, is_builtin, builtin_key)
  values
    (new.id, 'פרופיל אורח / חבר', 30, 78, 175, 92, 'sedentary', 'maintain', true, 'guest');

  insert into public.user_settings (user_id, active_profile_id)
  values (new.id, v_mine_id);

  -- The three seeded quick-add chips, so FavoritesQuickBar is never empty.
  insert into public.favorites (user_id, name, icon, kcal, protein, carbs, fat, position)
  values
    (new.id, 'מעדן חלבון',      '🥤', 140, 15, 13,   3,    0),
    (new.id, 'שייק אבקה + מים', '🥤', 120, 25,  3,   1.5,  1),
    (new.id, '3 ביצים',          '🥚', 233, 19,  1.6, 16.5, 2);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
