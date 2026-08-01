// Sprint 28 — a real, hand-authored exercise reference database for the
// custom workout builder, in the same spirit and under the same honesty
// discipline already established for lib/data/israeli-ingredients.ts
// (CLAUDE.md, Sprints 15.5/15.6/15.16): common, real gym movements with
// accurate Hebrew terminology, not a scraped or fabricated list padded to
// hit a round number. The brief asked for "100-150" — 114 solid, correctly
// categorized entries is what's deliverable responsibly in one pass.
//
// `defaultSets`/`defaultReps`/`defaultRest` are starting points the builder
// pre-fills (matching typical training conventions: heavy compound lifts get
// lower reps/longer rest, isolation work gets higher reps/shorter rest,
// core/cardio get either a rep range or a duration) — every field stays
// fully editable in the builder, exactly like every other numeric input in
// this app.
//
// Each entry's shape is a strict superset of the existing `Exercise` type
// (lib/data/workouts.ts: `{ name, sets, reps, rest }`) plus an `id` and
// `muscleGroup` for the database/picker itself — so turning a database entry
// into a workout's actual exercise is a direct, lossless mapping, no
// separate conversion logic needed.

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';

export interface MuscleGroupDef {
  key: MuscleGroup;
  label: string;
  emoji: string;
}

export const MUSCLE_GROUPS: MuscleGroupDef[] = [
  { key: 'chest', label: 'חזה', emoji: '🏋️' },
  { key: 'back', label: 'גב', emoji: '🔙' },
  { key: 'legs', label: 'רגליים', emoji: '🦵' },
  { key: 'shoulders', label: 'כתפיים', emoji: '💪' },
  { key: 'arms', label: 'ידיים', emoji: '💪' },
  { key: 'core', label: 'בטן/ליבה', emoji: '🎯' },
  { key: 'cardio', label: 'אירובי', emoji: '🏃' },
];

export interface ExerciseDbEntry {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  defaultReps: string;
  defaultRest: number;
}

