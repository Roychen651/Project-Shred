import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/lib/theme/ThemeContext';
import { PortionInput, gramsForPortion, formatPortionLabel } from '@/components/nutrition/PortionInput';
import { PORTION_UNITS } from '@/lib/data/portionUnits';

// PortionInput's qty field is a controlled input — a static, never-changing
// `qty` prop (as most tests below use) means the DOM value snaps back after
// every keystroke, exactly like it would if the real parent forgot to apply
// onQtyChange. This tiny wrapper actually applies it, matching how
// PlateComposerSheetBody really uses the component.
function ControlledPortionInput({ onQtyChange }: { onQtyChange: (qty: number) => void }) {
  const [qty, setQty] = useState(1);
  return (
    <PortionInput
      unit="tbsp"
      qty={qty}
      onUnitChange={vi.fn()}
      onQtyChange={(q) => { setQty(q); onQtyChange(q); }}
    />
  );
}

describe('PortionInput', () => {
  it('renders a pill for every one of PORTION_UNITS\' 12 units', () => {
    render(<ThemeProvider><PortionInput unit="gram" qty={100} onUnitChange={vi.fn()} onQtyChange={vi.fn()} /></ThemeProvider>);
    expect(PORTION_UNITS).toHaveLength(12);
    for (const u of PORTION_UNITS) {
      expect(screen.getByRole('button', { name: u.label })).toBeInTheDocument();
    }
  });

  it('picking a non-gram unit calls onUnitChange with that unit\'s own default quantity', async () => {
    const user = userEvent.setup();
    const onUnitChange = vi.fn();
    render(<ThemeProvider><PortionInput unit="gram" qty={100} onUnitChange={onUnitChange} onQtyChange={vi.fn()} /></ThemeProvider>);
    await user.click(screen.getByRole('button', { name: 'כף' }));
    expect(onUnitChange).toHaveBeenCalledWith('tbsp', 1); // tbsp's defaultQty is 1
  });

  it('shows only the unit label for grams (no redundant gram count)', () => {
    render(<ThemeProvider><PortionInput unit="gram" qty={100} onUnitChange={vi.fn()} onQtyChange={vi.fn()} /></ThemeProvider>);
    expect(screen.getByText('גר׳')).toBeInTheDocument();
  });

  it('shows the converted gram equivalent alongside a non-gram unit', () => {
    render(<ThemeProvider><PortionInput unit="tbsp" qty={3} onUnitChange={vi.fn()} onQtyChange={vi.fn()} /></ThemeProvider>);
    // 3 tbsp * 15g/tbsp = 45g
    expect(screen.getByText('כף (45ג)')).toBeInTheDocument();
  });

  it('typing an exact quantity calls onQtyChange with the real accumulated value', async () => {
    const user = userEvent.setup();
    const onQtyChange = vi.fn();
    render(<ThemeProvider><ControlledPortionInput onQtyChange={onQtyChange} /></ThemeProvider>);
    const qtyInput = screen.getByLabelText('כמות');
    await user.clear(qtyInput);
    await user.type(qtyInput, '4');
    expect(onQtyChange).toHaveBeenLastCalledWith(4);
  });
});

describe('gramsForPortion', () => {
  it('converts every unit to grams using its gramsPerUnit factor', () => {
    expect(gramsForPortion('gram', 250)).toBe(250);
    expect(gramsForPortion('tbsp', 2)).toBe(30);
    expect(gramsForPortion('cup', 1)).toBe(200);
    expect(gramsForPortion('pinch', 3)).toBe(2); // 3 * 0.5 = 1.5 -> rounds to 2
    expect(gramsForPortion('plate', 1)).toBe(380);
  });

  it('falls back to the gram unit for an unknown unit id', () => {
    expect(gramsForPortion('not-a-real-unit', 50)).toBe(50);
  });
});

describe('formatPortionLabel', () => {
  it('formats grams as a bare "N גר׳"', () => {
    expect(formatPortionLabel('gram', 150)).toBe('150 גר׳');
  });

  it('formats a non-gram unit as "qty shortLabel (Nגר׳)"', () => {
    expect(formatPortionLabel('handful', 2)).toBe('2 חופן (60 גר׳)');
  });
});
