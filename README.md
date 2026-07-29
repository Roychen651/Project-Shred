# PROJECT SHRED

A Hebrew-first, RTL nutrition and training tracker — macro logging against a
Mifflin–St Jeor derived target, a raw↔cooked ingredient composer, an Israeli
restaurant/takeout database, A/B upper-lower workout tracking with progressive
overload, and a compliance heatmap.

Currently mid-migration from a single-file Claude.ai artifact to Next.js +
Supabase. See **[`docs/MIGRATION.md`](docs/MIGRATION.md)** for the plan, the
decisions behind it, and what's done so far. **[`CLAUDE.md`](CLAUDE.md)** is the
living technical changelog covering 16+ sprints of product development and is
the reason most things are built the way they are — read it before changing
anything in the nutrition or fitness logic.

## Stack

Next.js (App Router) · Supabase (Postgres, Auth, RLS) · TypeScript · Tailwind ·
lucide-react · Tone.js · Zustand · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local     # fill in from your Supabase project
npm run dev
```

Applying the schema to a Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Scripts

| | |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run lint` | eslint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest |
| `npm run test:schema` | apply migrations to a throwaway database and assert the schema, views, constraints and RLS (needs a reachable Postgres 15+, no Docker) |

## Layout

```
app/                    Next.js App Router
lib/domain/             the "must not change" pure logic — targets, item scaling,
                        raw/cooked conversion, dates, scoring, smart swap
lib/data/               static reference data (279 ingredients, 64 recipes,
                        73 eating-out items, Cibus restaurants, workout templates)
supabase/migrations/    schema, RLS, views, new-user bootstrap
supabase/tests/         schema tests + a local shim for Supabase's auth schema
reference/              frozen copy of the artifact being ported — do not edit
docs/                   migration plan and the original brief
```
