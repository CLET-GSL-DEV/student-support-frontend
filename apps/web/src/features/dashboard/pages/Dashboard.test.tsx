import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import { ApiClientProvider } from '@starter/api-client';
import { AppProviders } from '@starter/ui';

import { useCounterStore } from '@/stores';

import { Component as Dashboard } from './Dashboard';

const testClient = axios.create({ baseURL: 'http://localhost:3000/api' });

function renderDashboard() {
  return render(
    <AppProviders>
      <ApiClientProvider client={testClient}>
        <Dashboard />
      </ApiClientProvider>
    </AppProviders>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    useCounterStore.getState().reset();
  });

  it('increments the counter store on click', async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.getByText('0')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
