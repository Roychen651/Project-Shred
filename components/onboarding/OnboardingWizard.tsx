'use client';

// Sprint 10 — first-user onboarding wizard.
//
// Shown to a brand-new account instead of dropping them straight into a
// dashboard seeded with generic template defaults (28y/75kg/175cm/90cm,
// office activity, maintain goal — see DEFAULT_PROFILES in shred-store.ts
// and CLAUDE.md's Known Simplifications) with no idea those numbers aren't
// theirs. Three steps — Welcome, Metrics, Goals/Activity — writing straight
// into the SAME computeProfileTargets() pipeline every other profile edit
// already uses (via store.updateActiveProfile), so there's no separate
// "onboarding-only" calculation to keep in sync with the real one.
//
// Gating lives in app/page.tsx, computed directly during render as
// `hydrationSettled && !store.hasSeenOnboarding` — no local effect/state for
// "should I show this," which sidesteps the react-hooks/set-state-in-effect
// pattern this codebase has hit repeatedly (AddToHomeScreenPrompt,
// ExerciseRow, WorkoutPanel). Completing the wizard calls
// setHasSeenOnboarding(true), which naturally re-renders the gate to false.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO } from '@/lib/theme/tokens';
import { FieldInput } from '@/components/settings/FieldInput';
import { ACTIVITY_LEVELS, GOALS, computeProfileTargets, type ActivityKey, type GoalKey } from '@/lib/domain/targets';
import type { Profile } from '@/lib/store/shred-store';

export interface OnboardingWizardProps {
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  onComplete: () => void;
}

type Draft = { name: string; age: number; weight: number; height: number; waist: number; activity: ActivityKey; goal: GoalKey };

const STEP_TITLES = ['ברוכים הבאים', 'נתונים גופניים', 'מטרה ורמת פעילות'];

export function OnboardingWizard({ profile, updateProfile, onComplete }: OnboardingWizardProps) {
  const T = useTheme();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    name: profile.name,
    age: profile.age,
    weight: profile.weight,
    height: profile.height,
    waist: profile.waist,
    activity: profile.activity,
    goal: profile.goal,
  });

  const preview = computeProfileTargets(draft);
  const canAdvance = step === 0 || (draft.age > 0 && draft.weight > 0 && draft.height > 0);

  const finish = () => {
    updateProfile(draft);
    onComplete();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: T.t.overlayBg, backdropFilter: 'blur(10px)' }}
    >
      <div
        className="w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: 460,
          maxHeight: '90vh',
          background: T.mode === 'dark' ? `${T.t.modalBg}E8` : `${T.t.modalBg}F7`,
          border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${T.glow(T.accent, 24, '35')}`,
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      >
        {/* progress dots */}
        <div className="flex items-center justify-center gap-2 pt-6 pb-2">
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{ width: i === step ? 20 : 6, height: 6, background: i <= step ? T.accent : T.t.border }}
            />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              {step === 0 && (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div
                    className="flex items-center justify-center rounded-3xl"
                    style={{ width: 64, height: 64, background: `linear-gradient(135deg, ${T.accent}, ${T.macro.protein})`, boxShadow: T.glow(T.accent, 24, '40') }}
                  >
                    <Sparkles size={28} color="#07080B" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>ברוכים הבאים ל-PROJECT SHRED</h2>
                    <p className="text-sm mt-2" style={{ color: T.t.textSecondary }}>
                      כמה נתונים קצרים כדי לבנות עבורכם תוכנית קלורית ותזונתית מדויקת — לוקח פחות מדקה.
                    </p>
                  </div>
                  <div className="w-full mt-2">
                    <FieldInput label="איך לקרוא לכם?" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-col gap-4 py-2">
                  <h3 className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>נתונים גופניים</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldInput label="גיל" type="number" suffix="שנים" value={draft.age} onChange={(v) => setDraft((d) => ({ ...d, age: Number(v) || 0 }))} />
                    <FieldInput label="משקל" type="number" suffix="ק״ג" value={draft.weight} onChange={(v) => setDraft((d) => ({ ...d, weight: Number(v) || 0 }))} />
                    <FieldInput label="גובה" type="number" suffix="ס״מ" value={draft.height} onChange={(v) => setDraft((d) => ({ ...d, height: Number(v) || 0 }))} />
                    <FieldInput label="היקף מותן" type="number" suffix="ס״מ" value={draft.waist} onChange={(v) => setDraft((d) => ({ ...d, waist: Number(v) || 0 }))} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-4 py-2">
                  <div>
                    <h3 className="text-base font-bold mb-2" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>רמת פעילות</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {(Object.entries(ACTIVITY_LEVELS) as [ActivityKey, { label: string; mult: number }][]).map(([key, a]) => (
                        <button
                          key={key}
                          onClick={() => setDraft((d) => ({ ...d, activity: key }))}
                          className="flex items-center justify-between py-2.5 px-3.5 rounded-lg text-sm font-semibold text-right"
                          style={{
                            background: draft.activity === key ? T.accent : T.t.chipBg,
                            color: draft.activity === key ? '#07080B' : T.t.textSecondary,
                            border: `1px solid ${draft.activity === key ? T.accent : T.t.border}`,
                          }}
                        >
                          <span>{a.label}</span>
                          <span style={{ opacity: 0.7 }}>×{a.mult}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-bold mb-2" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>מטרה</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(GOALS) as [GoalKey, { label: string; pct: number }][]).map(([key, g]) => (
                        <button
                          key={key}
                          onClick={() => setDraft((d) => ({ ...d, goal: key }))}
                          className="py-2.5 px-3 rounded-lg text-sm font-semibold"
                          style={{
                            background: draft.goal === key ? T.accent : T.t.chipBg,
                            color: draft.goal === key ? '#07080B' : T.t.textSecondary,
                            border: `1px solid ${draft.goal === key ? T.accent : T.t.border}`,
                          }}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl p-3.5" style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}>
                    <div className="text-xs mb-1" style={{ color: T.t.textDim }}>יעד קלורי יומי משוער</div>
                    <div className="text-lg font-bold" style={{ color: T.accent, fontFamily: FONT_MONO }}>{preview.rest.kcal} קל&apos;</div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 p-5 flex-shrink-0" style={{ borderTop: `1px solid ${T.t.border}` }}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold"
            style={{ color: T.t.textSecondary, opacity: step === 0 ? 0.35 : 1 }}
          >
            <ChevronRight size={16} /> חזרה
          </button>
          {step < STEP_TITLES.length - 1 ? (
            <button
              onClick={() => setStep((s) => Math.min(STEP_TITLES.length - 1, s + 1))}
              disabled={!canAdvance}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: T.accent, color: '#07080B', opacity: canAdvance ? 1 : 0.5 }}
            >
              המשך <ChevronLeft size={16} />
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: T.accent, color: '#07080B' }}
            >
              <Check size={16} /> בואו נתחיל
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
