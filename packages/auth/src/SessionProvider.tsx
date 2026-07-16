import type { ReactNode } from 'react';

import type { AxiosInstance } from 'axios';

import { SessionExpiredDialog } from './SessionExpiredDialog';
import type { IamMeResponse } from './session-api';
import type { SessionUser } from './sessionStore';
import { useSessionStore } from './sessionStore';
import { useSessionPoller } from './useSessionPoller';

interface SessionProviderProps {
  /** The IAM backend axios client (from `createIamClient`, pointed at the
   * IAM service's base URL + `/v1` — e.g. the app's `env.iamUrl`, which may
   * live on a different origin than the app API's gateway). */
  client: AxiosInstance;
  mapProfile?: (raw: IamMeResponse) => SessionUser;
  intervalMs?: number;
  /** When false, disables every `/me` call (on-login check + poller) — the
   * session user is derived from the ZITADEL token instead. Default true. */
  enabled?: boolean;
  loginPath?: string;
  children: ReactNode;
}

/**
 * Mounts the background session poller and renders `SessionExpiredDialog`
 * app-wide. Wrap the app tree with this once (below `GslAuthProvider`, so
 * `useAuth` is available) and the dialog will render no matter which route is
 * active.
 */
export function SessionProvider({
  client,
  mapProfile,
  intervalMs,
  enabled,
  loginPath = '/login',
  children,
}: SessionProviderProps) {
  useSessionPoller({ client, mapProfile, intervalMs, enabled });

  const sessionExpired = useSessionStore((s) => s.sessionExpired);
  const sessionExpiredMessage = useSessionStore((s) => s.sessionExpiredMessage);
  const clearSession = useSessionStore((s) => s.clearSession);

  return (
    <>
      <SessionExpiredDialog
        open={sessionExpired}
        message={sessionExpiredMessage}
        onOpenChange={() => clearSession()}
        onLogin={() => clearSession()}
        loginPath={loginPath}
      />
      {children}
    </>
  );
}
