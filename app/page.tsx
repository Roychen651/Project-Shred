'use client';

// The real app shell: 4-tab bottom navigation (Sprint 14's architecture),
// wired to the real Zustand store (lib/store/shred-store.ts) instead of a
// milestone-3 static demo. Today tab renders the ported CompositeHeroRing +
// SmartContextCard against live data; Nutrition opens the (Sprint-4-scoped)
// Restaurant Matrix / Plate Composer / quick-log sheets, each of which calls
// store.logItems() directly — so a log made in any sheet immediately moves
// the Today tab's ring and SmartContextCard, exactly like the artifact.
//
// Workouts and Insights are honest placeholders — porting WorkoutPanel,
// AiCoachWidget, ComplianceHeatmap etc. is future-sprint work, not something
// to fake here.

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon as MoonIcon, Sun as SunIcon, UtensilsCrossed, Layers3, Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY } from '@/lib/theme/tokens';
import { useShredStore, type LogItemSpec } from '@/lib/store/shred-store';
import { computeProfileTargets, type ComputedTargets } from '@/lib/domain/targets';
import type { SlotId } from '@/lib/domain/slots';

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

type DayMode = keyof Pick<ComputedTargets, 'training' | 'rest'>;
type ActiveSheet = 'quicklog' | 'restaurants' | 'plate' | null;

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
  const T = useTheme();
  const store = useShredStore();
  const [activeTab, setActiveTab] = useState<NavTabId>('today');
  const [dayMode, setDayMode] = useState<DayMode>('training');
  const [fabOpen, setFabOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<ActiveSheet>(null);

  const activeProfile = store.profiles[store.activeProfileId];
  const computed = computeProfileTargets(activeProfile);
  const targets = computed[dayMode];
  const dayItems = store.dayItems(store.selectedDateKey);
  const consumed = store.consumedForDate(store.selectedDateKey);

  // Matches the artifact's anyOverlayOpen guard (Sprint 15.7): the FAB must
  // never float above a sheet's own action buttons. fabOpen is deliberately
  // NOT part of this — the FAB stays visible (and rotated to "×") while its
  // own menu is open, so tapping it again closes the menu.
  const anyOverlayOpen = activeSheet !== null;

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
      {/* Sprint 5: ambient background glow — two large, softly blurred, fixed
          radial blobs in the accent + protein jewel tones. Fixed (not absolute)
          so they read as page-level atmosphere rather than scrolling with
          content; pointer-events-none + negative z-index keep them fully
          decorative and never in the way of a tap. */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: 'absolute', top: '-12%', insetInlineEnd: '-15%', width: '55vw', height: '55vw', maxWidth: 520, maxHeight: 520,
            background: `radial-gradient(circle, ${T.accent}${T.mode === 'dark' ? '3a' : '22'} 0%, transparent 70%)`,
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-8%', insetInlineStart: '-18%', width: '50vw', height: '50vw', maxWidth: 460, maxHeight: 460,
            background: `radial-gradient(circle, ${T.macro.protein}${T.mode === 'dark' ? '30' : '1c'} 0%, transparent 70%)`,
            filter: 'blur(70px)',
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
          <div className="flex items-center gap-2">
            <div className="flex p-1 rounded-xl gap-1" style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}` }}>
              <SegBtn active={dayMode === 'training'} onClick={() => setDayMode('training')}>אימון</SegBtn>
              <SegBtn active={dayMode === 'rest'} onClick={() => setDayMode('rest')}>מנוחה</SegBtn>
            </div>
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
              <div className="rounded-2xl p-6 text-center" style={{ background: T.t.card, border: `1px solid ${T.t.border}`, color: T.t.textDim }}>
                מעקב אימונים — בקרוב בספרינט הבא.
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="rounded-2xl p-6 text-center" style={{ background: T.t.card, border: `1px solid ${T.t.border}`, color: T.t.textDim }}>
                תובנות ואנליטיקה — בקרוב בספרינט הבא.
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
    </main>
  );
}
