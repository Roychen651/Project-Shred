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
import { Moon as MoonIcon, Sun as SunIcon, Layers3, Sparkles, Settings2, ClipboardList } from 'lucide-react';
import { AnimatedJumpingLettuce } from '@/components/ui/AnimatedIllustrations';
import { useTheme, type ShredTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, JEWEL, tactileGradient } from '@/lib/theme/tokens';
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
import { SyncStatusIndicator } from '@/components/shell/SyncStatusIndicator';

import { CompositeHeroRing } from '@/components/today/CompositeHeroRing';
import { HeroRingLegend } from '@/components/today/HeroRingLegend';
import { SmartContextCard } from '@/components/today/SmartContextCard';
import { MacroStatTiles } from '@/components/today/MacroStatTiles';
import { DateNavigator } from '@/components/today/DateNavigator';
import { PremiumMotivator } from '@/components/ui/PremiumMotivator';

import { QuickLogSheetBody } from '@/components/nutrition/QuickLogSheetBody';
import { RestaurantMatrixSheetBody } from '@/components/nutrition/RestaurantMatrixSheetBody';
import { PlateComposerSheetBody } from '@/components/nutrition/PlateComposerSheetBody';

import { WorkoutPanel } from '@/components/workouts/WorkoutPanel';

import { GlassCard } from '@/components/ui/GlassCard';
import { TiltCard } from '@/components/ui/TiltCard';
import { ProfileSwitcher } from '@/components/settings/ProfileSwitcher';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { CalorieMathSheetBody } from '@/components/insights/CalorieMathSheetBody';
import { DayLogSheetBody } from '@/components/nutrition/DayLogSheetBody';
import { MetricTracker } from '@/components/insights/MetricTracker';
import { DualTrendChart } from '@/components/insights/DualTrendChart';
import { ComplianceHeatmap } from '@/components/insights/ComplianceHeatmap';
import { WeeklyReportModal } from '@/components/insights/WeeklyReportModal';
import { MetabolicInsightCard } from '@/components/insights/MetabolicInsightCard';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { useSyncStatusStore } from '@/lib/store/sync-status';

type DayMode = keyof Pick<ComputedTargets, 'training' | 'rest'>;
type ActiveSheet = 'quicklog' | 'restaurants' | 'plate' | 'caloriemath' | 'daylog' | null;

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };

