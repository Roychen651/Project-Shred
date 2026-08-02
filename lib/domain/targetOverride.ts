// Sprint 45 — manual macro/calorie target tuning ("Custom Macro & Target
// Tuning" in the mandate), with live rebalancing: overriding kcal and/or
// protein and/or fat re-derives carbs as the remainder, the exact same
// "carbs absorb whatever calories remain" philosophy targets.ts's own
// Mifflin-St Jeor chain already uses (see computeProfileTargets — protein
// and fat come from bodyweight, carbs is always `(kcal - protein*4 - fat*9)/4`).
//
// Deliberately NOT inside targets.ts: that file's own header calls its math
// "THE MATH IS SACRED" — computeProfileTargets() must keep producing the
// exact, unmodified Mifflin-St Jeor numbers so the "מאיפה היעד הקלורי הזה?"
// science explainer stays truthful about how the *default* target was
// derived. A manual override is a deliberate deviation from that default,
// so it lives here as a pure wrapper around computeProfileTargets()'s
// output — the sacred math is computed once, in full, and only then
// selectively overridden.
import type { ComputedTargets, DayTargets } from './targets';

export interface TargetOverrideInput {
  kcal?: number;
  protein?: number;
  fat?: number;
}

function deriveCarbs(kcal: number, protein: number, fat: number): number {
  return Math.max(Math.round((kcal - protein * 4 - fat * 9) / 4), 0);
}

// The override is specified against the REST day (the tuning panel's frame
// of reference — it's what the person sees and edits). The training day is
// then re-derived from the OVERRIDDEN rest values using the exact same
// +300kcal/+75g-carb refeed delta computeProfileTargets() applies — not
// independently overridden and re-derived from scratch, which could let the
// two drift apart by a rounding error. runIntegrityChecks() (see
// lib/domain/diagnostics.ts) asserts this delta is exactly +300kcal/+75g;
// this keeps that invariant true even under a manual override.
export function applyTargetOverride(
  computed: ComputedTargets,
  override: TargetOverrideInput | null | undefined
): ComputedTargets {
  if (!override || (override.kcal == null && override.protein == null && override.fat == null)) {
    return computed;
  }
  const kcal = override.kcal ?? computed.rest.kcal;
  const protein = override.protein ?? computed.rest.protein;
  const fat = override.fat ?? computed.rest.fat;
  const carbs = deriveCarbs(kcal, protein, fat);
  const rest: DayTargets = { ...computed.rest, kcal, protein, fat, carbs };
  const training: DayTargets = { ...computed.training, kcal: kcal + 300, protein, fat, carbs: carbs + 75 };
  return { ...computed, rest, training };
}
