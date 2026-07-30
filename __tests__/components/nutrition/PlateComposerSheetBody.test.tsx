import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { PlateComposerSheetBody } from '@/components/nutrition/PlateComposerSheetBody';

describe('PlateComposerSheetBody', () => {
  it('starts with the first ingredient of the first category selected, showing its raw macros at 100g', () => {
    render(<ThemeProvider><PlateComposerSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    // First INGREDIENT_CATEGORIES entry is 'protein', first protein entry is
    // חזה עוף (chicken-breast) — appears both in the picker list and the
    // selected-detail header, so scope to the latter with 'selector'.
    expect(screen.getByText('חזה עוף', { selector: 'span' })).toBeInTheDocument();
    // Default portion is the "gram" unit at qty 100 — PortionInput shows the
    // quantity in its own number field and the unit's short label (גר׳,
    // PORTION_UNITS' own geresh-punctuated label) separately, not
    // concatenated into one text node like the old grams-only slider did.
    expect(screen.getByLabelText('כמות')).toHaveValue(100);
    expect(screen.getByText('גר׳')).toBeInTheDocument();
  });

  it('search finds an ingredient outside the currently-selected category', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><PlateComposerSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('חפשו מרכיב...'), 'בננה');
    expect(screen.getByRole('button', { name: 'בננה' })).toBeInTheDocument();
  });

  it('selecting an ingredient and adding it appends a plate line with live totals', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><PlateComposerSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByText('הוסף לצלחת'));
    expect(screen.getByText(/הצלחת שלכם \(1 פריטים\)/)).toBeInTheDocument();
    expect(screen.getByText(/חזה עוף · 100 גר/)).toBeInTheDocument();
  });

  it('the raw/cooked toggle only appears for ingredients that have a cooked variant', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><PlateComposerSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    // חזה עוף has a cooked variant.
    expect(screen.getByText('גולמי')).toBeInTheDocument();
    expect(screen.getByText('מבושל')).toBeInTheDocument();

    // Search for an ingredient with no cooked variant (eggs).
    await user.type(screen.getByPlaceholderText('חפשו מרכיב...'), 'ביצים');
    await user.click(screen.getByRole('button', { name: 'ביצים' }));
    expect(screen.queryByText('גולמי')).not.toBeInTheDocument();
  });

  it('assigning the plate calls onConfirm with one spec per line and clears the plate', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><PlateComposerSheetBody onConfirm={onConfirm} defaultSlotId="dinner" /></ThemeProvider>);
    await user.click(screen.getByText('הוסף לצלחת'));
    await user.click(screen.getByText('אשר ושבץ בארוחה'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [specs, slotId] = onConfirm.mock.calls[0];
    expect(slotId).toBe('dinner');
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({ source: 'plate', calories: 120 }); // raw chicken breast @100g: kcal 120
    expect(screen.queryByText(/הצלחת שלכם/)).not.toBeInTheDocument();
  });

  it('removing a plate line drops it from the totals', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><PlateComposerSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByText('הוסף לצלחת'));
    expect(screen.getByText(/הצלחת שלכם \(1 פריטים\)/)).toBeInTheDocument();
    // The plate line row's only button is its Trash2 remove control.
    const plateRow = screen.getByText(/חזה עוף · 100 גר/).closest('div')!;
    await user.click(plateRow.querySelector('button')!);
    expect(screen.queryByText(/הצלחת שלכם/)).not.toBeInTheDocument();
  });
});
