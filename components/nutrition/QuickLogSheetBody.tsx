'use client';

// ProjectShred.artifact.jsx:5573-5638 (Sprint 14, a standalone copy of the
// quick-log parser flow for FAB convenience — see CLAUDE.md's Known
// Simplifications note on why this duplicates the Insights-tab quick-log
// section rather than sharing one component).
//
// onConfirm receives normalized {name, calories, protein, carbs, fats, source}
// specs plus a slotId — the exact shape logItems() expects, so the parent only
// has to call store.logItems(specs, slotId) directly. No store import here:
// this stays a pure, testable presentation component.

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { MacroStrip } from '@/components/ui/MacroStrip';
import { MacroLine } from '@/components/ui/MacroLine';
import { FavoriteBuilderModal, type FavoriteDraftSeed } from '@/components/today/FavoriteBuilderModal';
import { SLOT_DEFS, type SlotId } from '@/lib/domain/slots';
import { parseFoodText, buildParserCorpus, type ParsedFoodItem, type ParserDishLike } from '@/lib/domain/foodParser';
import { customIngredientToIngredient, type Ingredient } from '@/lib/domain/ingredients';
import { INGREDIENT_DB } from '@/lib/data/ingredients';
import { ISRAELI_INGREDIENTS } from '@/lib/data/israeli-ingredients';
import { BEVERAGES } from '@/lib/data/beverages';
import { HACKS } from '@/lib/data/hacks';
import { EATING_OUT_MENU } from '@/lib/data/eatingOut';
import type { LogItemSpec, CustomIngredient, CustomHack, Favorite } from '@/lib/store/shred-store';

// Sprint 30 — the recognition corpus is now the app's real, full food surface
// (every raw ingredient + beverage + home recipe + eating-out dish, plus the
// signed-in person's own custom ingredients/hacks) instead of a bespoke
// 19-entry list, closing a direct report that common words ("קפה", "חלב")
// came back as "not recognized." Computed once at module scope for the
// static part (mirrors PlateComposerSheetBody's STATIC_INGREDIENTS) —
// custom items are merged in via useMemo since they change per person.
const STATIC_INGREDIENTS: Ingredient[] = [...INGREDIENT_DB, ...ISRAELI_INGREDIENTS, ...BEVERAGES];
const STATIC_DISHES: ParserDishLike[] = [...HACKS, ...EATING_OUT_MENU];

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

// Sprint 31 — visual pass: this row predates the app's later typographic
// conventions and had drifted noticeably behind them — a direct, specific
// complaint ("design that isn't finished/mature"), not a vague one.
// Sprint 35 — the macro line itself got a second pass: it had copied
// ItemLogRow's "12ח 36פ 4ש" concatenated-letter format, which turned out to
// be the same complaint one level down (a direct example quote: "משעמם. 12ח
// 36פ 4ש"). Now shares MacroLine (components/ui/MacroLine.tsx) with every
// other logged-item/dish row in the app — one small colored icon per macro
// instead of a run of Hebrew abbreviation letters.
function ParsedItemRow({ item, onRemove, onSaveFavorite }: { item: ParsedFoodItem; onRemove: () => void; onSaveFavorite: () => void }) {
  const T = useTheme();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={tapSpring}
      className="flex items-center gap-2.5 p-3 rounded-xl"
      style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: T.t.textPrimary }}>{item.name}</div>
        <MacroLine kcal={item.kcal} protein={item.protein} carbs={item.carbs} fat={item.fat} prefix={item.amount} className="mt-0.5" />
      </div>
      <motion.button
        onClick={onSaveFavorite}
        whileTap={{ scale: 0.88 }}
        transition={tapSpring}
        className="p-1.5 rounded-lg flex-shrink-0"
        style={{ background: T.t.border }}
        aria-label="שמור כמועדף"
        title="שמור כמועדף (כולל הכמות הזו)"
      >
        <Star size={13} color={T.accent} />
      </motion.button>
      <motion.button
        onClick={onRemove}
        whileTap={{ scale: 0.88 }}
        transition={tapSpring}
        className="p-1.5 rounded-lg flex-shrink-0"
        style={{ background: `${T.macro.fat}18` }}
        aria-label="הסר פריט"
      >
        <X size={13} color={T.macro.fat} />
      </motion.button>
    </motion.div>
  );
}

