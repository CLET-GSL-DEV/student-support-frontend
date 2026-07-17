import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { QUICK_ACTIONS } from '@/constants/quickActions';

interface QuickActionsState {
  /** Ids of the quick actions the administrator has chosen to surface. */
  actionIds: string[];
  setActionIds: (actionIds: string[]) => void;
}

const DEFAULT_ACTION_IDS = QUICK_ACTIONS.map((action) => action.id);

/**
 * Editable dashboard quick actions. Persisted to localStorage: a pure UI
 * preference, no sensitive data, so surviving reloads is safe and expected.
 * Defaults to the full catalog; rendering filters against it so a stale
 * persisted id can never break the dashboard.
 */
export const useQuickActionsStore = create<QuickActionsState>()(
  persist(
    (set) => ({
      actionIds: DEFAULT_ACTION_IDS,
      setActionIds: (actionIds) => set({ actionIds }),
    }),
    {
      name: 'gsl-admin-quick-actions',
      version: 1,
      // v0 persisted area slugs rather than action ids; reset to defaults.
      migrate: () => ({ actionIds: DEFAULT_ACTION_IDS }),
    },
  ),
);
