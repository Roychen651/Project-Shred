-- ============================================================================
-- PROJECT SHRED — 0001 · Initial schema
--
-- Ports the single `window.storage` JSON blob (STORAGE_KEY = 'project-shred-state')
-- from the artifact build into real Postgres tables.
--
-- Design rules this schema follows, and why:
--
--  1. `grams` on a logged item is a PORTION INDEX, not a weight. 100 = "the portion
--     exactly as originally recorded". Displayed macros are `base_* x (grams/100)`.
--     That scaling is NOT done here (no generated columns, no view) — it is a pure
--     client function (`scaleLoggedItem`) because it runs on every render. The only
--     place the database does the math is the aggregate view in migration 0003.
--
--  2. `date_key` is a plain `date` supplied by the CLIENT from LOCAL calendar
--     components (getFullYear/getMonth/getDate). Never default it to `now()::date`
--     or `current_date` — those are UTC on Supabase, and for any timezone ahead of
--     UTC (Israel is UTC+2/+3) a local-evening log would land on the wrong day.
--     This is the exact class of bug fixed in Sprint 15.2; the fix must survive
--     the move to a server.
--
--  3. Logs are per-USER, not per-profile. Switching profiles recalculates BMR/TDEE
--     targets only; it does not swap the food log. This matches the artifact, where
--     `itemsByDate` was never keyed by profile. There is deliberately no
--     `profile_id` column on `logged_items`.
--
--  4. Reference data (INGREDIENT_DB 279 / HACKS 64 / EATING_OUT_MENU 73, the four
--     built-in Restaurant Matrix restaurants, the A1/B1/A2/B2 workout templates) is NOT in this
--     schema. It lives in version-controlled TypeScript under `lib/data/` — it is
--     static, read on every keystroke of the Plate Composer search, and feeds
--     `buildFoodLibrary()`'s per-render combinatorial enumeration. Postgres would
--     add latency to the hottest UI path and buy nothing.
--
--  5. Every user-owned table gets `user_id ... default auth.uid()` so a client
--     insert that omits it cannot silently write NULL and then fail an RLS check
--     with a confusing error.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared trigger: keep `updated_at` honest without trusting the client.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ===========================================================================
-- profiles  <-  state.profiles (object keyed by 'mine' | 'guest' | 'custom-<ts>')
--
-- The artifact's two seeded profiles were `locked: true` and referenced by the
-- literal string id 'mine' (the fallback target when the active profile is
-- deleted). Real uuid primary keys replace those string ids, so `builtin_key`
-- preserves the ability to resolve "the default profile" without hardcoding a uuid.
-- ===========================================================================
create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,

  name          text not null,
  age           integer,
  weight        numeric(6,2),   -- kg
  height        numeric(6,2),   -- cm
  waist         numeric(6,2),   -- cm

  -- Multipliers live in lib/domain/targets.ts (ACTIVITY_LEVELS / GOALS), not here.
  -- The DB only constrains the key so a typo can never reach computeProfileTargets().
  activity      text not null default 'office'
                  check (activity in ('sedentary', 'office', 'veryActive')),
  goal          text not null default 'maintain'
                  check (goal in ('aggressive', 'moderate', 'maintain', 'bulk')),

  -- was `locked: true` on the two seeded profiles
  is_builtin    boolean not null default false,
  builtin_key   text check (builtin_key in ('mine', 'guest')),

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- a user has at most one 'mine' and one 'guest'
  constraint profiles_one_builtin_per_key unique (user_id, builtin_key)
);

