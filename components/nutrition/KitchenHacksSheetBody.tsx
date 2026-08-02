'use client';

// Sprint 36 — a real functionality gap, not a cosmetic one: lib/data/hacks.ts
// (68 home recipes across בוקר/ארוחה עיקרית/חטיף/מתוק, transcribed from the
// artifact since Sprint 4) has existed since the earliest data-porting
// sprints with zero UI ever browsing it. RestaurantMatrixSheetBody covers
// "eating out"; this closes the "cooking at home" half of the same surface,
// reusing the exact same search/category/log pattern (and MacroLine, and the
// tactileGradient "+" success-flash) so the two feel like one family, not two
// different components that happen to sit near each other.

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Check } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { tactileGradient } from '@/lib/theme/tokens';
import { MacroLine } from '@/components/ui/MacroLine';
import { HACKS, HACK_CATEGORIES } from '@/lib/data/hacks';
import { SLOT_DEFS, type SlotId } from '@/lib/domain/slots';
import { scrollHorizontallyOnWheel } from '@/lib/hooks/horizontalWheelScroll';
import type { LogItemSpec } from '@/lib/store/shred-store';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export interface KitchenHacksSheetBodyProps {
  onConfirm: (specs: LogItemSpec[], slotId: SlotId) => void;
  defaultSlotId?: SlotId;
}

export function KitchenHacksSheetBody({ onConfirm, defaultSlotId }: KitchenHacksSheetBodyProps) {
  const T = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<SlotId>(defaultSlotId || 'dinner');
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = HACKS;
    if (category) items = items.filter((h) => h.category === category);
    if (search.trim()) {
      const q = search.trim();
      items = items.filter((h) => h.name.includes(q) || h.detail.includes(q));
    }
    return items;
  }, [search, category]);

  const logHack = (hack: (typeof HACKS)[number]) => {
    onConfirm([{ name: hack.name, calories: hack.kcal, protein: hack.protein, carbs: hack.carbs, fats: hack.fat, source: 'hack' }], slotId);
    setJustLoggedId(hack.id);
    setTimeout(() => setJustLoggedId((id) => (id === hack.id ? null : id)), 900);
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
          placeholder="חפשו מתכון..."
          className="w-full py-2.5 pr-9 pl-3 rounded-xl text-sm outline-none"
          style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }} onWheel={scrollHorizontallyOnWheel}>
        <motion.button
          onClick={() => setCategory(null)}
          whileTap={{ scale: 0.94 }}
          transition={tapSpring}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={category === null ? { ...tactileGradient(T.accent), color: '#07080B' } : { background: T.t.chipBg, color: T.t.textSecondary, border: `1px solid ${T.t.border}` }}
        >
          הכל
        </motion.button>
        {HACK_CATEGORIES.map((c) => {
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
          <p className="text-sm text-center py-6" style={{ color: T.t.textDim }}>לא נמצאו מתכונים תואמים.</p>
        )}
        {filtered.map((hack) => {
          const justAdded = justLoggedId === hack.id;
          return (
            <div key={hack.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}>
              <span className="text-2xl flex-shrink-0" aria-hidden="true">{hack.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold truncate" style={{ color: T.t.textPrimary }}>{hack.name}</div>
                <div className="text-[11px] truncate mb-0.5" style={{ color: T.t.textDim }}>{hack.detail}</div>
                <MacroLine kcal={hack.kcal} protein={hack.protein} carbs={hack.carbs} fat={hack.fat} />
              </div>
              <motion.button
                onClick={() => logHack(hack)}
                whileTap={{ scale: 0.88 }}
                whileHover={{ scale: 1.06 }}
                transition={tapSpring}
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={justAdded ? { width: 34, height: 34, background: T.macro.protein, color: '#07080B' } : { width: 34, height: 34, ...tactileGradient(T.accent), color: '#07080B' }}
                aria-label={`הוסף ${hack.name}`}
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
