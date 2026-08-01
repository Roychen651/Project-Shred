'use client';

// Sprint 4 — a scoped-down "בנה צלחת" entry point bound to the real 279-item
// INGREDIENT_DB and the raw/cooked conversion math (lib/domain/ingredients.ts,
// ported in milestone 2). The artifact's PlateComposerWidget is a much larger,
// multi-region component that went through 15+ dedicated bugfix sprints
// (15.6-15.24 in CLAUDE.md) to reach its current layout — porting that exact
// structure is future work. This ships a single, working, scrollable flow:
// search/browse → pick an ingredient → raw/cooked + portion → add to plate →
// repeat → assign the composed plate to a time slot. No drag/sticky-region
// layout yet — genuinely functional, not visually final.
//
// Sprint 9.1: PORTION_UNITS (12 units — gram/ml/tbsp/tsp/pinch/cup/piece/
// handful/slice/can/palm/plate) existed in lib/data/ since Sprint 8 but this
// component never actually rendered them, only a grams-only slider — a real
// gap flagged directly by feedback. Now wired via PortionInput, ported from
// the artifact's Sprint 15.3 component.
//
// Sprint 12 — ISRAELI_INGREDIENTS (105 generic, non-branded staples) merged
// in alongside INGREDIENT_DB, plus the signed-in person's own
// customIngredients (mapped through customIngredientToIngredient() —
// CustomIngredient's category is a wider `string`, round-tripping through a
// DB check-constraint rather than the Ingredient union, so it isn't
// structurally assignable without narrowing). STATIC_INGREDIENTS is computed
// ONCE at module scope, not per-render or even per-mount, so merging in 105
// more items costs nothing on every keystroke of the search box — the
// .filter() below still runs over one flat array exactly like it did with
// INGREDIENT_DB alone. customIngredients changes rarely (only when the
// person saves a new one), so it's the only piece that needs its own
// useMemo dependency.

import { useMemo, useState } from 'react';
import { Search, Plus, Trash2, UserPlus } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { INGREDIENT_DB, INGREDIENT_CATEGORIES } from '@/lib/data/ingredients';
import { ISRAELI_INGREDIENTS } from '@/lib/data/israeli-ingredients';
import { BEVERAGES } from '@/lib/data/beverages';
import { getIngredientMacros, customIngredientToIngredient, type Ingredient, type IngredientState } from '@/lib/domain/ingredients';
import { SLOT_DEFS, type SlotId } from '@/lib/domain/slots';
import { MacroStrip } from '@/components/ui/MacroStrip';
import { PortionInput, gramsForPortion, formatPortionLabel } from './PortionInput';
import { CustomIngredientModal } from './CustomIngredientModal';
import type { LogItemSpec, CustomIngredient } from '@/lib/store/shred-store';

// Sprint 29 — BEVERAGES (coffee/tea/soft drinks/juices/alcohol etc., see that
// file's header) merged in the same way ISRAELI_INGREDIENTS was in Sprint 12:
// computed once at module scope, no per-render cost added.
const STATIC_INGREDIENTS: Ingredient[] = [...INGREDIENT_DB, ...ISRAELI_INGREDIENTS, ...BEVERAGES];

interface PlateLine {
  id: string;
  ingredient: Ingredient;
  state: IngredientState;
  unit: string;
  qty: number;
  grams: number;
}

export interface PlateComposerSheetBodyProps {
  onConfirm: (specs: LogItemSpec[], slotId: SlotId) => void;
  defaultSlotId?: SlotId;
  customIngredients?: CustomIngredient[];
  onSaveCustomIngredient?: (ing: CustomIngredient) => void;
}

