// Rule-based "AI Coach" report. ProjectShred.artifact.jsx:1203-1247 (Sprint 9).
//
// Deterministic and explainable — not a real LLM call. The spec asked for a
// "zero-key" engine that works offline; wiring a browser-side fetch to an
// LLM provider with a user-pasted key would mean exposing that key to whatever
// endpoint the user configured. This file is the honest, working alternative.

import type { MacroTotals } from './items';
import type { DayTargets } from './targets';

export const MENTAL_TIPS = {
  training: [
    'שינה של 7-8 שעות הלילה חשובה יותר מהסט האחרון באימון — תעדפו אותה.',
    'התאוששות היא חלק מהאימון, לא הפסקה ממנו. תנו לגוף את הזמן שהוא צריך.',
    'עקביות מנצחת עצימות חד-פעמית — היום היה עוד לבנה בקיר, לא הכל או כלום.',
  ],
  rest: [
    'יום מנוחה הוא לא יום "לא עשיתי כלום" — זה היום שבו הגוף בונה את מה שפירקתם אתמול.',
    'תזוזה קלה (הליכה, מתיחות) ביום מנוחה יכולה להוריד עייפות טובה יותר מישיבה מוחלטת.',
    'המשמעת שאתם בונים היום ביום מנוחה היא בדיוק מה שתומך ביום האימון הבא.',
  ],
} as const;

export type DayMode = 'training' | 'rest';

export interface AiReportInput {
  consumed: Pick<MacroTotals, 'kcal' | 'protein'>;
  targets: Pick<DayTargets, 'kcal' | 'protein'>;
  dayMode: DayMode;
}

export interface AiReport {
  score: number;
  tactical: string;
  mental: string;
  generatedAt: string;
}

// `now`/`random` are injectable — see the note in dates.ts. Production callers
// omit both and get identical behavior (real clock, Math.random()).
export function generateAiReport(
  { consumed, targets, dayMode }: AiReportInput,
  { now = new Date(), random = Math.random }: { now?: Date; random?: () => number } = {}
): AiReport {
  const proteinPct = targets.protein > 0 ? consumed.protein / targets.protein : 0;
  const kcalDelta = targets.kcal > 0 ? Math.abs(consumed.kcal - targets.kcal) / targets.kcal : 0;
  const proteinScore = Math.min(proteinPct, 1) * 100;
  const kcalScore = Math.max(0, 100 - kcalDelta * 100);
  const score = Math.round(proteinScore * 0.6 + kcalScore * 0.4);

  const proteinGap = Math.round(targets.protein - consumed.protein);
  const kcalGap = Math.round(targets.kcal - consumed.kcal);

  let tactical: string;
  if (proteinGap > 25) {
    tactical = `אתם בפיגור של כ-${proteinGap} גרם חלבון מהיעד. שקלו טוסט חלבון או מעדן חלבון + פסטרמה בארוחה הקרובה כדי לסגור את הפער.`;
  } else if (kcalGap < -150) {
    tactical = `חרגתם בכ-${Math.abs(kcalGap)} קלוריות מהיעד היומי. אין צורך "לתקן" בהגבלה קיצונית — פשוט העדיפו ארוחה קלה יותר מבוססת חלבון וירקות בהמשך היום.`;
  } else if (kcalGap > 400) {
    tactical = `נשארו לכם כ-${kcalGap} קלוריות פנויות היום — זה מקום טוב להוסיף תוספת פחמימה איכותית סביב האימון, לא לדלג על ארוחה.`;
  } else {
    tactical = 'היחס בין הקלוריות לחלבון מאוזן היטב היום. המשיכו באותה רמת דיוק עד סוף היום.';
  }

  const pool = MENTAL_TIPS[dayMode] || MENTAL_TIPS.rest;
  const mental = pool[Math.floor(random() * pool.length)];

  return {
    score: Math.max(0, Math.min(100, score)),
    tactical,
    mental,
    generatedAt: now.toISOString(),
  };
}
