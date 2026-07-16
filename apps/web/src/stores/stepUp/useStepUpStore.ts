import { create } from 'zustand';

/**
 * How long a successful TOTP step-up stays valid before the next sensitive
 * action re-prompts.
 * // SPEC: the step-up window length is not defined in the SRS; 5 minutes is
 * a placeholder pending the Admin Portal requirements document.
 */
const STEP_UP_WINDOW_MS = 5 * 60 * 1000;

interface StepUpState {
  /** Epoch ms until which the current step-up elevation is valid; null when
   * the session has never been elevated (or was explicitly cleared). */
  elevatedUntil: number | null;
  elevate: () => void;
  clear: () => void;
}

/**
 * Step-up MFA state for sensitive and governance actions (SRS CON-G1, §2.3).
 * Deliberately in-memory only: elevation never survives a reload, matching
 * the in-memory access-token posture of the auth layer.
 */
export const useStepUpStore = create<StepUpState>((set) => ({
  elevatedUntil: null,
  elevate: () => set({ elevatedUntil: Date.now() + STEP_UP_WINDOW_MS }),
  clear: () => set({ elevatedUntil: null }),
}));

/** True while a prior TOTP step-up is still within its validity window. */
export function isStepUpActive(elevatedUntil: number | null): boolean {
  return elevatedUntil !== null && Date.now() < elevatedUntil;
}
