'use client';

// Sprint 28 — `generateAiReport()` and `MENTAL_TIPS` (lib/domain/aiCoach.ts)
// have existed since Milestone 2, fully unit-tested, and were never wired to
// any component — MetabolicInsightCard's own comment already documented this
// exact gap ("AiCoachWidget... was never ported into this Next.js app in any
// prior sprint; only its pure domain logic was extracted, unused"). This is
// that widget, finally built.
//
// Same "Zero-Key" honesty already established in CLAUDE.md for the original
// artifact: deterministic, explainable, rule-based scoring — not a real LLM
// call. The short "מנתחים..." delay before showing the result is deliberate
// (matches the artifact's own register for a "coach" persona — the
// computation is instant, but presenting it as considered fits better than a
// snap client-side calc appearing with zero transition).

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, tactileGradient } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { generateAiReport, type AiReport, type DayMode } from '@/lib/domain/aiCoach';
import type { MacroTotals } from '@/lib/domain/items';
import type { DayTargets } from '@/lib/domain/targets';

export interface AiCoachWidgetProps {
  consumed: Pick<MacroTotals, 'kcal' | 'protein'>;
  targets: Pick<DayTargets, 'kcal' | 'protein'>;
  dayMode: DayMode;
}

export function AiCoachWidget({ consumed, targets, dayMode }: AiCoachWidgetProps) {
  const T = useTheme();
  const [report, setReport] = useState<AiReport | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setReport(generateAiReport({ consumed, targets, dayMode }));
      setLoading(false);
    }, 600);
  };

  const scoreColor = report ? (report.score >= 80 ? T.macro.protein : report.score >= 60 ? T.macro.kcal : T.macro.fat) : T.accent;

  return (
    <GlassCard className="p-5" accent={T.accent}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <Eyebrow>ARENA 00 · AI COACH</Eyebrow>
          <h3 className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מאמן אישי חכם</h3>
        </div>
        <Sparkles size={20} color={T.accent} />
      </div>

      <AnimatePresence mode="wait">
        {!report ? (
          <motion.button
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={runAnalysis}
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ ...tactileGradient(T.accent), color: '#07080B' }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> מנתחים את היום שלכם...
              </>
            ) : (
              <>
                <Sparkles size={15} /> נתחו את היום שלי
              </>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="report"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: 56, height: 56, background: `${scoreColor}18`, border: `2px solid ${scoreColor}` }}
              >
                <span className="text-lg font-black" style={{ color: scoreColor, fontFamily: FONT_MONO }}>{report.score}</span>
              </div>
              <p className="text-sm flex-1" style={{ color: T.t.textPrimary }}>{report.tactical}</p>
            </div>
            <div className="rounded-xl p-3" style={{ background: T.t.chipBg }}>
              <p className="text-xs" style={{ color: T.t.textSecondary }}>{report.mental}</p>
            </div>
            <button onClick={runAnalysis} className="text-xs font-bold self-center" style={{ color: T.accent }}>
              נתחו שוב
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
