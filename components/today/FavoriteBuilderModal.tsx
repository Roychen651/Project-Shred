'use client';

// Sprint 31 — favorites finally get a UI. The store side (`Favorite`,
// `favorites`, `saveFavorite`, `deleteFavorite`, `logFavorite`) has existed
// since the milestone-2 domain extraction (see shred-store.ts's header),
// exactly the same "logic ported, no component ever surfaced it" gap already
// documented for Smart Swap and custom ingredients — this is that missing
// piece, built new. Same centered-modal template CustomIngredientModal
// established (fixed inset-0 overlay, no-hooks outer + hooks-inner mount
// pattern to avoid the react-hooks/set-state-in-effect trap this codebase
// keeps hitting, autofocus via a cleanup-safe setTimeout).

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import { genUuid } from '@/lib/domain/util';
import type { Favorite } from '@/lib/store/shred-store';

const EMOJI_CHOICES = ['🍗', '🥚', '🍚', '🍞', '🥛', '🧀', '🍌', '🍎', '🥑', '🥤', '☕', '🍫', '🥜', '🍕', '🥗', '🍲'];

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

export interface FavoriteDraftSeed {
  id?: string;
  name?: string;
  icon?: string;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface FavoriteBuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (fav: Favorite) => void;
  /** Editing an existing favorite, or prefilling from an already-parsed/logged item (captures its exact quantity's macros). */
  seed?: FavoriteDraftSeed;
}

export function FavoriteBuilderModal({ open, onClose, onSave, seed }: FavoriteBuilderModalProps) {
  if (!open) return null;
  return <FavoriteBuilderModalInner onClose={onClose} onSave={onSave} seed={seed} />;
}

function emptyDraft(seed?: FavoriteDraftSeed) {
  return {
    name: seed?.name ?? '',
    icon: seed?.icon ?? EMOJI_CHOICES[0],
    kcal: seed?.kcal != null ? String(seed.kcal) : '',
    protein: seed?.protein != null ? String(seed.protein) : '',
    carbs: seed?.carbs != null ? String(seed.carbs) : '',
    fat: seed?.fat != null ? String(seed.fat) : '',
  };
}

function FavoriteBuilderModalInner({ onClose, onSave, seed }: Omit<FavoriteBuilderModalProps, 'open'>) {
  const T = useTheme();
  const [draft, setDraft] = useState(emptyDraft(seed));
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const canSave = draft.name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: seed?.id ?? genUuid(),
      name: draft.name.trim(),
      icon: draft.icon,
      kcal: Number(draft.kcal) || 0,
      protein: Number(draft.protein) || 0,
      carbs: Number(draft.carbs) || 0,
      fat: Number(draft.fat) || 0,
    });
    onClose();
  };

  const macroField = (label: string, key: 'kcal' | 'protein' | 'carbs' | 'fat', tabIndex: number) => (
    <div>
      <label
        className="text-xs font-semibold block mb-1.5"
        style={{ color: T.t.textDim, letterSpacing: '0.04em', fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
      >
        {label}
      </label>
      <input
        value={draft[key]}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
        type="number"
        dir="ltr"
        tabIndex={tabIndex}
        placeholder="0"
        className="w-full py-2.5 px-3 rounded-xl text-sm outline-none text-center"
        style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO, fontWeight: 600 }}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: T.t.overlayBg, backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: 420,
          maxHeight: '88vh',
          background: T.mode === 'dark' ? `${T.t.modalBg}E8` : `${T.t.modalBg}F7`,
          border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${T.glow(T.accent, 28, '35')}, inset 0 1px 0 ${T.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)'}, inset 0 0 0 1px ${T.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)'}`,
          backdropFilter: T.mode === 'dark' ? 'blur(40px) saturate(200%)' : 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: T.mode === 'dark' ? 'blur(40px) saturate(200%)' : 'blur(28px) saturate(180%)',
        }}
      >
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>
            {seed?.id ? 'עריכת מועדף' : 'מועדף חדש'}
          </h3>
          <motion.button onClick={onClose} whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} transition={tapSpring} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <X size={16} color={T.t.textSecondary} />
          </motion.button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ minHeight: 0 }}>
          <div>
            <label
              className="text-xs font-semibold block mb-1.5"
              style={{ color: T.t.textDim, letterSpacing: '0.04em', fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
            >
              שם המועדף
            </label>
            <input
              ref={nameInputRef}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="לדוגמה: שייק חלבון בוקר"
              tabIndex={1}
              className="w-full py-3 px-3.5 rounded-xl text-sm outline-none"
              style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, textAlign: 'right' }}
            />
          </div>

          <div>
            <label
              className="text-xs font-semibold block mb-1.5"
              style={{ color: T.t.textDim, letterSpacing: '0.04em', fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
            >
              אייקון
            </label>
            <div className="grid grid-cols-8 gap-1.5">
              {EMOJI_CHOICES.map((e) => (
                <motion.button
                  key={e}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, icon: e }))}
                  whileTap={{ scale: 0.9 }}
                  transition={tapSpring}
                  className="flex items-center justify-center rounded-lg text-lg"
                  style={{
                    aspectRatio: '1',
                    background: draft.icon === e ? `${T.accent}22` : T.t.chipBg,
                    border: `1px solid ${draft.icon === e ? T.accent : T.t.border}`,
                  }}
                >
                  {e}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: T.t.textSecondary }}>ערכים תזונתיים (למנה שלמה, כפי שתירשם בכל הקשה)</p>
            <div className="grid grid-cols-4 gap-2">
              {macroField('קל׳', 'kcal', 2)}
              {macroField('חלבון', 'protein', 3)}
              {macroField('פחמימה', 'carbs', 4)}
              {macroField('שומן', 'fat', 5)}
            </div>
          </div>

          <motion.button
            onClick={handleSave}
            disabled={!canSave}
            whileTap={canSave ? { scale: 0.97 } : undefined}
            whileHover={canSave ? { scale: 1.015 } : undefined}
            transition={tapSpring}
            tabIndex={6}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ background: T.accent, color: '#07080B', opacity: canSave ? 1 : 0.5, boxShadow: canSave ? T.glow(T.accent, 16, '30') : 'none' }}
          >
            <Save size={15} /> שמירת מועדף
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
