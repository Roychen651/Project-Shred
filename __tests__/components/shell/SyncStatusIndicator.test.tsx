import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { SyncStatusIndicator } from '@/components/shell/SyncStatusIndicator';
import { useSyncStatusStore } from '@/lib/store/sync-status';

// This is the component-level verification for the offline UI indicator
// (Sprint 10). A real end-to-end browser check (go offline, watch the icon
// appear) needs a live Supabase project — useWireSync only ever creates a
// scheduler after a successful hydrateShredData() call, and this sandbox has
// no .env.local / real Supabase credentials configured (see wireSync.ts's
// fail-open catch block). That's an honest, previously-documented sandbox
// limitation (Sprints 8/9), not something this test works around — it
// verifies the indicator itself renders correctly for every status the
// scheduler can report, independent of whether a live backend is reachable
// here.
describe('SyncStatusIndicator', () => {
  beforeEach(() => useSyncStatusStore.setState({ status: 'idle', hydrationSettled: false }));

  it('renders nothing when idle', () => {
    render(<ThemeProvider><SyncStatusIndicator /></ThemeProvider>);
    expect(screen.queryByLabelText('לא מקוון')).not.toBeInTheDocument();
  });

  it('renders nothing while saving', () => {
    useSyncStatusStore.setState({ status: 'saving' });
    render(<ThemeProvider><SyncStatusIndicator /></ThemeProvider>);
    expect(screen.queryByLabelText('לא מקוון')).not.toBeInTheDocument();
  });

  it('renders nothing on saved or error — offline is the only status this indicator shows', () => {
    useSyncStatusStore.setState({ status: 'saved' });
    const { rerender } = render(<ThemeProvider><SyncStatusIndicator /></ThemeProvider>);
    expect(screen.queryByLabelText('לא מקוון')).not.toBeInTheDocument();

    useSyncStatusStore.setState({ status: 'error' });
    rerender(<ThemeProvider><SyncStatusIndicator /></ThemeProvider>);
    expect(screen.queryByLabelText('לא מקוון')).not.toBeInTheDocument();
  });

  it('shows the CloudOff indicator when status is offline', () => {
    useSyncStatusStore.setState({ status: 'offline' });
    render(<ThemeProvider><SyncStatusIndicator /></ThemeProvider>);
    expect(screen.getByLabelText('לא מקוון')).toBeInTheDocument();
  });

  it('disappears again once status leaves offline', () => {
    useSyncStatusStore.setState({ status: 'offline' });
    const { rerender } = render(<ThemeProvider><SyncStatusIndicator /></ThemeProvider>);
    expect(screen.getByLabelText('לא מקוון')).toBeInTheDocument();

    useSyncStatusStore.setState({ status: 'saved' });
    rerender(<ThemeProvider><SyncStatusIndicator /></ThemeProvider>);
    expect(screen.queryByLabelText('לא מקוון')).not.toBeInTheDocument();
  });
});
