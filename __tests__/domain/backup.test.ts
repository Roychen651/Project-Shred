import { describe, it, expect } from 'vitest';
import { buildFullBackup, APP_VERSION, type BackupState } from '@/lib/domain/backup';

const baseState: BackupState = {
  profiles: { mine: { name: 'test' } },
  activeProfileId: 'mine',
  mode: 'dark', accentKey: 'emerald', density: 'comfortable', feedback: true,
  hasSeenOnboarding: true,
  aiReport: null,
  apiConfig: { provider: 'groq', key: 'super-secret-should-never-leave' },
  dailyLogs: {}, metricEntries: [], customRestaurants: [], customHacks: [],
  itemsByDate: {}, customIngredients: [], favorites: [], exerciseLogs: {},
};

describe('buildFullBackup', () => {
  it('never includes the raw API key, even when one is set', () => {
    const backup = buildFullBackup(baseState, new Date(2026, 6, 26));
    expect(backup.apiConfig).toEqual({ provider: 'groq', key: '' });
  });

  it('stamps version and exportedAt', () => {
    const now = new Date(2026, 6, 26, 10, 0);
    const backup = buildFullBackup(baseState, now);
    expect(backup.version).toBe(APP_VERSION);
    expect(backup.exportedAt).toBe(now.toISOString());
  });

  it('nests theme fields and passes every other collection through unchanged', () => {
    const backup = buildFullBackup(baseState, new Date());
    expect(backup.theme).toEqual({ mode: 'dark', accentKey: 'emerald', density: 'comfortable', feedback: true });
    expect(backup.profiles).toBe(baseState.profiles);
    expect(backup.itemsByDate).toBe(baseState.itemsByDate);
  });
});
