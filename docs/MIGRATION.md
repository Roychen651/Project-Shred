# PROJECT SHRED — artifact → production migration

Moving the app from a single-file Claude.ai artifact (`reference/ProjectShred.artifact.jsx`,
~6,500 lines, persisted only through `window.storage`) to Next.js + Supabase with real
Google accounts and Postgres.

This is an **infrastructure migration, not a redesign**. The nutrition and fitness logic has
been iterated across 16+ sprints (see `CLAUDE.md`) and is correct as-is.

---

## Invariants — things this migration must not change

| Invariant | Where it lives today |
|---|---|
| Mifflin–St Jeor with a flat `+5`, no sex term | `computeProfileTargets()` — artifact:1090 |
| Protein `2.0 g/kg`, fat `0.7 g/kg`, carbs = remainder | same |
| Training day = rest + 300 kcal, delivered entirely as +75 g carbs | same |
| Unified item schema: `base_*` macros captured at `grams = 100` | `makeLoggedItem()` — artifact:839 |
| Displayed macros = `base × (grams / 100)`; `grams` is a **portion index**, not a weight | `scaleLoggedItem()` — artifact:855 |
| Daily totals count **completed items only** | `sumItems()` — artifact:868 |
| Cooked macros are *derived* as `raw ÷ cookedFactor`, never stored twice | `getPer100()` — artifact:791 |
| `dateKey()` uses **local** calendar components, never `toISOString()` | artifact:1260 — the Sprint 15.2 bug |
| Smart Swap scoring: `kcalDiff/40 + proteinDiff/6`, top 3 | `findBestMatches()` — artifact:993 |
| Date-first navigation: `selectedDateKey` + `itemsByDate` are the only log state | artifact:5758 |
| Obsidian theme, JEWEL palette, Frank Ruhl Libre / Heebo / IBM Plex Sans Hebrew | artifact:23–122 |

The `dateKey` one gets **more** dangerous with a server involved, not less: Postgres
`now()::date` and `current_date` are UTC on Supabase, and Israel is UTC+2/+3, so an
evening meal would land on the wrong day. Date keys are always computed client-side and
sent as a `date`. There is no server-side date defaulting anywhere in the schema.

---

## Decisions taken, and where they differ from `docs/MIGRATION_BRIEF.original.md`

**Reference data stays in the repo, not Postgres.** `INGREDIENT_DB` (279), `HACKS` (64),
`EATING_OUT_MENU` (73), the four built-in Cibus restaurants and the A1/B1/A2/B2 workout
templates become typed TS modules under `lib/data/`. They are static, never user-written,
read on every keystroke of the Plate Composer search, and feed `buildFoodLibrary()`'s
per-render combinatorial enumeration. In Postgres they would add latency to the hottest UI
path and cost the literal types. The shape is fixed, so moving them to a table later — the
day editing-without-a-deploy actually matters — is a small, additive change.

**Scaled macros are not computed in the database.** No generated columns, no per-item view.
`base × grams/100` runs on every render; it belongs in `lib/domain/items.ts`. The one place
the database does the arithmetic is the `daily_totals` aggregate, where SQL is genuinely the
right tool.

**`dailyLogs` is split rather than dropped.** The brief proposed deriving everything from
`logged_items`. Totals, yes — but `workoutDone`/`workoutDay` are stored nowhere else and are
not derivable from food logs, and `DayEditor` writes kcal/protein straight into a date with
no items behind it. Those live in `day_meta`; everything else is derived by the `daily_log`
view.

**The Sprint 10 synthetic seed history is not ported.** With real accounts there is real
history from day one, and `CLAUDE.md` already lists seed-vs-real ambiguity as a known wart.
New accounts start with an empty heatmap.

**Logs are per-user, not per-profile.** Switching profiles recalculates targets only; it does
not swap the food log. This matches the artifact, where `itemsByDate` was never keyed by
profile. There is deliberately no `profile_id` on `logged_items`.

**`apiConfig.key` is dropped entirely.** Per `CLAUDE.md` (Sprint 9) it never fired a network
request — an honestly-labelled placeholder. Carrying an inert secret field into an app with
real accounts creates a credential surface for a feature that does nothing. Only
`ai_provider` survives. A live LLM connection needs a server route with the key in an
environment variable, which the artifact's own roadmap already concluded.

**Supabase is a sync target, not the read path.** The artifact is instant: every log is a
`setState`, with a debounced background write plus a `visibilitychange`/`pagehide` flush
(Sprint 16.2 — artifact:6047). That is already the right pattern. Client state keeps the
same shape (`itemsByDate` etc.) in a Zustand store, mutates optimistically, and writes
through on the same schedule. React Query is built for server-state-as-truth with cache
invalidation and would fight this design.

**Next.js, but not for React Server Components.** This is one large client tree —
`ThemeContext`, Tone.js, `window.innerHeight` measurement, inline RTL styles. Essentially
nothing can be a server component, and no component should be contorted to try. Next.js is
here for the Vercel deploy story, `@supabase/ssr` cookie auth, and a future server route for
the LLM proxy.

**Inline styles are ported verbatim.** The artifact uses inline styles because Tailwind's JIT
was unavailable in the sandbox, so arbitrary-value classes silently did nothing. JIT works in
real Next.js, so those classes would now work — but converting 6,500 lines of exact hex and
glow values is pure visual-regression risk for zero functional gain.

---

## Schema

`supabase/migrations/`

