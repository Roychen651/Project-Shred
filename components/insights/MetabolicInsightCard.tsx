'use client';

// Sprint 10 — surfaces analyzeMetabolicAdaptation() (lib/domain/adaptation.ts).
//
// Honest scope note: the mandate that asked for this referred to it
// surfacing through "the AiCoachWidget" — but AiCoachWidget (the artifact's
// Sprint 9 AI Coach Hub: report generation, the NLP quick-log parser, Smart
// Swap) was never ported into this Next.js app in any prior sprint; only its
// pure domain logic (lib/domain/aiCoach.ts) was extracted, unused. Building
// the full Coach Hub is much larger scope than "surface this one insight,"
// so this ships as its own small, honestly-named card instead of silently
// pretending a widget exists that doesn't. Porting the rest of the Coach Hub
// is a reasonable candidate for a future sprint.
//
// Renders nothing for 'maintain' (not applicable), nothing for
// 'insufficient_data' with zero entries (nothing to say yet is not an
// insight), and a real card otherwise — including the reassuring "on_track"
// case, since silence there could read as "the app isn't watching."

import { TrendingDown, TrendingUp, CircleAlert, CircleCheck, Info } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import { GlassCard } from '@/components/ui/GlassCard';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { analyzeMetabolicAdaptation } from '@/lib/domain/adaptation';
import type { MetricEntry } from '@/lib/domain/analytics';
import type { GoalKey } from '@/lib/domain/targets';

export interface MetabolicInsightCardProps {
  metricEntries: MetricEntry[];
  goal: GoalKey;
}

export function MetabolicInsightCard({ metricEntries, goal }: MetabolicInsightCardProps) {
  const T = useTheme();
  if (goal === 'maintain') return null;

  const insight = analyzeMetabolicAdaptation(metricEntries, goal);
  if (!insight || (insight.status === 'insufficient_data' && metricEntries.length === 0)) return null;

  const icon =
    insight.status === 'plateau_cut' || insight.status === 'plateau_bulk' ? (
      <CircleAlert size={20} color={T.macro.kcal} />
    ) : insight.status === 'on_track' ? (
      <CircleCheck size={20} color={T.macro.protein} />
    ) : (
      <Info size={20} color={T.t.textDim} />
    );

  const trendIcon =
    insight.weeklyDeltaKg > 0 ? <TrendingUp size={13} /> : insight.weeklyDeltaKg < 0 ? <TrendingDown size={13} /> : null;

  return (
    <GlassCard className="p-5" accent={insight.status.startsWith('plateau') ? T.macro.kcal : null}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <Eyebrow>הסתגלות מטבולית</Eyebrow>
          <h3 className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מגמת משקל · 3 שבועות אחרונים</h3>
        </div>
        {icon}
      </div>

      <p className="text-sm" style={{ color: T.t.textSecondary }}>{insight.message}</p>

      {insight.status !== 'insufficient_data' && (
        <div className="flex items-center gap-1.5 mt-3 text-xs font-bold" style={{ color: insight.weeklyDeltaKg < 0 ? T.macro.protein : insight.weeklyDeltaKg > 0 ? T.macro.kcal : T.t.textDim, fontFamily: FONT_MONO }}>
          {trendIcon}
          {insight.weeklyDeltaKg >= 0 ? '+' : ''}{insight.weeklyDeltaKg} ק״ג/שבוע בממוצע
        </div>
      )}
    </GlassCard>
  );
}
