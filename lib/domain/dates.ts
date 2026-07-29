// Date-key handling. ProjectShred.artifact.jsx:1256-1274, 876-901.
//
// CRITICAL: every function here works in LOCAL time. dateKey() must never use
// toISOString() (which converts to UTC) — this is the exact bug fixed in Sprint
// 15.2: in any timezone ahead of UTC (Israel is UTC+2/+3), a local-midnight Date
// serialized through toISOString() lands on the PREVIOUS day, and because
// shiftDateKey() re-serializes through dateKey() after shifting, the bug's own
// -1-day error stacked on top of the intended shift — "yesterday" landed 2 days
// back. See the Sprint 15.2 regression test below, pinned to the exact dates
// CLAUDE.md verified the fix against.
//
// This local-time discipline matters even more once a server is involved:
// Postgres `now()::date` / `current_date` are UTC on Supabase, so no table in
// this app ever defaults a date server-side — every date_key is computed here,
// client-side, and sent explicitly (see supabase/migrations/0001_init.sql).

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, n: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
}

export function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return dateKey(dt);
}

export function formatShortDate(key: string): string {
  const [, m, day] = key.split('-');
  return `${day}/${m}`;
}

const HEBREW_MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

// `now` is an optional trailing parameter defaulting to `new Date()` — omitted by
// production callers (identical behavior to the artifact), supplied by tests for
// determinism. Same technique used below in slots.ts, analytics.ts and aiCoach.ts.
export function formatHebrewDate(key: string, now: Date = new Date()): string {
  const today = dateKey(now);
  const yesterday = shiftDateKey(today, -1);
  const tomorrow = shiftDateKey(today, 1);
  if (key === today) return 'היום';
  if (key === yesterday) return 'אתמול';
  if (key === tomorrow) return 'מחר';
  const [, m, d] = key.split('-');
  return `${parseInt(d, 10)} ב${HEBREW_MONTHS[parseInt(m, 10) - 1]}`;
}
