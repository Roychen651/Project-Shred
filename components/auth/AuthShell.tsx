'use client';

// Shared centered glass card shell for /login, /signup, /forgot-password and
// /auth/reset-password — same visual language as SettingsModal/WeeklyReportModal
// (accent-glow border, backdrop-blur, T.t.modalBg), just full-page instead of
// an overlay, since there's no app shell to overlay yet before signing in.

import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY } from '@/lib/theme/tokens';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const T = useTheme();
  return (
    <main
      className="min-h-screen w-full flex items-center justify-center p-4 relative"
      style={{ background: T.t.bgGrad, color: T.t.textPrimary }}
    >
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          style={{
            position: 'absolute', top: '-15%', insetInlineEnd: '-10%', width: '60vw', height: '60vw', maxWidth: 560, maxHeight: 560,
            background: `radial-gradient(circle, ${T.accent}${T.mode === 'dark' ? '40' : '26'} 0%, transparent 70%)`,
            filter: 'blur(70px)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-15%', insetInlineStart: '-12%', width: '55vw', height: '55vw', maxWidth: 480, maxHeight: 480,
            background: `radial-gradient(circle, ${T.macro.protein}${T.mode === 'dark' ? '35' : '20'} 0%, transparent 70%)`,
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="w-full flex flex-col items-center gap-6" style={{ maxWidth: 380 }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{ width: 52, height: 52, background: `linear-gradient(135deg, ${T.accent}, ${T.macro.protein})`, boxShadow: T.glow(T.accent, 18, '35') }}
          >
            <Sparkles size={24} color="#07080B" />
          </div>
          <h1 className="text-xl font-bold" style={{ fontFamily: FONT_DISPLAY }}>PROJECT SHRED</h1>
        </div>

        <div
          className="w-full rounded-2xl p-6 flex flex-col gap-5"
          style={{
            background: T.mode === 'dark' ? `${T.t.modalBg}E8` : `${T.t.modalBg}F7`,
            border: `1px solid ${T.accent}33`,
            boxShadow: `${T.t.modalShadowExtra}, ${T.glow(T.accent, 20, '28')}`,
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>{title}</h2>
            <p className="text-sm mt-1" style={{ color: T.t.textDim }}>{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
