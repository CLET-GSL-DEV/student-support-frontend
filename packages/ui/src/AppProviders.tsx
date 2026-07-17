import { type ReactNode, useMemo } from 'react';

import { ThemeProvider, ToastProvider } from '@rfdtech/components';
import { type QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

import { ApiClientProvider, createQueryClient } from '@starter/api-client';
import {
  GslAuthProvider,
  type IamMeResponse,
  RoleBasedRedirectWatcher,
  SessionProvider,
  type SessionUser,
  type ZitadelEnv,
} from '@starter/auth';

import { ErrorBoundary } from './ErrorBoundary';

export interface AppProvidersSessionConfig {
  /** Override how IAM's `/me` payload becomes the shared session user. */
  mapProfile?: (raw: IamMeResponse) => SessionUser;
  intervalMs?: number;
  /** When false, disables every `/me` call (on-login check + session poller);
   * the session user is derived from the ZITADEL token instead. Wire this to
   * an env flag (e.g. VITE_SESSION_CHECK_ENABLED). Default true. */
  enabled?: boolean;
  loginPath?: string;
}

export interface AppProvidersAuthConfig {
  zitadelEnv: ZitadelEnv;
  /** The app's Student Support client (`createApiClient`) — the default for every module's endpoints. */
  apiClient: AxiosInstance;
  /** The IAM client (`createIamClient`) — the session poller's `/me` lives there. */
  iamClient: AxiosInstance;
  session?: AppProvidersSessionConfig;
  /** Set true for a self-contained app outside the multi-portal split —
   * disables the cross-portal hard redirect in `RoleBasedRedirectWatcher`. */
  skipRoleRedirect?: boolean;
}

interface AppProvidersProps {
  children: ReactNode;
  /** Provide a shared QueryClient, or let AppProviders create a default one. */
  queryClient?: QueryClient;
  defaultTheme?: 'light' | 'dark';
  /**
   * Full ZITADEL auth + API client + background session-poller/expired-dialog
   * wiring. Omit for an unauthenticated app (e.g. a purely public portal) —
   * AppProviders then only wires the error boundary/theme/query layers.
   */
  auth?: AppProvidersAuthConfig;
}

/**
 * Single composition point for EVERY app-wide provider. With `auth` supplied
 * this nests: ErrorBoundary > ThemeProvider > QueryClientProvider >
 * GslAuthProvider > RoleBasedRedirectWatcher + ApiClientProvider >
 * SessionProvider > children — so an app's `main.tsx` mounts one component
 * instead of hand-nesting several. `RoleBasedRedirectWatcher` lives for the
 * app's whole lifetime, so a role reassigned mid-session (picked up on the
 * next silent token renewal) sends the user to their portal just like a
 * fresh sign-in does. Without `auth`: ErrorBoundary > ThemeProvider >
 * QueryClientProvider > children (the original, auth-free composition).
 *
 * `ApiClientProvider` carries the Student Support client, because that's what the vast
 * majority of endpoints target. IAM endpoints take `iamClient` explicitly.
 */
export function AppProviders({
  children,
  queryClient,
  defaultTheme = 'light',
  auth,
}: AppProvidersProps) {
  const client = useMemo(() => queryClient ?? createQueryClient(), [queryClient]);

  const body = useMemo(
    () =>
      auth ? (
        <GslAuthProvider env={auth.zitadelEnv}>
          <RoleBasedRedirectWatcher enabled={!auth.skipRoleRedirect} />
          <ApiClientProvider client={auth.apiClient}>
            <SessionProvider
              client={auth.iamClient}
              mapProfile={auth.session?.mapProfile}
              intervalMs={auth.session?.intervalMs}
              enabled={auth.session?.enabled}
              loginPath={auth.session?.loginPath}
            >
              {children}
            </SessionProvider>
          </ApiClientProvider>
        </GslAuthProvider>
      ) : (
        children
      ),
    [auth, children],
  );

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider defaultTheme={defaultTheme}>
          <QueryClientProvider client={client}>{body}</QueryClientProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