create index profiles_user_id_idx on public.profiles (user_id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- user_settings  <-  state.activeProfileId + state.theme + hasSeenOnboarding
--                    + apiConfig.provider + aiReport
--
-- NOTE: `apiConfig.key` is deliberately absent. Per CLAUDE.md (Sprint 9) that field
-- never fired a network request — it was an honestly-labelled placeholder. Carrying
-- an inert secret field into an app with real user accounts creates a credential
-- surface for a feature that does nothing. If a live LLM connection is ever built it
-- needs a server-side route with the key in an environment variable (which the
-- artifact's own roadmap already concluded), never a client-readable table.
--
-- `dayMode` (training/rest) is intentionally NOT persisted — it was never in the
-- artifact's storage payload and resets to 'training' on each load. Preserved as-is.
-- ===========================================================================
create table public.user_settings (
  user_id             uuid primary key default auth.uid() references auth.users(id) on delete cascade,

  -- if the active profile is deleted, fall back to null; the client then resolves
  -- the 'mine' builtin, mirroring `if (activeProfileId === id) setActiveProfileId('mine')`
  active_profile_id   uuid references public.profiles(id) on delete set null,

  theme_mode          text not null default 'dark'
                        check (theme_mode in ('dark', 'light')),
  accent_key          text not null default 'emerald'
                        check (accent_key in ('emerald', 'cyan', 'violet', 'gold')),
  density             text not null default 'comfortable'
                        check (density in ('comfortable', 'compact')),
  feedback_enabled    boolean not null default true,
  has_seen_onboarding boolean not null default false,

  ai_provider         text not null default 'none'
                        check (ai_provider in ('none', 'groq', 'openai', 'huggingface')),
  ai_report           jsonb,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- logged_items  <-  state.itemsByDate  (THE core table)
--
-- The unified item schema from Sprint 15, 1:1. Every logging surface in the app
-- (Restaurant Matrix, Kitchen Hacks, Plate Composer, quick-log NLP parser, Smart Swap,
-- Favorites) normalizes through `makeLoggedItem()` into exactly this shape.
-- ===========================================================================
create table public.logged_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,

  date_key       date not null,   -- client-supplied LOCAL date. See rule 2 at the top.
  slot_id        text not null
                   check (slot_id in ('breakfast', 'midmorning', 'lunch', 'preworkout', 'dinner')),

  name           text not null,

  -- macros AS ORIGINALLY LOGGED, i.e. at grams = 100 ("1x the recorded portion")
  base_calories  numeric(8,2) not null default 0,
  base_protein   numeric(8,2) not null default 0,
  base_carbs     numeric(8,2) not null default 0,
  base_fats      numeric(8,2) not null default 0,

  -- PORTION INDEX, not a literal weight for anything that isn't a raw ingredient.
  -- 150 means "1.5x whatever I originally logged".
  grams          numeric(8,2) not null default 100 check (grams >= 0),

  is_completed   boolean not null default true,

  source         text not null default 'manual'
                   check (source in ('restaurant', 'hack', 'plate', 'quicklog', 'favorite', 'swap', 'manual')),

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- The single hottest query in the app: "give me everything for this date".
create index logged_items_user_date_idx on public.logged_items (user_id, date_key);
-- Stable render order within a slot (the artifact appended to an array).
create index logged_items_order_idx on public.logged_items (user_id, date_key, created_at, id);

create trigger logged_items_set_updated_at
  before update on public.logged_items
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- day_meta  <-  the parts of state.dailyLogs that are NOT derivable from items
--
-- The migration brief proposed dropping `dailyLogs` entirely and computing daily
-- totals from `logged_items`. That is right for the totals, but two things would
-- have been lost:
--
--   * `workoutDone` / `workoutDay` are stored nowhere else and cannot be derived
--     from food logs at all.
--   * `DayEditor` lets a past day's kcal/protein be edited directly, with no
--     underlying items to back it — a real, shipped retroactive-backfill feature.
--
-- So: totals are derived (see the view in 0003), and only the genuinely
-- non-derivable bits live here. A non-null `manual_*` value overrides the derived
-- sum for that date.
--
-- The Sprint 10 synthetic seed history is NOT ported. With real accounts there is
-- real history from day one, and CLAUDE.md already lists seed-vs-real ambiguity as
-- a known wart. New accounts start with an empty heatmap.
-- ===========================================================================
create table public.day_meta (
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  date_key        date not null,

  workout_done    boolean not null default false,
  workout_day     text check (workout_day in ('A1', 'B1', 'A2', 'B2')),

  -- DayEditor overrides. NULL = "use the value derived from logged_items".
  manual_kcal     numeric(8,2),
  manual_protein  numeric(8,2),
  manual_carbs    numeric(8,2),
  manual_fat      numeric(8,2),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  primary key (user_id, date_key)
);

create trigger day_meta_set_updated_at
  before update on public.day_meta
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- metric_entries  <-  state.metricEntries
--
-- The dual trend chart and the weekly report both diff consecutive entries in
-- chronological order, and MetricTracker appends. Without the unique constraint
-- two entries for the same day would silently skew every delta.
-- ===========================================================================
create table public.metric_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,

  date        date not null,
  weight      numeric(6,2),
  waist       numeric(6,2),

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint metric_entries_one_per_day unique (user_id, date)
);

create index metric_entries_user_date_idx on public.metric_entries (user_id, date);

create trigger metric_entries_set_updated_at
  before update on public.metric_entries
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- exercise_logs  <-  state.exerciseLogs  ({ [dateKey]: { [exerciseName]: {weight, reps} } })
--
-- The source shape is one record per (date, exercise) — an object key, so
-- inherently unique. `getLastLoggedSet()` scans backward for "the most recent
-- prior date with a weight for this exercise" and would become ambiguous if
-- duplicates were allowed, so the uniqueness is enforced here and writes upsert.
-- ===========================================================================
create table public.exercise_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,

  date_key       date not null,
  exercise_name  text not null,
  weight         numeric(6,2),
  reps           integer,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint exercise_logs_one_per_exercise_per_day unique (user_id, date_key, exercise_name)
);

-- Serves getLastLoggedSet(): "same exercise, date < today, newest first".
create index exercise_logs_pr_lookup_idx
  on public.exercise_logs (user_id, exercise_name, date_key desc);

create trigger exercise_logs_set_updated_at
  before update on public.exercise_logs
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- favorites  <-  state.favorites
-- Flat by design — one-tap quick-add chips. `position` preserves the chip order,
-- which was array order in the artifact.
-- ===========================================================================
create table public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,

  name        text not null,
  icon        text not null default '⭐',
  kcal        numeric(8,2) not null default 0,
  protein     numeric(8,2) not null default 0,
  carbs       numeric(8,2) not null default 0,
  fat         numeric(8,2) not null default 0,
  position    integer not null default 0,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index favorites_user_position_idx on public.favorites (user_id, position, created_at);

create trigger favorites_set_updated_at
  before update on public.favorites
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- custom_ingredients  <-  state.customIngredients
--
-- The artifact nests macros under `raw: { kcal, protein, carbs, fat }` to match
-- INGREDIENT_DB's shape (where `raw` is meaningful because cooked values are
-- DERIVED from it via getPer100()). Flattened to columns here; the client maps
-- back to the nested shape so `getPer100`/`getIngredientMacros` stay untouched.
--
-- Custom ingredients are always single-state (a packaged product's label already
-- reflects how it is normally weighed), so has_cooked_variant defaults false — but
-- the columns exist so the constraint can relax later without a migration.
-- ===========================================================================
create table public.custom_ingredients (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users(id) on delete cascade,

  name                text not null,
  category            text not null default 'protein'
                        check (category in ('protein', 'carb', 'fat', 'veg', 'fruit', 'dairy_snacks', 'condiments', 'beverages')),

  has_cooked_variant  boolean not null default false,
  cooked_factor       numeric(5,3) check (cooked_factor > 0),

  raw_kcal            numeric(8,2) not null default 0,
  raw_protein         numeric(8,2) not null default 0,
  raw_carbs           numeric(8,2) not null default 0,
  raw_fat             numeric(8,2) not null default 0,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- getPer100() divides by cooked_factor; a cooked variant without one would be a
  -- division by null and silently produce NULL macros.
  constraint custom_ingredients_cooked_factor_required
    check (not has_cooked_variant or cooked_factor is not null)
);

