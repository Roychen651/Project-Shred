'use client';

// ProjectShred.artifact.jsx:5246-5283 (Sprint 14). Visual design (colors, sizing,
// layout, icons, copy) ported exactly. The one deliberate addition beyond the
// artifact: a framer-motion `layoutId` indicator pill that fluidly slides between
// tabs with spring physics — the artifact had no such affordance at all (an
// instant active/inactive color swap), so this is new premium polish, not a
// changed existing animation.

import { motion } from 'framer-motion';
import { Sunrise, UtensilsCrossed, Dumbbell, BarChart3, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

export type NavTabId = 'today' | 'nutrition' | 'workouts' | 'insights';

interface NavTab {
  id: NavTabId;
  label: string;
  icon: LucideIcon;
}

export const NAV_TABS: NavTab[] = [
  { id: 'today', label: 'היום', icon: Sunrise },
  { id: 'nutrition', label: 'תזונה', icon: UtensilsCrossed },
  { id: 'workouts', label: 'אימונים', icon: Dumbbell },
  { id: 'insights', label: 'תובנות', icon: BarChart3 },
];

export interface BottomNavProps {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
}

export function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const T = useTheme();
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 flex justify-center"
      style={{
        background: T.t.modalBg,
        borderTop: `1px solid ${T.t.border}`,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -8px 24px -16px rgba(0,0,0,0.25)',
      }}
    >
      <div className="w-full flex items-stretch justify-around" style={{ maxWidth: 640 }}>
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5"
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-pill"
                  className="absolute rounded-2xl"
                  style={{ inset: '2px 10%', background: `${T.accent}14` }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Icon size={20} color={active ? T.accent : T.t.textDim} strokeWidth={active ? 2.4 : 2} style={{ position: 'relative' }} />
              <span className="text-xs font-semibold" style={{ color: active ? T.accent : T.t.textDim, position: 'relative' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
