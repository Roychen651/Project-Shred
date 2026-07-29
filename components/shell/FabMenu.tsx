'use client';

// ProjectShred.artifact.jsx:5640-5674 (Sprint 14). The three actions, their
// icons, and the panel's position (bottom: 158 — precisely computed to clear
// the FAB's own height, per the Sprint 15.7 bugfix note in CLAUDE.md) are
// unchanged. The CSS opacity/translateY transition is replaced with an
// AnimatePresence + spring, plus a staggered entrance across the 3 buttons — a
// new touch (the artifact animated all three as one block) in the spirit of the
// sprint 3 "fluid, deeply responsive" mandate.
//
// Sprint 4 rebrand: the artifact's second action was "בחר ב-Cibus" (Cibus is
// the real Israeli meal-benefit platform this app's restaurant data comes
// from) — renamed to the generic "מסעדות" since a global-facing app shouldn't
// name a specific regional vendor in its UI. The action id changed from
// 'cibus' to 'restaurants' to match; the underlying restaurant data
// (lib/data/restaurants.ts) is untouched.
//
// Sprint 5: `bottom: 158` was a hand-computed magic number tied to the old
// FAB_BOTTOM=84/size=58. Rather than re-deriving a new magic number when
// ActionFab's position changed (exactly the class of bug the Sprint 15.7 note
// in CLAUDE.md warns about), the panel now imports FAB_BOTTOM/FAB_SIZE and
// computes its offset from them, so it can never drift out of sync again.
// Panel styling also picked up the same glass treatment as GlassCard.

import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, UtensilsCrossed, Layers3, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FAB_BOTTOM, FAB_SIZE } from './ActionFab';

const MENU_BOTTOM = FAB_BOTTOM + FAB_SIZE + 16;

export type FabActionId = 'quicklog' | 'restaurants' | 'plate';

interface FabAction {
  id: FabActionId;
  label: string;
  icon: LucideIcon;
}

const ACTIONS: FabAction[] = [
  { id: 'quicklog', label: 'רישום חופשי', icon: Wand2 },
  { id: 'restaurants', label: 'מסעדות', icon: UtensilsCrossed },
  { id: 'plate', label: 'בנה צלחת', icon: Layers3 },
];

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
};

export interface FabMenuProps {
  open: boolean;
  onClose: () => void;
  onPickAction: (id: FabActionId) => void;
}

export function FabMenu({ open, onClose, onPickAction }: FabMenuProps) {
  const T = useTheme();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-30"
          style={{ background: T.t.overlayBg }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            className="fixed left-1/2 flex flex-col gap-2"
            style={{ bottom: MENU_BOTTOM, width: 240, x: '-50%' }}
            variants={listVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <motion.button
                  key={a.id}
                  variants={itemVariants}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onPickAction(a.id)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold w-full"
                  style={{
                    background: T.mode === 'dark' ? `${T.t.modalBg}D9` : `${T.t.modalBg}F5`,
                    color: T.t.textPrimary,
                    border: `1px solid ${T.mode === 'dark' ? 'rgba(255,255,255,0.1)' : T.t.border}`,
                    backdropFilter: 'blur(18px) saturate(160%)',
                    WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                    boxShadow: '0 12px 28px -12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}
                >
                  <Icon size={16} color={T.accent} /> {a.label}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