create index custom_ingredients_user_idx on public.custom_ingredients (user_id, category);

create trigger custom_ingredients_set_updated_at
  before update on public.custom_ingredients
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- custom_hacks  <-  state.customHacks
-- Flat shape, rendered through the same HackCard as the 64 built-in recipes.
-- ===========================================================================
create table public.custom_hacks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,

  name        text not null,
  detail      text not null default 'מתכון אישי',
  icon        text not null default '🍽️',
  category    text not null default 'main'
                check (category in ('breakfast', 'main', 'snack', 'dessert')),

  kcal        numeric(8,2) not null default 0,
  protein     numeric(8,2) not null default 0,
  carbs       numeric(8,2) not null default 0,
  fat         numeric(8,2) not null default 0,

  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index custom_hacks_user_idx on public.custom_hacks (user_id, category);

create trigger custom_hacks_set_updated_at
  before update on public.custom_hacks
  for each row execute function public.set_updated_at();


-- ===========================================================================
-- custom_restaurants  <-  state.customRestaurants
--
-- Deliberately jsonb rather than three more relational tables. A custom restaurant
-- is a document the user edits as a whole in RestaurantBuilderModal (add/remove
-- dish rows, then save), and nothing ever queries its internals server-side —
-- `buildFoodLibrary()` loads all of them and enumerates in the client. Normalizing
-- would mean three tables and a transaction per save for zero query benefit.
--
--   type 'simple' -> dishes:        [{ id, name, kcal, protein, carbs, fat }, ...]
--   type 'plate3' -> plate_options: { veg: [...], protein: [...], carb: [...] }
-- ===========================================================================
create table public.custom_restaurants (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,

  name           text not null,
  type           text not null default 'simple' check (type in ('simple', 'plate3')),

  dishes         jsonb not null default '[]'::jsonb,
  plate_options  jsonb not null default '{"veg":[],"protein":[],"carb":[]}'::jsonb,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint custom_restaurants_dishes_is_array
    check (jsonb_typeof(dishes) = 'array'),
  constraint custom_restaurants_plate_options_is_object
    check (jsonb_typeof(plate_options) = 'object')
);

create index custom_restaurants_user_idx on public.custom_restaurants (user_id);

create trigger custom_restaurants_set_updated_at
  before update on public.custom_restaurants
  for each row execute function public.set_updated_at();
