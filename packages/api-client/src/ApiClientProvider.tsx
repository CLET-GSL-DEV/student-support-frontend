import type { ReactNode } from 'react';

import type { AxiosInstance } from 'axios';

import { ApiClientContext } from './apiClientContext';

interface ApiClientProviderProps {
  client: AxiosInstance;
  children: ReactNode;
}

/**
 * Makes the app's axios instance (from `createApiClient`) available to
 * `useQueryEndpoint`/`useMutationEndpoint` without threading it through every
 * call site — mirrors the old single-app pattern where a module-level
 * `apiClient` singleton was the implicit default. Each app mounts this once,
 * near the root, with the client it built in `src/config/api.ts`.
 */
export function ApiClientProvider({ client, children }: ApiClientProviderProps) {
  return <ApiClientContext.Provider value={client}>{children}</ApiClientContext.Provider>;
}
