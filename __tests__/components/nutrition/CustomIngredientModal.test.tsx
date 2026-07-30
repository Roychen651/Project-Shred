import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { CustomIngredientModal } from '@/components/nutrition/CustomIngredientModal';

describe('CustomIngredientModal', () => {
  it('renders nothing when closed', () => {
    render(<ThemeProvider><CustomIngredientModal open={false} onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    expect(screen.queryByText('מרכיב אישי חדש')).not.toBeInTheDocument();
  });

  it('autofocuses the name field on open', async () => {
    render(<ThemeProvider><CustomIngredientModal open onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    const nameInput = screen.getByPlaceholderText('לדוגמה: יוגורט חלבון וניל');
    await vi.waitFor(() => expect(nameInput).toHaveFocus());
  });

  it('the save button is disabled until a name is entered', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><CustomIngredientModal open onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('שמירת מרכיב')).toBeDisabled();
    await user.type(screen.getByPlaceholderText('לדוגמה: יוגורט חלבון וניל'), 'דוגמה');
    expect(screen.getByText('שמירת מרכיב')).not.toBeDisabled();
  });

  it('saving builds a CustomIngredient with a real uuid id and the entered macros', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ThemeProvider><CustomIngredientModal open onClose={vi.fn()} onSave={onSave} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('לדוגמה: יוגורט חלבון וניל'), 'מוצר לדוגמה');
    await user.type(screen.getAllByPlaceholderText('0')[0], '150');
    await user.click(screen.getByText('שמירת מרכיב'));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved.name).toBe('מוצר לדוגמה');
    expect(saved.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(saved.hasCookedVariant).toBe(false);
    expect(saved.raw.kcal).toBe(150);
  });

  it('quick-duplicate: searching and picking an existing ingredient pre-fills the form', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><CustomIngredientModal open onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByText('שכפול מהיר ממרכיב קיים'));
    await user.type(screen.getByPlaceholderText(/חפשו מרכיב לשכפול/), 'חזה עוף');
    // "חזה עוף" is a substring of both חזה עוף and חזה עוף מעושן — pick the exact one.
    await user.click(screen.getByText('חזה עוף', { selector: 'span' }));
    const nameInput = screen.getByPlaceholderText('לדוגמה: יוגורט חלבון וניל') as HTMLInputElement;
    expect(nameInput.value).toBe('חזה עוף');
  });

  it('closing and reopening resets the form (no stale draft leaking into the next entry)', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ThemeProvider><CustomIngredientModal open onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('לדוגמה: יוגורט חלבון וניל'), 'טיוטה ישנה');
    rerender(<ThemeProvider><CustomIngredientModal open={false} onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    rerender(<ThemeProvider><CustomIngredientModal open onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    const nameInput = screen.getByPlaceholderText('לדוגמה: יוגורט חלבון וניל') as HTMLInputElement;
    expect(nameInput.value).toBe('');
  });
});
