'use client';

// ProjectShred.artifact.jsx:5415-5478 (Sprint 15.3). Every number here comes
// straight from computeProfileTargets() — nothing is recomputed or
// approximated for display, it's the exact same math chain the hero ring's
// numbers come from, just laid out step by step with the person's real
// profile values plugged into each formula.

import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { ACTIVITY_LEVELS, GOALS } from '@/lib/domain/targets';
import type { ComputedTargets } from '@/lib/domain/targets';
import type { Profile } from '@/lib/store/shred-store';

function MathRow({ step, title, formula, result }: { step: number; title: string; formula: string; result: string }) {
  const T = useTheme();
  return (
    <div className="flex gap-3">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold"
        style={{ width: 24, height: 24, background: `${T.accent}22`, color: T.accent, fontFamily: FONT_MONO }}
      >
        {step}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: T.t.textDim, fontFamily: FONT_MONO, direction: 'ltr', textAlign: 'right' }}>{formula}</p>
        <p className="text-xs mt-1 font-bold" style={{ color: T.accent, fontFamily: FONT_MONO }}>{result}</p>
      </div>
    </div>
  );
}

export interface CalorieMathSheetBodyProps {
  profile: Profile;
  computed: ComputedTargets;
  dayMode: 'training' | 'rest';
}

export function CalorieMathSheetBody({ profile, computed, dayMode }: CalorieMathSheetBodyProps) {
  const T = useTheme();
  const activity = ACTIVITY_LEVELS[profile.activity] || ACTIVITY_LEVELS.office;
  const goal = GOALS[profile.goal] || GOALS.maintain;
  const targets = computed[dayMode];
  const proteinKcal = Math.round(targets.protein * 4);
  const fatKcal = Math.round(targets.fat * 9);
  const carbKcal = Math.round(targets.carbs * 4);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm" style={{ color: T.t.textSecondary }}>
        היעד היומי שלכם לא שרירותי — הוא נגזר צעד-אחר-צעד מהנתונים שהזנתם בפרופיל. הנה בדיוק איך הגענו למספר.
      </p>

      <MathRow
        step={1}
        title="חילוף חומרים בסיסי (BMR) · נוסחת Mifflin-St Jeor"
        formula={`10×${profile.weight} + 6.25×${profile.height} − 5×${profile.age} + 5`}
        result={`BMR = ${computed.bmr} קל׳ ליום (בשכיבה מוחלטת)`}
      />
      <MathRow
        step={2}
        title={`הוצאה יומית כוללת (TDEE) · רמת פעילות: ${activity.label}`}
        formula={`${computed.bmr} × ${activity.mult}`}
        result={`TDEE = ${computed.tdee} קל׳ ליום`}
      />
      <MathRow
        step={3}
        title={`יעד לפי מטרה: ${goal.label} (${goal.pct >= 0 ? '+' : ''}${Math.round(goal.pct * 100)}%)`}
        formula={`${computed.tdee} × (1 ${goal.pct >= 0 ? '+' : '−'} ${Math.abs(goal.pct)})`}
        result={`יעד יום מנוחה = ${computed.rest.kcal} קל׳`}
      />
      <MathRow
        step={4}
        title="יום אימון: תדלוק פחמימה נוסף (Refeed)"
        formula="יעד יום מנוחה + 300 קל׳ (כ-75 גר׳ פחמימה נוספת)"
        result={`יעד יום אימון = ${computed.training.kcal} קל׳`}
      />

      <div className="pt-4" style={{ borderTop: `1px solid ${T.t.border}` }}>
        <Eyebrow>פיצול המאקרו · {dayMode === 'training' ? 'יום אימון' : 'יום מנוחה'}</Eyebrow>
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: T.t.textSecondary }}>חלבון · 2.0 גר׳ × {profile.weight} ק&quot;ג</span>
            <span style={{ fontFamily: FONT_MONO, color: T.macro.protein, fontWeight: 700 }}>{targets.protein}g ({proteinKcal} קל׳)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: T.t.textSecondary }}>שומן · 0.7 גר׳ × {profile.weight} ק&quot;ג</span>
            <span style={{ fontFamily: FONT_MONO, color: T.macro.fat, fontWeight: 700 }}>{targets.fat}g ({fatKcal} קל׳)</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: T.t.textSecondary }}>פחמימה · השארית מהיעד הקלורי</span>
            <span style={{ fontFamily: FONT_MONO, color: T.macro.carbs, fontWeight: 700 }}>{targets.carbs}g ({carbKcal} קל׳)</span>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: T.t.textDim }}>
        לשינוי גיל/משקל/גובה/רמת פעילות/מטרה — הגדרות ← פרטים אישיים. כל היעדים יחושבו מחדש מיידית.
      </p>
    </div>
  );
}
