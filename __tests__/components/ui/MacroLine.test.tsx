import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { MacroLine } from '@/components/ui/MacroLine';

describe('MacroLine', () => {
  it('renders each macro value alongside its icon', () => {
    render(<ThemeProvider><MacroLine kcal={320} protein={60} carbs={0} fat={7} /></ThemeProvider>);
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('shows the optional prefix label before the macro icons', () => {
    render(<ThemeProvider><MacroLine kcal={100} protein={10} carbs={10} fat={5} prefix="200 גרם" /></ThemeProvider>);
    expect(screen.getByText('200 גרם')).toBeInTheDocument();
  });

  // Sprint 44 — caught while building the quick-log quantity adjuster: a
  // scaled value (e.g. 6.9 * 1.5) reliably reintroduces floating-point
  // noise (10.350000000000001) unless rounded at MacroLine's own display
  // boundary, the same discipline MacroStrip already applies to its totals.
  it('rounds a floating-point-noisy value instead of rendering it verbatim', () => {
    render(<ThemeProvider><MacroLine kcal={480.00000000001} protein={90} carbs={0} fat={6.9 * 1.5} /></ThemeProvider>);
    expect(screen.getByText('480')).toBeInTheDocument();
    // roundNum keeps one decimal (matching MacroStrip/makeLoggedItem
    // elsewhere) — 6.9*1.5's raw floating-point value (10.350000000000001)
    // must never render verbatim, whatever the rounded display turns out to be.
    expect(screen.queryByText('10.350000000000001')).not.toBeInTheDocument();
    expect(screen.getByText('10.4')).toBeInTheDocument();
  });
});
