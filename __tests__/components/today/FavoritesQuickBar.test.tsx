import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { FavoritesQuickBar } from '@/components/today/FavoritesQuickBar';
import type { Favorite } from '@/lib/store/shred-store';

const FAVORITES: Favorite[] = [
  { id: 'fav-1', name: 'מעדן חלבון', icon: '🥤', kcal: 140, protein: 15, carbs: 13, fat: 3 },
  { id: 'fav-2', name: '3 ביצים', icon: '🥚', kcal: 233, protein: 19, carbs: 1.6, fat: 16.5 },
];

describe('FavoritesQuickBar', () => {
  it('renders a chip per favorite with its name and calories', () => {
    render(<ThemeProvider><FavoritesQuickBar favorites={FAVORITES} onLog={vi.fn()} onSave={vi.fn()} onDelete={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('מעדן חלבון')).toBeInTheDocument();
    expect(screen.getByText('3 ביצים')).toBeInTheDocument();
  });

  it('tapping a chip logs that exact favorite in one tap — no picker, no confirmation screen', async () => {
    const user = userEvent.setup();
    const onLog = vi.fn();
    render(<ThemeProvider><FavoritesQuickBar favorites={FAVORITES} onLog={onLog} onSave={vi.fn()} onDelete={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByText('מעדן חלבון'));
    expect(onLog).toHaveBeenCalledTimes(1);
    expect(onLog).toHaveBeenCalledWith(FAVORITES[0]);
  });

  it('the "+ מועדף" chip opens the builder and saves a brand-new favorite', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<ThemeProvider><FavoritesQuickBar favorites={FAVORITES} onLog={vi.fn()} onSave={onSave} onDelete={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByText('מועדף'));
    expect(screen.getByText('מועדף חדש')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('לדוגמה: שייק חלבון בוקר'), 'טוסט חלבון');
    await user.click(screen.getByText('שמירת מועדף'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ name: 'טוסט חלבון' });
  });

  it('the edit pencil on an existing chip opens the builder pre-filled and offers deletion', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<ThemeProvider><FavoritesQuickBar favorites={FAVORITES} onLog={vi.fn()} onSave={vi.fn()} onDelete={onDelete} /></ThemeProvider>);
    await user.click(screen.getAllByLabelText('ערוך מועדף')[0]);
    expect(screen.getByText('עריכת מועדף')).toBeInTheDocument();
    expect(screen.getByDisplayValue('מעדן חלבון')).toBeInTheDocument();
    await user.click(screen.getByText('מחק מועדף זה'));
    expect(onDelete).toHaveBeenCalledWith('fav-1');
  });
});
