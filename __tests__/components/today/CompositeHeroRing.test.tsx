import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { CompositeHeroRing } from '@/components/today/CompositeHeroRing';

describe('CompositeHeroRing', () => {
  it('shows consumed calories as the primary number, and the target beneath it', () => {
    render(<ThemeProvider><CompositeHeroRing consumed={{ kcal: 1800, protein: 120 }} targets={{ kcal: 2330, protein: 168 }} /></ThemeProvider>);
    expect(screen.getByText('1800')).toBeInTheDocument();
    expect(screen.getByText('מתוך 2330 קל׳')).toBeInTheDocument();
  });

  it('shows a green "remaining" pill when under target', () => {
    render(<ThemeProvider><CompositeHeroRing consumed={{ kcal: 1800, protein: 120 }} targets={{ kcal: 2330, protein: 168 }} /></ThemeProvider>);
    expect(screen.getByText('530 נותרו')).toBeInTheDocument();
  });

  it('shows an "over target" pill when over, with the absolute delta', () => {
    render(<ThemeProvider><CompositeHeroRing consumed={{ kcal: 2600, protein: 120 }} targets={{ kcal: 2330, protein: 168 }} /></ThemeProvider>);
    expect(screen.getByText('+270 מעל היעד')).toBeInTheDocument();
  });

  it('does not divide by zero when targets are zero (e.g. a broken profile)', () => {
    render(<ThemeProvider><CompositeHeroRing consumed={{ kcal: 0, protein: 0 }} targets={{ kcal: 0, protein: 0 }} /></ThemeProvider>);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
