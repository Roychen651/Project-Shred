'use client';

// ProjectShred.artifact.jsx:5528-5571 (Sprint 14, rewritten Sprint 15). Compares
// the real clock to the 5 base slot times and shows whichever meal is "now" —
// the next unchecked slot within a 90-minute look-back window, the next
// upcoming one, or the last one if the day is done (see getCurrentSlotId in
// lib/domain/slots.ts, ported in milestone 2).

import { Check, Pencil } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO, FONT_DISPLAY } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { SLOT_DEFS, getCurrentSlotId, type SlotId } from '@/lib/domain/slots';
import type { LoggedItem } from '@/lib/domain/items';
import { SLOT_ICONS } from '@/components/nutrition/slotIcons';

export interface SmartContextCardProps {
  items: LoggedItem[];
  onQuickComplete: (slotId: SlotId) => void;
  onEdit: (slotId: SlotId) => void;
}

export function SmartContextCard({ items, onQuickComplete, onEdit }: SmartContextCardProps) {
  const T = useTheme();
  const currentId = getCurrentSlotId(items);
  const slot = SLOT_DEFS.find((s) => s.id === currentId);
  if (!slot) return null;
  const Icon = SLOT_ICONS[slot.id];
  const slotItems = items.filter((i) => i.slotId === slot.id);
  const done = slotItems.length > 0 && slotItems.every((i) => i.isCompleted);
  const summary = slotItems.length === 0 ? 'עדיין לא שובץ פריט לחלון הזה' : slotItems.map((i) => i.name).join(' · ');

  return (
    <GlassCard className="p-5" accent={null}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-2xl" style={{ width: 46, height: 46, background: done ? `${T.macro.protein}18` : `${T.accent}14` }}>
            <Icon size={20} color={done ? T.macro.protein : T.accent} />
          </div>
          <div>
            <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{slot.time} · עכשיו</span>
            <div className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{slot.emoji} {slot.label}</div>
            <div className="text-xs" style={{ color: T.t.textSecondary }}>{summary}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => onQuickComplete(slot.id)}
          disabled={slotItems.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: done ? `${T.macro.protein}18` : T.accent, color: done ? T.macro.protein : '#07080B', opacity: slotItems.length === 0 ? 0.5 : 1 }}
        >
          <Check size={14} /> {done ? 'סומן כבוצע' : 'סמן הכל כבוצע'}
        </button>
        <button
          onClick={() => onEdit(slot.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: T.t.chipBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}` }}
        >
          <Pencil size={13} /> {slotItems.length === 0 ? 'הוסף' : 'ערוך'}
        </button>
      </div>
    </GlassCard>
  );
}
