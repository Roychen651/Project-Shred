import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { QuickLogSheetBody } from '@/components/nutrition/QuickLogSheetBody';

describe('QuickLogSheetBody', () => {
  it('parses free text and shows a preview with computed macros', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן GO...'), 'בננה');
    await user.click(screen.getByText('פענח'));
    // 'selector' scopes past the textarea, which also contains the typed text 'בננה'.
    expect(screen.getByText('בננה', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('אשר והוסף ליומן')).toBeInTheDocument();
  });

  it('shows a "no match" message for unrecognized text', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={vi.fn()} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן GO...'), 'משהו לא מוכר לגמרי');
    await user.click(screen.getByText('פענח'));
    expect(screen.getByText('לא זוהו מאכלים ידועים — נסו שם מאכל ברור יותר.')).toBeInTheDocument();
  });

  it('confirm calls onConfirm with normalized LogItemSpecs and the selected slot', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ThemeProvider><QuickLogSheetBody onConfirm={onConfirm} defaultSlotId="breakfast" /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('במבה קטנה ומעדן GO...'), 'בננה');
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
    const textarea = screen.getByPlaceholderText('במבה קטנה ומעדן GO...');
    await user.type(textarea, 'בננה');
    await user.click(screen.getByText('פענח'));
    await user.click(screen.getByText('אשר והוסף ליומן'));
    expect(textarea).toHaveValue('');
    expect(screen.queryByText('אשר והוסף ליומן')).not.toBeInTheDocument();
  });
});
