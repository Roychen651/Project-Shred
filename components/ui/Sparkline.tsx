'use client';

// ProjectShred.artifact.jsx:2542-2585. A hand-rolled SVG sparkline — no
// charting library anywhere in this app, matching the rest of the port
// (custom rings, dual trendlines, heatmap).
//
// Sprint 14 — the trend line and its endpoint dot now glow with the same
// two-layer neon-tube technique used on CompositeHeroRing (a wide soft bloom
// + a tighter bright bloom, merged under the crisp source stroke), matching
// dark mode's now-unchained aesthetic.

import { useId } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { FONT_MONO } from '@/lib/theme/tokens';
import { formatShortDate } from '@/lib/domain/dates';

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface SparklineProps {
  data: SparklinePoint[];
  color: string;
  unit: string;
}

export function Sparkline({ data, color, unit }: SparklineProps) {
  const glowId = `sparkline-glow-${useId().replace(/:/g, '')}`;
  const w = 280, h = 70, pad = 6;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals) - 0.5;
  const max = Math.max(...vals) + 0.5;
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const areaPath = `${path} L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`;
  const last = data[data.length - 1];
  const first = data[0];
  const trendUp = last.value > first.value;
  const gradId = `grad-${color.replace('#', '')}`;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={glowId} x="-60%" y="-100%" width="220%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="wideBloom" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="tightBloom" />
            <feMerge>
              <feMergeNode in="wideBloom" />
              <feMergeNode in="tightBloom" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={i === points.length - 1 ? 4 : 2.5} fill={color} filter={`url(#${glowId})`} />
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs" style={{ fontFamily: FONT_MONO }}>{formatShortDate(first.date)} → {formatShortDate(last.date)}</span>
        <div className="flex items-center gap-1">
          {trendUp ? <TrendingUp size={13} color={color} /> : <TrendingDown size={13} color={color} />}
          <span className="text-xs font-bold" style={{ color, fontFamily: FONT_MONO }}>
            {last.value}{unit}
          </span>
        </div>
      </div>
    </div>
  );
}
