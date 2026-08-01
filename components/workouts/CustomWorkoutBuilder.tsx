'use client';

// Sprint 28 — the custom workout builder, following the exact
// search+category-tabs / pick+quantity / running-list pattern already
// established by PlateComposerSheetBody for composing a plate from
// INGREDIENT_DB. Same shape here: pick an exercise from EXERCISE_DB (114
// entries, lib/data/exercises.ts), set its target sets/reps, add it to the
// routine being built, repeat, then save. Saved exercises are copied as
// plain { name, sets, reps, rest } — not a reference to the DB entry — so a
// saved workout stays valid even if the reference database changes later,
// and renders directly through the existing ExerciseRow with no adapter.

import { useMemo, useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { EXERCISE_DB, MUSCLE_GROUPS, type ExerciseDbEntry } from '@/lib/data/exercises';
import { genUuid } from '@/lib/domain/util';
import { Stepper } from '@/components/ui/Stepper';
import type { CustomWorkout, CustomWorkoutExercise } from '@/lib/domain/workouts';

export interface CustomWorkoutBuilderProps {
  existing?: CustomWorkout | null;
  onSave: (workout: CustomWorkout) => void;
  onClose: () => void;
}

export function CustomWorkoutBuilder({ existing, onSave, onClose }: CustomWorkoutBuilderProps) {
  const T = useTheme();
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0].key);
  const [selectedId, setSelectedId] = useState(EXERCISE_DB[0].id);
  const [sets, setSets] = useState(EXERCISE_DB[0].defaultSets);
  const [reps, setReps] = useState(EXERCISE_DB[0].defaultReps);
  const [name, setName] = useState(existing?.name ?? '');
  const [exercises, setExercises] = useState<CustomWorkoutExercise[]>(existing?.exercises ?? []);

  const filtered = useMemo(() => {
    if (search.trim()) return EXERCISE_DB.filter((e) => e.name.includes(search.trim()));
    return EXERCISE_DB.filter((e) => e.muscleGroup === muscleGroup);
  }, [search, muscleGroup]);

  const selected: ExerciseDbEntry = EXERCISE_DB.find((e) => e.id === selectedId) || filtered[0] || EXERCISE_DB[0];

  const pickExercise = (ex: ExerciseDbEntry) => {
    setSelectedId(ex.id);
    setSets(ex.defaultSets);
    setReps(ex.defaultReps);
  };

  const addExercise = () => {
    setExercises((cur) => [...cur, { name: selected.name, sets, reps, rest: selected.defaultRest }]);
  };

  const removeExercise = (idx: number) => setExercises((cur) => cur.filter((_, i) => i !== idx));

  const canSave = name.trim().length > 0 && exercises.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ id: existing?.id ?? genUuid(), name: name.trim(), exercises });
    onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="שם האימון (למשל: יום דחיפה שלי)"
        className="w-full py-2.5 px-3 rounded-xl text-sm outline-none"
        style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
      />

      <div className="relative">
        <Search size={15} color={T.t.textDim} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חפשו תרגיל..."
          className="w-full py-2.5 pr-9 pl-3 rounded-xl text-sm outline-none"
          style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
        />
      </div>

      {!search.trim() && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MUSCLE_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setMuscleGroup(g.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: muscleGroup === g.key ? T.accent : T.t.chipBg,
                color: muscleGroup === g.key ? '#07080B' : T.t.textSecondary,
                border: `1px solid ${muscleGroup === g.key ? T.accent : T.t.border}`,
              }}
            >
              {g.emoji} {g.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto rounded-xl" style={{ border: `1px solid ${T.t.border}` }}>
        {filtered.slice(0, 60).map((ex) => (
          <button
            key={ex.id}
            onClick={() => pickExercise(ex)}
            className="text-right px-3 py-2 text-sm"
            style={{
              background: selectedId === ex.id ? `${T.accent}18` : 'transparent',
              color: selectedId === ex.id ? T.accent : T.t.textPrimary,
              borderBottom: `1px solid ${T.t.border}`,
            }}
          >
            {ex.name}
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-center py-4" style={{ color: T.t.textDim }}>לא נמצאו תרגילים.</p>}
      </div>

      <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: T.t.chipBg }}>
        <span className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>{selected.name}</span>
        <div className="grid grid-cols-2 gap-2">
          <Stepper label="סטים" value={sets} onChange={setSets} step={1} min={1} max={10} />
          <div>
            <label
              className="text-xs font-semibold block mb-2"
              style={{ color: T.t.textDim, fontFamily: FONT_MONO, textTransform: 'uppercase', fontSize: '10.5px' }}
            >
              חזרות
            </label>
            <input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full text-center rounded-2xl outline-none"
              style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary, fontFamily: FONT_MONO, fontWeight: 700, padding: '13px 2px' }}
            />
          </div>
        </div>
        <button onClick={addExercise} className="py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5" style={{ background: T.accent, color: '#07080B' }}>
          <Plus size={14} /> הוסף לאימון
        </button>
      </div>

      {exercises.length > 0 && (
        <div className="flex flex-col gap-2 pt-2" style={{ borderTop: `1px solid ${T.t.border}` }}>
          <p className="text-xs font-semibold" style={{ color: T.t.textSecondary }}>התרגילים באימון ({exercises.length})</p>
          {exercises.map((ex, i) => (
            <div key={`${ex.name}-${i}`} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: T.t.chipBg }}>
              <span className="text-sm" style={{ color: T.t.textPrimary }}>{ex.name} · {ex.sets}×{ex.reps}</span>
              <button onClick={() => removeExercise(i)} style={{ color: T.t.textDim }} aria-label="הסר תרגיל"><Trash2 size={14} /></button>
            </div>
          ))}
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="py-3 rounded-xl text-sm font-bold"
            style={{ background: T.macro.protein, color: '#07080B', opacity: canSave ? 1 : 0.5 }}
          >
            שמירת האימון
          </button>
        </div>
      )}
    </div>
  );
}
