import { afterEach, describe, expect, it, vi } from 'vitest';

import { authStore } from './authStore';

afterEach(() => authStore.clear());

describe('authStore', () => {
  it('starts unauthenticated', () => {
    expect(authStore.isAuthenticated()).toBe(false);
    expect(authStore.getToken()).toBeNull();
  });

  it('holds a token in memory', () => {
    authStore.setToken('abc');
    expect(authStore.getToken()).toBe('abc');
    expect(authStore.isAuthenticated()).toBe(true);
  });

  it('notifies subscribers on change', () => {
    const listener = vi.fn();
    const unsubscribe = authStore.subscribe(listener);
    authStore.setToken('xyz');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    authStore.clear();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
