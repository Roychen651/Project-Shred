'use client';

// Sprint 9 — a light "install this app" nudge. Two real platforms, two real
// mechanisms, because there is no unified web API for this:
//
//  - Android/Chrome fires a genuine `beforeinstallprompt` event the browser
//    controls; we just capture it and re-trigger it from our own button
//    (`event.prompt()`) instead of Chrome's own mini-infobar.
//  - iOS Safari has NO such event at all, ever — "Add to Home Screen" only
//    exists behind the manual Share-sheet action. The only thing a page can
//    do is detect "this is iOS Safari, not already installed" and show
//    instructions pointing at the Share icon.
//
// Rendered once in the root layout (outside any page-specific overlay state),
// so it deliberately sits as a top banner rather than near the bottom nav/FAB
// — those live inside app/page.tsx and this component has no way to
// coordinate z-index with them from the layout.
import { useEffect, useState } from 'react';
import { Share, X, Download } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_BODY } from '@/lib/theme/tokens';

const DISMISSED_KEY = 'shred-a2hs-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

export function AddToHomeScreenPrompt() {
  const T = useTheme();
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'ios' | 'android' | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return;

    if (isIosSafari()) {
      // queueMicrotask (not a direct call) so this satisfies react-hooks'
      // set-state-in-effect rule — the beforeinstallprompt branch below is
      // already fine since its setState calls live inside an event-listener
      // callback, not synchronously in the effect body itself. Same
      // "move the transition into an async callback boundary" technique used
      // for WorkoutPanel's rest-timer effect (Sprint 6).
      queueMicrotask(() => {
        setMode('ios');
        setVisible(true);
      });
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode('android');
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (!visible || !mode) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-50 flex justify-center p-3"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
    >
      <div
        className="w-full flex items-center gap-3 rounded-2xl px-4 py-3"
        style={{
          maxWidth: 420,
          background: T.mode === 'dark' ? `${T.t.modalBg}F0` : `${T.t.modalBg}FA`,
          border: `1px solid ${T.accent}40`,
          boxShadow: `${T.t.dropdownShadow}, ${T.glow(T.accent, 14, '25')}`,
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          fontFamily: FONT_BODY,
        }}
      >
        <div className="flex items-center justify-center rounded-xl flex-shrink-0" style={{ width: 34, height: 34, background: `${T.accent}22` }}>
          {mode === 'ios' ? <Share size={16} color={T.accent} /> : <Download size={16} color={T.accent} />}
        </div>
        <div className="flex-1 text-xs" style={{ color: T.t.textPrimary }}>
          {mode === 'ios' ? (
            <>התקינו את PROJECT SHRED: הקישו על <Share size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> ואז &quot;הוסף למסך הבית&quot;</>
          ) : (
            <>התקינו את PROJECT SHRED למסך הבית לגישה מהירה כמו אפליקציה</>
          )}
        </div>
        {mode === 'android' && (
          <button
            onClick={handleInstall}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: T.accent, color: '#07080B' }}
          >
            התקנה
          </button>
        )}
        <button onClick={dismiss} className="flex-shrink-0 p-1 rounded-lg" style={{ color: T.t.textDim }} aria-label="סגירה">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
