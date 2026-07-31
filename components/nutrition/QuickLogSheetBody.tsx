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

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { MacroStrip } from '@/components/ui/MacroStrip';
import { SLOT_DEFS, type SlotId } from '@/lib/domain/slots';
import { parseFoodText, type ParsedFoodItem } from '@/lib/domain/foodParser';
import type { LogItemSpec } from '@/lib/store/shred-store';

function ParsedItemRow({ item, onRemove }: { item: ParsedFoodItem; onRemove: () => void }) {
  const T = useTheme();
  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: T.t.chipBg }}>
      <div>
        <div className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{item.name}</div>
        <div className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{item.amount}</div>
      </div>
      <div className="flex items-center gap-3 text-xs" style={{ fontFamily: FONT_MONO }}>
        <span style={{ color: T.macro.kcal }}>{item.kcal} קל׳</span>
        <span style={{ color: T.macro.protein }}>{item.protein}ח</span>
        <span style={{ color: T.macro.carbs }}>{item.carbs}פ</span>
        <span style={{ color: T.macro.fat }}>{item.fat}ש</span>
        <button onClick={onRemove} style={{ color: T.t.textDim }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export interface QuickLogSheetBodyProps {
  onConfirm: (specs: LogItemSpec[], slotId: SlotId) => void;
  defaultSlotId?: SlotId;
}

export function QuickLogSheetBody({ onConfirm, defaultSlotId }: QuickLogSheetBodyProps) {
  const T = useTheme();
  const [logText, setLogText] = useState('');
  const [preview, setPreview] = useState<ParsedFoodItem[]>([]);
  const [noMatch, setNoMatch] = useState(false);
  const [slotId, setSlotId] = useState<SlotId>(defaultSlotId || 'lunch');

  const runParse = () => {
    // The artifact's T.playFeedback() (haptic + Tone.js blip) isn't wired up
    // yet — ThemeContext only carries the `feedback` setting so far, not the
    // player itself. Deferred to whichever sprint ports Sprint 7's sound engine.
    const results = parseFoodText(logText);
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
        placeholder="במבה קטנה ומעדן GO..."
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
          {preview.map((item) => <ParsedItemRow key={item.id} item={item} onRemove={() => setPreview((p) => p.filter((x) => x.id !== item.id))} />)}
          <MacroStrip totals={totals} />
          <button onClick={confirm} className="py-3 rounded-xl text-sm font-bold" style={{ background: T.macro.protein, color: '#07080B' }}>אשר והוסף ליומן</button>
        </>
      )}
    </div>
  );
}