// Sprint 19 — a real staggered 3D entrance instead of the whole tab fading in
// as one block. `tabContainerVariants` on the tab wrapper (below) declares
// named 'hidden'/'visible' states so Framer Motion's variant propagation can
// orchestrate `staggerChildren` across whichever direct motion.div children
// opt in via `tabItemVariants` — plain fade-in children (that don't use
// these variants) are unaffected and keep animating however they already do.
// The `perspective` on the tab wrapper is required for `rotateX` on children
// to actually read as 3D tilt rather than a flat vertical squash.
const tabContainerVariants = {
  // `opacity` here is a baseline fade for tab content that doesn't opt into
  // per-child staggering (Workouts/Insights) — Today/Nutrition's direct
  // children additionally declare tabItemVariants for the full staggered
  // 3D entrance on top of this.
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
const tabItemVariants = {
  hidden: { opacity: 0, y: 40, rotateX: -12 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
};

// Sprint 14 follow-up — these three tap-targets (Nutrition tab's two sheet-
// openers, Insights' weekly-report button) are `motion.button`s, not `div`s,
// so they can't wrap <GlassCard> directly; this mirrors GlassCard's dark-mode
// branch exactly (same blur/frost/border/shadow values) rather than staying
// on the old flat T.t.card fill a live screenshot showed was never updated.
function glassSurface(T: ShredTheme) {
  if (T.mode !== 'dark') {
    return {
      background: `${T.t.card}FA`,
      border: `1.5px solid ${T.t.border}`,
      boxShadow: '0 3px 8px -4px rgba(33,28,22,0.08), 0 24px 48px -20px rgba(33,28,22,0.14)',
    };
  }
  return {
    background: 'rgba(10,10,10,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(40px) saturate(200%)',
    WebkitBackdropFilter: 'blur(40px) saturate(200%)',
    boxShadow: '0 30px 60px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)',
  };
}

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const T = useTheme();
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      transition={tapSpring}
      className="px-3 py-1.5 rounded-lg text-xs font-bold"
      style={active ? { ...tactileGradient(T.accent), color: '#07080B' } : { background: 'transparent', color: T.t.textSecondary }}
    >
      {children}
    </motion.button>
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

  // Sprint 10 — computed directly during render, not via useEffect+state (this
  // codebase has hit the react-hooks/set-state-in-effect trap repeatedly —
  // see AddToHomeScreenPrompt/ExerciseRow/WorkoutPanel). hydrationSettled
  // distinguishes "haven't checked yet" from "checked, and onboarding really
  // hasn't been seen" — see sync-status.ts for why that distinction matters.
  // Sprint 13 — also requires !hydrationFailed: a real backend configured but
  // a failed hydrate fetch must NOT show onboarding to a returning user just
  // because hasSeenOnboarding never got the chance to load (see sync-status.ts).
  const hydrationSettled = useSyncStatusStore((s) => s.hydrationSettled);
  const hydrationFailed = useSyncStatusStore((s) => s.hydrationFailed);
  const showOnboarding = hydrationSettled && !hydrationFailed && !store.hasSeenOnboarding;

  const activeProfile = store.profiles[store.activeProfileId];
  const computed = computeProfileTargets(activeProfile);
  const targets = computed[dayMode];
  const dayItems = store.dayItems(store.selectedDateKey);
  const consumed = store.consumedForDate(store.selectedDateKey);

  // Matches the artifact's anyOverlayOpen guard (Sprint 15.7): the FAB must
  // never float above ANY overlay's own action buttons, sheet or modal alike.
  // fabOpen is deliberately NOT part of this — the FAB stays visible (and
  // rotated to "×") while its own menu is open, so tapping it again closes it.
  const anyOverlayOpen = activeSheet !== null || settingsOpen || weeklyReportOpen || showOnboarding;

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
      {/* Sprint 5, brightened in Sprint 8, deepened in Sprint 13, unchained in
          Sprint 14: with dark mode now the app's only reachable mode, this
          went from "two brightened blobs in the existing accent/protein
          tones" to a genuine three-point neon corner glow (accent + jade +
          plum) over a near-obsidian base (THEME_PRESETS.dark, tokens.ts) —
          the "endless dark void with light leaks" look. Fixed (not absolute)
          so they read as page-level atmosphere rather than scrolling with
          content; pointer-events-none + negative z-index keep them fully
          decorative and never in the way of a tap.
          Sprint 20 — each blob now drifts slowly (position/scale/opacity via
          the shred-mesh-blob-N keyframes in globals.css, offset durations so
          they never move in sync) instead of sitting static, and a fourth
          "midnight blue" blob (JEWEL.steel) joins accent/jade/plum for a
          genuine multi-hue mesh instead of a three-color palette. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="shred-mesh-blob-1"
          style={{
            position: 'absolute', top: '-16%', insetInlineEnd: '-18%', width: '60vw', height: '60vw', maxWidth: 620, maxHeight: 620,
            background: `radial-gradient(circle, ${T.accent}${T.mode === 'dark' ? '85' : '1c'} 0%, transparent 68%)`,
            filter: 'blur(64px)',
          }}
        />
        <div
          className="shred-mesh-blob-2"
          style={{
            position: 'absolute', bottom: '-12%', insetInlineStart: '-20%', width: '55vw', height: '55vw', maxWidth: 540, maxHeight: 540,
            background: `radial-gradient(circle, ${T.macro.protein}${T.mode === 'dark' ? '78' : '16'} 0%, transparent 68%)`,
            filter: 'blur(70px)',
          }}
        />
        {T.mode === 'dark' && (
          <div
            className="shred-mesh-blob-3"
            style={{
              position: 'absolute', top: '32%', left: '50%', width: '48vw', height: '48vw', maxWidth: 460, maxHeight: 460,
              background: `radial-gradient(circle, ${JEWEL.dark.plum}55 0%, transparent 70%)`,
              filter: 'blur(80px)',
            }}
          />
        )}
        {T.mode === 'dark' && (
          <div
            className="shred-mesh-blob-2"
            style={{
              position: 'absolute', top: '55%', insetInlineEnd: '-10%', width: '42vw', height: '42vw', maxWidth: 400, maxHeight: 400,
              background: `radial-gradient(circle, ${JEWEL.dark.steel}45 0%, transparent 70%)`,
              filter: 'blur(75px)', animationDelay: '-18s',
            }}
          />
        )}
        {/* Sprint 22 — a third, warm-bronze wash for light mode specifically
            (Biosora-reference request: a genuinely multi-hue organic blend,
            not two thin accent/jade blobs alone). Kept deliberately low-alpha
            and positioned off-center: Sprint 15 already found that pushing
            light-mode blob alpha up to dark-mode strength reads as an
            "untreated color blotch" on a pale cream base rather than a soft
            wash, so this adds a third hue instead of just turning up the
            two existing ones. */}
        {T.mode === 'light' && (
          <div
            className="shred-mesh-blob-3"
            style={{
              position: 'absolute', top: '38%', left: '8%', width: '50vw', height: '50vw', maxWidth: 480, maxHeight: 480,
              background: `radial-gradient(circle, ${JEWEL.light.bronze}16 0%, transparent 70%)`,
              filter: 'blur(80px)',
            }}
          />
        )}
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
            <div className="flex p-1 rounded-2xl gap-1" style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}` }}>
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
            <SyncStatusIndicator />
            <motion.button
              onClick={() => setSettingsOpen(true)}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.06 }}
              transition={tapSpring}
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 38, height: 38, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
              aria-label="הגדרות"
            >
              <Settings2 size={16} color={T.t.textSecondary} />
            </motion.button>
            <motion.button
              onClick={() => T.setMode(T.mode === 'dark' ? 'light' : 'dark')}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.06 }}
              transition={tapSpring}
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 38, height: 38, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
              aria-label="מצב תצוגה"
            >
              {T.mode === 'dark' ? <MoonIcon size={16} color={T.t.textSecondary} /> : <SunIcon size={16} color={T.t.textSecondary} />}
            </motion.button>
          </div>
        </div>

        {/* ===== tabs, with a staggered 3D entrance choreography ===== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContainerVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
            style={{ perspective: 1000 }}
          >
            {activeTab === 'today' && (
              <div className="flex flex-col items-center gap-3">
                {/* Sprint 26 — the store/domain layer for date navigation
                    (setSelectedDateKey, shiftDateKey, formatHebrewDate) has
                    existed since the Zustand store was built, but no
                    component ever surfaced it — there was no way to look at
                    or fix a past day at all. */}
                <motion.div variants={tabItemVariants} className="w-full">
                  <DateNavigator selectedDateKey={store.selectedDateKey} onChange={store.setSelectedDateKey} />
                </motion.div>
                <motion.div variants={tabItemVariants}>
                  <CompositeHeroRing consumed={consumed} targets={targets} />
                </motion.div>
                <motion.div variants={tabItemVariants}>
                  <HeroRingLegend />
                </motion.div>
                {/* Sprint 25 — carbs/fat had no surface anywhere on this tab
                    (the ring only ever tracked kcal/protein); this closes
                    that real gap with the floating-badge tile pattern from
                    the new Dribbble references, with room above for the
                    corner badges that poke past each tile's own edge. */}
                <motion.div variants={tabItemVariants} className="w-full mt-3">
                  <MacroStatTiles consumed={consumed} targets={targets} />
                </motion.div>
                {/* Sprint 20 — extra top clearance for SmartContextCard's
                    floating badge (Sprint 19), which pokes -14px above the
                    card. Audited: it measured a real 22px gap from the
                    legend above, not an actual overlap, but that read as
                    visually tight, so this pushes it to a more comfortable
                    margin as a safety buffer rather than leaving it exact. */}
                <motion.div variants={tabItemVariants} className="w-full mt-2">
                  <SmartContextCard
                    items={dayItems}
                    onQuickComplete={(slotId) => store.markSlotCompleted(store.selectedDateKey, slotId)}
                    onEdit={(slotId) => { setActiveTab('nutrition'); setActiveSheet(slotId === 'lunch' ? 'restaurants' : 'plate'); }}
                  />
                </motion.div>
                {/* Sprint 22 — a genuine whole-day empty state, distinct from
                    SmartContextCard's own per-slot empty illustration above
                    (that one says "this specific meal is unlogged"; this one
                    says "nothing at all yet today"), shown only when it's
                    actually true. */}
                {dayItems.length === 0 && (
                  <motion.div variants={tabItemVariants} className="w-full">
                    <PremiumMotivator variant="nutrition-empty" />
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'nutrition' && (
              <div className="flex flex-col gap-3">
                <motion.div variants={tabItemVariants}>
                  <DateNavigator selectedDateKey={store.selectedDateKey} onChange={store.setSelectedDateKey} />
                </motion.div>
                <motion.div variants={tabItemVariants} className="grid grid-cols-2 gap-3">
                <motion.div variants={tabItemVariants}>
                  <TiltCard>
                    <motion.button
                      onClick={() => setActiveSheet('restaurants')}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      transition={tapSpring}
                      className="w-full flex flex-col items-start gap-3 p-4 rounded-[32px] text-right"
                      style={glassSurface(T)}
                    >
                      {/* Sprint 22 — a genuinely animated, hand-drawn lettuce
                          leaf instead of a static stock icon, on one of the
                          most-tapped cards in the app. */}
                      <AnimatedJumpingLettuce size={34} color={T.accent} />
                      <span className="text-lg font-black" style={{ letterSpacing: '-0.02em' }}>מטריצת מסעדות</span>
                      <span className="text-[10px] font-light uppercase" style={{ color: T.t.textDim, letterSpacing: '0.15em' }}>מסעדות ואוכל בחוץ</span>
                    </motion.button>
                  </TiltCard>
                </motion.div>
                <motion.div variants={tabItemVariants}>
                  <TiltCard>
                    <motion.button
                      onClick={() => setActiveSheet('plate')}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.02 }}
                      transition={tapSpring}
                      className="w-full flex flex-col items-start gap-3 p-4 rounded-[32px] text-right"
                      style={glassSurface(T)}
                    >
                      <Layers3 size={32} color={T.accent} strokeWidth={1.75} />
                      <span className="text-lg font-black" style={{ letterSpacing: '-0.02em' }}>בנה צלחת אישית</span>
                      <span className="text-[10px] font-light uppercase" style={{ color: T.t.textDim, letterSpacing: '0.15em' }}>גולמי/מבושל · גרם מדויק</span>
                    </motion.button>
                  </TiltCard>
                </motion.div>
                </motion.div>
                {/* Sprint 26 — the other reported gap: once something was
                    logged, there was no way to see the full list again, let
                    alone fix a wrong tap. This is the one place that shows
                    every item for the selected date with edit/delete. */}
                <motion.div variants={tabItemVariants}>
                  <motion.button
                    onClick={() => setActiveSheet('daylog')}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ scale: 1.01 }}
                    transition={tapSpring}
                    className="w-full flex items-center justify-between p-4 rounded-[32px] text-right"
                    style={glassSurface(T)}
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList size={18} color={T.accent} />
                      <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>היומן של היום</span>
                    </div>
                    <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{dayItems.length} פריטים · צפו ועריכה</span>
                  </motion.button>
                </motion.div>
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
                <motion.button
                  onClick={() => setWeeklyReportOpen(true)}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  transition={tapSpring}
                  className="flex items-center justify-between p-4 rounded-[32px] text-right"
                  style={glassSurface(T)}
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList size={20} color={T.accent} />
                    <span className="text-sm font-bold" style={{ color: T.t.textPrimary }}>דוח שבועי מנהלים</span>
                  </div>
                  <span className="text-xs" style={{ color: T.t.textDim }}>דיוק ממוצע {weeklyReport.avgCompliance}%</span>
                </motion.button>

                <MetabolicInsightCard metricEntries={store.metricEntries} goal={activeProfile.goal} />

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
        <PlateComposerSheetBody onConfirm={handleLog} customIngredients={store.customIngredients} onSaveCustomIngredient={store.saveCustomIngredient} />
      </SheetModal>

      <SheetModal open={activeSheet === 'caloriemath'} onClose={() => setActiveSheet(null)} title="מאיפה היעד הקלורי הזה?">
        <CalorieMathSheetBody profile={activeProfile} computed={computed} dayMode={dayMode} />
      </SheetModal>

      <SheetModal open={activeSheet === 'daylog'} onClose={() => setActiveSheet(null)} title="היומן של היום">
        <DayLogSheetBody
          items={dayItems}
          onToggle={(id) => store.toggleItemCompleted(store.selectedDateKey, id)}
          onDelete={(id) => store.deleteItem(store.selectedDateKey, id)}
          onUpdate={(id, patch) => store.updateItem(store.selectedDateKey, id, patch)}
        />
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

      {showOnboarding && (
        <OnboardingWizard
          profile={activeProfile}
          updateProfile={store.updateActiveProfile}
          onComplete={() => store.setHasSeenOnboarding(true)}
        />
      )}
    </main>
  );
}