export interface QuickLogSheetBodyProps {
  onConfirm: (specs: LogItemSpec[], slotId: SlotId) => void;
  defaultSlotId?: SlotId;
  customIngredients?: CustomIngredient[];
  customHacks?: CustomHack[];
  /** Sprint 31 — lets any parsed item be saved as a one-tap Favorite for next time, quantity baked in. Omitted entirely if the caller doesn't wire favorites. */
  onSaveFavorite?: (fav: Favorite) => void;
}

export function QuickLogSheetBody({ onConfirm, defaultSlotId, customIngredients = [], customHacks = [], onSaveFavorite }: QuickLogSheetBodyProps) {
  const T = useTheme();
  const [logText, setLogText] = useState('');
  const [preview, setPreview] = useState<ParsedFoodItem[]>([]);
  const [noMatch, setNoMatch] = useState(false);
  const [slotId, setSlotId] = useState<SlotId>(defaultSlotId || 'lunch');
  const [favoriteSeed, setFavoriteSeed] = useState<FavoriteDraftSeed | null>(null);

  const corpus = useMemo(() => {
    const ingredients = customIngredients.length
      ? [...STATIC_INGREDIENTS, ...customIngredients.map(customIngredientToIngredient)]
      : STATIC_INGREDIENTS;
    const dishes = customHacks.length ? [...STATIC_DISHES, ...customHacks] : STATIC_DISHES;
    return buildParserCorpus(ingredients, dishes);
  }, [customIngredients, customHacks]);

  const runParse = () => {
    // The artifact's T.playFeedback() (haptic + Tone.js blip) isn't wired up
    // yet — ThemeContext only carries the `feedback` setting so far, not the
    // player itself. Deferred to whichever sprint ports Sprint 7's sound engine.
    const results = parseFoodText(logText, corpus);
    setPreview(results);
    setNoMatch(results.length === 0);
  };

  const confirm = () => {
    onConfirm(
      preview.map((p) => ({ name: p.name, calories: p.kcal, protein: p.protein, carbs: p.carbs, fats: p.fat, source: 'quicklog' as const })),
      slotId
    );
    setPreview([]);
    setLogText('');
  };

  const totals = preview.reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: T.t.textSecondary }}>מה אכלתם? כתבו בלשון חופשית — לדוגמה &quot;200 גרם חזה עוף ואורז&quot;.</p>
      <textarea
        value={logText}
        onChange={(e) => setLogText(e.target.value)}
        rows={2}
        placeholder="במבה קטנה ומעדן גמדים..."
        className="w-full py-3 px-3.5 rounded-xl text-sm outline-none resize-none"
        style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
      />
      <div>
        <p className="text-xs font-semibold mb-1.5" style={{ color: T.t.textSecondary }}>שיבוץ לחלון זמן</p>
        <div className="grid grid-cols-5 gap-1.5">
          {SLOT_DEFS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSlotId(s.id)}
              className="py-2 px-1 rounded-lg text-xs font-semibold"
              style={{
                background: slotId === s.id ? T.accent : T.t.chipBg,
                color: slotId === s.id ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${slotId === s.id ? T.accent : T.t.border}`,
              }}
            >
              {s.emoji}
            </button>
          ))}
        </div>
      </div>
      <button onClick={runParse} disabled={!logText.trim()} className="py-3 rounded-xl text-sm font-bold" style={{ background: T.accent, color: '#07080B', opacity: logText.trim() ? 1 : 0.5 }}>
        פענח
      </button>
      {noMatch && preview.length === 0 && <p className="text-xs" style={{ color: T.macro.kcal }}>לא זוהו מאכלים ידועים — נסו שם מאכל ברור יותר.</p>}
      {preview.length > 0 && (
        <>
          <AnimatePresence initial={false}>
            {preview.map((item) => (
              <ParsedItemRow
                key={item.id}
                item={item}
                onRemove={() => setPreview((p) => p.filter((x) => x.id !== item.id))}
                onSaveFavorite={() => setFavoriteSeed({ name: item.name, kcal: item.kcal, protein: item.protein, carbs: item.carbs, fat: item.fat })}
              />
            ))}
          </AnimatePresence>
          <MacroStrip totals={totals} />
          <button onClick={confirm} className="py-3 rounded-xl text-sm font-bold" style={{ background: T.macro.protein, color: '#07080B' }}>אשר והוסף ליומן</button>
        </>
      )}

      {onSaveFavorite && (
        <FavoriteBuilderModal
          open={favoriteSeed !== null}
          onClose={() => setFavoriteSeed(null)}
          seed={favoriteSeed ?? undefined}
          onSave={onSaveFavorite}
        />
      )}
    </div>
  );
}
