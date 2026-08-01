import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { FavoriteBuilderModal } from '@/components/today/FavoriteBuilderModal';

describe('FavoriteBuilderModal', () => {
  it('renders nothing when closed', () => {
    render(<ThemeProvider><FavoriteBuilderModal open={false} onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    expect(screen.queryByText('מועדף חדש')).not.toBeInTheDocument();
  });

  it('saves a brand-new favorite with a fresh id when no seed is given', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ThemeProvider><FavoriteBuilderModal open onClose={vi.fn()} onSave={onSave} /></ThemeProvider>);
    await user.type(screen.getByPlaceholderText('לדוגמה: שייק חלבון בוקר'), 'שייק ערב');
    const numberInputs = screen.getAllByRole('spinbutton');
    await user.type(numberInputs[0], '150'); // kcal
    await user.type(numberInputs[1], '25'); // protein
    await user.click(screen.getByText('שמירת מועדף'));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved).toMatchObject({ name: 'שייק ערב', kcal: 150, protein: 25 });
    expect(saved.id).toBeTruthy();
  });

  it('the save button stays disabled until a name is entered', async () => {
    render(<ThemeProvider><FavoriteBuilderModal open onClose={vi.fn()} onSave={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('שמירת מועדף').closest('button')).toBeDisabled();
  });

  it('pre-fills from a seed (editing an existing favorite) and reuses its id', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const seed = { id: 'fav-1', name: 'מעדן חלבון', icon: '🥤', kcal: 140, protein: 15, carbs: 13, fat: 3 };
    render(<ThemeProvider><FavoriteBuilderModal open onClose={vi.fn()} onSave={onSave} seed={seed} /></ThemeProvider>);
    expect(screen.getByText('עריכת מועדף')).toBeInTheDocument();
    expect(screen.getByDisplayValue('מעדן חלבון')).toBeInTheDocument();
    await user.click(screen.getByText('שמירת מועדף'));
    expect(onSave.mock.calls[0][0]).toMatchObject({ id: 'fav-1', name: 'מעדן חלבון', kcal: 140 });
  });

  // Sprint 42 — the "how many units does this favorite represent" field
  // that backs FavoritesQuickBar's quantity adjuster.
  it('defaults unitCount to 1 for a brand-new favorite, and saves it', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ThemeProvider><FavoriteBuilderModal open onClose={vi.fn()} onSave={onSave} /></ThemeProvider>);
    expect(screen.getByText('כמות ברירת מחדל (יחידות)')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('לדוגמה: שייק חלבון בוקר'), 'חטיף');
    await user.click(screen.getByText('שמירת מועדף'));
    expect(onSave.mock.calls[0][0]).toMatchObject({ unitCount: 1 });
  });

  it('pre-fills unitCount from a seed (e.g. "3 eggs") and lets it be adjusted with the stepper', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const seed = { id: 'fav-eggs', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5, unitCount: 3 };
    render(<ThemeProvider><FavoriteBuilderModal open onClose={vi.fn()} onSave={onSave} seed={seed} /></ThemeProvider>);
    await user.click(screen.getByLabelText('הוסף כמות ברירת מחדל (יחידות)'));
    await user.click(screen.getByText('שמירת מועדף'));
    expect(onSave.mock.calls[0][0]).toMatchObject({ unitCount: 3.5 });
  });
});