export function PlateComposerSheetBody({ onConfirm, defaultSlotId, customIngredients = [], onSaveCustomIngredient }: PlateComposerSheetBodyProps) {
  const T = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(INGREDIENT_CATEGORIES[0].id);
  const [selectedId, setSelectedId] = useState(STATIC_INGREDIENTS[0].id);
  const [state, setState] = useState<IngredientState>('raw');
  const [unit, setUnit] = useState('gram');
  const [qty, setQty] = useState(100);
  const [plate, setPlate] = useState<PlateLine[]>([]);
  const [slotId, setSlotId] = useState<SlotId>(defaultSlotId || 'lunch');
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const allIngredients = useMemo(
    () => (customIngredients.length ? [...STATIC_INGREDIENTS, ...customIngredients.map(customIngredientToIngredient)] : STATIC_INGREDIENTS),
    [customIngredients]
  );

  const filtered = useMemo(() => {
    if (search.trim()) return allIngredients.filter((i) => i.name.includes(search.trim()));
    return allIngredients.filter((i) => i.category === category);
  }, [allIngredients, search, category]);

  const selected = allIngredients.find((i) => i.id === selectedId) || filtered[0] || allIngredients[0];
  const grams = gramsForPortion(unit, qty);
  const selectedMacros = getIngredientMacros(selected, state, grams);

  const addToPlate = () => {
    setPlate((p) => [...p, { id: `${selected.id}-${Date.now()}`, ingredient: selected, state, unit, qty, grams }]);
  };

  const removeLine = (id: string) => setPlate((p) => p.filter((l) => l.id !== id));

  const plateTotals = plate.reduce(
    (acc, line) => {
      const m = getIngredientMacros(line.ingredient, line.state, line.grams);
      return { kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const assignPlate = () => {
    if (plate.length === 0) return;
    onConfirm(
      plate.map((line) => {
        const m = getIngredientMacros(line.ingredient, line.state, line.grams);
        return { name: `${line.ingredient.name} (${formatPortionLabel(line.unit, line.qty)})`, calories: m.kcal, protein: m.protein, carbs: m.carbs, fats: m.fat, source: 'plate' as const };
      }),
      slotId
    );
    setPlate([]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} color={T.t.textDim} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפשו מרכיב..."
            className="w-full py-2.5 pr-9 pl-3 rounded-xl text-sm outline-none"
            style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
          />
        </div>
        <button
          onClick={() => setCustomModalOpen(true)}
          className="flex-shrink-0 flex items-center justify-center rounded-xl"
          style={{ width: 42, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
          aria-label="הוספת מרכיב אישי"
          title="לא מצאתם? הוסיפו מרכיב אישי מהתווית"
        >
          <UserPlus size={16} color={T.accent} />
        </button>
      </div>

      {!search.trim() && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {INGREDIENT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: category === c.id ? T.accent : T.t.chipBg, color: category === c.id ? '#07080B' : T.t.textSecondary, border: `1px solid ${category === c.id ? T.accent : T.t.border}` }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-xl" style={{ border: `1px solid ${T.t.border}` }}>
        {filtered.slice(0, 60).map((ing) => (
          <button
            key={ing.id}
            onClick={() => { setSelectedId(ing.id); setState('raw'); }}
            className="text-right px-3 py-2 text-sm"
            style={{
              background: selectedId === ing.id ? `${T.accent}18` : 'transparent',
              color: selectedId === ing.id ? T.accent : T.t.textPrimary,
              borderBottom: `1px solid ${T.t.border}`,
            }}
          >
            {ing.name}
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-center py-4" style={{ color: T.t.textDim }}>לא נמצאו מרכיבים.</p>}
      </div>

      <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: T.t.chipBg }}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{selected.name}</span>
          {selected.hasCookedVariant && (
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${T.t.border}` }}>
              {(['raw', 'cooked'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setState(s)}
                  className="px-2.5 py-1 text-xs font-semibold"
                  style={{ background: state === s ? T.accent : 'transparent', color: state === s ? '#07080B' : T.t.textSecondary }}
                >
                  {s === 'raw' ? 'גולמי' : 'מבושל'}
                </button>
              ))}
            </div>
          )}
        </div>
        <PortionInput
          unit={unit}
          qty={qty}
          onUnitChange={(u, defaultQty) => { setUnit(u); setQty(defaultQty); }}
          onQtyChange={setQty}
        />
        <MacroStrip totals={selectedMacros} />
        <button onClick={addToPlate} className="py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: T.accent, color: '#07080B' }}>
          <Plus size={14} /> הוסף לצלחת
        </button>
      </div>

      {plate.length > 0 && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${T.t.border}` }}>
          <p className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>הצלחת שלכם ({plate.length} פריטים)</p>
          {plate.map((line) => (
            <div key={line.id} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: T.t.chipBg }}>
              <span className="text-sm" style={{ color: T.t.textPrimary }}>{line.ingredient.name} · {formatPortionLabel(line.unit, line.qty)}</span>
              <button onClick={() => removeLine(line.id)} style={{ color: T.t.textDim }}><Trash2 size={14} /></button>
            </div>
          ))}
          <MacroStrip totals={plateTotals} />
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
          <button onClick={assignPlate} className="py-3 rounded-xl text-sm font-bold" style={{ background: T.macro.protein, color: '#07080B' }}>
            אשר ושבץ בארוחה
          </button>
        </div>
      )}

      <CustomIngredientModal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSave={(ing) => {
          onSaveCustomIngredient?.(ing);
          setSelectedId(ing.id);
        }}
      />
    </div>
  );
}
