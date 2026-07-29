import { describe, it, expect } from 'vitest';
import { dateKey, addDays, shiftDateKey, formatShortDate, formatHebrewDate } from '@/lib/domain/dates';

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
