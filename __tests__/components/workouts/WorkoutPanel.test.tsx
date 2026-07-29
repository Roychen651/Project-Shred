import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { WorkoutPanel } from '@/components/workouts/WorkoutPanel';

function renderPanel(overrides: Partial<Parameters<typeof WorkoutPanel>[0]> = {}) {
  const onWorkoutActivity = vi.fn();
  const onLogSet = vi.fn();
  const utils = render(
    <ThemeProvider>
      <WorkoutPanel
        exerciseLogs={{}}
        selectedDateKey="2026-07-29"
        onWorkoutActivity={onWorkoutActivity}
        onLogSet={onLogSet}
        {...overrides}
      />
    </ThemeProvider>
  );
  return { ...utils, onWorkoutActivity, onLogSet };
}

describe('WorkoutPanel', () => {
  it('defaults to A1 and lists its exercises', () => {
    renderPanel();
    expect(screen.getByText('A1 · Power Upper')).toBeInTheDocument();
    expect(screen.getByText('לחיצת חזה במוט')).toBeInTheDocument();
    expect(screen.getByText('0/14 סטים הושלמו')).toBeInTheDocument();
  });

  it('switches the exercise list when a different day tab is picked', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole('button', { name: 'B1' }));
    expect(screen.getByText('B1 · Power Lower')).toBeInTheDocument();
    expect(screen.getByText('סקוואט גב')).toBeInTheDocument();
    expect(screen.queryByText('לחיצת חזה במוט')).not.toBeInTheDocument();
  });

  // Regression test for a real bug caught while porting this component: toggling
  // a set called onWorkoutActivity (which flows into a different store's
  // setState) from inside setLog's functional updater, which React runs during
  // render — producing "Cannot update a component while rendering a different
  // component." toggleSet must never trigger that warning.
  it('toggling a set does not trigger a setState-during-render warning, and reports activity', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { onWorkoutActivity } = renderPanel();

    const firstSetButton = screen.getAllByText('1')[0].closest('button')!;
    await user.click(firstSetButton);

    expect(onWorkoutActivity).toHaveBeenCalledWith(true, 'A1');
    expect(screen.getByText('1/14 סטים הושלמו')).toBeInTheDocument();
    const warned = errorSpy.mock.calls.some((call) => String(call[0]).includes('Cannot update a component'));
    expect(warned).toBe(false);
    errorSpy.mockRestore();
  });

  it('un-toggling the only completed set reports activity=false', async () => {
    const user = userEvent.setup();
    const { onWorkoutActivity } = renderPanel();
    const firstSetButton = screen.getAllByText('1')[0].closest('button')!;
    await user.click(firstSetButton);
    await user.click(firstSetButton);
    expect(onWorkoutActivity).toHaveBeenLastCalledWith(false, 'A1');
  });

  it('passes exerciseLogs/selectedDateKey through so a previously logged set pre-fills the row', () => {
    renderPanel({ exerciseLogs: { '2026-07-29': { 'לחיצת חזה במוט': { weight: 80, reps: 4 } } } });
    const weightInputs = screen.getAllByPlaceholderText('ק״ג');
    expect((weightInputs[0] as HTMLInputElement).value).toBe('80');
  });
});
