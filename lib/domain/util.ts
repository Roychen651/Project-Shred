// One-decimal rounding used throughout the app for grams/protein/carbs/fat display.
// Calories are always whole numbers (Math.round directly); this is only for the rest.
export function roundNum(n: number): number {
  return Math.round(n * 10) / 10;
}

// Same id shape the artifact used everywhere (`${prefix}-${Date.now()}-${random}`),
// factored out once instead of re-typed at each call site. Used only for
// UI-local, never-persisted-directly ids (e.g. a quick-log parse preview row
// before it's confirmed into a real logged item) — see genUuid() below for
// anything that becomes a row in a Postgres `uuid` primary key column.
export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Sprint 8: every id that ends up as a Supabase table's `uuid primary key`
// (logged_items.id, metric_entries.id, profiles.id, ...) must actually BE a
// UUID — genId()'s `log-1730-x9k2p` shape isn't valid Postgres uuid syntax and
// an insert with it as `id` would be rejected outright. crypto.randomUUID() is
// available in every browser and Node runtime this app targets.
export function genUuid(): string {
  return crypto.randomUUID();
}
