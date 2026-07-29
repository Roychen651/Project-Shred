# PROJECT SHRED — Artifact → Real App Migration Brief
### Hand this file to Claude Code as the starting brief. It captures the current data model and a concrete plan so you don't have to re-derive it from the artifact source.

---

## Why this migration, in one line
`window.storage` only works for published artifacts, is scoped in ways that don't reliably support multi-device or multi-user use, and has no real auth — none of which is fixable from inside a single-file artifact. This needs a real stack: Next.js (or Vite) + Supabase (Postgres + Auth + RLS) + GitHub + CI/CD.

## Recommended stack
- **Frontend:** Next.js (App Router) — good Vercel deploy story, easy CI/CD, server components for anything that shouldn't ship the anon key.
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Storage if needed for images later).
- **Auth:** Supabase Auth with Google OAuth provider enabled.
- **Hosting/CI:** GitHub repo → Vercel (auto-deploy on push to `main`, preview deploys on PRs) or GitHub Actions if you want more control over the pipeline.
- **Styling:** keep Tailwind + the existing design tokens (JEWEL palette, THEME_PRESETS, FONT_DISPLAY/BODY/MONO) — these port over almost unchanged, they're just CSS-in-JS constants today.

---

## Current Data Model (from the artifact — CLAUDE.md v3.3)

Everything today lives in one `window.storage` JSON blob keyed by `STORAGE_KEY`. Below is that shape, with a suggested Postgres table per top-level key. Assume a `user_id uuid references auth.users` column on every table, and RLS policies of the form `user_id = auth.uid()` for all of them (see policy template at the bottom).

### `profiles` (object keyed by profile id → table `profiles`)
```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  age int, weight numeric, height numeric, waist numeric,
  activity text check (activity in ('sedentary','office','veryActive')),
  goal text check (goal in ('aggressive','moderate','maintain','bulk')),
  locked boolean default false,
  created_at timestamptz default now()
);
```
`activeProfileId` becomes a `active_profile_id` column on a `user_settings` table (see below) instead of a separate key.

### `itemsByDate` (THE core logging table) → `logged_items`
This is the most important table — the unified item schema from Sprint 15 maps almost 1:1:
```sql
create table logged_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  profile_id uuid references profiles,
  date_key date not null,               -- was the "YYYY-MM-DD" string key
  slot_id text not null,                -- 'breakfast'|'midmorning'|'lunch'|'preworkout'|'dinner'
  name text not null,
  base_calories numeric not null,
  base_protein numeric not null,
  base_carbs numeric not null,
  base_fats numeric not null,
  grams numeric default 100,             -- portion index, see note below
  is_completed boolean default true,
  source text,                           -- 'cibus'|'hack'|'plate'|'quicklog'|'favorite'|'swap'|'manual'
  created_at timestamptz default now()
);
create index on logged_items (user_id, date_key);
```
**Important semantic note to preserve:** `grams` is a *portion index* (100 = "as originally logged"), not always a literal weight — a Cibus plate or quick-log item doesn't have a true per-gram rate. Displayed macros = `base_* × (grams / 100)`. Keep this exact scaling logic in the new backend (as a DB view, a Postgres generated column, or computed at the API layer) rather than re-deriving it differently.

### `dailyLogs` → can likely be **dropped** as a stored table
In the artifact this existed for two reasons: (1) synthetic seed data so the heatmap wasn't empty on first run, (2) a derived summary of `itemsByDate`. In a real backend, just compute daily totals with a `SUM(...) GROUP BY date_key` query (or a materialized view) directly from `logged_items` — no synthetic seeding needed once there's real user data from day one.

### `metricEntries` → `metric_entries`
```sql
create table metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  weight numeric,
  waist numeric
);
```

### `customRestaurants` / `customHacks` / `customIngredients` / `favorites`
Each becomes its own table, same shape as the JS objects (id, name, macros, category/type, plus `user_id`). These are all small, simple CRUD tables — no special notes needed.

