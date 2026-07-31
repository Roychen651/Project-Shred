'use client';

// Sprint 19 — a real 3D spatial-hover effect (perspective + rotateX/rotateY
// tracking the cursor, plus a glare that moves with it), the Framer-Motion-
// only alternative to reaching for a heavier animation library. Deliberately
// its own wrapper rather than baked into GlassCard: not every card should
// tilt (a settings row or a sheet's ingredient list would just feel broken),
// so this composes around whichever card actually earns the treatment.
//
// Gated behind `(hover: hover) and (pointer: fine)` — because continuous
// mousemove tracking has no equivalent on touch, and forcing it there would
// either do nothing useful or fight the user's own scroll/tap gestures.
// Below that threshold this renders as a perfectly normal flat card; the
// tilt is a bonus for the input device that can actually produce a "cursor
// position," not a requirement.
//
// Read via useSyncExternalStore, not useState+useEffect — matchMedia is
// state that lives outside React, and deriving it with an effect that calls
// setState synchronously on mount is exactly the react-hooks/set-state-in-
// effect trap this codebase has hit and fixed repeatedly elsewhere (see
// useViewportHeight.ts's identical note). This is the same fix, reused.
import { useRef, useSyncExternalStore, type ReactNode, type CSSProperties } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion';

function subscribeToHoverCapability(): () => void {
  return () => {};
}
function getHoverCapability(): boolean {
  // jsdom (this app's test environment) doesn't implement matchMedia at all —
  // guarding here means test-rendering any TiltCard consumer doesn't require
  // every test file to know about and mock this component's internals.
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
function getServerHoverCapability(): boolean {
  return false;
}

export interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
  glare?: boolean;
  /** Must match the wrapped card's own border-radius — the glare overlay is a
   * sibling of `children`, not a descendant, so CSS `inherit` can't pick this
   * up from the card automatically. Every card in this app currently uses the
   * same 24px radius (see GlassCard.tsx), hence the shared default. */
  borderRadius?: number;
}

export function TiltCard({ children, className = '', style = {}, maxTilt = 8, glare = true, borderRadius = 24 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const tiltEnabled = useSyncExternalStore(subscribeToHoverCapability, getHoverCapability, getServerHoverCapability);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [maxTilt, -maxTilt]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-maxTilt, maxTilt]), { stiffness: 300, damping: 30 });
  const glareBg = useMotionTemplate`radial-gradient(circle at ${useTransform(px, (v) => `${v * 100}%`)} ${useTransform(py, (v) => `${v * 100}%`)}, rgba(255,255,255,0.14), transparent 55%)`;

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEnabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };
  const handleLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ perspective: 1000 }} className={className}>
      <motion.div
        style={{
          rotateX: tiltEnabled ? rotateX : 0,
          rotateY: tiltEnabled ? rotateY : 0,
          transformStyle: 'preserve-3d',
          position: 'relative',
          ...style,
        }}
      >
        {children}
        {/* No overflow:hidden on the wrapper above — that would clip the
         * card's own box-shadow/glow, which is the whole point of GlassCard's
         * multi-layer shadow. A div always clips its OWN background to its
         * OWN border-radius regardless of its parent, so giving the glare
         * layer the same radius as the card is enough to round it correctly
         * without touching the wrapper at all. */}
        {glare && tiltEnabled && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: glareBg, mixBlendMode: 'overlay', borderRadius }}
          />
        )}
      </motion.div>
    </div>
  );
}
