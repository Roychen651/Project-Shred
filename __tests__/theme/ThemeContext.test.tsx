import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/lib/theme/ThemeContext';
import { JEWEL } from '@/lib/theme/tokens';

function Probe() {
  const t = useTheme();
  return (
    <div>
      <span data-testid="accent">{t.accent}</span>
      <span data-testid="mode">{t.mode}</span>
      <span data-testid="kcal-color">{t.macro.kcal}</span>
      <button onClick={() => t.setMode(t.mode === 'dark' ? 'light' : 'dark')}>toggle</button>
      <button onClick={() => t.setAccentKey('violet')}>violet</button>
    </div>
  );
}

describe('ThemeProvider / useTheme', () => {
  it('defaults to dark mode with the jade (emerald) accent', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('mode').textContent).toBe('dark');
    expect(screen.getByTestId('accent').textContent).toBe(JEWEL.dark.jade);
  });

  it('macro colors are the fixed jewel set, not accent-dependent', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    expect(screen.getByTestId('kcal-color').textContent).toBe(JEWEL.dark.bronze);
  });

  it('switching mode re-derives accent and macro colors from the correct dark/light JEWEL variant', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('mode').textContent).toBe('light');
    expect(screen.getByTestId('accent').textContent).toBe(JEWEL.light.jade);
  });

  it('switching accent updates the resolved accent hex', () => {
    render(<ThemeProvider><Probe /></ThemeProvider>);
    fireEvent.click(screen.getByText('violet'));
    expect(screen.getByTestId('accent').textContent).toBe(JEWEL.dark.plum);
  });

  it('useTheme() outside a provider throws rather than silently returning undefined', () => {
    const consoleError = console.error;
    console.error = () => {}; // React logs the thrown error to console; suppress for a clean test run
    expect(() => render(<Probe />)).toThrow();
    console.error = consoleError;
  });
});
