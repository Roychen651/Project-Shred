'use client';

// ProjectShred.artifact.jsx:3872-3911. One custom SVG plotting weight and
// waist on two independent normalized y-scales sharing one x-axis, plus a
// dashed target-waist line — no charting library, matching the rest of the
// app. Sprint 7 adds the same feGaussianBlur+feMerge glow technique already
// used on the hero ring (Sprint 5) and the rest-timer ring (Sprint 6) to both
// trendlines, for visual consistency across every custom SVG chart in the app.

import { useId } from 'react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import { formatShortDate } from '@/lib/domain/dates';
import { TARGET_WAIST_CM } from '@/lib/domain/analytics';
import type { MetricEntry } from '@/lib/store/shred-store';

export interface DualTrendChartProps {
  entries: (MetricEntry & { weight: number; waist: number })[];
}

export function DualTrendChart({ entries }: DualTrendChartProps) {
  const T = useTheme();
  const uid = useId().replace(/:/g, '');
  const w = 560, h = 180, pad = 24;
  const weights = entries.map((e) => e.weight);
  const waists = entries.map((e) => e.waist);
  const wMin = Math.min(...weights) - 1, wMax = Math.max(...weights) + 1;
  const waMin = Math.min(...waists, TARGET_WAIST_CM) - 2, waMax = Math.max(...waists) + 2;

  const x = (i: number) => pad + (i / Math.max(entries.length - 1, 1)) * (w - pad * 2);
  const yW = (v: number) => h - pad - ((v - wMin) / (wMax - wMin || 1)) * (h - pad * 2);
  const yWa = (v: number) => h - pad - ((v - waMin) / (waMax - waMin || 1)) * (h - pad * 2);

  const weightPath = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yW(e.weight)}`).join(' ');
  const waistPath = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${yWa(e.waist)}`).join(' ');
  const targetY = yWa(TARGET_WAIST_CM);
  const glowWeightId = `trend-glow-w-${uid}`;
  const glowWaistId = `trend-glow-wa-${uid}`;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <filter id={glowWeightId} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={glowWaistId} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1={pad} y1={targetY} x2={w - pad} y2={targetY} stroke={T.t.textDim} strokeWidth="1.5" strokeDasharray="4 4" />
        <path d={waistPath} fill="none" stroke={T.macro.kcal} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowWaistId})`} />
        <path d={weightPath} fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowWeightId})`} />
        {entries.map((e, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={yW(e.weight)} r={i === entries.length - 1 ? 4 : 2.5} fill={T.accent} />
            <circle cx={x(i)} cy={yWa(e.waist)} r={i === entries.length - 1 ? 4 : 2.5} fill={T.macro.kcal} />
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2 flex-wrap gap-2 text-xs" style={{ fontFamily: FONT_MONO }}>
        <div className="flex items-center gap-3">
          <span style={{ color: T.accent }}>● משקל</span>
          <span style={{ color: T.macro.kcal }}>● היקף מותן</span>
          <span style={{ color: T.t.textDim }}>┄ יעד {TARGET_WAIST_CM}cm</span>
        </div>
        <span style={{ color: T.t.textDim }}>{formatShortDate(entries[0].date)} → {formatShortDate(entries[entries.length - 1].date)}</span>
      </div>
    </div>
  );
}
