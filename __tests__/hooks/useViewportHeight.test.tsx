import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { useViewportHeight } from '@/lib/hooks/useViewportHeight';

function Probe() {
  const vh = useViewportHeight();
  return <span data-testid="vh">{vh}</span>;
}

describe('useViewportHeight', () => {
  afterEach(() => {
    // @ts-expect-error -- jsdom doesn't implement visualViewport; restore between tests
    delete window.visualViewport;
  });

  it('falls back to window.innerHeight when visualViewport is unavailable (jsdom default)', () => {
    render(<Probe />);
    expect(screen.getByTestId('vh').textContent).toBe(String(window.innerHeight));
  });

  it('re-renders when window fires a resize event', () => {
    render(<Probe />);
    act(() => {
      Object.defineProperty(window, 'innerHeight', { value: 555, configurable: true });
      window.dispatchEvent(new Event('resize'));
    });
    expect(screen.getByTestId('vh').textContent).toBe('555');
  });

  it('prefers visualViewport.height over window.innerHeight when available', () => {
    const stub = {
      height: 640,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as VisualViewport;
    window.visualViewport = stub;
    render(<Probe />);
    expect(screen.getByTestId('vh').textContent).toBe('640');
  });
});
