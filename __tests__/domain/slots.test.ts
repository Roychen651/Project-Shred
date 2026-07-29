import { describe, it, expect } from 'vitest';
import { SLOT_DEFS, getCurrentSlotId } from '@/lib/domain/slots';
import type { LoggedItem } from '@/lib/domain/items';

function itemAt(slotId: LoggedItem['slotId'], isCompleted = true): Pick<LoggedItem, 'slotId' | 'isCompleted'> {
  return { slotId, isCompleted };
}

describe('SLOT_DEFS', () => {
  it('has exactly the 5 slots, in timeline order', () => {
    expect(SLOT_DEFS.map((s) => s.id)).toEqual(['breakfast', 'midmorning', 'lunch', 'preworkout', 'dinner']);
    expect(SLOT_DEFS.map((s) => s.time)).toEqual(['08:00', '10:30', '13:00', '16:30', '20:00']);
  });
});

describe('getCurrentSlotId', () => {
  it('picks the next uncompleted slot within the 90-minute look-back window', () => {
    const now = new Date(2026, 6, 20, 8, 30); // 08:30, nothing logged yet
    expect(getCurrentSlotId([], now)).toBe('breakfast'); // 08:00 is within 90min of 08:30
  });

  it('skips completed slots and finds the next uncompleted one', () => {
    const now = new Date(2026, 6, 20, 15, 0); // 15:00 = 900 minutes
    const items = [itemAt('breakfast'), itemAt('midmorning'), itemAt('lunch')];
    // preworkout (16:30=990) is within 900-90=810..∞ and uncompleted
    expect(getCurrentSlotId(items, now)).toBe('preworkout');
  });

  it('the "upcoming" fallback does not check completion (a faithful port of the artifact quirk)', () => {
    // Every slot already completed, and it's before breakfast: nextEmpty finds
    // nothing (nothing uncompleted), so the algorithm falls through to `upcoming`
    // — which finds the first slot with minutes >= now regardless of its
    // completion state, and returns breakfast even though it's done. This is the
    // exact behavior of ProjectShred.artifact.jsx:5523 (`upcoming = ...find(s =>
    // s.minutes >= nowMinutes)` has no `!s.hasCompleted` check), preserved as-is.
    const now = new Date(2026, 6, 20, 6, 0); // 06:00, before every slot's time
    const items = SLOT_DEFS.map((s) => itemAt(s.id, true));
    expect(getCurrentSlotId(items, now)).toBe('breakfast');
  });

  it('falls back to the last slot when the day is entirely done', () => {
    const now = new Date(2026, 6, 20, 21, 0); // 21:00, after every slot's time
    const items = SLOT_DEFS.map((s) => itemAt(s.id));
    expect(getCurrentSlotId(items, now)).toBe('dinner');
  });
});
