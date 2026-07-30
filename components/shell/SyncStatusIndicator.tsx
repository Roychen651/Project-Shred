'use client';

// Sprint 10 — the "subtle UI indicator" half of the offline-resilience
// mandate. useSyncStatusStore (lib/store/sync-status.ts) already carries an
// 'offline' status distinct from 'error' (a real failure) — this just
// renders it. Deliberately silent for every other status (idle/saving/
// saved/error): the mandate asked specifically for an offline cue, and a
// header full of spinner/checkmark churn on every debounced save would be
// noise, not signal.
import { CloudOff } from 'lucide-react';
import { useSyncStatusStore } from '@/lib/store/sync-status';
import { useTheme } from '@/lib/theme/ThemeContext';

export function SyncStatusIndicator() {
  const status = useSyncStatusStore((s) => s.status);
  const T = useTheme();
  if (status !== 'offline') return null;

  return (
    <div
      className="flex items-center justify-center rounded-xl"
      style={{ width: 38, height: 38, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
      title="לא מחובר לרשת — השינויים יישמרו בענן כשהחיבור יחזור"
      aria-label="לא מקוון"
    >
      <CloudOff size={16} color={T.macro.kcal} />
    </div>
  );
}
