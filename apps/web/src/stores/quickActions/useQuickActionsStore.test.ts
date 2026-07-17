import { beforeEach, describe, expect, it } from 'vitest';

import { QUICK_ACTIONS } from '@/constants/quickActions';

import { useQuickActionsStore } from './useQuickActionsStore';

beforeEach(() => {
  useQuickActionsStore.getState().setActionIds(QUICK_ACTIONS.map((action) => action.id));
});

describe('quick actions preference store', () => {
  it('defaults to the full action catalog', () => {
    expect(useQuickActionsStore.getState().actionIds).toEqual(
      QUICK_ACTIONS.map((action) => action.id),
    );
  });

  it('persists an edited selection', () => {
    useQuickActionsStore.getState().setActionIds(['releases.prepare']);
    expect(useQuickActionsStore.getState().actionIds).toEqual(['releases.prepare']);
  });
});
