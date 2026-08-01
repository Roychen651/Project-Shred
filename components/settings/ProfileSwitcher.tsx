'use client';

// ProjectShred.artifact.jsx:2712-2790. Header badge (name + weight) opens a
// dropdown to switch profiles, delete a non-builtin one, or add a new one —
// unchanged from the artifact except that `profiles`/`addProfile`/
// `deleteProfile`/`setActiveId` now bind directly to the real Zustand store
// instead of local App state.

import { useState } from 'react';
import { User, UserPlus, ChevronDown, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO, CONTROL_HEIGHT, CONTROL_RADIUS } from '@/lib/theme/tokens';
import type { Profile } from '@/lib/store/shred-store';

export interface ProfileSwitcherProps {
  profiles: Record<string, Profile>;
  activeId: string;
  setActiveId: (id: string) => void;
  addProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
}

const tapSpring = { type: 'spring' as const, stiffness: 420, damping: 26 };

export function ProfileSwitcher({ profiles, activeId, setActiveId, addProfile, deleteProfile }: ProfileSwitcherProps) {
  const T = useTheme();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const active = profiles[activeId];

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        transition={tapSpring}
        className="flex items-center gap-2 px-3"
        style={{ height: CONTROL_HEIGHT, borderRadius: CONTROL_RADIUS, background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
      >
        <div className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: `${T.accent}22` }}>
          <User size={13} color={T.accent} />
        </div>
        <div className="text-right">
          <div className="text-xs font-bold leading-tight" style={{ color: T.t.textPrimary }}>{active.name}</div>
          <div className="text-xs leading-tight" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{active.weight}kg</div>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={tapSpring} className="flex items-center">
          <ChevronDown size={14} color={T.t.textDim} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -6 }}
              transition={tapSpring}
              className="absolute left-0 top-full mt-2 rounded-2xl z-30 overflow-hidden"
              style={{
                width: 260,
                transformOrigin: 'top left',
                background: T.mode === 'dark' ? `${T.t.popover}E6` : `${T.t.popover}F5`,
                border: `1px solid ${T.t.border}`,
                boxShadow: T.t.dropdownShadow,
                backdropFilter: 'blur(18px) saturate(160%)',
                WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              }}
            >
            <div className="p-2 flex flex-col gap-1 max-h-56 overflow-y-auto">
              {Object.values(profiles).map((p) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { setActiveId(p.id); setOpen(false); }}
                    className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-right"
                    style={{ background: p.id === activeId ? `${T.accent}18` : 'transparent' }}
                  >
                    <span className="text-sm" style={{ color: T.t.textPrimary }}>{p.name}</span>
                    <span className="text-xs" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{p.weight}kg</span>
                  </button>
                  {/* Sprint 37 — direct request: "I don't need the guest/
                      friend entry" + "make it possible to delete profiles
                      too." Both built-in profiles used p.locked (both true)
                      to hide the delete button — that protected the
                      not-really-needed guest/friend seed profile the same
                      way it protected the person's own real profile. Only
                      the true "mine" profile (builtinKey identifies it
                      regardless of its real uuid — see the store's Sprint 9
                      note) still can't be deleted from here; the guest
                      built-in and any custom profile now can. */}
                  {p.builtinKey !== 'mine' && (
                    <button onClick={() => deleteProfile(p.id)} className="p-2 rounded-lg" style={{ color: T.t.textDim }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-2" style={{ borderTop: `1px solid ${T.t.border}` }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="שם פרופיל חדש"
                className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}`, color: T.t.textPrimary }}
              />
              <button
                onClick={() => {
                  if (!newName.trim()) return;
                  addProfile(newName.trim());
                  setNewName('');
                }}
                className="p-2.5 rounded-xl flex-shrink-0"
                style={{ background: T.accent, color: '#07080B' }}
              >
                <UserPlus size={15} />
              </button>
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </div>
  );
}
