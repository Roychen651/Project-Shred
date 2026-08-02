'use client';

// New in Sprint 4 — a scoped-down entry point onto the "מסעדות" surface (the
// artifact's CibusMatrix, renamed per the Sprint 4 rebrand — see
// components/shell/FabMenu.tsx's header note). The full artifact component
// (5 restaurant tabs, 3-part plate builders per restaurant, custom-restaurant
// CRUD) is a much larger port left for a later sprint; this ships something
// genuinely functional now: search + category browsing across the real
// 73-item EATING_OUT_MENU, with the same 5-slot picker pattern every other
// logging surface in the app uses (Sprint 15's "universal slot selection").

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Check } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { tactileGradient } from '@/lib/theme/tokens';
import { MacroLine } from '@/components/ui/MacroLine';
import { EATING_OUT_MENU, EATING_OUT_CATEGORIES } from '@/lib/data/eatingOut';
import { SLOT_DEFS, type SlotId } from '@/lib/domain/slots';
import { scrollHorizontallyOnWheel } from '@/lib/hooks/horizontalWheelScroll';
import type { LogItemSpec } from '@/lib/store/shred-store';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export interface RestaurantMatrixSheetBodyProps {
  onConfirm: (specs: LogItemSpec[], slotId: SlotId) => void;
  defaultSlotId?: SlotId;
}

export function RestaurantMatrixSheetBody({ onConfirm, defaultSlotId }: RestaurantMatrixSheetBodyProps) {
  const T = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<SlotId>(defaultSlotId || 'lunch');
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = EATING_OUT_MENU;
    if (category) items = items.filter((i) => i.category === category);
    if (search.trim()) {
      const q = search.trim();
      items = items.filter((i) => i.name.includes(q));
    }
    return items;
  }, [search, category]);

  const logItem = (item: (typeof EATING_OUT_MENU)[number]) => {
    onConfirm([{ name: item.name, calories: item.kcal, protein: item.protein, carbs: item.carbs, fats: item.fat, source: 'restaurant' }], slotId);
    setJustLoggedId(item.id);
    setTimeout(() => setJustLoggedId((id) => (id === item.id ? null : id)), 900);
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: T.t.textSecondary }}>שיבוץ לחלון זמן</p>
        <div className="grid grid-cols-5 gap-1.5">
          {SLOT_DEFS.map((s) => {
            const active = slotId === s.id;
            return (
              <motion.button
                key={s.id}
                onClick={() => setSlotId(s.id)}
                whileTap={{ scale: 0.92 }}
                transition={tapSpring}
                className="py-2 px-1 rounded-lg text-xs font-semibold"
                style={active ? { ...tactileGradient(T.accent), color: '#07080B' } : { background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
              >
                {s.emoji}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="relative">
        <Search size={15} color={T.t.textDim} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפשו מנה..."
          className="w-full py-2.5 pr-9 pl-3 rounded-xl text-sm outline-none"
          style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible" style={{ scrollbarWidth: 'none' }} onWheel={scrollHorizontallyOnWheel}>
        <motion.button
          onClick={() => setCategory(null)}
          whileTap={{ scale: 0.94 }}
          transition={tapSpring}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={category === null ? { ...tactileGradient(T.accent), color: '#07080B' } : { background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
        >
          הכל
        </motion.button>
        {EATING_OUT_CATEGORIES.map((c) => {
          const active = category === c.id;
          return (
            <motion.button
              key={c.id}
              onClick={() => setCategory(c.id)}
              whileTap={{ scale: 0.94 }}
              transition={tapSpring}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={active ? { ...tactileGradient(T.accent), color: '#07080B' } : { background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
            >
              {c.label}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: T.t.textDim }}>לא נמצאו מנות תואמות.</p>
        )}
        {filtered.map((item) => {
          const justAdded = justLoggedId === item.id;
          return (
            <div key={item.id} className="flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: T.t.textPrimary }}>{item.name}</div>
                <MacroLine kcal={item.kcal} protein={item.protein} carbs={item.carbs} fat={item.fat} className="mt-0.5" />
              </div>
              <motion.button
                onClick={() => logItem(item)}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                transition={tapSpring}
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={justAdded ? { width: 34, height: 34, background: T.macro.protein, color: '#07080B' } : { width: 34, height: 34, ...tactileGradient(T.accent), color: '#07080B' }}
                aria-label={`הוסף ${item.name}`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {justAdded ? (
                    <motion.span key="check" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={tapSpring}>
                      <Check size={16} />
                    </motion.span>
                  ) : (
                    <motion.span key="plus" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={tapSpring}>
                      <Plus size={16} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
