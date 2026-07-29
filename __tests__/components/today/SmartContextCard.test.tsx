import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { SmartContextCard } from '@/components/today/SmartContextCard';
import type { LoggedItem } from '@/lib/domain/items';

function item(overrides: Partial<LoggedItem> = {}): LoggedItem {
  return {
    id: 'i1', dateKey: '2026-07-20', slotId: 'lunch', name: 'Test',
    baseCalories: 500, baseProtein: 40, baseCarbs: 50, baseFats: 10,
    grams: 100, isCompleted: true, source: 'manual',
    ...overrides,
  };
}

describe('SmartContextCard', () => {
  // Faking only Date (not setTimeout/setInterval) pins getCurrentSlotId's
  // `new Date()` read without also freezing the real timers userEvent needs
  // internally — faking everything (vi.useFakeTimers()'s default) deadlocks
  // any userEvent interaction, since userEvent's internal waits never resolve
  // and vi.advanceTimersByTime doesn't flush the microtasks between them either.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 6, 20, 13, 5)); // 13:05 -> "now" is lunch (13:00)
  });
  afterEach(() => vi.useRealTimers());

  it('shows the current slot with no items logged yet', () => {
    render(<ThemeProvider><SmartContextCard items={[]} onQuickComplete={vi.fn()} onEdit={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('13:00 · עכשיו')).toBeInTheDocument();
    expect(screen.getByText('🍲 צהריים')).toBeInTheDocument();
    expect(screen.getByText('עדיין לא שובץ פריט לחלון הזה')).toBeInTheDocument();
    expect(screen.getByText('הוסף')).toBeInTheDocument(); // edit button label when empty
  });

  it('summarizes logged item names for the current slot and disables complete when empty', () => {
    render(<ThemeProvider><SmartContextCard items={[]} onQuickComplete={vi.fn()} onEdit={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('סמן הכל כבוצע').closest('button')).toBeDisabled();
  });

  it('shows item names and an enabled complete button once something is logged', async () => {
    const user = userEvent.setup();
    const onQuickComplete = vi.fn();
    const items = [item({ name: 'עוף בגריל', isCompleted: false })];
    render(<ThemeProvider><SmartContextCard items={items} onQuickComplete={onQuickComplete} onEdit={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('עוף בגריל')).toBeInTheDocument();
    const completeBtn = screen.getByText('סמן הכל כבוצע').closest('button')!;
    expect(completeBtn).not.toBeDisabled();
    await user.click(completeBtn);
    expect(onQuickComplete).toHaveBeenCalledWith('lunch');
  });

  it('shows "סומן כבוצע" once the resolved current slot is done', () => {
    // getCurrentSlotId only ever returns an already-completed slot via its
    // last-resort fallback ("the day is entirely done") — a completed slot
    // is always excluded from the nextEmpty match, by design (see
    // lib/domain/slots.ts). So this has to mirror that exact scenario: it's
    // after every slot's time (21:00) and the last slot (dinner) is done.
    vi.setSystemTime(new Date(2026, 6, 20, 21, 0));
    render(<ThemeProvider><SmartContextCard items={[item({ slotId: 'dinner', isCompleted: true })]} onQuickComplete={vi.fn()} onEdit={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('סומן כבוצע')).toBeInTheDocument();
  });

  it('onEdit receives the current slot id', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ThemeProvider><SmartContextCard items={[]} onQuickComplete={vi.fn()} onEdit={onEdit} /></ThemeProvider>);
    await user.click(screen.getByText('הוסף'));
    expect(onEdit).toHaveBeenCalledWith('lunch');
  });
});
