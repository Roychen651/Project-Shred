'use client';

// Sprint 40 — a second, more direct pass at actually using the vegetable/
// salad doodle reference sheet supplied back in Sprint 38. Sprint 39's
// response to that reference was indirect (a few extra unicode emoji added
// to FoodConfetti's list) — real, but not a hand-drawn use of the sheet the
// way the burger layers (TabBeamTransition) and the meat-cut reference
// (ProteinCutIcon) already were. These four are the same treatment applied
// to the vegetable sheet: loose, doodle-style hand-authored SVG paths (a
// deliberately imperfect, sketched line quality — not a clean geometric
// icon-font glyph), matching the reference sheet's own loose-outline style.
// Still no embedded stock art (this app has never done that, see
// AnimatedIllustrations.tsx) — these are drawn shapes informed by the
// reference, not traces of it. Used in FoodConfetti so the "vegetable
// confetti" the person asked for in Sprint 37 is, for part of the burst,
// actually hand-drawn vegetable art rather than only emoji glyphs.

export interface DoodleIconProps {
  size?: number;
}

export function CarrotDoodle({ size = 24 }: DoodleIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M8.5 8.5c2-2.3 5.3-3.6 7.8-1.1s-1.2 5.8-3.5 7.8L6.2 21 3 17.8z" fill="#E8722C" stroke="#B8531A" strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M9 9.5c.6 1 .6 2.4 0 3.4M11 11.3c.6 1 .6 2.2 0 3.1" stroke="rgba(0,0,0,0.18)" strokeWidth={0.8} strokeLinecap="round" />
      <path d="M13 4.5c1.4-.9 3-.6 3.6.6M15.6 2.8c1.1-.4 2.3.1 2.6 1.2M11.8 3.4c1-1.1 2.5-1.3 3.4-.4" stroke="#4C8C3B" strokeWidth={1.6} strokeLinecap="round" />
    </svg>
  );
}

export function ChiliDoodle({ size = 24 }: DoodleIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 5.2c1.7-.6 2.9.4 2.6 1.9-.5 2.6-3 4-3.4 7.2-.3 2.6 1.6 5 4.4 5.4 3.4.5 6.9-2.3 7.4-6.3.4-3-1.3-4.9-3.6-4.6-1.2.2-1.6-1-.7-1.9 1-1 1-2.3-.4-2.6-2-.5-4.8.3-6.3 1"
        fill="#D8382C" stroke="#A32218" strokeWidth={0.8} strokeLinejoin="round" strokeLinecap="round"
      />
      <path d="M6.4 5.2c-1-.4-1.7-1.7-1.2-2.7" stroke="#4C8C3B" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M10 10.5c1.6-.4 3 .3 3.4 1.8" stroke="rgba(255,255,255,0.4)" strokeWidth={0.9} strokeLinecap="round" />
    </svg>
  );
}

export function OnionDoodle({ size = 24 }: DoodleIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5c1.3 1.6 1.7 3 1.6 4.3 3 .8 5.2 4 5.2 7.4 0 3.5-3 5.6-6.8 5.6s-6.8-2.1-6.8-5.6c0-3.4 2.2-6.6 5.2-7.4-.1-1.3.3-2.7 1.6-4.3z" fill="#C9A6DE" stroke="#8E5BAF" strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M9.5 10.5c-.5 3-.5 6 .3 8.8M14.5 10.5c.5 3 .5 6-.3 8.8" stroke="rgba(255,255,255,0.55)" strokeWidth={0.8} strokeLinecap="round" />
      <path d="M12 3.5c-.4.9-.5 1.9-.3 2.9M12 3.5c.4.9.5 1.9.3 2.9" stroke="#5B9A4A" strokeWidth={1.3} strokeLinecap="round" />
    </svg>
  );
}

export function MushroomDoodle({ size = 24 }: DoodleIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 11.5C4 7.5 7.6 4.5 12 4.5s8 3 8 7c0 .8-.7 1.2-1.5 1.1-2-.3-4-1.6-6.5-1.6s-4.5 1.3-6.5 1.6C4.7 12.7 4 12.3 4 11.5z" fill="#C97B4A" stroke="#93552C" strokeWidth={0.8} strokeLinejoin="round" />
      <path d="M8.5 12.3v4.6c0 2 1.6 3.6 3.5 3.6s3.5-1.6 3.5-3.6v-4.6" fill="#F3E4D0" stroke="#93552C" strokeWidth={0.8} strokeLinejoin="round" />
      <circle cx="9" cy="8.5" r="1" fill="rgba(255,255,255,0.5)" />
      <circle cx="14.5" cy="7.5" r="0.8" fill="rgba(255,255,255,0.4)" />
    </svg>
  );
}

export const VEGGIE_DOODLES = [CarrotDoodle, ChiliDoodle, OnionDoodle, MushroomDoodle];
