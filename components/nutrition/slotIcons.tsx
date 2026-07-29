// Slot id → icon mapping. Lives in the UI layer, not lib/domain/slots.ts, since
// SLOT_DEFS is deliberately React-free (see the note in that file) — a lucide
// component reference is exactly the kind of thing that has to live here instead.
// ProjectShred.artifact.jsx:825-829 embedded these directly in SLOT_DEFS.

import { Sunrise, Coffee, UtensilsCrossed, Dumbbell, Moon, type LucideIcon } from 'lucide-react';
import type { SlotId } from '@/lib/domain/slots';

export const SLOT_ICONS: Record<SlotId, LucideIcon> = {
  breakfast: Sunrise,
  midmorning: Coffee,
  lunch: UtensilsCrossed,
  preworkout: Dumbbell,
  dinner: Moon,
};
