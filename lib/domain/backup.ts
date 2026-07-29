// Full-state export/import shape. ProjectShred.artifact.jsx:1339, 1452-1468.
//
// Preserved for milestone 7 (importing an existing artifact backup into a real
// account) — this is how a user's real body metrics and history get in, since the
// new-user bootstrap trigger seeds generic template values, not personal ones.
//
// NOTE — pre-existing inconsistency, ported as-is rather than silently fixed:
// the artifact's own APP_VERSION constant ('3.1.0') was never bumped past Sprint
// 13, even though CLAUDE.md's Version History lists Sprint 16 as "v3.3 — current".
// Changing the string here wouldn't affect any macro math, but it would change
// what's embedded in already-exported backups' `version` field, so it's left
// exactly as the artifact has it rather than guessed at.
export const APP_VERSION = '3.1.0';

export interface BackupState {
  profiles: unknown;
  activeProfileId: string;
  mode: string;
  accentKey: string;
  density: string;
  feedback: boolean;
  hasSeenOnboarding: boolean;
  aiReport: unknown;
  apiConfig: { provider: string; key?: string };
  dailyLogs: unknown;
  metricEntries: unknown;
  customRestaurants: unknown;
  customHacks: unknown;
  itemsByDate: unknown;
  customIngredients: unknown;
  favorites: unknown;
  exerciseLogs: unknown;
}

export interface FullBackup {
  version: string;
  exportedAt: string;
  profiles: unknown;
  activeProfileId: string;
  theme: { mode: string; accentKey: string; density: string; feedback: boolean };
  hasSeenOnboarding: boolean;
  aiReport: unknown;
  apiConfig: { provider: string; key: '' };
  dailyLogs: unknown;
  metricEntries: unknown;
  customRestaurants: unknown;
  customHacks: unknown;
  itemsByDate: unknown;
  customIngredients: unknown;
  favorites: unknown;
  exerciseLogs: unknown;
}

// `now` is injectable — see the note in dates.ts. The raw API key is never
// included (`key: ''`), matching the Sprint 9 security rule: "never export the key".
export function buildFullBackup(state: BackupState, now: Date = new Date()): FullBackup {
  return {
    version: APP_VERSION,
    exportedAt: now.toISOString(),
    profiles: state.profiles,
    activeProfileId: state.activeProfileId,
    theme: { mode: state.mode, accentKey: state.accentKey, density: state.density, feedback: state.feedback },
    hasSeenOnboarding: state.hasSeenOnboarding,
    aiReport: state.aiReport,
    apiConfig: { provider: state.apiConfig.provider, key: '' },
    dailyLogs: state.dailyLogs,
    metricEntries: state.metricEntries,
    customRestaurants: state.customRestaurants,
    customHacks: state.customHacks,
    itemsByDate: state.itemsByDate,
    customIngredients: state.customIngredients,
    favorites: state.favorites,
    exerciseLogs: state.exerciseLogs,
  };
}
