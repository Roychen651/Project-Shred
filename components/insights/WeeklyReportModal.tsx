'use client';

// ProjectShred.artifact.jsx:3930-4023. Presentational — takes an already-
// computed `report` (buildWeeklyReport) and the active profile, formats the
// WhatsApp-ready Hebrew text, and copies it via navigator.clipboard.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, X, MessageCircle, Check, Copy } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_DISPLAY, FONT_MONO, tactileGradient } from '@/lib/theme/tokens';
import { useViewportHeight } from '@/lib/hooks/useViewportHeight';

const tapSpring = { type: 'spring' as const, stiffness: 400, damping: 24 };
import type { WeeklyReport } from '@/lib/domain/analytics';
import type { Profile } from '@/lib/store/shred-store';

export interface WeeklyReportModalProps {
  open: boolean;
  onClose: () => void;
  report: WeeklyReport;
  profile: Profile;
}

export function WeeklyReportModal({ open, onClose, report, profile }: WeeklyReportModalProps) {
  const T = useTheme();
  // Sprint 43 — same vh-mismatch fix as FavoriteBuilderModal/SheetModal (see
  // useViewportHeight's header).
  const vh = useViewportHeight();
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const whatsappText = `📊 *דוח שבועי · PROJECT SHRED*
👤 ${profile.name}

📉 שינוי משקל השבוע: ${report.weightDelta > 0 ? '+' : ''}${report.weightDelta} ק"ג
📏 שינוי היקף מותן: ${report.waistDelta > 0 ? '+' : ''}${report.waistDelta} ס"מ
🎯 דיוק ממוצע שבועי: ${report.avgCompliance}%
🥩 ממוצע חלבון יומי: ${report.avgProtein} גרם
🏃‍♂️ ימי אימון שבוצעו: ${report.workoutDays}/7

נוצר אוטומטית ב-PROJECT SHRED`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fail silently, text is still visible on screen.
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: T.t.overlayBg, backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-2xl overflow-hidden"
        style={{
          maxWidth: 460, maxHeight: Math.round(vh * 0.88), overflowY: 'auto',
          background: T.mode === 'dark' ? `${T.t.modalBg}E8` : `${T.t.modalBg}F7`,
          border: `1px solid ${T.accent}33`,
          boxShadow: `${T.t.modalShadowExtra}, ${T.glow(T.accent, 20, '30')}`,
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${T.t.border}` }}>
          <div className="flex items-center gap-2">
            <ClipboardList size={18} color={T.accent} />
            <h3 className="text-lg font-bold" style={{ color: T.t.textPrimary, fontFamily: FONT_DISPLAY }}>דוח שבועי מנהלים</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: T.t.chipBg }}>
            <X size={16} color={T.t.textSecondary} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>שינוי משקל</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.accent }}>{report.weightDelta > 0 ? '+' : ''}{report.weightDelta} ק״ג</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>שינוי היקף מותן</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.kcal }}>{report.waistDelta > 0 ? '+' : ''}{report.waistDelta} ס״מ</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>דיוק שבועי ממוצע</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.protein }}>{report.avgCompliance}%</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={{ background: T.t.chipBg }}>
              <div className="text-xs" style={{ color: T.t.textDim }}>ימי אימון</div>
              <div className="text-lg font-bold" style={{ fontFamily: FONT_MONO, color: T.macro.fat }}>{report.workoutDays}/7</div>
            </div>
          </div>

          <p className="text-xs" style={{ color: T.t.textDim }}>ממוצע חלבון יומי השבוע: <span style={{ color: T.t.textPrimary, fontFamily: FONT_MONO }}>{report.avgProtein} גרם</span></p>

          <motion.button
            onClick={copyToClipboard}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            transition={tapSpring}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm mt-2"
            style={copied ? { background: T.macro.protein, color: '#07080B' } : { ...tactileGradient(T.accent), color: '#07080B' }}
          >
            {copied ? <Check size={16} /> : <MessageCircle size={16} />}
            {copied ? 'הועתק!' : 'העתק דוח ל-WhatsApp'}
          </motion.button>
          <p className="text-xs text-center" style={{ color: T.t.textDim }}>
            <Copy size={11} style={{ display: 'inline', marginLeft: 4 }} /> הטקסט מועתק ללוח והדבקה ב-WhatsApp/כל אפליקציה
          </p>
        </div>
      </div>
    </div>
  );
}
