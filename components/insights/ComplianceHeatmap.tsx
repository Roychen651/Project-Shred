'use client';

// ProjectShred.artifact.jsx:3724-3828. GitHub-style grid, HEATMAP_WEEKS columns
// × 7 rows, rendered dir="ltr" so weeks flow chronologically left-to-right (a
// deliberate RTL exception, same as a calendar grid — see CLAUDE.md Sprint 10).
//
// Data source differs from the artifact: there's no raw settable `dailyLogs`
// dict here — buildDailyLog() derives each cell from real itemsByDate (Sprint
// 15's unified schema) merged with day_meta-equivalent workout/manual-override
// state, mirroring supabase/migrations/0003's `daily_log` view exactly.
//
// Scope note: the artifact's "איפוס נתוני שבוע אחרון" button deleted 7 dates'
// worth of lightweight dailyLogs entries. Here that would mean deleting real
// logged food items across 7 days — a materially more destructive action than
// what the artifact did, so it's left out rather than silently becoming a
// bulk-delete button. Individual days stay editable via DayEditor either way.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, LayoutGrid } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, tactileGradient } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };
import { Eyebrow } from '@/components/ui/Eyebrow';
import { HeatmapDetail } from './HeatmapDetail';
import { DayEditor, type DayEditorSavePatch } from './DayEditor';
import { buildDailyLog, buildHeatmapColumns, heatColor, HEATMAP_WEEKS, type DayMetaLike, type DayLog } from '@/lib/domain/analytics';
import { dateKey, addDays } from '@/lib/domain/dates';
import type { LoggedItem } from '@/lib/domain/items';
import type { ComputedTargets } from '@/lib/domain/targets';

export interface ComplianceHeatmapProps {
  itemsByDate: Record<string, LoggedItem[]>;
  dayMeta: Record<string, DayMetaLike>;
  computed: ComputedTargets;
  onSaveDay: (dateKey: string, patch: DayEditorSavePatch) => void;
}

export function ComplianceHeatmap({ itemsByDate, dayMeta, computed, onSaveDay }: ComplianceHeatmapProps) {
  const T = useTheme();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const today = new Date();
  const totalDays = HEATMAP_WEEKS * 7;
  const dailyLogs: Record<string, DayLog | null> = {};
  for (let i = 0; i < totalDays; i++) {
    const key = dateKey(addDays(today, -i));
    dailyLogs[key] = buildDailyLog(itemsByDate[key], dayMeta[key]);
  }

  const columns = buildHeatmapColumns(dailyLogs, computed);
  const allCells = columns.flat();
  const selectedCell = allCells.find((c) => c.key === selectedKey) || null;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <Eyebrow>מפת חום היצמדות · {HEATMAP_WEEKS} שבועות אחרונים</Eyebrow>
          <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מפת חום שבועית/חודשית</h3>
        </div>
        <LayoutGrid size={20} color={T.accent} />
      </div>

      <div dir="ltr" className="overflow-x-auto pb-1">
        <div className="flex gap-1 w-max">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((cell) => {
                const color = heatColor(cell.score, T.macro);
                const isSelected = cell.key === selectedKey;
                return (
                  <motion.button
                    key={cell.key}
                    onMouseEnter={() => setSelectedKey(cell.key)}
                    onClick={() => { setSelectedKey(cell.key); setEditing(false); }}
                    whileHover={{ scale: 1.35 }}
                    transition={tapSpring}
                    className="rounded-[4px] flex-shrink-0"
                    style={{
                      width: 13, height: 13,
                      background: color || T.t.chipBg,
                      boxShadow: color && isSelected ? T.glow(color, 8, '55') : undefined,
                      border: isSelected ? `1.5px solid ${T.accent}` : `1px solid ${T.t.border}`,
                      opacity: color ? 1 : 0.5,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-3.5 text-xs" style={{ color: T.t.textDim }}>
        <span>פחות</span>
        <span className="rounded-full" style={{ width: 11, height: 11, background: T.t.chipBg, border: `1px solid ${T.t.border}`, display: 'inline-block' }} />
        <span className="rounded-full" style={{ width: 11, height: 11, background: T.macro.fat, display: 'inline-block' }} />
        <span className="rounded-full" style={{ width: 11, height: 11, background: T.macro.kcal, display: 'inline-block' }} />
        <span className="rounded-full" style={{ width: 11, height: 11, background: T.macro.protein, display: 'inline-block' }} />
        <span>יותר</span>
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <HeatmapDetail cell={selectedCell} computed={computed} />
        {selectedCell && (
          <div className="mt-3">
            {!editing ? (
              <motion.button
                onClick={() => setEditing(true)}
                whileTap={{ scale: 0.96 }}
                whileHover={{ scale: 1.02 }}
                transition={tapSpring}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl"
                style={{ ...tactileGradient(T.accent), color: '#07080B' }}
              >
                <Pencil size={12} /> ערוך יום זה (מילוי רטרואקטיבי)
              </motion.button>
            ) : (
              <DayEditor
                cell={selectedCell}
                onSave={(patch) => onSaveDay(selectedCell.key, patch)}
                onClose={() => setEditing(false)}
              />
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