### `exerciseLogs` → `exercise_logs`
```sql
create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date_key date not null,
  exercise_name text not null,
  weight numeric,
  reps int
);
```
The "PR delta" badge logic (`getLastLoggedSet`) becomes a simple query: most recent `date_key < current` for the same `exercise_name`, ordered descending, limit 1.

### `apiConfig`, `hasSeenOnboarding`, theme settings (`mode`, `accentKey`, `density`, `feedback`) → `user_settings`
```sql
create table user_settings (
  user_id uuid primary key references auth.users,
  active_profile_id uuid references profiles,
  theme_mode text default 'dark',
  accent_key text default 'jade',
  density text default 'comfortable',
  feedback_enabled boolean default true,
  has_seen_onboarding boolean default false
);
```
**`apiConfig.key` (the optional LLM API key field):** do **not** store this in Postgres in plaintext if you ever wire up a real LLM connection. Use Supabase Edge Functions or a Next.js server route with the key in an environment variable / secret manager — never a client-readable table. This mirrors the "never export the key" rule already followed in the artifact.

### `INGREDIENT_DB` / `HACKS` / `EATING_OUT_MENU` (the ~280/64/73-item reference data)
These are **not per-user data** — they're shared reference tables everyone reads from:
```sql
create table ingredients_reference (
  id text primary key,
  name text not null,
  category text not null,
  has_cooked_variant boolean default false,
  cooked_factor numeric,
  kcal numeric, protein numeric, carbs numeric, fat numeric
);
```
(same pattern for a `hacks_reference` and `eating_out_reference` table). Seed these once from the arrays already in the artifact source — it's a one-time data migration script, not something users write to. Consider making these tables publicly readable (no RLS restriction) since they're not sensitive.

---

## RLS Policy Template
Apply this pattern to every per-user table:
```sql
alter table logged_items enable row level security;

create policy "Users can CRUD their own logged_items"
  on logged_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```
Repeat for `profiles`, `metric_entries`, `exercise_logs`, `custom_restaurants`, `custom_hacks`, `custom_ingredients`, `favorites`, `user_settings`. The two reference tables (`ingredients_reference`, etc.) can either skip RLS (public read) or use `for select using (true)` with no insert/update/delete policies for regular users.

---

## Suggested Migration Sequence for Claude Code
1. `npx create-next-app` (or Vite) fresh project, Tailwind configured with the existing color tokens ported from `THEME_PRESETS`/`JEWEL` in the artifact source.
2. Create Supabase project, run the schema above as a migration (`supabase/migrations/0001_init.sql`).
3. Enable Google provider in Supabase Auth dashboard; wire up `@supabase/auth-helpers-nextjs` (or `@supabase/ssr`) for login.
4. Enable RLS + policies (script above) before writing any client code that touches these tables — don't develop with RLS off "temporarily."
5. Seed `ingredients_reference`/`hacks_reference`/`eating_out_reference` from the arrays in the current artifact file — write a one-off Node script that reads the JS arrays and inserts them via the Supabase client.
6. Port UI components largely as-is — the component tree (Timeline, PlateComposerWidget, CibusMatrix, WorkoutPanel, etc.) doesn't need a rewrite, just swap `window.storage` reads/writes for Supabase queries (React Query or SWR recommended for the data-fetching layer).
7. Push to GitHub, connect the repo to Vercel for automatic preview deploys per PR and production deploy on `main` merge — this is your CI/CD without needing custom GitHub Actions, unless you want additional steps (lint/test) gating merges, in which case add a `.github/workflows/ci.yml` running `npm run lint && npm run build` on PRs.

---

## What NOT to change
The actual product logic (Mifflin-St Jeor formulas, the unified item schema's portion-scaling math, the raw/cooked ingredient conversion, the Smart Swap distance-scoring algorithm, the slot-flexibility model) is all sound and heavily iterated — none of that needs rethinking. This migration is purely an infrastructure change: same product, real backend.
