'use client';

// Sprint 26 — the missing other half of the logging pipeline: `logItems()`
// and friends have always been able to write items into `itemsByDate`, but
// nothing in this ported app could ever show them again, let alone fix a
// wrong tap. `store.toggleItemCompleted`/`deleteItem`/`updateItem` already
// existed (Sprint 15's domain layer + the Zustand store built on top of it)
// with zero UI ever calling them — this is that UI.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { tactileGradient } from '@/lib/theme/tokens';
import { Stepper } from '@/components/ui/Stepper';
import { MacroLine } from '@/components/ui/MacroLine';
import { SLOT_DEFS } from '@/lib/domain/slots';
import { SLOT_ICONS } from './slotIcons';
import { scaleLoggedItem, type LoggedItem } from '@/lib/domain/items';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export interface ItemLogRowProps {
  item: LoggedItem;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: (patch: Partial<Pick<LoggedItem, 'grams' | 'slotId'>>) => void;
}

export function ItemLogRow({ item, onToggle, onDelete, onUpdate }: ItemLogRowProps) {
  const T = useTheme();
  const [editing, setEditing] = useState(false);
  const macros = scaleLoggedItem(item);

  return (
    <div className="py-2.5" style={{ borderBottom: `1px solid ${T.t.border}`, opacity: item.isCompleted ? 1 : 0.5 }}>
      <div className="flex items-center gap-2.5">
        <motion.button
          onClick={onToggle}
          whileTap={{ scale: 0.85 }}
          whileHover={{ scale: 1.06 }}
          transition={tapSpring}
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={
            item.isCompleted
              ? { width: 26, height: 26, ...tactileGradient(T.accent) }
              : { width: 26, height: 26, background: T.t.chipBg, border: `1px solid ${T.t.border}` }
          }
          aria-label={item.isCompleted ? 'בטל השלמה' : 'סמן כהושלם'}
        >
          {item.isCompleted && <Check size={13} color="#07080B" />}
        </motion.button>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold truncate" style={{ color: T.t.textPrimary }}>{item.name}</div>
          <MacroLine kcal={macros.calories} protein={macros.protein} carbs={macros.carbs} fat={macros.fats} className="mt-0.5" />
        </div>

        <motion.button
          onClick={() => setEditing((v) => !v)}
          whileTap={{ scale: 0.88 }}
          transition={tapSpring}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: editing ? T.t.border : T.t.chipBg }}
          aria-label="ערוך פריט"
        >
          <Pencil size={13} color={T.t.textSecondary} />
        </motion.button>
        <motion.button
          onClick={onDelete}
          whileTap={{ scale: 0.88 }}
          transition={tapSpring}
          className="p-1.5 rounded-lg flex-shrink-0"
          style={{ background: `${T.macro.fat}18` }}
          aria-label="מחק פריט"
        >
          <Trash2 size={13} color={T.macro.fat} />
        </motion.button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 flex flex-col gap-3">
              <Stepper
                label="מנה (100% = כפי שנרשם במקור)"
                value={item.grams}
                onChange={(v) => onUpdate({ grams: v })}
                step={25}
                min={25}
                max={400}
                suffix="%"
              />
              <div className="flex gap-1.5">
                {SLOT_DEFS.map((s) => {
                  const Icon = SLOT_ICONS[s.id];
                  const active = s.id === item.slotId;
                  return (
                    <motion.button
                      key={s.id}
                      onClick={() => onUpdate({ slotId: s.id })}
                      whileTap={{ scale: 0.92 }}
                      transition={tapSpring}
                      className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl"
                      style={active ? { ...tactileGradient(T.accent) } : { background: T.t.chipBg, border: `1px solid ${T.t.border}` }}
                    >
                      <Icon size={13} color={active ? '#07080B' : T.t.textSecondary} />
                      <span className="text-[9px] font-bold" style={{ color: active ? '#07080B' : T.t.textDim }}>{s.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
