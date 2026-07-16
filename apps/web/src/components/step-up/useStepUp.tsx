import { type ReactNode, useCallback, useState } from 'react';

import { isStepUpActive, useStepUpStore } from '@/stores';

import { StepUpDialog } from './StepUpDialog';

export interface StepUpGate {
  /** Run an action behind step-up: executes immediately while a prior
   * elevation is still valid, otherwise prompts for TOTP first. */
  guard: (action: () => void) => void;
  /** True while a prior step-up elevation is still valid. */
  isElevated: boolean;
  /** Mount once per screen that uses `guard`. */
  dialog: ReactNode;
}

/**
 * Screen-side hook for the step-up MFA gate (SRS CON-G1, §2.3). Usage:
 * destructure `guard` and `dialog`, render `dialog` anywhere in the tree,
 * and wrap sensitive handlers as `guard(() => doSensitiveThing())`.
 */
export function useStepUp(): StepUpGate {
  const elevatedUntil = useStepUpStore((state) => state.elevatedUntil);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const guard = useCallback((action: () => void) => {
    if (isStepUpActive(useStepUpStore.getState().elevatedUntil)) {
      action();
      return;
    }
    setPendingAction(() => action);
  }, []);

  const dialog = (
    <StepUpDialog
      open={pendingAction !== null}
      onOpenChange={(open) => {
        if (!open) setPendingAction(null);
      }}
      onVerified={() => {
        pendingAction?.();
        setPendingAction(null);
      }}
    />
  );

  return { guard, isElevated: isStepUpActive(elevatedUntil), dialog };
}
