import { afterEach, describe, expect, it } from 'vitest';

import { isStepUpActive, useStepUpStore } from './useStepUpStore';

afterEach(() => {
  useStepUpStore.getState().clear();
});

describe('step-up elevation window', () => {
  it('is inactive before any elevation', () => {
    expect(isStepUpActive(useStepUpStore.getState().elevatedUntil)).toBe(false);
  });

  it('activates on elevate and deactivates on clear', () => {
    useStepUpStore.getState().elevate();
    expect(isStepUpActive(useStepUpStore.getState().elevatedUntil)).toBe(true);

    useStepUpStore.getState().clear();
    expect(isStepUpActive(useStepUpStore.getState().elevatedUntil)).toBe(false);
  });

  it('expires once the window has passed', () => {
    expect(isStepUpActive(Date.now() - 1)).toBe(false);
    expect(isStepUpActive(Date.now() + 60_000)).toBe(true);
  });
});
