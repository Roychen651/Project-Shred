import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { BottomNav, NAV_TABS } from '@/components/shell/BottomNav';

function renderNav(activeTab: 'today' | 'nutrition' | 'workouts' | 'insights', setActiveTab = vi.fn()) {
  render(<ThemeProvider><BottomNav activeTab={activeTab} setActiveTab={setActiveTab} /></ThemeProvider>);
  return setActiveTab;
}

describe('BottomNav', () => {
  it('renders all 4 tabs with their Hebrew labels, in order', () => {
    renderNav('today');
    expect(NAV_TABS.map((t) => t.label)).toEqual(['היום', 'תזונה', 'אימונים', 'תובנות']);
    for (const tab of NAV_TABS) {
      expect(screen.getByText(tab.label)).toBeInTheDocument();
    }
  });

  it('marks the active tab with aria-current', () => {
    renderNav('nutrition');
    expect(screen.getByText('תזונה').closest('button')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('היום').closest('button')).not.toHaveAttribute('aria-current');
  });

  it('clicking a tab calls setActiveTab with its id', async () => {
    const user = userEvent.setup();
    const setActiveTab = renderNav('today');
    await user.click(screen.getByText('אימונים'));
    expect(setActiveTab).toHaveBeenCalledWith('workouts');
  });
});
