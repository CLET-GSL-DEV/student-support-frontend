import { RouterProvider, createMemoryRouter } from 'react-router';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppProviders } from '@starter/ui';

import { Component as Dashboard } from './Dashboard';

// Hermetic env: the dashboard's data layer transitively imports @/config/env,
// whose zod schema requires ZITADEL URLs that only exist in a real .env.
vi.mock('@/config/env', () => ({
  env: {
    apiUrl: '/api/app',
    iamUrl: '/api/iam',
    appEnv: 'development',
    sentryDsn: '',
    sessionCheckEnabled: false,
    zitadel: {
      authority: 'http://localhost:8080',
      clientId: '',
      redirectUri: 'http://localhost:5290/auth/callback',
      postLogoutRedirectUri: 'http://localhost:5290/auth/logout/callback',
      projectId: '',
    },
    adminDataSource: 'mock',
    adminMockScenario: 'populated',
  },
}));

function renderDashboard() {
  const router = createMemoryRouter([{ path: '/', element: <Dashboard /> }]);
  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe('Dashboard', () => {
  it('renders entry points for every configuration area', () => {
    renderDashboard();

    for (const label of [
      'Notification Content',
      'Scholarship Windows',
      'Welfare Routing',
      'Hostel Allocation',
      'Admissions Workflow',
      'Release Governance',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('renders aggregate metrics from the analytics repository', async () => {
    renderDashboard();

    expect(await screen.findByText('Active students')).toBeInTheDocument();
    expect(screen.getByText('Scholarship applications')).toBeInTheDocument();
  });
});
