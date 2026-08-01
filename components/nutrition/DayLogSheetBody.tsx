'use client';

// Sprint 26 — grouped by SLOT_DEFS, exactly the shape the artifact's own
// Timeline used (Sprint 15's rewrite) before this port simplified the
// Nutrition tab down to two "open a builder" cards with no persistent view
// of what had actually been logged.

import { SLOT_DEFS } from '@/lib/domain/slots';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY } from '@/lib/theme/tokens';
import { SLOT_ICONS } from './slotIcons';
import { ItemLogRow } from './ItemLogRow';
import type { LoggedItem } from '@/lib/domain/items';

export interface DayLogSheetBodyProps {
  items: LoggedItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<LoggedItem, 'grams' | 'slotId'>>) => void;
}

export function DayLogSheetBody({ items, onToggle, onDelete, onUpdate }: DayLogSheetBodyProps) {
  const T = useTheme();

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="text-sm font-bold" style={{ color: T.t.textPrimary }}>עדיין לא נרשם כלום ביום הזה</div>
        <div className="text-xs mt-1.5" style={{ color: T.t.textDim }}>כל מה שתרשמו יופיע כאן, מקובץ לפי חלון זמן — כולל אפשרות לערוך ולמחוק בכל רגע.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {SLOT_DEFS.map((slot) => {
        const slotItems = items.filter((i) => i.slotId === slot.id);
        if (slotItems.length === 0) return null;
        const Icon = SLOT_ICONS[slot.id];
        return (
          <div key={slot.id}>
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} color={T.accent} />
              <span className="text-xs font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{slot.emoji} {slot.label}</span>
              <span className="text-[10px]" style={{ color: T.t.textDim }}>{slot.time}</span>
            </div>
            <div>
              {slotItems.map((item) => (
                <ItemLogRow
                  key={item.id}
                  item={item}
                  onToggle={() => onToggle(item.id)}
                  onDelete={() => onDelete(item.id)}
                  onUpdate={(patch) => onUpdate(item.id, patch)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
