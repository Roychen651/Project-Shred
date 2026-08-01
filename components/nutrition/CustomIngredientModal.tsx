'use client';

// Sprint 12 — the "frictionless custom entry" half of the pivot away from
// fabricated branded macros (see lib/data/israeli-ingredients.ts's header).
// Since a real branded product's exact numbers can only come from the
// person reading their own label, this modal has to be the fast path: land
// on the name field with the keyboard already up, tab straight through
// every macro field in reading order, and — for the common case of "this is
// basically an existing generic item, just this brand's numbers are
// slightly different" — a quick-duplicate picker that pre-fills the whole
// form from any built-in or Israeli-staple ingredient in one tap.
//
// Did not previously exist anywhere in this Next.js port: the store already
// had `customIngredients` / `saveCustomIngredient` wired since Milestone 2,
// but no component ever surfaced them (a real, honestly-documented gap —
// same class of thing as Smart Swap never getting a UI). This is that
// missing piece, built new rather than "upgraded."

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Copy, Search } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import { INGREDIENT_DB, INGREDIENT_CATEGORIES } from '@/lib/data/ingredients';
import { ISRAELI_INGREDIENTS } from '@/lib/data/israeli-ingredients';
import { BEVERAGES } from '@/lib/data/beverages';
import type { Ingredient, IngredientCategory } from '@/lib/domain/ingredients';
import { genUuid } from '@/lib/domain/util';
import type { CustomIngredient } from '@/lib/store/shred-store';

const DUPLICATE_SOURCE: Ingredient[] = [...INGREDIENT_DB, ...ISRAELI_INGREDIENTS, ...BEVERAGES];

export interface CustomIngredientModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (ing: CustomIngredient) => void;
}

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

function emptyDraft(): { name: string; category: IngredientCategory; kcal: string; protein: string; carbs: string; fat: string } {
  return { name: '', category: 'protein', kcal: '', protein: '', carbs: '', fat: '' };
}

// The outer component calls NO hooks at all — its only job is the open
// check — so CustomIngredientModalInner mounting fresh every time `open`
// flips true gives it a genuinely fresh useState(emptyDraft()) for free.
// This replaces an earlier version that used a useEffect to manually reset
// state on open, which both tripped react-hooks/set-state-in-effect (a
// pattern this codebase has hit repeatedly — AddToHomeScreenPrompt,
// ExerciseRow, WorkoutPanel; see CLAUDE.md) and — deferred into a setTimeout
// to satisfy that rule — would have flashed the PREVIOUS draft's stale
// values for ~50ms before clearing. A fresh mount has neither problem: the
// initial render already has the empty draft, no reset step required.
export function CustomIngredientModal({ open, onClose, onSave }: CustomIngredientModalProps) {
  if (!open) return null;
  return <CustomIngredientModalInner onClose={onClose} onSave={onSave} />;
}

interface CustomIngredientModalInnerProps {
  onClose: () => void;
  onSave: (ing: CustomIngredient) => void;
}

