'use client';

// Sprint 31 — one-tap logging for the foods a person eats almost every day
// (a protein pudding, the same morning shake, "3 eggs"). The store side
// (`favorites`, `logFavorite`, `saveFavorite`, `deleteFavorite`) has existed
// since the milestone-2 domain extraction with zero UI ever calling it — see
// FavoriteBuilderModal's header for the same class of gap already documented
// for Smart Swap/custom ingredients. Placed at the very top of the Today
// tab, above even the hero ring: the artifact's own Sprint 15.11 note called
// this "the most-seen, fastest-reachable spot in the app," and that's still
// true here — nothing on this tab is reached faster than the first scroll
// position.
//
// True one-tap logging, not "one tap + a confirmation screen": tapping a
// chip calls store.logFavorite() directly, which already combines
// getCurrentSlotId() (the same "what slot is it right now" heuristic
// SmartContextCard uses) with logItems() — no slot picker, no preview. A
// brief inline checkmark confirms what happened; if the auto-picked slot is
// ever wrong, the item can still be re-slotted from the day log's existing
// edit sheet (Sprint 26) — this bar optimizes for the common case only.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Pencil } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { FavoriteBuilderModal, type FavoriteDraftSeed } from './FavoriteBuilderModal';
import type { Favorite } from '@/lib/store/shred-store';

export interface FavoritesQuickBarProps {
  favorites: Favorite[];
  onLog: (fav: Favorite) => void;
  onSave: (fav: Favorite) => void;
  onDelete: (id: string) => void;
}

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export function FavoritesQuickBar({ favorites, onLog, onSave, onDelete }: FavoritesQuickBarProps) {
  const T = useTheme();
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  const [editingSeed, setEditingSeed] = useState<FavoriteDraftSeed | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);

  const handleTap = (fav: Favorite) => {
    onLog(fav);
    setJustLoggedId(fav.id);
    setTimeout(() => setJustLoggedId((cur) => (cur === fav.id ? null : cur)), 900);
  };

  const openNew = () => { setEditingSeed(null); setBuilderOpen(true); };
  const openEdit = (fav: Favorite) => { setEditingSeed(fav); setBuilderOpen(true); };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {favorites.map((fav) => (
          <motion.button
            key={fav.id}
            type="button"
            onClick={() => handleTap(fav)}
            whileTap={{ scale: 0.94 }}
            whileHover={{ scale: 1.02 }}
            transition={tapSpring}
            className="relative flex-shrink-0 flex items-center gap-1.5 pl-2.5 pr-1.5 py-2 rounded-full"
            style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}
          >
            <span
              onClick={(e) => { e.stopPropagation(); openEdit(fav); }}
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 20, height: 20, background: `${T.accent}18` }}
              aria-label="ערוך מועדף"
              role="button"
            >
              <Pencil size={10} color={T.accent} />
            </span>
            <span className="text-lg leading-none">{fav.icon}</span>
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: T.t.textPrimary }}>{fav.name}</span>
            <span className="text-[10px] whitespace-nowrap" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{Math.round(fav.kcal)} קל׳</span>

            <AnimatePresence>
              {justLoggedId === fav.id && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute inset-0 flex items-center justify-center gap-1 rounded-full text-xs font-bold"
                  style={{ background: T.macro.protein, color: '#07080B' }}
                >
                  <Check size={13} /> נוסף!
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}

        <motion.button
          type="button"
          onClick={openNew}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.02 }}
          transition={tapSpring}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold"
          style={{ background: 'transparent', border: `1px dashed ${T.t.border}`, color: T.t.textDim }}
        >
          <Plus size={13} /> מועדף
        </motion.button>
      </div>

      <FavoriteBuilderModal
        open={builderOpen}
        onClose={() => setBuilderOpen(false)}
        seed={editingSeed ?? undefined}
        onSave={onSave}
      />

      {editingSeed?.id && (
        <DeleteFavoriteLink open={builderOpen} favId={editingSeed.id} onDelete={onDelete} onClose={() => setBuilderOpen(false)} />
      )}
    </>
  );
}

// A tiny, deliberately separate escape hatch for removing a favorite —
// rendered as a floating text link only while editing an existing one, kept
// out of FavoriteBuilderModal itself so that component stays a reusable
// add-or-edit form with no delete concept baked in (the "add a brand-new
// favorite" call site above never has anything to delete).
function DeleteFavoriteLink({ open, favId, onDelete, onClose }: { open: boolean; favId: string; onDelete: (id: string) => void; onClose: () => void }) {
  const T = useTheme();
  if (!open) return null;
  return (
    <div className="fixed inset-x-0 flex justify-center pointer-events-none" style={{ bottom: 24, zIndex: 60 }}>
      <button
        onClick={() => { onDelete(favId); onClose(); }}
        className="pointer-events-auto px-4 py-2 rounded-full text-xs font-semibold"
        style={{ background: `${T.macro.fat}22`, color: T.macro.fat, border: `1px solid ${T.macro.fat}44` }}
      >
        מחק מועדף זה
      </button>
    </div>
  );
}
