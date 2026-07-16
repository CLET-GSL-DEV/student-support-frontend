import { create } from 'zustand';

import { env } from '@/config/env';

export type MockScenario = 'populated' | 'empty' | 'error';

interface MockScenarioState {
  scenario: MockScenario;
  setScenario: (scenario: MockScenario) => void;
}

/**
 * Runtime switch for every mock repository (see src/data/support.ts):
 * 'populated' serves seeded dummy data, 'empty' serves empty collections,
 * 'error' makes calls fail. Initialised from VITE_ADMIN_MOCK_SCENARIO so a
 * whole dev session can start in a given state; flip it at runtime to
 * exercise loading/empty/error paths on any screen without a backend.
 */
export const useMockScenarioStore = create<MockScenarioState>((set) => ({
  scenario: env.adminMockScenario,
  setScenario: (scenario) => set({ scenario }),
}));
