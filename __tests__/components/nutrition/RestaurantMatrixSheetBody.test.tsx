import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { RestaurantMatrixSheetBody } from '@/components/nutrition/RestaurantMatrixSheetBody';

describe('RestaurantMatrixSheetBody', () => {
  it('renders real items from EATING_OUT_MENU by default', () => {
    render(<ThemeProvider><RestaurantMatrixSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('משולש פיצה (רגילה)')).toBeInTheDocument();
  });

  it('search filters the list to matching names only', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><RestaurantMatrixSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('חפשו מנה...'), 'פיצה');
    expect(screen.getByText('משולש פיצה (רגילה)')).toBeInTheDocument();
    expect(screen.queryByText('המבורגר קלאסי')).not.toBeInTheDocument();
  });

  it('a category pill filters to just that category', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><RestaurantMatrixSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByText('שתייה'));
    expect(screen.getByText(/קוקה קולה רגילה/)).toBeInTheDocument();
    expect(screen.queryByText('משולש פיצה (רגילה)')).not.toBeInTheDocument();
  });

  it('tapping "+" on a row logs it to the selected slot with source "restaurant"', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><RestaurantMatrixSheetBody onConfirm={onConfirm} defaultSlotId="dinner" /></ThemeProvider>);
    await user.click(screen.getByLabelText('הוסף משולש פיצה (רגילה)'));
    expect(onConfirm).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'משולש פיצה (רגילה)', calories: 285, source: 'restaurant' })],
      'dinner'
    );
  });

  it('changing the slot picker changes which slot new logs go to', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><RestaurantMatrixSheetBody onConfirm={onConfirm} defaultSlotId="lunch" /></ThemeProvider>);
    await user.click(screen.getByText('🌅')); // breakfast slot pill
    await user.click(screen.getByLabelText('הוסף משולש פיצה (רגילה)'));
    const [, slotId] = onConfirm.mock.calls[0];
    expect(slotId).toBe('breakfast');
  });
});
