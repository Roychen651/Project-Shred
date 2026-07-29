// A/B Upper/Lower workout templates. ProjectShred.artifact.jsx:377-417 (Sprint 4).
// Transcribed verbatim. Colors are intentionally omitted here — Power (A1/B1) vs
// Volume (A2/B2) day coloring is a fixed UI concern (petrol/plum, per CLAUDE.md's
// Known Simplifications: "stay fixed across accent changes"), applied by the
// component layer, not stored as data.

export type WorkoutDayKey = 'A1' | 'B1' | 'A2' | 'B2';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: number; // seconds
}

export interface WorkoutDay {
  label: string;
  exercises: Exercise[];
}

export const WORKOUTS: Record<WorkoutDayKey, WorkoutDay> = {
  A1: {
    label: 'A1 · Power Upper',
    exercises: [
      { name: 'לחיצת חזה במוט', sets: 4, reps: '4', rest: 150 },
      { name: 'מתח משוקלל', sets: 4, reps: '5', rest: 150 },
      { name: 'לחיצת כתפיים במוט', sets: 3, reps: '6', rest: 120 },
      { name: 'חתירה בכפיפה', sets: 3, reps: '6', rest: 120 },
    ],
  },
  B1: {
    label: 'B1 · Power Lower',
    exercises: [
      { name: 'סקוואט גב', sets: 4, reps: '4', rest: 180 },
      { name: 'רומנית עם מוט', sets: 3, reps: '6', rest: 150 },
      { name: 'לחיצת רגליים', sets: 3, reps: '8', rest: 120 },
      { name: 'עליות שוק בעמידה', sets: 4, reps: '10', rest: 75 },
    ],
  },
  A2: {
    label: 'A2 · Volume Upper',
    exercises: [
      { name: 'לחיצת חזה שיפוע - משקולות', sets: 4, reps: '10', rest: 90 },
      { name: 'משיכת פולי עליון', sets: 4, reps: '10', rest: 90 },
      { name: 'הרחקת כתפיים בכבל', sets: 3, reps: '15', rest: 60 },
      { name: 'פייס פול', sets: 3, reps: '15', rest: 60 },
      { name: 'פשיטת מרפק בפולי', sets: 3, reps: '12', rest: 60 },
      { name: 'כפיפת מרפק משקולות', sets: 3, reps: '12', rest: 60 },
    ],
  },
  B2: {
    label: 'B2 · Volume Lower',
    exercises: [
      { name: 'סקוואט קדמי', sets: 3, reps: '10', rest: 120 },
      { name: 'כפיפת ברך שכיבה', sets: 4, reps: '12', rest: 75 },
      { name: 'מכרעים הליכה', sets: 3, reps: '12', rest: 75 },
      { name: 'פשיטת ברך במכונה', sets: 3, reps: '15', rest: 60 },
      { name: 'עליות שוק ישיבה', sets: 4, reps: '15', rest: 60 },
    ],
  },
};
