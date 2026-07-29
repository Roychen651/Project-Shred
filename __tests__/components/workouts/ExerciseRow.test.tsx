import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { ExerciseRow } from '@/components/workouts/ExerciseRow';
import type { Exercise } from '@/lib/data/workouts';

const ex: Exercise = { name: 'סקוואט גב', sets: 4, reps: '4', rest: 180 };

function renderRow(overrides: Partial<Parameters<typeof ExerciseRow>[0]> = {}) {
  return render(
    <ThemeProvider>
      <ExerciseRow
        ex={ex}
        isLast={false}
        done={undefined}
        toggleSet={vi.fn()}
        activeTimer={null}
        setActiveTimer={vi.fn()}
        loggedSet={undefined}
        onLogSet={vi.fn()}
        lastSet={null}
        {...overrides}
      />
    </ThemeProvider>
  );
}

describe('ExerciseRow', () => {
  it('renders one set circle per ex.sets and calls toggleSet with the exercise name and index', async () => {
    const user = userEvent.setup();
    const toggleSet = vi.fn();
    renderRow({ toggleSet });
    const setButtons = screen.getAllByText(/^[1-4]$/).map((el) => el.closest('button')!);
    expect(setButtons).toHaveLength(4);
    await user.click(setButtons[0]);
    expect(toggleSet).toHaveBeenCalledWith('סקוואט גב', 0);
  });

  it('commits weight/reps onBlur, not on every keystroke', async () => {
    const user = userEvent.setup();
    const onLogSet = vi.fn();
    renderRow({ onLogSet });
    const weightInput = screen.getByPlaceholderText('ק״ג');
    await user.type(weightInput, '100');
    expect(onLogSet).not.toHaveBeenCalled();
    await user.tab();
    expect(onLogSet).toHaveBeenCalledWith('סקוואט גב', { weight: 100, reps: undefined });
  });

  it('shows a PR badge when the typed weight beats the last logged session', async () => {
    const user = userEvent.setup();
    renderRow({ lastSet: { date: '2026-07-15', weight: 100, reps: 5 } });
    const weightInput = screen.getByPlaceholderText('ק״ג');
    await user.type(weightInput, '102.5');
    expect(screen.getByText('+2.5ק״ג PR 🏆')).toBeInTheDocument();
  });

  it('shows a plain (non-PR) delta badge when the typed weight is lower than last time', async () => {
    const user = userEvent.setup();
    renderRow({ lastSet: { date: '2026-07-15', weight: 100, reps: 5 } });
    const weightInput = screen.getByPlaceholderText('ק״ג');
    await user.type(weightInput, '95');
    expect(screen.getByText('-5ק״ג')).toBeInTheDocument();
    expect(screen.queryByText(/PR/)).not.toBeInTheDocument();
  });

  it('shows no badge at all when there is no prior session to compare against', async () => {
    const user = userEvent.setup();
    renderRow({ lastSet: null });
    const weightInput = screen.getByPlaceholderText('ק״ג');
    await user.type(weightInput, '80');
    expect(screen.queryByText(/ק״ג$/)).not.toBeInTheDocument();
  });
});
