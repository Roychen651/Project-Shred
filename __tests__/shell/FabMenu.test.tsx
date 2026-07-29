import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { FabMenu } from '@/components/shell/FabMenu';

describe('FabMenu', () => {
  it('renders nothing when closed', () => {
    render(<ThemeProvider><FabMenu open={false} onClose={vi.fn()} onPickAction={vi.fn()} /></ThemeProvider>);
    expect(screen.queryByText('רישום חופשי')).not.toBeInTheDocument();
  });

  it('renders all 3 actions when open', () => {
    render(<ThemeProvider><FabMenu open onClose={vi.fn()} onPickAction={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('רישום חופשי')).toBeInTheDocument();
    expect(screen.getByText('מסעדות')).toBeInTheDocument();
    expect(screen.getByText('בנה צלחת')).toBeInTheDocument();
  });

  it('clicking an action calls onPickAction with its id, not onClose', async () => {
    const user = userEvent.setup();
    const onPickAction = vi.fn();
    const onClose = vi.fn();
    render(<ThemeProvider><FabMenu open onClose={onClose} onPickAction={onPickAction} /></ThemeProvider>);
    await user.click(screen.getByText('בנה צלחת'));
    expect(onPickAction).toHaveBeenCalledWith('plate');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('clicking the overlay (outside the menu) calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<ThemeProvider><FabMenu open onClose={onClose} onPickAction={vi.fn()} /></ThemeProvider>);
    const overlay = container.firstChild as HTMLElement;
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