| Migration | Contents |
|---|---|
| `…0001_init.sql` | 10 user-owned tables + `set_updated_at()` |
| `…0002_rls.sql` | RLS enabled and policied on all 10 |
| `…0003_views_and_bootstrap.sql` | `daily_totals`, `daily_log`, new-user bootstrap trigger |

Two deviations from the brief's RLS template, both deliberate: policies use
`(select auth.uid())` rather than bare `auth.uid()` so the planner hoists it to an InitPlan
instead of re-invoking per row, and every policy is scoped `to authenticated`. Both views
are declared `security_invoker = true` — without it a view runs as its owner (a superuser on
Supabase) and **bypasses RLS entirely**.

### Mapping from the old storage blob

| `window.storage` key | Postgres |
|---|---|
| `profiles` (keyed `mine`/`guest`/`custom-…`) | `profiles` (uuid pk + `builtin_key`) |
| `activeProfileId`, `theme`, `hasSeenOnboarding`, `apiConfig.provider`, `aiReport` | `user_settings` |
| `itemsByDate` | `logged_items` |
| `dailyLogs` | `day_meta` (workout flags + DayEditor overrides) + `daily_log` view |
| `metricEntries` | `metric_entries` |
| `exerciseLogs` | `exercise_logs` |
| `favorites` | `favorites` |
| `customIngredients` | `custom_ingredients` (nested `raw{}` flattened to columns) |
| `customHacks` | `custom_hacks` |
| `customRestaurants` | `custom_restaurants` (`dishes`/`plate_options` as `jsonb`) |
| `apiConfig.key` | *dropped — see above* |
| `INGREDIENT_DB` / `HACKS` / `EATING_OUT_MENU` | `lib/data/*.ts`, not the database |

### Testing the schema

```bash
npm run test:schema     # needs a reachable Postgres 15+; no Docker, no Supabase project
```

`supabase/tests/00_shim_supabase.sql` stands up the minimum slice of Supabase's managed
`auth` schema (the `anon`/`authenticated` roles, `auth.users`, `auth.uid()` driven by a
session GUC) so the migrations can be applied and exercised anywhere. It is never applied to
a real project.

`01_schema_test.sql` asserts the bootstrap trigger, `daily_totals` parity with `sumItems()`
(including that uncompleted items are excluded and that rounding happens per item), the
`daily_log` merge and override rules, the constraints that protect domain logic, real
cross-user RLS isolation from inside the `authenticated` role, and account-deletion cascade.

---

## Sequence

- [x] **1 · Schema + RLS.** Migrations, views, bootstrap trigger, schema tests.
- [x] **2 · Domain extraction + state engine.** 13 pure modules under `lib/domain/`, 96 golden
      tests cross-checked against the verbatim artifact logic (not just self-consistency).
      `lib/store/shred-store.ts` (Zustand, exact state shape, `logItems()` signature preserved)
      and `lib/store/sync-scheduler.ts` (the Sprint 16.2 debounce + visibility/pagehide/blur
      flush pattern, extracted and tested standalone). Actual Supabase persistence is not yet
      wired in — see CLAUDE.md's Sprint 2 summary for the honest scope note.
- [x] **3 · Reference data + UI foundation.** `INGREDIENT_DB` (279) / `HACKS` (64) /
      `EATING_OUT_MENU` (73) / the 4 Cibus builders / `WORKOUTS` transcribed verbatim into
      `lib/data/`, count- and structure-tested, and cross-checked against the raw source
      independently of the transcription itself. `buildFoodLibrary()`'s milestone-2 deferred
      wiring is closed — it now runs against the real data. Theme tokens (`JEWEL`,
      `THEME_PRESETS`, fonts) ported into `lib/theme/`, plus a first slice of the app shell
      (`BottomNav`, `SheetModal`, `ActionFab`, `FabMenu`) rebuilt with framer-motion in place of
      the artifact's CSS transitions — verified in a real browser, not just unit tests.
- [ ] **4 · Auth.** `@supabase/ssr` browser + server clients, middleware session refresh,
      `/login` with Google, `/auth/callback` code exchange, route guard.
- [ ] **5 · Wire the sync scheduler to Supabase.** `lib/store/sync-scheduler.ts`'s `persist()`
      is currently a mock in tests; give it a real Supabase-backed implementation once
      credentials exist.
- [ ] **6 · UI port.** The remaining components (Timeline, CibusMatrix, PlateComposerWidget,
      WorkoutPanel, AiCoachWidget, etc.) moved into the shell, wired to the store.
- [ ] **7 · Backup import.** Read an exported `project-shred-backup-v*.json` and load it into
      the account — this is how existing artifact data (including real body metrics) gets in.
- [ ] **8 · CI/CD.** Vercel preview-per-PR and production on `main`.

---

## Account setup still needed

Nothing below can be done from this repo — they need a human with dashboard access.

1. **Supabase project.** Create it, then put `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (and in Vercel). Apply migrations with
   `supabase link --project-ref <ref>` then `supabase db push` — this keeps the database
   password and service-role key on your machine.
2. **Google OAuth.** Create an OAuth 2.0 client in Google Cloud Console, then paste the
   client ID and secret into Supabase → Authentication → Providers → Google. Authorised
   redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`. In Supabase →
   Authentication → URL Configuration, set the site URL and add
   `http://localhost:3000/auth/callback` plus the Vercel preview and production callbacks as
   redirect URLs.
3. **Vercel.** Import the GitHub repo, add the two `NEXT_PUBLIC_*` variables.

The anon key is public by design (RLS is what protects the data) but is still kept out of
git and injected as an environment variable. The service-role key is never needed by this
application and should not be added to Vercel.
