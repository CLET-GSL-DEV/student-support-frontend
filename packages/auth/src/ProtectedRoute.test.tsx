import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from './ProtectedRoute';

const signinRedirect = vi.fn();
let mockAuth: Record<string, unknown>;

vi.mock('./useAuth', () => ({ useAuth: () => mockAuth }));

const renderInRouter = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

function setAuth(overrides: Record<string, unknown>) {
  mockAuth = {
    isLoading: false,
    isAuthenticated: false,
    error: null,
    user: null,
    signinRedirect,
    hasRole: () => false,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  signinRedirect.mockClear();
});

describe('ProtectedRoute', () => {
  it('redirects to the IdP when unauthenticated', () => {
    setAuth({ isAuthenticated: false });
    renderInRouter(
      <ProtectedRoute>
        <div>secret</div>
      </ProtectedRoute>,
    );
    expect(signinRedirect).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('renders children when authenticated and a single required role matches', () => {
    setAuth({ isAuthenticated: true, hasRole: (r: string) => r === 'admin' });
    renderInRouter(
      <ProtectedRoute roles="admin">
        <div>secret</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
    expect(signinRedirect).not.toHaveBeenCalled();
  });

  it('grants access when the user has ANY role in the list (OR)', () => {
    setAuth({ isAuthenticated: true, hasRole: (r: string) => r === 'editor' });
    renderInRouter(
      <ProtectedRoute roles={['admin', 'editor']}>
        <div>secret</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('shows 403 when authenticated but missing every required role', () => {
    setAuth({ isAuthenticated: true, hasRole: () => false });
    renderInRouter(
      <ProtectedRoute roles={['admin', 'editor']}>
        <div>secret</div>
      </ProtectedRoute>,
    );
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });
});