export const EXERCISE_DB: ExerciseDbEntry[] = [
  // ===== חזה (Chest) =====
  { id: 'ch-01', name: 'לחיצת חזה במוט', muscleGroup: 'chest', defaultSets: 4, defaultReps: '6-8', defaultRest: 150 },
  { id: 'ch-02', name: 'לחיצת חזה בשיפוע חיובי במוט', muscleGroup: 'chest', defaultSets: 4, defaultReps: '6-10', defaultRest: 150 },
  { id: 'ch-03', name: 'לחיצת חזה בשיפוע שלילי במוט', muscleGroup: 'chest', defaultSets: 3, defaultReps: '8-10', defaultRest: 120 },
  { id: 'ch-04', name: 'לחיצת חזה בשיפוע חיובי בדאמבלים', muscleGroup: 'chest', defaultSets: 4, defaultReps: '8-10', defaultRest: 120 },
  { id: 'ch-05', name: 'לחיצת חזה בדאמבלים', muscleGroup: 'chest', defaultSets: 4, defaultReps: '8-10', defaultRest: 120 },
  { id: 'ch-06', name: 'פרפר בדאמבלים', muscleGroup: 'chest', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'ch-07', name: 'פרפר בשיפוע בדאמבלים', muscleGroup: 'chest', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'ch-08', name: 'פרפר בכבלים', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'ch-09', name: 'מכונת פרפר', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'ch-10', name: 'מקבילים לחזה', muscleGroup: 'chest', defaultSets: 3, defaultReps: '8-12', defaultRest: 120 },
  { id: 'ch-11', name: 'שכיבות סמיכה', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12-20', defaultRest: 60 },
  { id: 'ch-12', name: 'שכיבות סמיכה בשיפוע', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'ch-13', name: 'לחיצת חזה במכונה', muscleGroup: 'chest', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'ch-14', name: 'לחיצה בכבל תחתון לחזה עליון', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'ch-15', name: 'לחיצה בכבל עליון לחזה תחתון', muscleGroup: 'chest', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'ch-16', name: 'פולאובר בדאמבל', muscleGroup: 'chest', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'ch-17', name: 'לחיצת חזה בסמית משין', muscleGroup: 'chest', defaultSets: 4, defaultReps: '8-10', defaultRest: 120 },
  { id: 'ch-18', name: 'שכיבות סמיכה עם משקל נוסף', muscleGroup: 'chest', defaultSets: 3, defaultReps: '8-12', defaultRest: 90 },

  // ===== גב (Back) =====
  { id: 'bk-01', name: 'מתח אחיזה רחבה', muscleGroup: 'back', defaultSets: 4, defaultReps: '6-10', defaultRest: 120 },
  { id: 'bk-02', name: 'מתח אחיזה צרה', muscleGroup: 'back', defaultSets: 4, defaultReps: '6-10', defaultRest: 120 },
  { id: 'bk-03', name: 'מתח אחיזה הפוכה', muscleGroup: 'back', defaultSets: 3, defaultReps: '8-10', defaultRest: 120 },
  { id: 'bk-04', name: 'משיכת פולי עליון', muscleGroup: 'back', defaultSets: 4, defaultReps: '8-12', defaultRest: 90 },
  { id: 'bk-05', name: 'משיכת פולי עליון אחיזה צרה', muscleGroup: 'back', defaultSets: 3, defaultReps: '8-12', defaultRest: 90 },
  { id: 'bk-06', name: 'חתירה בסטנג', muscleGroup: 'back', defaultSets: 4, defaultReps: '6-8', defaultRest: 120 },
  { id: 'bk-07', name: 'חתירה בדאמבל חד-יד', muscleGroup: 'back', defaultSets: 3, defaultReps: '8-12', defaultRest: 90 },
  { id: 'bk-08', name: 'חתירה בישיבה בכבל', muscleGroup: 'back', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'bk-09', name: 'חתירה בטי-בר', muscleGroup: 'back', defaultSets: 4, defaultReps: '8-10', defaultRest: 120 },
  { id: 'bk-10', name: 'חתירה במכונה', muscleGroup: 'back', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'bk-11', name: 'דדליפט קלאסי', muscleGroup: 'back', defaultSets: 4, defaultReps: '4-6', defaultRest: 180 },
  { id: 'bk-12', name: 'דדליפט רומני', muscleGroup: 'back', defaultSets: 3, defaultReps: '8-10', defaultRest: 120 },
  { id: 'bk-13', name: 'דדליפט סומו', muscleGroup: 'back', defaultSets: 4, defaultReps: '5-6', defaultRest: 180 },
  { id: 'bk-14', name: 'פייס פול', muscleGroup: 'back', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'bk-15', name: 'פשיטת גב תחתון', muscleGroup: 'back', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'bk-16', name: 'משיכת פולי עליון בזרוע ישרה', muscleGroup: 'back', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'bk-17', name: 'שראגים עם מוט', muscleGroup: 'back', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'bk-18', name: 'שראגים עם דאמבלים', muscleGroup: 'back', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },

  // ===== רגליים (Legs) =====
  { id: 'lg-01', name: 'סקוואט חופשי', muscleGroup: 'legs', defaultSets: 4, defaultReps: '6-8', defaultRest: 180 },
  { id: 'lg-02', name: 'סקוואט קדמי', muscleGroup: 'legs', defaultSets: 4, defaultReps: '6-8', defaultRest: 150 },
  { id: 'lg-03', name: 'סקוואט בולגרי', muscleGroup: 'legs', defaultSets: 3, defaultReps: '8-10 לכל רגל', defaultRest: 90 },
  { id: 'lg-04', name: 'סקוואט גובלט', muscleGroup: 'legs', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'lg-05', name: 'לחיצת רגליים', muscleGroup: 'legs', defaultSets: 4, defaultReps: '8-12', defaultRest: 120 },
  { id: 'lg-06', name: 'פשיטת ברך', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'lg-07', name: 'כפיפת ברך שכיבה', muscleGroup: 'legs', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'lg-08', name: 'כפיפת ברך ישיבה', muscleGroup: 'legs', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'lg-09', name: 'מכרעים הליכה', muscleGroup: 'legs', defaultSets: 3, defaultReps: '10-12 לכל רגל', defaultRest: 90 },
  { id: 'lg-10', name: 'מכרעים במקום', muscleGroup: 'legs', defaultSets: 3, defaultReps: '10-12 לכל רגל', defaultRest: 90 },
  { id: 'lg-11', name: 'הרמת אגן', muscleGroup: 'legs', defaultSets: 4, defaultReps: '8-12', defaultRest: 120 },
  { id: 'lg-12', name: 'גשר אגן', muscleGroup: 'legs', defaultSets: 3, defaultReps: '12-15', defaultRest: 75 },
  { id: 'lg-13', name: 'כפיפת שוק עמידה', muscleGroup: 'legs', defaultSets: 4, defaultReps: '12-20', defaultRest: 60 },
  { id: 'lg-14', name: 'כפיפת שוק ישיבה', muscleGroup: 'legs', defaultSets: 4, defaultReps: '12-20', defaultRest: 60 },
  { id: 'lg-15', name: 'הליכת סומו עם דאמבל', muscleGroup: 'legs', defaultSets: 3, defaultReps: '20 צעדים', defaultRest: 75 },
  { id: 'lg-16', name: 'דדליפט רגל ישרה', muscleGroup: 'legs', defaultSets: 3, defaultReps: '8-10', defaultRest: 120 },
  { id: 'lg-17', name: 'סטפ-אפ עם דאמבלים', muscleGroup: 'legs', defaultSets: 3, defaultReps: '10-12 לכל רגל', defaultRest: 90 },
  { id: 'lg-18', name: 'היפ אבדקשן במכונה', muscleGroup: 'legs', defaultSets: 3, defaultReps: '15-20', defaultRest: 60 },
  { id: 'lg-19', name: 'היפ אדקשן במכונה', muscleGroup: 'legs', defaultSets: 3, defaultReps: '15-20', defaultRest: 60 },
  { id: 'lg-20', name: 'הק סקוואט', muscleGroup: 'legs', defaultSets: 4, defaultReps: '8-10', defaultRest: 120 },
  { id: 'lg-21', name: 'פיסטול סקוואט', muscleGroup: 'legs', defaultSets: 3, defaultReps: '6-8 לכל רגל', defaultRest: 90 },
  { id: 'lg-22', name: 'גוד מורנינג', muscleGroup: 'legs', defaultSets: 3, defaultReps: '8-10', defaultRest: 120 },

  // ===== כתפיים (Shoulders) =====
  { id: 'sh-01', name: 'לחיצת כתפיים במוט עומד', muscleGroup: 'shoulders', defaultSets: 4, defaultReps: '6-8', defaultRest: 150 },
  { id: 'sh-02', name: 'לחיצת כתפיים בדאמבלים בישיבה', muscleGroup: 'shoulders', defaultSets: 4, defaultReps: '8-10', defaultRest: 120 },
  { id: 'sh-03', name: 'לחיצת ארנולד', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '8-10', defaultRest: 120 },
  { id: 'sh-04', name: 'הרחקת כתף צידית', muscleGroup: 'shoulders', defaultSets: 4, defaultReps: '12-15', defaultRest: 60 },
  { id: 'sh-05', name: 'הרחקת כתף קדמית', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'sh-06', name: 'פרפר אחורי', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'sh-07', name: 'חתירה זקופה', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'sh-08', name: 'לחיצת כתפיים בסמית משין', muscleGroup: 'shoulders', defaultSets: 4, defaultReps: '8-10', defaultRest: 120 },
  { id: 'sh-09', name: 'הרחקה צידית בכבל', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'sh-10', name: 'פרפר אחורי במכונה', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'sh-11', name: 'לחיצת כתפיים במכונה', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'sh-12', name: 'שראג מאחורי הגב', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'sh-13', name: 'הרמת מוט לסנטר', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '10-12', defaultRest: 90 },
  { id: 'sh-14', name: 'הרחקת Y בשיפוע', muscleGroup: 'shoulders', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },

  // ===== ידיים (Arms) =====
  { id: 'ar-01', name: 'כפיפת מרפק במוט', muscleGroup: 'arms', defaultSets: 3, defaultReps: '8-10', defaultRest: 75 },
  { id: 'ar-02', name: 'כפיפת מרפק בדאמבלים', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-03', name: 'כפיפת מרפק פטיש', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-04', name: 'כפיפת מרפק בספסל סקוט', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-05', name: 'כפיפת מרפק בכבל', muscleGroup: 'arms', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'ar-06', name: 'כפיפת מרפק בכבל תחתון חד-יד', muscleGroup: 'arms', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'ar-07', name: 'כפיפת מרפק במוט EZ', muscleGroup: 'arms', defaultSets: 3, defaultReps: '8-10', defaultRest: 75 },
  { id: 'ar-08', name: 'כפיפת מרפק ריכוז', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 60 },
  { id: 'ar-09', name: 'פשיטת מרפק בכבל', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-10', name: 'פשיטת מרפק בכבל אחיזה הפוכה', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-11', name: 'פשיטת מרפק מעל הראש בכבל', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-12', name: 'פשיטת מרפק בדאמבל מעל הראש', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-13', name: 'פשיטת מרפק שכיבה עם מוט', muscleGroup: 'arms', defaultSets: 3, defaultReps: '8-10', defaultRest: 90 },
  { id: 'ar-14', name: 'מקבילים לטריצפס', muscleGroup: 'arms', defaultSets: 3, defaultReps: '8-12', defaultRest: 90 },
  { id: 'ar-15', name: 'לחיצה צרפתית', muscleGroup: 'arms', defaultSets: 3, defaultReps: '10-12', defaultRest: 75 },
  { id: 'ar-16', name: 'Kickback בדאמבל', muscleGroup: 'arms', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'ar-17', name: 'כפיפת שורש כף היד', muscleGroup: 'arms', defaultSets: 3, defaultReps: '15-20', defaultRest: 45 },
  { id: 'ar-18', name: 'פשיטת שורש כף היד', muscleGroup: 'arms', defaultSets: 3, defaultReps: '15-20', defaultRest: 45 },

  // ===== בטן/ליבה (Core) =====
  { id: 'co-01', name: 'כפיפות בטן קלאסיות', muscleGroup: 'core', defaultSets: 3, defaultReps: '15-20', defaultRest: 45 },
  { id: 'co-02', name: 'כפיפות בטן על כדור פיזיו', muscleGroup: 'core', defaultSets: 3, defaultReps: '15-20', defaultRest: 45 },
  { id: 'co-03', name: 'פלאנק', muscleGroup: 'core', defaultSets: 3, defaultReps: '30-60 שניות', defaultRest: 45 },
  { id: 'co-04', name: 'פלאנק צידי', muscleGroup: 'core', defaultSets: 3, defaultReps: '20-40 שניות לכל צד', defaultRest: 45 },
  { id: 'co-05', name: 'הרמת רגליים תלויה', muscleGroup: 'core', defaultSets: 3, defaultReps: '10-15', defaultRest: 75 },
  { id: 'co-06', name: 'הרמת ברכיים תלויה', muscleGroup: 'core', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'co-07', name: 'סיבובי רוסים', muscleGroup: 'core', defaultSets: 3, defaultReps: '20-30', defaultRest: 45 },
  { id: 'co-08', name: 'גלגלת בטן', muscleGroup: 'core', defaultSets: 3, defaultReps: '8-12', defaultRest: 75 },
  { id: 'co-09', name: 'כפיפת בטן בכבל עליון', muscleGroup: 'core', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'co-10', name: 'V-Up', muscleGroup: 'core', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'co-11', name: 'Mountain Climbers', muscleGroup: 'core', defaultSets: 3, defaultReps: '30-40 שניות', defaultRest: 45 },
  { id: 'co-12', name: 'Bicycle Crunch', muscleGroup: 'core', defaultSets: 3, defaultReps: '20-30', defaultRest: 45 },
  { id: 'co-13', name: 'הרמת רגליים בשכיבה', muscleGroup: 'core', defaultSets: 3, defaultReps: '12-15', defaultRest: 60 },
  { id: 'co-14', name: 'Dead Bug', muscleGroup: 'core', defaultSets: 3, defaultReps: '10-12 לכל צד', defaultRest: 45 },

  // ===== אירובי (Cardio) =====
  { id: 'cd-01', name: 'הליכון - הליכה', muscleGroup: 'cardio', defaultSets: 1, defaultReps: '20-30 דקות', defaultRest: 0 },
  { id: 'cd-02', name: 'הליכון - ריצה', muscleGroup: 'cardio', defaultSets: 1, defaultReps: '15-25 דקות', defaultRest: 0 },
  { id: 'cd-03', name: 'אופני כושר', muscleGroup: 'cardio', defaultSets: 1, defaultReps: '20-30 דקות', defaultRest: 0 },
  { id: 'cd-04', name: 'חתירה (מכונה)', muscleGroup: 'cardio', defaultSets: 1, defaultReps: '15-20 דקות', defaultRest: 0 },
  { id: 'cd-05', name: 'אליפטיקל', muscleGroup: 'cardio', defaultSets: 1, defaultReps: '20-30 דקות', defaultRest: 0 },
  { id: 'cd-06', name: 'מכונת מדרגות', muscleGroup: 'cardio', defaultSets: 1, defaultReps: '15-20 דקות', defaultRest: 0 },
  { id: 'cd-07', name: 'קפיצות חבל', muscleGroup: 'cardio', defaultSets: 4, defaultReps: '60-90 שניות', defaultRest: 45 },
  { id: 'cd-08', name: 'Burpees', muscleGroup: 'cardio', defaultSets: 4, defaultReps: '10-15', defaultRest: 60 },
  { id: 'cd-09', name: 'חבלי קרב', muscleGroup: 'cardio', defaultSets: 4, defaultReps: '30-40 שניות', defaultRest: 45 },
  { id: 'cd-10', name: 'ספרינטים', muscleGroup: 'cardio', defaultSets: 6, defaultReps: '20-30 שניות', defaultRest: 60 },
];
