import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { Stepper } from '@/components/ui/Stepper';

describe('Stepper', () => {
  it('increments by step when the plus button is tapped', async () => {
    const onChange = vi.fn();
    render(<ThemeProvider><Stepper label="גיל" value={30} onChange={onChange} /></ThemeProvider>);
    await userEvent.click(screen.getByLabelText('הוסף גיל'));
    expect(onChange).toHaveBeenCalledWith(31);
  });

  it('decrements by step when the minus button is tapped', async () => {
    const onChange = vi.fn();
    render(<ThemeProvider><Stepper label="גיל" value={30} onChange={onChange} /></ThemeProvider>);
    await userEvent.click(screen.getByLabelText('הפחת גיל'));
    expect(onChange).toHaveBeenCalledWith(29);
  });

  it('respects a custom step (e.g. 0.5 for weight)', async () => {
    const onChange = vi.fn();
    render(<ThemeProvider><Stepper label="משקל" value={82} onChange={onChange} step={0.5} /></ThemeProvider>);
    await userEvent.click(screen.getByLabelText('הוסף משקל'));
    expect(onChange).toHaveBeenCalledWith(82.5);
  });

  it('clamps at min and does not go below it', async () => {
    const onChange = vi.fn();
    render(<ThemeProvider><Stepper label="גיל" value={0} onChange={onChange} min={0} /></ThemeProvider>);
    await userEvent.click(screen.getByLabelText('הפחת גיל'));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it('clamps at max and does not go above it', async () => {
    const onChange = vi.fn();
    render(<ThemeProvider><Stepper label="גיל" value={999} onChange={onChange} max={999} /></ThemeProvider>);
    await userEvent.click(screen.getByLabelText('הוסף גיל'));
    expect(onChange).toHaveBeenCalledWith(999);
  });

  it('allows direct typing into the center input', async () => {
    const onChange = vi.fn();
    render(<ThemeProvider><Stepper label="גיל" value={30} onChange={onChange} /></ThemeProvider>);
    const input = screen.getByDisplayValue('30');
    await userEvent.type(input, '5');
    expect(onChange).toHaveBeenCalled();
  });

  it('renders the suffix when provided', () => {
    render(<ThemeProvider><Stepper label="משקל" value={82} onChange={() => {}} suffix="ק״ג" /></ThemeProvider>);
    expect(screen.getByText('ק״ג')).toBeInTheDocument();
  });
});
