// Mifflin–St Jeor BMR/TDEE engine. ProjectShred.artifact.jsx:1006-1117.
//
// THE MATH IS SACRED — this file must never diverge from the artifact's formulas.
// See __tests__/domain/targets.test.ts for hand-verified golden values pinned
// against both of the artifact's seeded profiles.

export type ActivityKey = 'sedentary' | 'office' | 'veryActive';
export type GoalKey = 'aggressive' | 'moderate' | 'maintain' | 'bulk';

export const ACTIVITY_LEVELS: Record<ActivityKey, { label: string; mult: number }> = {
  sedentary: { label: 'יושבני', mult: 1.2 },
  office: { label: 'משרד + הליכות / תזזיתי', mult: 1.55 },
  veryActive: { label: 'פעיל מאוד', mult: 1.75 },
};

export const GOALS: Record<GoalKey, { label: string; pct: number }> = {
  aggressive: { label: 'חיטוב עצבני', pct: -0.25 },
  moderate: { label: 'חיטוב מתון', pct: -0.15 },
  maintain: { label: 'שמירה', pct: 0 },
  bulk: { label: 'מסה', pct: 0.12 },
};

// Fields come from form inputs (often strings) or may be missing on a half-filled
// custom profile, so accept anything Number() can coerce — same leniency as the
// artifact's `Number(profile.weight) || 0`.
export interface ProfileInput {
  weight?: number | string | null;
  height?: number | string | null;
  age?: number | string | null;
  activity?: ActivityKey;
  goal?: GoalKey;
}

export interface DayTargets {
  label: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface ComputedTargets {
  bmr: number;
  tdee: number;
  rest: DayTargets;
  training: DayTargets;
}

export function computeProfileTargets(profile: ProfileInput): ComputedTargets {
  const w = Number(profile.weight) || 0;
  const h = Number(profile.height) || 0;
  const a = Number(profile.age) || 0;

  // BMR = 10*weight + 6.25*height - 5*age + 5. No sex/gender term — the artifact's
  // spec used this exact flat-constant form; see CLAUDE.md's Known Simplifications.
  const bmr = 10 * w + 6.25 * h - 5 * a + 5;
  const activityMult = (ACTIVITY_LEVELS[profile.activity as ActivityKey] || ACTIVITY_LEVELS.office).mult;
  const tdee = bmr * activityMult;
  const goalPct = (GOALS[profile.goal as GoalKey] || GOALS.maintain).pct;

  const restKcal = Math.max(Math.round(tdee * (1 + goalPct)), 0);
  const protein = Math.round(w * 2.0);
  const fat = Math.round(w * 0.7);
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const restCarbKcal = Math.max(restKcal - proteinKcal - fatKcal, 0);
  const restCarbs = Math.round(restCarbKcal / 4);

  // Training-day refeed: +300kcal, delivered entirely as carbs (+75g). This delta is
  // a fixed invariant, not derived — runIntegrityChecks() asserts it exactly.
  const trainingKcal = restKcal + 300;
  const trainingCarbs = restCarbs + 75;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    rest: { label: 'יום מנוחה', kcal: restKcal, protein, fat, carbs: restCarbs },
    training: { label: 'יום אימון', kcal: trainingKcal, protein, fat, carbs: trainingCarbs },
  };
}
