'use client';

// Sprint 9 — a shared, animated validation-error message for every Auth form.
// AnimatePresence + a spring pop-in/out (not just conditional rendering) plus
// a short horizontal shake on mount — the same "give the mistake a felt
// moment, not just text that appears" language framer-motion is used for
// elsewhere in this app (ExerciseRow's PR badge, Sprint 6).

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';

export function AuthError({ message }: { message: string | null }) {
  const T = useTheme();
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.p
          key={message}
          initial={{ opacity: 0, y: -6, x: 0 }}
          animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
          exit={{ opacity: 0, y: -6 }}
          transition={{
            opacity: { duration: 0.18 },
            y: { type: 'spring', stiffness: 420, damping: 26 },
            x: { duration: 0.4, ease: 'easeOut' },
          }}
          className="flex items-center gap-1.5 text-xs"
          style={{ color: T.macro.kcal }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
