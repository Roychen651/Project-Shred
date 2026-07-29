import { describe, it, expect } from 'vitest';
import { generateAiReport, MENTAL_TIPS } from '@/lib/domain/aiCoach';

describe('generateAiReport', () => {
  const now = new Date(2026, 6, 26, 12, 0);

  it('protein gap > 25g: tactical advice targets protein, score computed exactly', () => {
    const report = generateAiReport(
      { consumed: { kcal: 1800, protein: 100 }, targets: { kcal: 2330, protein: 168 }, dayMode: 'training' },
      { now, random: () => 0 }
    );
    // proteinScore = min(100/168,1)*100 = 59.5238; kcalScore = 100 - |1800-2330|/2330*100 = 77.2532
    // score = round(59.5238*0.6 + 77.2532*0.4) = round(35.714 + 30.901) = round(66.616) = 67
    expect(report.score).toBe(67);
    expect(report.tactical).toBe(
      'אתם בפיגור של כ-68 גרם חלבון מהיעד. שקלו טוסט חלבון או מעדן חלבון + פסטרמה בארוחה הקרובה כדי לסגור את הפער.'
    );
    expect(report.mental).toBe(MENTAL_TIPS.training[0]);
    expect(report.generatedAt).toBe(now.toISOString());
  });

  it('kcal gap < -150 (overshot): tactical advice does not suggest a hard restriction', () => {
    const report = generateAiReport(
      { consumed: { kcal: 2600, protein: 160 }, targets: { kcal: 2330, protein: 168 }, dayMode: 'rest' },
      { now, random: () => 0 }
    );
    expect(report.tactical).toBe(
      'חרגתם בכ-270 קלוריות מהיעד היומי. אין צורך "לתקן" בהגבלה קיצונית — פשוט העדיפו ארוחה קלה יותר מבוססת חלבון וירקות בהמשך היום.'
    );
    expect(report.score).toBe(93);
  });

  it('kcal gap > 400 (lots of room left): tactical advice suggests fueling, not skipping', () => {
    const report = generateAiReport(
      { consumed: { kcal: 1800, protein: 160 }, targets: { kcal: 2330, protein: 168 }, dayMode: 'training' },
      { now, random: () => 0 }
    );
    expect(report.tactical).toBe(
      'נשארו לכם כ-530 קלוריות פנויות היום — זה מקום טוב להוסיף תוספת פחמימה איכותית סביב האימון, לא לדלג על ארוחה.'
    );
    expect(report.score).toBe(88);
  });

  it('balanced day: the neutral message', () => {
    const report = generateAiReport(
      { consumed: { kcal: 2300, protein: 165 }, targets: { kcal: 2330, protein: 168 }, dayMode: 'rest' },
      { now, random: () => 0 }
    );
    expect(report.tactical).toBe('היחס בין הקלוריות לחלבון מאוזן היטב היום. המשיכו באותה רמת דיוק עד סוף היום.');
    expect(report.score).toBe(98);
  });

  it('picks the mental tip pool by dayMode and the injected random selects the index', () => {
    const reportTraining = generateAiReport(
      { consumed: { kcal: 2330, protein: 168 }, targets: { kcal: 2330, protein: 168 }, dayMode: 'training' },
      { now, random: () => 0.999 }
    );
    expect(reportTraining.mental).toBe(MENTAL_TIPS.training[2]); // floor(0.999*3) = 2

    const reportRest = generateAiReport(
      { consumed: { kcal: 2330, protein: 168 }, targets: { kcal: 2330, protein: 168 }, dayMode: 'rest' },
      { now, random: () => 0.5 }
    );
    expect(reportRest.mental).toBe(MENTAL_TIPS.rest[1]); // floor(0.5*3) = 1
  });

  it('score is clamped to [0, 100]', () => {
    const report = generateAiReport(
      { consumed: { kcal: 0, protein: 0 }, targets: { kcal: 2330, protein: 168 }, dayMode: 'rest' },
      { now, random: () => 0 }
    );
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });
});