function CustomIngredientModalInner({ onClose, onSave }: CustomIngredientModalInnerProps) {
  const T = useTheme();
  const [draft, setDraft] = useState(emptyDraft());
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateSearch, setDuplicateSearch] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Autofocus only — no setState here, so no set-state-in-effect concern.
  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const duplicateMatches = useMemo(() => {
    if (!duplicateSearch.trim()) return [];
    return DUPLICATE_SOURCE.filter((i) => i.name.includes(duplicateSearch.trim())).slice(0, 8);
  }, [duplicateSearch]);

  const applyDuplicate = (source: Ingredient) => {
    setDraft({
      name: source.name,
      category: source.category,
      kcal: String(source.raw.kcal),
      protein: String(source.raw.protein),
      carbs: String(source.raw.carbs),
      fat: String(source.raw.fat),
    });
    setDuplicateOpen(false);
    setDuplicateSearch('');
    nameInputRef.current?.focus();
  };

  const canSave = draft.name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: genUuid(),
      name: draft.name.trim(),
      category: draft.category,
      hasCookedVariant: false,
      raw: {
        kcal: Number(draft.kcal) || 0,
        protein: Number(draft.protein) || 0,
        carbs: Number(draft.carbs) || 0,
        fat: Number(draft.fat) || 0,
      },
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
          maxWidth: 440,
          maxHeight: '88vh',
          background: T.mode === 'dark' ? `${T.t.modalBg}E8` : `${T.t.modalBg}F7`,
          border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${T.glow(T.accent, 28, '35')}, inset 0 1px 0 ${T.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.75)'}, inset 0 0 0 1px ${T.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)'}`,
          backdropFilter: T.mode === 'dark' ? 'blur(40px) saturate(200%)' : 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: T.mode === 'dark' ? 'blur(40px) saturate(200%)' : 'blur(28px) saturate(180%)',
        }}
      >
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מרכיב אישי חדש</h3>
          <motion.button onClick={onClose} whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.06 }} transition={tapSpring} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <X size={16} color={T.t.textSecondary} />
          </motion.button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto" style={{ minHeight: 0 }}>
          <motion.button
            onClick={() => setDuplicateOpen((o) => !o)}
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            transition={tapSpring}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: duplicateOpen ? `${T.accent}18` : T.t.chipBg, border: `1px solid ${duplicateOpen ? T.accent : T.t.border}`, color: duplicateOpen ? T.accent : T.t.textSecondary }}
          >
            <Copy size={14} /> שכפול מהיר ממרכיב קיים
          </motion.button>

          <AnimatePresence>
            {duplicateOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <Search size={14} color={T.t.textDim} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      value={duplicateSearch}
                      onChange={(e) => setDuplicateSearch(e.target.value)}
                      placeholder="חפשו מרכיב לשכפול... (למשל: יוגורט)"
                      autoFocus
                      className="w-full py-2.5 pr-8 pl-3 rounded-xl text-sm outline-none"
                      style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
                    />
                  </div>
                  {duplicateMatches.length > 0 && (
                    <div className="flex flex-col gap-1 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.t.border}` }}>
                      {duplicateMatches.map((ing) => (
                        <button
                          key={ing.id}
                          onClick={() => applyDuplicate(ing)}
                          className="text-right px-3 py-2 text-sm flex items-center justify-between"
                          style={{ color: T.t.textPrimary, borderBottom: `1px solid ${T.t.border}` }}
                        >
                          <span>{ing.name}</span>
                          <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{ing.raw.kcal} קל&apos;</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label
              className="text-xs font-semibold block mb-1.5"
              style={{ color: T.t.textDim, letterSpacing: '0.04em', fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
            >
              שם המוצר (בדיוק כפי שמופיע על התווית)
            </label>
            <input
              ref={nameInputRef}
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="לדוגמה: יוגורט חלבון וניל"
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
              קטגוריה
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {INGREDIENT_CATEGORIES.map((c) => (
                <motion.button
                  key={c.id}
                  onClick={() => setDraft((d) => ({ ...d, category: c.id }))}
                  whileTap={{ scale: 0.95 }}
                  transition={tapSpring}
                  tabIndex={2}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: draft.category === c.id ? T.accent : T.t.chipBg,
                    color: draft.category === c.id ? '#07080B' : T.t.textSecondary,
                    border: `1px solid ${draft.category === c.id ? T.accent : T.t.border}`,
                  }}
                >
                  {c.label}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: T.t.textSecondary }}>ערכים תזונתיים ל-100 גרם (מהתווית)</p>
            <div className="grid grid-cols-4 gap-2">
              {macroField('קל׳', 'kcal', 3)}
              {macroField('חלבון', 'protein', 4)}
              {macroField('פחמימה', 'carbs', 5)}
              {macroField('שומן', 'fat', 6)}
            </div>
          </div>

          <motion.button
            onClick={handleSave}
            disabled={!canSave}
            whileTap={canSave ? { scale: 0.97 } : undefined}
            whileHover={canSave ? { scale: 1.015 } : undefined}
            transition={tapSpring}
            tabIndex={7}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ background: T.accent, color: '#07080B', opacity: canSave ? 1 : 0.5, boxShadow: canSave ? T.glow(T.accent, 16, '30') : 'none' }}
          >
            <Save size={15} /> שמירת מרכיב
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
