// The five daily timeline slots. ProjectShred.artifact.jsx:821-831, 5513-5526.
//
// Single source of truth for slot identity — every logging surface (Timeline,
// Cibus, Kitchen Hacks, Plate Composer, every quick-log flow) reads from this one
// list rather than each screen inventing its own slot labels, which is how slot
// mismatches happened before Sprint 15.
//
// Icons are deliberately NOT part of this module: `icon: Sunrise` etc. in the
// artifact is a lucide-react component reference, a UI concern. The mapping from
// slot id to icon component belongs in a components/ layer, not lib/domain — this
// file has zero React dependency, by design (Sprint 2 mandate).

import type { LoggedItem } from './items';

export type SlotId = 'breakfast' | 'midmorning' | 'lunch' | 'preworkout' | 'dinner';

export interface SlotDef {
  id: SlotId;
  time: string; // 'HH:MM', 24h
  label: string;
  emoji: string;
}

export const SLOT_DEFS: SlotDef[] = [
  { id: 'breakfast', time: '08:00', label: 'בוקר', emoji: '🌅' },
  { id: 'midmorning', time: '10:30', label: 'ביניים', emoji: '🍏' },
  { id: 'lunch', time: '13:00', label: 'צהריים', emoji: '🍲' },
  { id: 'preworkout', time: '16:30', label: 'אחה"כ', emoji: '🍌' },
  { id: 'dinner', time: '20:00', label: 'ערב', emoji: '🍳' },
];

// "What slot is it right now?" heuristic: the next slot without a completed item
// within a 90-minute look-back window, else the next upcoming slot, else the last
// slot if the day is already done. `now` is injectable for deterministic tests —
// see the note in dates.ts.
export function getCurrentSlotId(items: Pick<LoggedItem, 'slotId' | 'isCompleted'>[], now: Date = new Date()): SlotId {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const withMinutes = SLOT_DEFS.map((s) => {
    const [h, m] = s.time.split(':').map(Number);
    const hasCompleted = items.some((i) => i.slotId === s.id && i.isCompleted);
    return { ...s, minutes: h * 60 + m, hasCompleted };
  });
  const nextEmpty = withMinutes.find((s) => !s.hasCompleted && s.minutes >= nowMinutes - 90);
  if (nextEmpty) return nextEmpty.id;
  const upcoming = withMinutes.find((s) => s.minutes >= nowMinutes);
  if (upcoming) return upcoming.id;
  return withMinutes[withMinutes.length - 1].id;
}
