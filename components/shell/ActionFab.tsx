'use client';

// ProjectShred.artifact.jsx:5676-5692 (Sprint 14). The artifact rotated the "+"
// to an "×" via a plain CSS `transition: transform 0.25s ease`. Per the sprint 3
// mandate, this is now real spring physics — the exact `{ type: 'spring',
// stiffness: 300, damping: 30 }` example — plus a tactile press-scale on tap,
// which the artifact had no equivalent of at all (button:active { scale(0.96) }
// was a global, generic rule; this is a purpose-built spring on the one control
// that's tapped most often in the app).
//
// Positioning (fixed, bottom-center) stays on a plain wrapper div rather than the
// motion component itself — framer-motion writes `rotate`/`scale` through its own
// transform pipeline, which would silently fight a hand-written
// `translateX(-50%)` in the same `style.transform` string.
//
// Sprint 5: flat `background: T.accent` replaced with a `color-mix()` two-stop
// gradient (accent → a lightened mix of the same accent) for real dimensionality
// instead of a flat disc, plus a stronger dual-layer glow. Bottom offset raised
// from 84 to FAB_BOTTOM so it still clears the now-floating (previously
// edge-flush) BottomNav pill with a clean gap — see BottomNav.tsx.

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

export const FAB_BOTTOM = 108;
export const FAB_SIZE = 58;

export interface ActionFabProps {
  open: boolean;
  onToggle: () => void;
}

export function ActionFab({ open, onToggle }: ActionFabProps) {
  const T = useTheme();
  return (
    <div className="fixed z-40" style={{ bottom: FAB_BOTTOM, left: '50%', transform: 'translateX(-50%)' }}>
      <motion.button
        onClick={onToggle}
        className="flex items-center justify-center rounded-full"
        style={{
          width: FAB_SIZE,
          height: FAB_SIZE,
          background: `linear-gradient(155deg, color-mix(in srgb, ${T.accent} 100%, white 18%), ${T.accent} 55%, color-mix(in srgb, ${T.accent} 100%, black 20%))`,
          boxShadow: `${T.glow(T.accent, 22, '4c')}, 0 6px 20px -6px ${T.accent}80, inset 0 1px 0 rgba(255,255,255,0.35)`,
        }}
        animate={{ rotate: open ? 45 : 0 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        aria-label="הוסף"
      >
        <Plus size={26} color="#07080B" strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
