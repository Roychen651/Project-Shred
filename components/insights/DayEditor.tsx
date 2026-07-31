'use client';

// ProjectShred.artifact.jsx:3830-3869. Inline retroactive-backfill form for a
// selected heatmap day. `onSave` stays store-agnostic here (matching the
// artifact) — ComplianceHeatmap is the one that knows this maps to
// setManualDayOverride + setWorkoutActivity in the real store.

import { useState } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import type { HeatmapCell } from '@/lib/domain/analytics';

export interface DayEditorSavePatch {
  kcal: number;
  protein: number;
  workoutDone: boolean;
}

export function DayEditor({ cell, onSave, onClose }: { cell: HeatmapCell; onSave: (patch: DayEditorSavePatch) => void; onClose: () => void }) {
  const T = useTheme();
  const [kcal, setKcal] = useState(cell.log?.kcal !== undefined ? String(cell.log.kcal) : '');
  const [protein, setProtein] = useState(cell.log?.protein !== undefined ? String(cell.log.protein) : '');
  const [workoutDone, setWorkoutDone] = useState(cell.log?.workoutDone ?? false);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl" style={{ background: T.t.chipBg }}>
      <div className="flex gap-2 flex-wrap">
        <input
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          type="number" dir="ltr" placeholder="קלוריות"
          className="flex-1 py-2 px-3 rounded-lg text-sm outline-none"
          style={{ minWidth: 110, background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
        />
        <input
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          type="number" dir="ltr" placeholder="חלבון (גרם)"
          className="flex-1 py-2 px-3 rounded-lg text-sm outline-none"
          style={{ minWidth: 110, background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO }}
        />
      </div>
      <label className="flex items-center gap-2 text-xs" style={{ color: T.t.textSecondary }}>
        <input type="checkbox" checked={workoutDone} onChange={(e) => setWorkoutDone(e.target.checked)} />
        אימון בוצע ביום זה
      </label>
      <div className="flex gap-2">
        <button
          onClick={() => { onSave({ kcal: Number(kcal) || 0, protein: Number(protein) || 0, workoutDone }); onClose(); }}
          className="flex-1 py-2 rounded-lg text-xs font-bold"
          style={{ background: T.accent, color: '#07080B' }}
        >
          שמור
        </button>
        <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs" style={{ background: T.t.inputBg, color: T.t.textSecondary }}>ביטול</button>
      </div>
    </div>
  );
}
