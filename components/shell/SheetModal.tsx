'use client';

// ProjectShred.artifact.jsx:5287-5328 (Sprint 14, hardened through Sprints
// 15.8-15.22 — see CLAUDE.md for the long history of viewport/scroll bugs this
// exact structure fixes). Layout, sizing (useViewportHeight-measured pixels, not
// a CSS vh guess), and the `bare` prop's three-region contract are unchanged.
//
// New in Sprint 3, per the "no clunky CSS transitions" mandate: the slide-up is
// a real spring (AnimatePresence + motion), and the sheet can be dragged down by
// its handle/header to dismiss — a native-feeling gesture the artifact never had.
// The drag is bound to the handle only (via useDragControls + dragListener=false)
// rather than the whole panel, so it can never fight the body's own scroll.
//
// Sprint 14 follow-up: the "unchained dark mode" glass/glow pass (GlassCard.tsx,
// SettingsModal/OnboardingWizard/CustomIngredientModal) never actually reached
// this component — a real gap, confirmed from a live screenshot of the Plate
// Composer sheet still showing the old flat T.t.modalBg fill. This is arguably
// the highest-traffic surface in the whole app (every food-logging flow opens
// through here), so it gets the same treatment now: frosted background, heavy
// blur/saturate, bright top highlight, layered shadow — matching GlassCard's
// dark-mode branch exactly rather than inventing a second variant.
//
// Sprint 16: top corner radius bumped 24px -> 32px to match GlassCard's larger
// radius bump — same "shapes felt dated" feedback, same fix.
//
// Sprint 18: dark background flipped from a light frost tint to genuine dark
// smoked glass (rgba(10,10,10,0.6)) — mirrors the identical change in
// GlassCard.tsx, same reasoning: light-tinted glass over the new near-black
// page read gray, not obsidian.
//
// Sprint 20: top radius bumped once more, 32px -> 40px, matching GlassCard's
// squircle bump (24 -> 32) — the sheet is the single largest rounded surface
// in the app, so it reads the increase most.

import { useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { useViewportHeight, useViewportOffsetTop } from '@/lib/hooks/useViewportHeight';
import { FONT_DISPLAY } from '@/lib/theme/tokens';

export interface SheetModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** When set, the child fully owns its internal layout (a flex-1/min-height:0/
   * overflow:hidden container) instead of a single auto-scroll region. */
  bare?: boolean;
}

const DISMISS_OFFSET = 120; // px dragged down
const DISMISS_VELOCITY = 600; // px/s

export function SheetModal({ open, onClose, title, children, bare }: SheetModalProps) {
  const T = useTheme();
  const vh = useViewportHeight();
  const viewportOffsetTop = useViewportOffsetTop();
  const panelHeight = Math.round(vh * 0.85);
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_e: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed z-40 flex items-end justify-center"
          // Sprint 29 — top/height driven by the real, measured visual
          // viewport (see useViewportOffsetTop's note) instead of `inset-0`,
          // so the overlay — and the sheet bottom-aligned inside it — stays
          // glued to whatever's actually visible when the keyboard opens,
          // rather than the bottom of the page underneath it.
          style={{ background: T.t.overlayBg, top: viewportOffsetTop, left: 0, right: 0, height: vh }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full flex flex-col"
            style={{
              maxWidth: 640,
              borderTopLeftRadius: 40, borderTopRightRadius: 40,
              height: panelHeight, maxHeight: panelHeight,
              background: T.mode === 'dark' ? 'rgba(10,10,10,0.6)' : T.t.modalBg,
              borderTop: `1px solid ${T.mode === 'dark' ? 'rgba(255,255,255,0.1)' : T.t.border}`,
              borderInline: T.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : 'none',
              boxShadow: T.mode === 'dark'
                ? '0 30px 60px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
                : '0 -20px 50px -20px rgba(33,28,22,0.28)',
              backdropFilter: T.mode === 'dark' ? 'blur(40px) saturate(200%)' : 'none',
              WebkitBackdropFilter: T.mode === 'dark' ? 'blur(40px) saturate(200%)' : 'none',
              overflow: 'hidden',
              touchAction: 'none',
            }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 400 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div
              className="flex-shrink-0 rounded-t-3xl"
              style={{ background: 'transparent', touchAction: 'none', cursor: 'grab' }}
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="flex justify-center pt-3 pb-1">
                <span className="rounded-full" style={{ width: 36, height: 4, background: T.t.border }} />
              </div>
              <div className="flex items-center justify-between px-5 pb-3">
                <h3 className="text-base font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{title}</h3>
                <button
                  onClick={onClose}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg"
                  style={{ background: T.t.chipBg }}
                  aria-label="סגור"
                >
                  <X size={15} color={T.t.textSecondary} />
                </button>
              </div>
            </div>
            {bare ? (
              <div className="flex-1 flex flex-col" style={{ minHeight: 0, overflow: 'hidden', touchAction: 'pan-y' }}>{children}</div>
            ) : (
              <div
                className="px-5 pb-8 flex-1"
                style={{ minHeight: 0, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                {children}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
