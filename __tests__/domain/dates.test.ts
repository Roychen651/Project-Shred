import { describe, it, expect } from 'vitest';
import { dateKey, addDays, shiftDateKey, formatShortDate, formatHebrewDate, formatHebrewMonthYear, buildMonthGrid } from '@/lib/domain/dates';

describe('dateKey — must use local calendar components, never toISOString()', () => {
  it('formats a local Date as YYYY-MM-DD', () => {
    expect(dateKey(new Date(2026, 6, 20))).toBe('2026-07-20'); // month index 6 = July
  });

  it('zero-pads single-digit months and days', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('addDays', () => {
  it('adds and subtracts days across a month boundary', () => {
    expect(dateKey(addDays(new Date(2026, 6, 31), 1))).toBe('2026-08-01');
    expect(dateKey(addDays(new Date(2026, 7, 1), -1))).toBe('2026-07-31');
  });
});

describe('shiftDateKey — Sprint 15.2 regression', () => {
  // Pinned to the exact scenario CLAUDE.md documents verifying the fix against:
  // "today 2026-07-26 -> yesterday 2026-07-25 -> tomorrow 2026-07-27". Before the
  // fix, dateKey() used toISOString() (UTC), which combined with shiftDateKey's
  // own +/-1 to make "yesterday" land 2 days back in any timezone ahead of UTC.
  it('yesterday of 2026-07-26 is 2026-07-25, not 2026-07-24', () => {
    expect(shiftDateKey('2026-07-26', -1)).toBe('2026-07-25');
  });

  it('tomorrow of 2026-07-26 is 2026-07-27', () => {
    expect(shiftDateKey('2026-07-26', 1)).toBe('2026-07-27');
  });

  it('shifting by 0 is a no-op', () => {
    expect(shiftDateKey('2026-07-26', 0)).toBe('2026-07-26');
  });

  it('crosses a year boundary correctly', () => {
    expect(shiftDateKey('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDateKey('2025-12-31', 1)).toBe('2026-01-01');
  });
});

describe('formatShortDate', () => {
  it('renders as D(D)/M(M) from the key, no re-parsing through Date', () => {
    expect(formatShortDate('2026-07-05')).toBe('05/07');
    expect(formatShortDate('2026-11-23')).toBe('23/11');
  });
});

describe('formatHebrewDate', () => {
  const now = new Date(2026, 6, 26); // 2026-07-26, matches the Sprint 15.2 scenario

  it('labels today, yesterday and tomorrow in Hebrew', () => {
    expect(formatHebrewDate('2026-07-26', now)).toBe('היום');
    expect(formatHebrewDate('2026-07-25', now)).toBe('אתמול');
    expect(formatHebrewDate('2026-07-27', now)).toBe('מחר');
  });

  it('falls back to "D בMONTH" for any other date', () => {
    expect(formatHebrewDate('2026-01-15', now)).toBe('15 בינואר');
    expect(formatHebrewDate('2026-12-01', now)).toBe('1 בדצמבר');
  });
});

describe('formatHebrewMonthYear', () => {
  it('renders a Hebrew month name with the year', () => {
    expect(formatHebrewMonthYear(2026, 1)).toBe('פברואר 2026');
    expect(formatHebrewMonthYear(2026, 0)).toBe('ינואר 2026');
  });
});

describe('buildMonthGrid — Sunday-first calendar grid', () => {
  it('returns exactly 6 weeks of 7 days each', () => {
    const grid = buildMonthGrid(2026, 1); // February 2026
    expect(grid).toHaveLength(6);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });

  it('starts on Feb 1 with no leading days when the 1st falls on a Sunday', () => {
    // 2026-02-01 is a Sunday — verified directly, not assumed.
    const grid = buildMonthGrid(2026, 1);
    expect(grid[0][0]).toEqual({ key: '2026-02-01', dayNum: 1, inMonth: true });
    expect(grid[0].every((d) => d.inMonth)).toBe(true);
  });

  it('carries trailing out-of-month days into March when February ends mid-grid', () => {
    const grid = buildMonthGrid(2026, 1); // Feb 2026 has 28 days = exactly 4 weeks
    expect(grid[4][0]).toEqual({ key: '2026-03-01', dayNum: 1, inMonth: false });
    expect(grid[5][6]).toEqual({ key: '2026-03-14', dayNum: 14, inMonth: false });
  });

  it('carries leading out-of-month days from June when July 1 falls mid-week', () => {
    // 2026-07-01 is a Wednesday — verified directly.
    const grid = buildMonthGrid(2026, 6); // July 2026
    expect(grid[0][0]).toEqual({ key: '2026-06-28', dayNum: 28, inMonth: false });
    expect(grid[0][3]).toEqual({ key: '2026-07-01', dayNum: 1, inMonth: true });
  });

  it('every cell is exactly one day after the previous one (no gaps or duplicates)', () => {
    const grid = buildMonthGrid(2026, 6);
    const flat = grid.flat();
    for (let i = 1; i < flat.length; i++) {
      expect(shiftDateKey(flat[i - 1].key, 1)).toBe(flat[i].key);
    }
  });
});
