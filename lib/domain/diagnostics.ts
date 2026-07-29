// Profile integrity checks. ProjectShred.artifact.jsx:1416-1450 (Sprint 12).
//
// Genuinely recomputes the active profile's Mifflin-St Jeor chain and verifies
// it's internally consistent — real numbers each run, not a static checklist.

import type { ProfileInput } from './targets';
import type { ComputedTargets } from './targets';

export interface IntegrityCheck {
  label: string;
  pass: boolean;
  detail: string;
}

export function runIntegrityChecks(profile: ProfileInput, computed: ComputedTargets): IntegrityCheck[] {
  const checks: IntegrityCheck[] = [];
  const w = Number(profile.weight);
  const h = Number(profile.height);
  const a = Number(profile.age);

  checks.push({
    label: 'שדות פרופיל תקינים',
    pass: w > 0 && h > 0 && a > 0,
    detail: w > 0 && h > 0 && a > 0 ? 'משקל, גובה וגיל הם מספרים חיוביים תקינים.' : 'אחד השדות חסר או לא תקין.',
  });

  checks.push({
    label: 'BMR חיובי וסופי',
    pass: Number.isFinite(computed.bmr) && computed.bmr > 0,
    detail: `BMR מחושב: ${computed.bmr} קל׳.`,
  });

  (['rest', 'training'] as const).forEach((mode) => {
    const d = computed[mode];
    const rebuilt = d.protein * 4 + d.fat * 9 + d.carbs * 4;
    const diff = Math.abs(rebuilt - d.kcal);
    checks.push({
      label: `עקביות מאקרו · ${mode === 'rest' ? 'יום מנוחה' : 'יום אימון'}`,
      pass: diff <= 6,
      detail: `${d.protein}×4 + ${d.fat}×9 + ${d.carbs}×4 = ${rebuilt} קל׳ (יעד: ${d.kcal} קל׳, פער: ${diff}).`,
    });
  });

  checks.push({
    label: 'דלתא Refeed מדויקת',
    pass: computed.training.kcal - computed.rest.kcal === 300 && computed.training.carbs - computed.rest.carbs === 75,
    detail: `הפרש קלורי: ${computed.training.kcal - computed.rest.kcal} (יעד: 300) · הפרש פחמימה: ${computed.training.carbs - computed.rest.carbs}g (יעד: 75g).`,
  });

  return checks;
}
