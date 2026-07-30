'use client';

// ProjectShred.artifact.jsx:2890+ (Sprint 6 profile fields, Sprint 7
// appearance section). A scoped-down but genuinely functional port: real
// profile fields wired straight to computeProfileTargets() (every keystroke
// recalculates BMR/TDEE/macros, exactly like the artifact), plus accent
// switching. The artifact's SettingsModal also has AI-provider config,
// export/import JSON, and links to the Docs/Diagnostics modals — none of
// those exist yet in this port (no api key field, no backup pipeline built
// here), so they're left out rather than half-wired. Future-sprint scope,
// same honesty pattern as RestaurantMatrixSheetBody/PlateComposerSheetBody.

import { useRouter } from 'next/navigation';
import { X, Settings2, Calculator, LogOut } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, ACCENT_PRESETS, getAccentHex, type AccentKey } from '@/lib/theme/tokens';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { FieldInput } from './FieldInput';
import { ACTIVITY_LEVELS, GOALS, type ActivityKey, type GoalKey } from '@/lib/domain/targets';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/store/shred-store';

export interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  updateProfile: (patch: Partial<Profile>) => void;
  bmr: number;
  tdee: number;
  onOpenCalorieMath: () => void;
}

export function SettingsModal({ open, onClose, profile, updateProfile, bmr, tdee, onOpenCalorieMath }: SettingsModalProps) {
  const T = useTheme();
  const router = useRouter();
  if (!open) return null;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: T.t.overlayBg, backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden flex flex-col"
        style={{
          maxWidth: 460,
          maxHeight: '88vh',
          background: T.mode === 'dark' ? `${T.t.modalBg}E8` : `${T.t.modalBg}F7`,
          border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${T.glow(T.accent, 20, '30')}`,
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      >
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <Settings2 size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>הגדרות</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <X size={16} color={T.t.textSecondary} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto" style={{ minHeight: 0 }}>
          <div>
            <Eyebrow>פרטים אישיים</Eyebrow>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2">
                <FieldInput label="שם" value={profile.name} onChange={(v) => updateProfile({ name: v })} />
              </div>
              <FieldInput label="גיל" type="number" suffix="שנים" value={profile.age} onChange={(v) => updateProfile({ age: Number(v) || 0 })} />
              <FieldInput label="משקל" type="number" suffix="ק״ג" value={profile.weight} onChange={(v) => updateProfile({ weight: Number(v) || 0 })} />
              <FieldInput label="גובה" type="number" suffix="ס״מ" value={profile.height} onChange={(v) => updateProfile({ height: Number(v) || 0 })} />
              <FieldInput label="היקף מותן" type="number" suffix="ס״מ" value={profile.waist} onChange={(v) => updateProfile({ waist: Number(v) || 0 })} />
            </div>
          </div>

          <div>
            <Eyebrow>רמת פעילות</Eyebrow>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {(Object.entries(ACTIVITY_LEVELS) as [ActivityKey, { label: string; mult: number }][]).map(([key, a]) => (
                <button
                  key={key}
                  onClick={() => updateProfile({ activity: key })}
                  className="flex items-center justify-between py-2.5 px-3.5 rounded-lg text-sm font-semibold text-right"
                  style={{
                    background: profile.activity === key ? T.accent : T.t.chipBg,
                    color: profile.activity === key ? '#07080B' : T.t.textSecondary,
                    border: `1px solid ${profile.activity === key ? T.accent : T.t.border}`,
                  }}
                >
                  <span>{a.label}</span>
                  <span style={{ opacity: 0.7 }}>×{a.mult}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Eyebrow>מטרה</Eyebrow>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(Object.entries(GOALS) as [GoalKey, { label: string; pct: number }][]).map(([key, g]) => (
                <button
                  key={key}
                  onClick={() => updateProfile({ goal: key })}
                  className="py-2.5 px-3 rounded-lg text-sm font-semibold"
                  style={{
                    background: profile.goal === key ? T.accent : T.t.chipBg,
                    color: profile.goal === key ? '#07080B' : T.t.textSecondary,
                    border: `1px solid ${profile.goal === key ? T.accent : T.t.border}`,
                  }}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenCalorieMath}
            className="flex items-center justify-between p-3.5 rounded-xl text-right"
            style={{ background: T.t.chipBg, border: `1px solid ${T.t.border}` }}
          >
            <div className="flex items-center gap-2">
              <Calculator size={16} color={T.accent} />
              <div>
                <div className="text-sm font-semibold" style={{ color: T.t.textPrimary }}>מאיפה היעד הקלורי הזה?</div>
                <div className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>BMR {bmr} · TDEE {tdee} קל&apos;</div>
              </div>
            </div>
          </button>

          <div>
            <Eyebrow>צבע דגש (Accent)</Eyebrow>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(Object.keys(ACCENT_PRESETS) as AccentKey[]).map((key) => {
                const hex = getAccentHex(T.mode, key);
                const active = T.accentKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => T.setAccentKey(key)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                    style={{ background: active ? `${hex}18` : T.t.chipBg, border: `1px solid ${active ? hex : T.t.border}` }}
                  >
                    <span className="rounded-full" style={{ width: 22, height: 22, background: hex, boxShadow: active ? T.glow(hex, 8, '30') : 'none' }} />
                    <span className="text-xs" style={{ color: active ? hex : T.t.textDim }}>{ACCENT_PRESETS[key].label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
            style={{ background: T.t.chipBg, color: T.macro.kcal, border: `1px solid ${T.t.border}` }}
          >
            <LogOut size={15} /> התנתקות
          </button>
        </div>
      </div>
    </div>
  );
}
