'use client';

// Milestone-3 checkpoint page: wires the ported UI shell together so it's
// actually visible in the browser, not just covered by unit tests. The real
// Today/Nutrition/Workouts/Insights tab content is milestone 6 — this proves
// the shell (theme, fonts, BottomNav, FAB, FabMenu, SheetModal) works together.

import { useState } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY } from '@/lib/theme/tokens';
import { BottomNav, type NavTabId } from '@/components/shell/BottomNav';
import { ActionFab } from '@/components/shell/ActionFab';
import { FabMenu, type FabActionId } from '@/components/shell/FabMenu';
import { SheetModal } from '@/components/shell/SheetModal';
import { INGREDIENT_DB } from '@/lib/data/ingredients';
import { HACKS } from '@/lib/data/hacks';
import { EATING_OUT_MENU } from '@/lib/data/eatingOut';

export default function Home() {
  const T = useTheme();
  const [activeTab, setActiveTab] = useState<NavTabId>('today');
  const [fabOpen, setFabOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastAction, setLastAction] = useState<FabActionId | null>(null);

  const handlePickAction = (id: FabActionId) => {
    setFabOpen(false);
    setLastAction(id);
    setSheetOpen(true);
  };

  return (
    <main
      className="min-h-screen w-full"
      dir="rtl"
      style={{ background: T.t.bgGrad, color: T.t.textPrimary, paddingBottom: 132 }}
    >
      <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 pt-10">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: FONT_DISPLAY, color: T.t.textPrimary }}>
          PROJECT SHRED
        </h1>
        <p className="text-sm mb-6" style={{ color: T.t.textDim }}>
          תשתית UI · Sprint 3 — Reference Data &amp; Premium Micro-interactions
        </p>

        <div className="rounded-2xl p-5 mb-4" style={{ background: T.t.card, border: `1px solid ${T.t.border}` }}>
          <p className="text-sm font-semibold mb-2" style={{ color: T.t.textPrimary }}>נתוני ייחוס שהועברו</p>
          <ul className="text-sm flex flex-col gap-1" style={{ color: T.t.textSecondary }}>
            <li>{INGREDIENT_DB.length} מרכיבים גולמיים</li>
            <li>{HACKS.length} מתכוני בית</li>
            <li>{EATING_OUT_MENU.length} פריטי אוכל בחוץ</li>
          </ul>
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: T.accent, color: '#07080B', boxShadow: T.glow(T.accent, 10, '30') }}
        >
          פתח גיליון לדוגמה
        </button>

        <p className="text-xs mt-6" style={{ color: T.t.textDim }}>
          טאב פעיל: {activeTab}
        </p>
      </div>

      {!fabOpen && !sheetOpen && <ActionFab open={fabOpen} onToggle={() => setFabOpen((o) => !o)} />}
      <FabMenu open={fabOpen} onClose={() => setFabOpen(false)} onPickAction={handlePickAction} />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <SheetModal open={sheetOpen} onClose={() => setSheetOpen(false)} title={lastAction ? `נבחר: ${lastAction}` : 'גיליון לדוגמה'}>
        <p className="text-sm" style={{ color: T.t.textSecondary }}>
          זהו תוכן לדוגמה בתוך SheetModal — גררו את הידית למעלה כדי לסגור, או לחצו על ה-X.
        </p>
      </SheetModal>
    </main>
  );
}
