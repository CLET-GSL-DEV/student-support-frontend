import { type ReactNode, useMemo } from 'react';

import { AuthProvider } from '@zitadel/react-auth';

import { AuthTokenBridge } from './AuthTokenBridge';
import { type ZitadelEnv, buildAuthConfig } from './config';

interface GslAuthProviderProps {
  env: ZitadelEnv;
  children: ReactNode;
}

/**
 * App-wide ZITADEL auth provider. Runs the Authorization Code + PKCE flow with a
 * sessionStorage-backed token store and automatic silent renew, and mounts the
 * token bridge so the API client always sees the current access token.
 */
export function GslAuthProvider({ env, children }: GslAuthProviderProps) {
  // Build the config (incl. the sessionStorage userStore) once so the UserManager
  // and its silent-renew timers are stable across renders.
  const config = useMemo(() => buildAuthConfig(env), [env]);

  return (
    <AuthProvider {...config}>
      <AuthTokenBridge />
      {children}
    </AuthProvider>
  );
}
