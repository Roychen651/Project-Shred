'use client';

// Sprint 22 — a named wrapper that composes the existing Sprint 20/22
// illustrations with a short, human-centric Hebrew line, for the specific
// spots where a plain empty state or a bare "0" reads as cold rather than
// encouraging. Deliberately thin: it does not duplicate any animation
// logic (that lives in AnimatedIllustrations.tsx) — it only picks the right
// illustration + copy pairing for a given moment and lays them out
// consistently, so every "premium nudge" in the app shares one visual
// rhythm instead of each call site inventing its own microcopy card.

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_BODY, FONT_DISPLAY } from '@/lib/theme/tokens';
import { AnimatedPulsingDumbbell, AnimatedJumpingLettuce, AnimatedRunner } from './AnimatedIllustrations';

export type MotivatorVariant = 'workout-start' | 'nutrition-empty' | 'goal-hit';

const COPY: Record<MotivatorVariant, { title: string; subtitle: string }> = {
  'workout-start': { title: 'הגוף מוכן, מתי מתחילים?', subtitle: 'כל סט שתסמנו מקרב אתכם ליעד של היום' },
  'nutrition-empty': { title: 'הצלחת עוד ריקה — בואו נמלא אותה נכון', subtitle: 'כל מה שתרשמו מעדכן את הטבעת בזמן אמת' },
  'goal-hit': { title: 'יעד המשמעת של היום הושג', subtitle: 'ביצוע עקבי כזה הוא מה שבאמת מזיז את המחט' },
};

const ILLUSTRATIONS: Record<MotivatorVariant, typeof AnimatedPulsingDumbbell> = {
  'workout-start': AnimatedPulsingDumbbell,
  'nutrition-empty': AnimatedJumpingLettuce,
  'goal-hit': AnimatedRunner,
};

export interface PremiumMotivatorProps {
  variant: MotivatorVariant;
}

export function PremiumMotivator({ variant }: PremiumMotivatorProps) {
  const T = useTheme();
  const Illustration = ILLUSTRATIONS[variant];
  const copy = COPY[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-center gap-3 px-4 py-3 rounded-3xl"
      style={{
        background: `${T.accent}0f`,
        border: `1px solid ${T.accent}26`,
      }}
    >
      <div className="flex-shrink-0 flex items-center justify-center" style={{ width: 44, height: 44 }}>
        <Illustration size={40} color={T.accent} />
      </div>
      <div>
        <div className="text-sm font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{copy.title}</div>
        <div className="text-xs mt-0.5" style={{ color: T.t.textSecondary, fontFamily: FONT_BODY }}>{copy.subtitle}</div>
      </div>
    </motion.div>
  );
}
