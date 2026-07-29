import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { SheetModal } from '@/components/shell/SheetModal';

describe('SheetModal', () => {
  it('renders nothing when closed', () => {
    render(<ThemeProvider><SheetModal open={false} onClose={vi.fn()} title="כותרת"><p>תוכן</p></SheetModal></ThemeProvider>);
    expect(screen.queryByText('כותרת')).not.toBeInTheDocument();
  });

  it('renders the title and children when open', () => {
    render(<ThemeProvider><SheetModal open onClose={vi.fn()} title="כותרת"><p>תוכן הגיליון</p></SheetModal></ThemeProvider>);
    expect(screen.getByText('כותרת')).toBeInTheDocument();
    expect(screen.getByText('תוכן הגיליון')).toBeInTheDocument();
  });

  it('the close (X) button calls onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ThemeProvider><SheetModal open onClose={onClose} title="כותרת"><p>x</p></SheetModal></ThemeProvider>);
    // The close button is the only <button> rendered by SheetModal itself.
    await user.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking the overlay calls onClose, clicking inside the panel does not', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ThemeProvider><SheetModal open onClose={onClose} title="כותרת"><p>תוכן פנימי</p></SheetModal></ThemeProvider>);
    await user.click(screen.getByText('תוכן פנימי'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('in `bare` mode the body is a single non-scrolling flex container, handing layout to the child', () => {
    render(
      <ThemeProvider>
        <SheetModal open onClose={vi.fn()} title="t" bare>
          <div data-testid="bare-child">child</div>
        </SheetModal>
      </ThemeProvider>
    );
    const child = screen.getByTestId('bare-child');
    const bodyRegion = child.parentElement!;
    expect(bodyRegion).toHaveStyle({ overflow: 'hidden' });
  });

  it('in default (non-bare) mode the body is a single auto-scroll region', () => {
    render(
      <ThemeProvider>
        <SheetModal open onClose={vi.fn()} title="t">
          <div data-testid="scroll-child">child</div>
        </SheetModal>
      </ThemeProvider>
    );
    const child = screen.getByTestId('scroll-child');
    const bodyRegion = child.parentElement!;
    expect(bodyRegion).toHaveStyle({ overflowY: 'auto' });
  });
});
