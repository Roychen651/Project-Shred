'use client';

// ProjectShred.artifact.jsx:2336-2366 (Sprint 4/16). Countdown ring for one
// exercise's rest period; only one timer runs app-wide (WorkoutPanel owns
// `activeTimer` state) — matches real training (you rest one exercise at a
// time), documented in CLAUDE.md's Known Simplifications.
//
// Sprint 6 premium upgrade: the plain 1s-linear stroke transition is joined by
// the same feGaussianBlur+feMerge SVG glow technique CompositeHeroRing uses
// (Sprint 5), so the ring has a subtle neon presence while actually running —
// not while idle, so it doesn't compete visually with the rest of the row.

import { useId } from 'react';
import { Pause, Play } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';

export interface ActiveTimer {
  id: string;
  secondsLeft: number;
  total: number;
}

export interface RestTimerProps {
  seconds: number;
  id: string;
  activeTimer: ActiveTimer | null;
  setActiveTimer: (t: ActiveTimer | null) => void;
}

export function RestTimer({ seconds, id, activeTimer, setActiveTimer }: RestTimerProps) {
  const T = useTheme();
  const uid = useId().replace(/:/g, '');
  const isActive = activeTimer?.id === id;
  const secondsLeft = isActive ? activeTimer.secondsLeft : seconds;
  const pct = isActive ? 1 - secondsLeft / seconds : 0;
  const r = 15;
  const circ = 2 * Math.PI * r;
  const glowId = `rest-timer-glow-${uid}`;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-9 h-9">
        <svg width={36} height={36} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          <defs>
            <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={18} cy={18} r={r} stroke={T.t.border} strokeWidth={3} fill="none" />
          <circle
            cx={18} cy={18} r={r} stroke={T.accent} strokeWidth={3} fill="none"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            strokeLinecap="round"
            filter={isActive ? `url(#${glowId})` : undefined}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <button
          onClick={() => setActiveTimer(isActive ? null : { id, secondsLeft: seconds, total: seconds })}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={isActive ? 'עצור טיימר מנוחה' : 'התחל טיימר מנוחה'}
        >
          {isActive ? <Pause size={13} color={T.accent} /> : <Play size={13} color={T.t.textSecondary} />}
        </button>
      </div>
      <span className="text-xs" style={{ fontFamily: FONT_MONO, color: isActive ? T.accent : T.t.textDim }}>
        {isActive ? `${secondsLeft}s` : `${seconds}s מנוחה`}
      </span>
    </div>
  );
}
