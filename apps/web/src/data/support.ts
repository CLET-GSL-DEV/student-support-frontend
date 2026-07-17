import { useMockScenarioStore } from '@/stores';

/**
 * Shared plumbing for every mock repository in the Admin Portal's
 * frontend-only data layer. Mock repositories serve dummy data behind the
 * same repository interfaces the Api stubs implement, so swapping in the
 * real backend later is a data-source flip (see dataSource.ts), not a
 * refactor.
 */

/** Thrown by mock repositories when the scenario switch is set to 'error',
 * so screens can exercise their error states without a backend. */
export class MockScenarioError extends Error {
  constructor() {
    super('Mock scenario is set to "error"; this simulated request failed.');
    this.name = 'MockScenarioError';
  }
}

// Near-zero under vitest so repository invariant tests stay fast; the
// visible-loading-state latency only matters in a browser.
const MOCK_LATENCY_MS = import.meta.env.MODE === 'test' ? 5 : 350;

/** Simulated network latency so loading states are actually visible. */
export function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

/**
 * Resolve a mock read against the active scenario: 'populated' returns the
 * seeded value, 'empty' the empty value, 'error' throws MockScenarioError.
 * Always applies mock latency first.
 */
export async function resolveScenario<T>(populated: T, empty: T): Promise<T> {
  await mockDelay();
  const { scenario } = useMockScenarioStore.getState();
  if (scenario === 'error') throw new MockScenarioError();
  return scenario === 'empty' ? empty : populated;
}

/**
 * Guard a mock write against the active scenario: throws under 'error' so
 * write-failure paths are testable. 'empty' does not block writes; it only
 * affects what reads return.
 */
export async function guardMockWrite(): Promise<void> {
  await mockDelay();
  const { scenario } = useMockScenarioStore.getState();
  if (scenario === 'error') throw new MockScenarioError();
}

export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
