import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { AdminArea } from '@/constants/admin';
import { ADMIN_AREA_NAV } from '@/constants/adminNav';

interface QuickActionsState {
  /** Areas the administrator has chosen to surface on the dashboard. */
  areas: AdminArea[];
  setAreas: (areas: AdminArea[]) => void;
}

/**
 * Editable dashboard quick actions. Persisted to localStorage: a pure UI
 * preference, no sensitive data, so surviving reloads is safe and expected.
 * Defaults to every admin area; rendering filters against the current nav
 * config so a stale persisted entry can never break the dashboard.
 */
export const useQuickActionsStore = create<QuickActionsState>()(
  persist(
    (set) => ({
      areas: ADMIN_AREA_NAV.map((item) => item.area),
      setAreas: (areas) => set({ areas }),
    }),
    { name: 'gsl-admin-quick-actions' },
  ),
);
