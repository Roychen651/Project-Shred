// One-decimal rounding used throughout the app for grams/protein/carbs/fat display.
// Calories are always whole numbers (Math.round directly); this is only for the rest.
export function roundNum(n: number): number {
  return Math.round(n * 10) / 10;
}

// Same id shape the artifact used everywhere (`${prefix}-${Date.now()}-${random}`),
// factored out once instead of re-typed at each call site.
export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
