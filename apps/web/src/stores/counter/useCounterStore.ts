import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

/**
 * Example Zustand store. Kept app-local (not in a shared package) because client
 * state is usually portal-specific. Import stores via the `@/stores` barrel only
 * — enforced by the `no-restricted-imports` ESLint rule.
 */
export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}));
