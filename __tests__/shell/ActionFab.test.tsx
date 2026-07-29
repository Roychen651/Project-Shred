import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { ActionFab } from '@/components/shell/ActionFab';

describe('ActionFab', () => {
  it('renders with an accessible label', () => {
    render(<ThemeProvider><ActionFab open={false} onToggle={vi.fn()} /></ThemeProvider>);
    expect(screen.getByLabelText('הוסף')).toBeInTheDocument();
  });

  it('calls onToggle on click', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<ThemeProvider><ActionFab open={false} onToggle={onToggle} /></ThemeProvider>);
    await user.click(screen.getByLabelText('הוסף'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
