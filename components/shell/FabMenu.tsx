'use client';

// ProjectShred.artifact.jsx:5640-5674 (Sprint 14). The three actions, their
// labels/icons, and the panel's position (bottom: 158 — precisely computed to
// clear the FAB's own height, per the Sprint 15.7 bugfix note in CLAUDE.md) are
// unchanged. The CSS opacity/translateY transition is replaced with an
// AnimatePresence + spring, plus a staggered entrance across the 3 buttons — a
// new touch (the artifact animated all three as one block) in the spirit of the
// sprint 3 "fluid, deeply responsive" mandate.

import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, UtensilsCrossed, Layers3, type LucideIcon } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

export type FabActionId = 'quicklog' | 'cibus' | 'plate';

interface FabAction {
  id: FabActionId;
  label: string;
  icon: LucideIcon;
}

const ACTIONS: FabAction[] = [
  { id: 'quicklog', label: 'רישום חופשי', icon: Wand2 },
  { id: 'cibus', label: 'בחר ב-Cibus', icon: UtensilsCrossed },
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
            style={{ bottom: 158, width: 240, x: '-50%' }}
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
                  style={{ background: T.t.modalBg, color: T.t.textPrimary, border: `1px solid ${T.t.border}`, boxShadow: '0 8px 20px -10px rgba(0,0,0,0.3)' }}
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
