// Metabolic adaptation heuristic. Sprint 10.
//
// WHAT THIS IS, HONESTLY: a deterministic, explainable, rule-based check —
// not a clinical or ML model — matching the exact "Zero-Key AI Coach"
// philosophy already documented in CLAUDE.md for lib/domain/aiCoach.ts. The
// real phenomenon it responds to is real (as body weight drops, BMR drops
// with it — see targets.ts's Mifflin-St Jeor chain — so a FIXED calorie
// target that was a correct deficit at the start of a cut can quietly
// shrink to "roughly maintenance" weeks later with no change in behavior;
// that's what "metabolic adaptation" means here, not a special metabolic
// diagnosis). The thresholds below are reasonable, stated coaching heuristics
// (a body basically not moving for two-plus weeks on a cut goal), not
// clinically validated cutoffs — presented to the user as a suggestion to
// consider, never as an automatic target change.
//
// A 'maintain' goal is deliberately exempt: a flat trend IS the goal there,
// not a problem to flag.
import { dateKey } from './dates';
import type { GoalKey } from './targets';
import type { MetricEntry } from './analytics';

export type AdaptationStatus = 'insufficient_data' | 'on_track' | 'plateau_cut' | 'plateau_bulk';

export interface AdaptationInsight {
  status: AdaptationStatus;
  message: string;
  /** Average weight change per week over the analyzed window, in kg. 0 when insufficient_data. */
  weeklyDeltaKg: number;
  /** Suggested change to the daily calorie target: negative = reduce, positive = increase, 0 = none. */
  suggestedKcalAdjustment: number;
}

const WINDOW_DAYS = 21; // "2-3 weeks", per the mandate
const MIN_SPAN_DAYS = 10; // a trend over less than this is too noisy to act on

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(aKey: string, bKey: string): number {
  const ms = parseDateKey(bKey).getTime() - parseDateKey(aKey).getTime();
  return Math.round(ms / 86_400_000);
}

export function analyzeMetabolicAdaptation(
  metricEntries: MetricEntry[],
  goal: GoalKey,
  today: Date = new Date()
): AdaptationInsight | null {
  if (goal === 'maintain') return null;

  const withWeight = metricEntries
    .filter((e): e is MetricEntry & { weight: number } => e.weight !== undefined)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const cutoffKey = dateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - WINDOW_DAYS));
  const windowEntries = withWeight.filter((e) => e.date >= cutoffKey);

  if (windowEntries.length < 2) {
    return {
      status: 'insufficient_data',
      message: 'עדיין אין מספיק מדידות משקל בשבועות האחרונים לניתוח מגמה — הוסיפו לפחות שתי מדידות במרווח של כ-10 ימים.',
      weeklyDeltaKg: 0,
      suggestedKcalAdjustment: 0,
    };
  }

  const first = windowEntries[0];
  const last = windowEntries[windowEntries.length - 1];
  const spanDays = daysBetween(first.date, last.date);

  if (spanDays < MIN_SPAN_DAYS) {
    return {
      status: 'insufficient_data',
      message: 'המדידות שקיימות קרובות מדי זו לזו בזמן — צריך פריסה של כ-10 ימים לפחות כדי לזהות מגמה אמיתית.',
      weeklyDeltaKg: 0,
      suggestedKcalAdjustment: 0,
    };
  }

  const totalDeltaKg = last.weight - first.weight;
  const weeklyDeltaKg = Math.round((totalDeltaKg / (spanDays / 7)) * 100) / 100;

  if (goal === 'aggressive' || goal === 'moderate') {
    const stallThreshold = goal === 'aggressive' ? -0.2 : -0.1;
    if (weeklyDeltaKg > stallThreshold) {
      const adjustment = goal === 'aggressive' ? -150 : -100;
      return {
        status: 'plateau_cut',
        message: `המשקל כמעט לא זז ב-${spanDays} הימים האחרונים (${weeklyDeltaKg >= 0 ? '+' : ''}${weeklyDeltaKg} ק"ג/שבוע) למרות יעד ${goal === 'aggressive' ? 'חיטוב עצבני' : 'חיטוב מתון'}. סימן אפשרי להסתגלות מטבולית — הגוף מוציא פחות אנרגיה ממה שהוצאתם בהתחלה. שקלו להוריד את היעד הקלורי בכ-${Math.abs(adjustment)} קל׳.`,
        weeklyDeltaKg,
        suggestedKcalAdjustment: adjustment,
      };
    }
    return {
      status: 'on_track',
      message: `המגמה תואמת את היעד — ${weeklyDeltaKg} ק"ג/שבוע בממוצע על פני ${spanDays} ימים.`,
      weeklyDeltaKg,
      suggestedKcalAdjustment: 0,
    };
  }

  // goal === 'bulk'
  const gainThreshold = 0.1;
  if (weeklyDeltaKg < gainThreshold) {
    return {
      status: 'plateau_bulk',
      message: `המשקל לא עולה כמצופה ב-${spanDays} הימים האחרונים (${weeklyDeltaKg >= 0 ? '+' : ''}${weeklyDeltaKg} ק"ג/שבוע) למרות יעד מסה. שקלו להעלות את היעד הקלורי בכ-150 קל׳.`,
      weeklyDeltaKg,
      suggestedKcalAdjustment: 150,
    };
  }
  return {
    status: 'on_track',
    message: `המגמה תואמת את היעד — ${weeklyDeltaKg} ק"ג/שבוע בממוצע על פני ${spanDays} ימים.`,
    weeklyDeltaKg,
    suggestedKcalAdjustment: 0,
  };
}
