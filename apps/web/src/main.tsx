import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import '@rfdtech/components/style.css';

import { createQueryClient } from '@starter/api-client';
import { AppProviders } from '@starter/ui';

import { api, iamApi } from '@/config/api';
import { env } from '@/config/env';
import { ROUTES } from '@/constants/routes';
import { router } from '@/routes/router';

import './index.css';

const queryClient = createQueryClient();
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders
      queryClient={queryClient}
      auth={{
        zitadelEnv: env.zitadel,
        apiClient: api,
        iamClient: iamApi,
        session: { loginPath: ROUTES.LOGIN, enabled: env.sessionCheckEnabled },
        // Single, self-contained app — disables RoleBasedRedirectWatcher's
        // cross-portal hard redirect (mirrors router.tsx's skipRoleRedirect).
        skipRoleRedirect: true,
      }}
    >
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
