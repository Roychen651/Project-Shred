'use client';

// ProjectShred.artifact.jsx:2712-2790. Header badge (name + weight) opens a
// dropdown to switch profiles, delete a non-builtin one, or add a new one —
// unchanged from the artifact except that `profiles`/`addProfile`/
// `deleteProfile`/`setActiveId` now bind directly to the real Zustand store
// instead of local App state.

import { useState } from 'react';
import { User, UserPlus, ChevronDown, Trash2 } from 'lucide-react';
import { useTheme } from '@/lib/theme/ThemeContext';
import { FONT_MONO } from '@/lib/theme/tokens';
import type { Profile } from '@/lib/store/shred-store';

export interface ProfileSwitcherProps {
  profiles: Record<string, Profile>;
  activeId: string;
  setActiveId: (id: string) => void;
  addProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
}

export function ProfileSwitcher({ profiles, activeId, setActiveId, addProfile, deleteProfile }: ProfileSwitcherProps) {
  const T = useTheme();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const active = profiles[activeId];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: T.t.inputBg, border: `1px solid ${T.t.border}` }}
      >
        <div className="flex items-center justify-center rounded-full" style={{ width: 24, height: 24, background: `${T.accent}22` }}>
          <User size={13} color={T.accent} />
        </div>
        <div className="text-right">
          <div className="text-xs font-bold leading-tight" style={{ color: T.t.textPrimary }}>{active.name}</div>
          <div className="text-xs leading-tight" style={{ color: T.t.textDim, fontFamily: FONT_MONO }}>{active.weight}kg</div>
        </div>
        <ChevronDown size={14} color={T.t.textDim} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full mt-2 rounded-xl z-30 overflow-hidden"
            style={{
              width: 260,
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
                  {!p.locked && (
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
                style={{ background: T.t.inputBg, border: `1.5px solid ${T.t.border}`, color: T.t.textPrimary }}
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
          </div>
        </>
      )}
    </div>
  );
}
