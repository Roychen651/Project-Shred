import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { KitchenHacksSheetBody } from '@/components/nutrition/KitchenHacksSheetBody';

describe('KitchenHacksSheetBody', () => {
  it('renders real recipes from HACKS by default', () => {
    render(<ThemeProvider><KitchenHacksSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('שקשוקה')).toBeInTheDocument();
  });

  it('search filters the list to matching names/details only', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><KitchenHacksSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('חפשו מתכון...'), 'שקשוקה');
    expect(screen.getByText('שקשוקה')).toBeInTheDocument();
    expect(screen.queryByText('ביצה קשה עם מלח')).not.toBeInTheDocument();
  });

  it('a category pill filters to just that category', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><KitchenHacksSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByText('חטיף'));
    expect(screen.getByText('ביצה קשה עם מלח')).toBeInTheDocument();
    expect(screen.queryByText('שקשוקה')).not.toBeInTheDocument();
  });

  it('tapping "+" on a row logs it to the selected slot with source "hack"', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><KitchenHacksSheetBody onConfirm={onConfirm} defaultSlotId="dinner" /></ThemeProvider>);
    await user.click(screen.getByLabelText('הוסף שקשוקה'));
    expect(onConfirm).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'שקשוקה', calories: 320, protein: 18, carbs: 15, fats: 20, source: 'hack' })],
      'dinner'
    );
  });

  it('changing the slot picker changes which slot new logs go to', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><KitchenHacksSheetBody onConfirm={onConfirm} defaultSlotId="lunch" /></ThemeProvider>);
    await user.click(screen.getByText('🌅')); // breakfast slot pill
    await user.click(screen.getByLabelText('הוסף שקשוקה'));
    const [, slotId] = onConfirm.mock.calls[0];
    expect(slotId).toBe('breakfast');
  });
});
