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
// chip's main body calls store.logFavorite() directly at its default
// quantity, which already combines getCurrentSlotId() (the same "what slot
// is it right now" heuristic SmartContextCard uses) with logItems() — no
// slot picker, no preview. A brief inline checkmark confirms what happened;
// if the auto-picked slot is ever wrong, the item can still be re-slotted
// from the day log's existing edit sheet (Sprint 26) — this bar optimizes
// for the common case only.
//
// Sprint 42 — direct feedback: "logged 3 eggs by default, what if I wanted
// 2? rigid." The only way to deviate from a favorite's stored default was to
// log it in full and then hunt down the item afterward in the day log's
// edit sheet and do fractional-portion math by hand. `Favorite.unitCount`
// (shred-store.ts) now gives every favorite an explicit "how many units is
// this normally" baseline, and each chip grows a small quantity badge
// (e.g. "×3") that expands an inline Stepper — adjust the count right there
// and log at that exact quantity, without leaving the Today tab or losing
// the one-tap fast path for the common "just log the default" case.

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Pencil, ChevronDown } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { FavoriteBuilderModal, type FavoriteDraftSeed } from './FavoriteBuilderModal';
import type { Favorite } from '@/lib/store/shred-store';

export interface FavoritesQuickBarProps {
  favorites: Favorite[];
  onLog: (fav: Favorite, qty?: number) => void;
  onSave: (fav: Favorite) => void;
  onDelete: (id: string) => void;
}

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export function FavoritesQuickBar({ favorites, onLog, onSave, onDelete }: FavoritesQuickBarProps) {
  const T = useTheme();
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  const [editingSeed, setEditingSeed] = useState<FavoriteDraftSeed | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);

  const flashLogged = (id: string) => {
    setJustLoggedId(id);
    setTimeout(() => setJustLoggedId((cur) => (cur === id ? null : cur)), 900);
  };

  const handleTap = (fav: Favorite) => {
    onLog(fav);
    flashLogged(fav.id);
  };

  const openAdjust = (fav: Favorite) => {
    setAdjustQty(fav.unitCount ?? 1);
    setAdjustingId((cur) => (cur === fav.id ? null : fav.id));
  };

  const confirmAdjusted = (fav: Favorite) => {
    onLog(fav, adjustQty);
    setAdjustingId(null);
    flashLogged(fav.id);
  };

  const openNew = () => { setEditingSeed(null); setBuilderOpen(true); };
  const openEdit = (fav: Favorite) => { setEditingSeed(fav); setBuilderOpen(true); };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {favorites.map((fav) => {
          const unitCount = fav.unitCount ?? 1;
          const isAdjusting = adjustingId === fav.id;
          return (
            <div key={fav.id} className="flex-shrink-0" style={{ maxWidth: isAdjusting ? 180 : undefined }}>
              <motion.div
                layout
                className="relative flex items-center gap-1.5 pl-1.5 pr-1.5 py-2 rounded-full overflow-hidden"
                style={{ background: T.t.chipBg, border: `1px solid ${isAdjusting ? T.accent : T.t.border}` }}
              >
                <span
                  onClick={() => openEdit(fav)}
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 20, height: 20, background: `${T.accent}18`, cursor: 'pointer' }}
                  aria-label="ערוך מועדף"
                  role="button"
                >
                  <Pencil size={10} color={T.accent} />
                </span>

                {!isAdjusting ? (
                  <>
                    <button type="button" onClick={() => handleTap(fav)} className="flex items-center gap-1.5">
                      <span className="text-lg leading-none">{fav.icon}</span>
                      <span className="text-xs font-semibold whitespace-nowrap" style={{ color: T.t.textPrimary }}>{fav.name}</span>
                      <span className="text-[10px] whitespace-nowrap" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{Math.round(fav.kcal)} קל׳</span>
                    </button>
                    <motion.button
                      type="button"
                      onClick={() => openAdjust(fav)}
                      whileTap={{ scale: 0.88 }}
                      className="flex items-center gap-0.5 pl-1.5 pr-0.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
                      aria-label="שנה כמות לפני הרישום"
                    >
                      <span className="text-[10px] font-bold" style={{ color: T.t.textSecondary, fontFamily: FONT_MONO }}>×{unitCount}</span>
                      <ChevronDown size={11} color={T.t.textDim} />
                    </motion.button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 py-0.5">
                    <span className="text-lg leading-none">{fav.icon}</span>
                    <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${T.t.border}` }}>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setAdjustQty((q) => Math.max(0.5, Math.round((q - 0.5) * 2) / 2))}
                        className="px-2 py-1 text-xs font-bold"
                        style={{ color: T.t.textSecondary }}
                        aria-label="הפחת כמות"
                      >
                        −
                      </motion.button>
                      <span className="px-1.5 text-xs font-bold min-w-[26px] text-center" style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>{adjustQty}</span>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setAdjustQty((q) => Math.round((q + 0.5) * 2) / 2)}
                        className="px-2 py-1 text-xs font-bold"
                        style={{ color: T.t.textSecondary }}
                        aria-label="הוסף כמות"
                      >
                        +
                      </motion.button>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => confirmAdjusted(fav)}
                      whileTap={{ scale: 0.92 }}
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ width: 24, height: 24, background: T.macro.protein }}
                      aria-label="אשר ורשום"
                    >
                      <Check size={13} color="#07080B" />
                    </motion.button>
                  </div>
                )}

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
              </motion.div>
            </div>
          );
        })}

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
