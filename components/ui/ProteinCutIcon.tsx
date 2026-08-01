'use client';

// Sprint 39 — a hand-drawn steak/meat-cut glyph replacing the generic
// lucide-react <Beef> icon everywhere the app marks "protein" (MacroLine,
// HeroRingLegend, PlateComposerSheetBody's MacroReadout, the Today tab's
// MacroStatTile). Informed by a reference sheet of meat-cut illustrations
// supplied specifically as design material for this pass — a rounded cut
// with soft marbling streaks across it — the same way TabBeamTransition's
// burger-layer shapes were informed by their own reference sheet: hand-
// authored SVG paths, not the reference images themselves (this app has
// never embedded stock art; every illustration is drawn the same way, see
// components/ui/AnimatedIllustrations.tsx).

export interface ProteinCutIconProps {
  size?: number;
  color?: string;
}

export function ProteinCutIcon({ size = 16, color = 'currentColor' }: ProteinCutIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4.2 13.6c-.7-3.1 1.3-6.3 4.9-7.4 2.2-.7 4.6-.3 6.5 1.1 2.4 1.8 3.5 4.7 2.6 7.4-.9 2.8-3.6 4.6-6.5 4.3-1.8-.2-3-1.4-4.4-2.2-1.7-1-3.5-1.2-4.1-3.2z"
        fill={color}
      />
      <path d="M6.8 10.2c1.3-.7 2.9-.8 4.2-.2" stroke="rgba(255,255,255,0.55)" strokeWidth={0.9} strokeLinecap="round" />
      <path d="M8.3 13.1c1.5-.6 3.3-.5 4.7.3" stroke="rgba(255,255,255,0.5)" strokeWidth={0.9} strokeLinecap="round" />
      <path d="M10.4 16.1c1.1-.4 2.3-.2 3.3.3" stroke="rgba(255,255,255,0.45)" strokeWidth={0.9} strokeLinecap="round" />
    </svg>
  );
}
