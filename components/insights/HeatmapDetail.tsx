'use client';

// ProjectShred.artifact.jsx:3694-3722. A persistent detail panel below the
// heatmap grid rather than a cursor-following tooltip — works identically on
// touch and mouse (documented reasoning in CLAUDE.md, Sprint 10).

import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { formatShortDate } from '@/lib/domain/dates';
import type { HeatmapCell } from '@/lib/domain/analytics';
import type { ComputedTargets } from '@/lib/domain/targets';

export function HeatmapDetail({ cell, computed }: { cell: HeatmapCell | null; computed: ComputedTargets }) {
  const T = useTheme();
  if (!cell) {
    return <p className="text-xs" style={{ color: T.t.textDim }}>הצביעו או הקישו על יום כדי לראות פרטים.</p>;
  }
  const { log, score, key } = cell;
  const dayTargets = log?.workoutDone ? computed.training : computed.rest;
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <span className="text-sm font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>{formatShortDate(key)}</span>
        {score !== null ? (
          <span className="text-xs mr-2" style={{ color: T.t.textDim }}>ציון היצמדות: {score}%</span>
        ) : (
          <span className="text-xs mr-2" style={{ color: T.t.textDim }}>לא תועד יום זה</span>
        )}
      </div>
      {log && (
        <div className="flex items-center gap-3 text-xs" style={{ fontFamily: FONT_MONO }}>
          <span style={{ color: T.macro.kcal }}>{log.kcal}/{dayTargets.kcal} קל׳</span>
          <span style={{ color: T.macro.protein }}>{log.protein}/{dayTargets.protein}ח</span>
          <span style={{ color: log.workoutDone ? T.macro.protein : T.t.textDim }}>
            {log.workoutDone ? `✓ אימון ${log.workoutDay || ''}` : 'ללא אימון'}
          </span>
        </div>
      )}
    </div>
  );
}
