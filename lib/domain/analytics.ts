// Day-level adherence scoring and the weekly report. ProjectShred.artifact.jsx:1253-1291, 3913-3928.

import { roundNum } from './util';
import { addDays, dateKey } from './dates';
import type { DayTargets, ComputedTargets } from './targets';

export const TARGET_WAIST_CM = 90;
export const HEATMAP_WEEKS = 6; // 6 weeks = 42 days

export interface DayLog {
  kcal: number;
  protein: number;
  carbs?: number;
  fat?: number;
  workoutDone?: boolean;
  workoutDay?: string | null;
}

// 50% protein accuracy + 50% calorie accuracy against whichever target (training
// or rest) that day's workoutDone flag implies. Protein ratio is capped at 1 —
// over-hitting protein doesn't push the score past what hitting it exactly gives.
export function scoreDayLog(log: DayLog | null | undefined, targets: DayTargets): number | null {
  if (!log) return null;
  const proteinRatio = targets.protein > 0 ? Math.min(log.protein / targets.protein, 1) : 0;
  const kcalDelta = targets.kcal > 0 ? Math.abs(log.kcal - targets.kcal) / targets.kcal : 1;
  const kcalRatio = Math.max(0, 1 - kcalDelta);
  return Math.round((proteinRatio * 0.5 + kcalRatio * 0.5) * 100);
}

export interface MacroColorSet {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
}

// Buckets a score into one of the app's 3 fixed heat colors (or null for
// genuinely unlogged days). Takes the resolved hex set as a parameter rather than
// reading theme state directly, since this file has no React/theme dependency.
export function heatColor(score: number | null | undefined, macro: MacroColorSet): string | null {
  if (score === null || score === undefined) return null;
  if (score >= 90) return macro.protein; // on point
  if (score >= 75) return macro.kcal; // slight deviation
  return macro.fat; // needs attention
}

export interface MetricEntry {
  date: string;
  weight?: number;
  waist?: number;
}

export interface WeeklyReport {
  avgCompliance: number;
  avgProtein: number;
  workoutDays: number;
  weightDelta: number;
  waistDelta: number;
  loggedDays: number;
}

// `today` is injectable — see the note in dates.ts. Production callers omit it.
export function buildWeeklyReport(
  dailyLogs: Record<string, DayLog>,
  metricEntries: MetricEntry[],
  computed: ComputedTargets,
  today: Date = new Date()
): WeeklyReport {
  const last7Keys = Array.from({ length: 7 }, (_, i) => dateKey(addDays(today, -i)));
  const last7Logs = last7Keys.map((k) => dailyLogs[k]).filter((l): l is DayLog => Boolean(l));

  const scores = last7Logs
    .map((log) => scoreDayLog(log, log.workoutDone ? computed.training : computed.rest))
    .filter((s): s is number => s !== null);
  const avgCompliance = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const avgProtein = last7Logs.length ? Math.round(last7Logs.reduce((a, l) => a + l.protein, 0) / last7Logs.length) : 0;
  const workoutDays = last7Logs.filter((l) => l.workoutDone).length;

  const recent = metricEntries.slice(-2);
  const weightDelta = recent.length === 2 ? roundNum((recent[1].weight ?? 0) - (recent[0].weight ?? 0)) : 0;
  const waistDelta = recent.length === 2 ? Math.round((recent[1].waist ?? 0) - (recent[0].waist ?? 0)) : 0;

  return { avgCompliance, avgProtein, workoutDays, weightDelta, waistDelta, loggedDays: last7Logs.length };
}
