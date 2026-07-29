'use client';

// ProjectShred.artifact.jsx:5246-5283 (Sprint 14). Visual design (colors, sizing,
// layout, icons, copy) ported exactly. The one deliberate addition beyond the
// artifact: a framer-motion `layoutId` indicator pill that fluidly slides between
// tabs with spring physics — the artifact had no such affordance at all (an
// instant active/inactive color swap), so this is new premium polish, not a
// changed existing animation.
//
// Sprint 5: detached from the screen edge into a floating glass pill per direct
// design feedback. Still the same T.t.modalBg/border/shadowCard tokens the rest
// of the app's overlays use — the change is shape and position (floating,
// backdrop-blurred, rounded-full, its own ambient shadow), not a new palette.

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
  const isDark = T.mode === 'dark';
  const pillBg = isDark ? `${T.t.modalBg}CC` : `${T.t.modalBg}F2`;
  return (
    <div
      className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    >
      <div
        className="w-full flex items-stretch justify-around pointer-events-auto rounded-full"
        style={{
          maxWidth: 460,
          margin: '0 20px',
          background: pillBg,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : T.t.border}`,
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          boxShadow: `0 20px 48px -12px rgba(0,0,0,${isDark ? 0.55 : 0.18}), 0 4px 16px -4px rgba(0,0,0,${isDark ? 0.4 : 0.1}), inset 0 1px 0 ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.8)'}`,
        }}
      >
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
                  style={{ inset: '2px 10%', background: `${T.accent}1c`, boxShadow: `0 0 16px -2px ${T.accent}55` }}
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
