'use client';

// The real app shell: 4-tab bottom navigation (Sprint 14's architecture),
// wired to the real Zustand store (lib/store/shred-store.ts) instead of a
// milestone-3 static demo. Today tab renders the ported CompositeHeroRing +
// SmartContextCard against live data; Nutrition opens the (Sprint-4-scoped)
// Restaurant Matrix / Plate Composer / quick-log sheets, each of which calls
// store.logItems() directly — so a log made in any sheet immediately moves
// the Today tab's ring and SmartContextCard, exactly like the artifact.
//
// Workouts are ported (Sprint 6). Insights now carries real analytics
// (Sprint 7): metric tracker + dual trendline, a derived compliance heatmap
// with retroactive day editing, and a weekly WhatsApp-ready report — see
// components/insights/ for the per-component porting notes.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon as MoonIcon, Sun as SunIcon, UtensilsCrossed, Layers3, Sparkles, Settings2, ClipboardList } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY } from '@/lib/theme/tokens';
import { useShredStore, type LogItemSpec } from '@/lib/store/shred-store';
import { useWireSync } from '@/lib/store/wireSync';
import { computeProfileTargets, type ComputedTargets } from '@/lib/domain/targets';
import type { SlotId } from '@/lib/domain/slots';
import type { WorkoutDayKey } from '@/lib/data/workouts';
import type { ExerciseSet } from '@/lib/domain/workouts';
import { buildDailyLog, buildWeeklyReport, type DayLog } from '@/lib/domain/analytics';
import { dateKey, addDays } from '@/lib/domain/dates';

import { BottomNav, type NavTabId } from '@/components/shell/BottomNav';
import { ActionFab } from '@/components/shell/ActionFab';
import { FabMenu, type FabActionId } from '@/components/shell/FabMenu';
import { SheetModal } from '@/components/shell/SheetModal';

import { CompositeHeroRing } from '@/components/today/CompositeHeroRing';
import { HeroRingLegend } from '@/components/today/HeroRingLegend';
import { SmartContextCard } from '@/components/today/SmartContextCard';

import { QuickLogSheetBody } from '@/components/nutrition/QuickLogSheetBody';
import { RestaurantMatrixSheetBody } from '@/components/nutrition/RestaurantMatrixSheetBody';
import { PlateComposerSheetBody } from '@/components/nutrition/PlateComposerSheetBody';

import { WorkoutPanel } from '@/components/workouts/WorkoutPanel';

import { GlassCard } from '@/components/ui/GlassCard';
import { ProfileSwitcher } from '@/components/settings/ProfileSwitcher';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { CalorieMathSheetBody } from '@/components/insights/CalorieMathSheetBody';
import { MetricTracker } from '@/components/insights/MetricTracker';
import { DualTrendChart } from '@/components/insights/DualTrendChart';
import { ComplianceHeatmap } from '@/components/insights/ComplianceHeatmap';
import { WeeklyReportModal } from '@/components/insights/WeeklyReportModal';

type DayMode = keyof Pick<ComputedTargets, 'training' | 'rest'>;
type ActiveSheet = 'quicklog' | 'restaurants' | 'plate' | 'caloriemath' | null;

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const T = useTheme();
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg text-xs font-bold"
      style={{ background: active ? T.accent : 'transparent', color: active ? '#07080B' : T.t.textSecondary }}
    >
      {children}
    </button>
  );
}

