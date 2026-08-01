'use client';

// Sprint 37 — "after finishing entering a meal, show a confetti burst of
// vegetables/food pieces etc." A lightweight, self-contained particle burst
// (no canvas-confetti or any new dependency — this app has consistently
// avoided pulling in animation libraries beyond framer-motion, already
// installed everywhere else). Deliberately reserved for the deliberate,
// session-culminating logging flows (a sheet's confirm action) rather than
// the Today tab's one-tap Favorites bar — a full celebratory burst on every
// single quick-tap of a favorite (already has its own "✓ נוסף!" pop from
// Sprint 31) would turn a low-friction, repeated action into a noisy one;
// see app/page.tsx's handleLog for where this fires.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Sprint 39 — the emoji set was cross-checked against a reference sheet of
// vegetable/produce illustrations supplied as design material (tomato,
// mushroom, onion, chili, pineapple, olive, broccoli) — added the items
// that reference specifically called out and this list was missing
// (mushroom, onion, chili, pineapple, olive), on top of what was already
// here.
const FOOD_EMOJI = ['🥕', '🥦', '🍅', '🥑', '🌽', '🫑', '🍗', '🥩', '🧀', '🍞', '🍓', '🥚', '🍋', '🍄', '🧅', '🌶️', '🍍', '🫒', '🥬', '🍆'];
const PARTICLE_COUNT = 16;
const DURATION_MS = 1000;

export interface FoodConfettiProps {
  onDone: () => void;
}

export function FoodConfetti({ onDone }: FoodConfettiProps) {
  useEffect(() => {
    const t = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(t);
  }, [onDone]);

  // Randomized once per mount (a fresh burst every time this remounts, since
  // the parent keys it per-trigger) via a useState LAZY INITIALIZER — the
  // one place React's render-purity rules explicitly permit non-deterministic
  // work (it runs exactly once, is never re-invoked on re-render, unlike a
  // useMemo callback which the linter treats as render-time code that must
  // stay pure/idempotent).
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
      const distance = 80 + Math.random() * 130;
      return {
        emoji: FOOD_EMOJI[Math.floor(Math.random() * FOOD_EMOJI.length)],
        x: Math.cos(angle) * distance,
        yPeak: -40 - Math.random() * 40,
        yFall: 70 + Math.random() * 50,
        rotate: (Math.random() - 0.5) * 420,
        delay: Math.random() * 0.1,
        size: 20 + Math.random() * 16,
      };
    })
  );

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center overflow-hidden" style={{ pointerEvents: 'none' }} aria-hidden="true">
      <div className="relative" style={{ width: 0, height: 0 }}>
        {particles.map((p, i) => (
          <motion.span
            key={i}
            className="absolute"
            style={{ fontSize: p.size, left: 0, top: 0, willChange: 'transform, opacity' }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
            animate={{
              x: p.x,
              y: [0, p.yPeak, p.yFall],
              opacity: [0, 1, 0],
              scale: [0.3, 1, 0.85],
              rotate: p.rotate,
            }}
            transition={{ duration: 0.9, delay: p.delay, ease: [0.2, 0.75, 0.4, 1], times: [0, 0.4, 1] }}
          >
            {p.emoji}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
