import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { QuickLogSheetBody } from '@/components/nutrition/QuickLogSheetBody';

describe('QuickLogSheetBody', () => {
  it('parses free text and shows a preview with computed macros', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'בננה');
    await user.click(screen.getByText('פענח'));
    // 'selector' scopes past the textarea, which also contains the typed text 'בננה'.
    expect(screen.getByText('בננה', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('אשר והוסף ליומן')).toBeInTheDocument();
  });

  it('shows a "no match" message for unrecognized text', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'משהו לא מוכר לגמרי');
    await user.click(screen.getByText('פענח'));
    expect(screen.getByText('לא זוהו מאכלים ידועים — נסו שם מאכל ברור יותר.')).toBeInTheDocument();
  });

  it('confirm calls onConfirm with normalized LogItemSpecs and the selected slot', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={onConfirm} defaultSlotId="breakfast" /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'בננה');
    await user.click(screen.getByText('פענח'));
    await user.click(screen.getByText('אשר והוסף ליומן'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    const [specs, slotId] = onConfirm.mock.calls[0];
    expect(slotId).toBe('breakfast');
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({ name: 'בננה', source: 'quicklog' });
  });

  it('clears the text and preview after confirming', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    const textarea = screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...');
    await user.type(textarea, 'בננה');
    await user.click(screen.getByText('פענח'));
    await user.click(screen.getByText('אשר והוסף ליומן'));
    expect(textarea).toHaveValue('');
    expect(screen.queryByText('אשר והוסף ליומן')).not.toBeInTheDocument();
  });

  it('saves a parsed item as a favorite, quantity baked in, when onSaveFavorite is wired', async () => {
    const user = userEvent.setup();
    const onSaveFavorite = vi.fn();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} onSaveFavorite={onSaveFavorite} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'אכלתי 200 גרם חזה עוף');
    await user.click(screen.getByText('פענח'));
    await user.click(screen.getByLabelText('שמור כמועדף'));
    // The builder modal opens pre-filled from the parsed item's exact macros.
    expect(await screen.findByText('מועדף חדש')).toBeInTheDocument();
    await user.click(screen.getByText('שמירת מועדף'));
    expect(onSaveFavorite).toHaveBeenCalledTimes(1);
    expect(onSaveFavorite.mock.calls[0][0]).toMatchObject({ name: 'חזה עוף', kcal: 320, protein: 60 });
  });

  it('does not render a save-favorite affordance when onSaveFavorite is not wired', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'בננה');
    await user.click(screen.getByText('פענח'));
    await user.click(screen.getByLabelText('שמור כמועדף'));
    expect(screen.queryByText('מועדף חדש')).not.toBeInTheDocument();
  });

  // Sprint 44 — direct feedback: "need an option to adapt the weights/
  // measurements of the products it identified." Every parsed row now
  // carries an adjustable ×N multiplier, defaulting to exactly the
  // recognized amount and scaling every downstream use (totals, confirm,
  // save-as-favorite) — not just the row's own display.
  it('defaults every parsed row to ×1 (exactly as recognized)', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'אכלתי 200 גרם חזה עוף');
    await user.click(screen.getByText('פענח'));
    expect(screen.getByText('×1')).toBeInTheDocument();
  });

  it('increasing the quantity adjuster scales the confirmed spec and appends a ×N suffix to the name', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={onConfirm} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'אכלתי 200 גרם חזה עוף');
    await user.click(screen.getByText('פענח'));
    await user.click(screen.getByLabelText('שנה כמות'));
    await user.click(screen.getByLabelText('הוסף כמות')); // ×1 -> ×1.25
    await user.click(screen.getByLabelText('הוסף כמות')); // ×1.25 -> ×1.5
    await user.click(screen.getByLabelText('סיום עריכת כמות'));
    await user.click(screen.getByText('אשר והוסף ליומן'));
    const [specs] = onConfirm.mock.calls[0];
    expect(specs[0]).toMatchObject({ name: 'חזה עוף (×1.5)', calories: 320 * 1.5, protein: 60 * 1.5 });
  });

  it('decreasing the adjuster below ×1 and saving as a favorite captures the reduced quantity, not the full default', async () => {
    const user = userEvent.setup();
    const onSaveFavorite = vi.fn();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} onSaveFavorite={onSaveFavorite} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן גמדים...'), 'אכלתי 200 גרם חזה עוף');
    await user.click(screen.getByText('פענח'));
    await user.click(screen.getByLabelText('שנה כמות'));
    await user.click(screen.getByLabelText('הפחת כמות')); // ×1 -> ×0.75
    await user.click(screen.getByLabelText('הפחת כמות')); // ×0.75 -> ×0.5
    await user.click(screen.getByLabelText('שמור כמועדף'));
    expect(await screen.findByText('מועדף חדש')).toBeInTheDocument();
    await user.click(screen.getByText('שמירת מועדף'));
    expect(onSaveFavorite.mock.calls[0][0]).toMatchObject({ name: 'חזה עוף (×0.5)', kcal: 320 * 0.5, protein: 60 * 0.5 });
  });
});