export default function Home() {
  useWireSync();
  const T = useTheme();
  const store = useShredStore();
  const [activeTab, setActiveTab] = useState<NavTabId>('today');
  const [dayMode, setDayMode] = useState<DayMode>('training');
  const [fabOpen, setFabOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weeklyReportOpen, setWeeklyReportOpen] = useState(false);

  const activeProfile = store.profiles[store.activeProfileId];
  const computed = computeProfileTargets(activeProfile);
  const targets = computed[dayMode];
  const dayItems = store.dayItems(store.selectedDateKey);
  const consumed = store.consumedForDate(store.selectedDateKey);

  // Matches the artifact's anyOverlayOpen guard (Sprint 15.7): the FAB must
  // never float above ANY overlay's own action buttons, sheet or modal alike.
  // fabOpen is deliberately NOT part of this — the FAB stays visible (and
  // rotated to "×") while its own menu is open, so tapping it again closes it.
  const anyOverlayOpen = activeSheet !== null || settingsOpen || weeklyReportOpen;

  // Sprint 7 — derives the last 7 days' DayLog entries from real itemsByDate/
  // dayMeta (mirroring supabase/migrations/0003's daily_log view) to feed the
  // exact same buildWeeklyReport() used since Milestone 2.
  const last7DailyLogs: Record<string, DayLog> = {};
  for (let i = 0; i < 7; i++) {
    const key = dateKey(addDays(new Date(), -i));
    const log = buildDailyLog(store.itemsByDate[key], store.dayMeta[key]);
    if (log) last7DailyLogs[key] = log;
  }
  const weeklyReport = buildWeeklyReport(last7DailyLogs, store.metricEntries, computed);
  const trendEntries = store.metricEntries.filter(
    (e): e is typeof e & { weight: number; waist: number } => e.weight !== undefined && e.waist !== undefined
  );

  const handlePickAction = (id: FabActionId) => {
    setFabOpen(false);
    setActiveTab('nutrition');
    setActiveSheet(id === 'quicklog' ? 'quicklog' : id === 'restaurants' ? 'restaurants' : 'plate');
  };

  const handleLog = (specs: LogItemSpec[], slotId: SlotId) => {
    store.logItems(specs, slotId);
    setActiveSheet(null);
  };

  return (
    <main className="min-h-screen w-full relative" style={{ background: T.t.bgGrad, color: T.t.textPrimary, paddingBottom: 190 }}>
      {/* Sprint 5, brightened in Sprint 8: ambient background glow — two large,
          softly blurred, fixed radial blobs in the accent + protein jewel
          tones. Fixed (not absolute) so they read as page-level atmosphere
          rather than scrolling with content; pointer-events-none + negative
          z-index keep them fully decorative and never in the way of a tap.
          Sprint 8 raised the alpha and shrank the blur slightly — screenshots
          showed them reading as nearly flat black at the original values. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: 'absolute', top: '-12%', insetInlineEnd: '-15%', width: '55vw', height: '55vw', maxWidth: 520, maxHeight: 520,
            background: `radial-gradient(circle, ${T.accent}${T.mode === 'dark' ? '4d' : '2c'} 0%, transparent 70%)`,
            filter: 'blur(52px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-8%', insetInlineStart: '-18%', width: '50vw', height: '50vw', maxWidth: 460, maxHeight: 460,
            background: `radial-gradient(circle, ${T.macro.protein}${T.mode === 'dark' ? '40' : '26'} 0%, transparent 70%)`,
            filter: 'blur(62px)',
          }}
        />
      </div>

      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-8 relative">
        {/* ===== header ===== */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 42, height: 42, background: `linear-gradient(135deg, ${T.accent}, ${T.macro.protein})`, boxShadow: T.glow(T.accent, 14, '30') }}
            >
              <Sparkles size={20} color="#07080B" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>PROJECT SHRED</h1>
              <p className="text-xs" style={{ color: T.t.textDim }}>{activeProfile.name} · {targets.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex p-1 rounded-xl gap-1" style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}` }}>
              <SegBtn active={dayMode === 'training'} onClick={() => setDayMode('training')}>אימון</SegBtn>
              <SegBtn active={dayMode === 'rest'} onClick={() => setDayMode('rest')}>מנוחה</SegBtn>
            </div>
            <ProfileSwitcher
              profiles={store.profiles}
              activeId={store.activeProfileId}
              setActiveId={store.setActiveProfileId}
              addProfile={store.addProfile}
              deleteProfile={store.deleteProfile}
            />
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center rounded-xl"
              style={{ width: 38, height: 38, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
              aria-label="הגדרות"
            >
              <Settings2 size={16} color={T.t.textSecondary} />
            </button>
            <button
              onClick={() => T.setMode(T.mode === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center rounded-xl"
              style={{ width: 38, height: 38, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
              aria-label="מצב תצוגה"
            >
              {T.mode === 'dark' ? <MoonIcon size={16} color={T.t.textSecondary} /> : <SunIcon size={16} color={T.t.textSecondary} />}
            </button>
          </div>
        </div>

        {/* ===== tabs, with a fluid cross-fade + slide between them ===== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            {activeTab === 'today' && (
              <div className="flex flex-col items-center gap-3">
                <CompositeHeroRing consumed={consumed} targets={targets} />
                <HeroRingLegend />
                <div className="w-full">
                  <SmartContextCard
                    items={dayItems}
                    onQuickComplete={(slotId) => store.markSlotCompleted(store.selectedDateKey, slotId)}
                    onEdit={(slotId) => { setActiveTab('nutrition'); setActiveSheet(slotId === 'lunch' ? 'restaurants' : 'plate'); }}
                  />
                </div>
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveSheet('restaurants')}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl text-right"
                  style={{ background: T.t.card, border: `1.5px solid ${T.t.border}` }}
                >
                  <UtensilsCrossed size={20} color={T.accent} />
                  <span className="text-sm font-bold">מטריצת מסעדות</span>
                  <span className="text-xs" style={{ color: T.t.textDim }}>מסעדות ואוכל בחוץ</span>
                </button>
                <button
                  onClick={() => setActiveSheet('plate')}
                  className="flex flex-col items-start gap-2 p-4 rounded-2xl text-right"
                  style={{ background: T.t.card, border: `1.5px solid ${T.t.border}` }}
                >
                  <Layers3 size={20} color={T.accent} />
                  <span className="text-sm font-bold">בנה צלחת אישית</span>
                  <span className="text-xs" style={{ color: T.t.textDim }}>גולמי/מבושל · גרם מדויק</span>
                </button>
              </div>
            )}

            {activeTab === 'workouts' && (
              <WorkoutPanel
                exerciseLogs={store.exerciseLogs}
                selectedDateKey={store.selectedDateKey}
                onWorkoutActivity={(done: boolean, workoutDayKey: WorkoutDayKey) =>
                  store.setWorkoutActivity(store.selectedDateKey, done, workoutDayKey)
                }
                onLogSet={(exerciseName: string, patch: ExerciseSet) =>
                  store.logExerciseSet(store.selectedDateKey, exerciseName, patch)
                }
              />
            )}

            {activeTab === 'insights' && (
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setWeeklyReportOpen(true)}
                  className="flex items-center justify-between p-4 rounded-2xl text-right"
                  style={{ background: T.t.card, border: `1.5px solid ${T.t.border}` }}
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList size={20} color={T.accent} />
                    <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>דוח שבועי מנהלים</span>
                  </div>
                  <span className="text-xs" style={{ color: T.t.textDim }}>דיוק ממוצע {weeklyReport.avgCompliance}%</span>
                </button>

                <ComplianceHeatmap
                  itemsByDate={store.itemsByDate}
                  dayMeta={store.dayMeta}
                  computed={computed}
                  onSaveDay={(dk, patch) => {
                    store.setManualDayOverride(dk, { manualKcal: patch.kcal, manualProtein: patch.protein });
                    store.setWorkoutActivity(dk, patch.workoutDone, store.dayMeta[dk]?.workoutDay ?? null);
                  }}
                />

                {trendEntries.length > 0 && (
                  <GlassCard className="p-5">
                    <DualTrendChart entries={trendEntries} />
                  </GlassCard>
                )}

                <MetricTracker entries={store.metricEntries} onAddEntry={store.addMetricEntry} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {!anyOverlayOpen && <FabMenu open={fabOpen} onClose={() => setFabOpen(false)} onPickAction={handlePickAction} />}
      {!anyOverlayOpen && <ActionFab open={fabOpen} onToggle={() => setFabOpen((o) => !o)} />}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <SheetModal open={activeSheet === 'quicklog'} onClose={() => setActiveSheet(null)} title="רישום חופשי מהיר">
        <QuickLogSheetBody onConfirm={handleLog} />
      </SheetModal>

      <SheetModal open={activeSheet === 'restaurants'} onClose={() => setActiveSheet(null)} title="מטריצת מסעדות">
        <RestaurantMatrixSheetBody onConfirm={handleLog} />
      </SheetModal>

      <SheetModal open={activeSheet === 'plate'} onClose={() => setActiveSheet(null)} title="בונה צלחת אישית">
        <PlateComposerSheetBody onConfirm={handleLog} />
      </SheetModal>

      <SheetModal open={activeSheet === 'caloriemath'} onClose={() => setActiveSheet(null)} title="מאיפה היעד הקלורי הזה?">
        <CalorieMathSheetBody profile={activeProfile} computed={computed} dayMode={dayMode} />
      </SheetModal>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={activeProfile}
        updateProfile={store.updateActiveProfile}
        bmr={computed.bmr}
        tdee={computed.tdee}
        onOpenCalorieMath={() => { setSettingsOpen(false); setActiveSheet('caloriemath'); }}
      />

      <WeeklyReportModal
        open={weeklyReportOpen}
        onClose={() => setWeeklyReportOpen(false)}
        report={weeklyReport}
        profile={activeProfile}
      />
    </main>
  );
}
