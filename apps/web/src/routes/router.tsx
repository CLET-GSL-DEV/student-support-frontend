import { createBrowserRouter } from 'react-router';

import { ProtectedRoute } from '@starter/auth';
import { GlobalAuthRoutes, GlobalErrorRoutes } from '@starter/ui';

import { MainLayout } from '@/components/layout/MainLayout';
import { PREFERRED_ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';

/**
 * This app owns its own /login + OIDC callback routes — there is no central
 * login app. `GlobalAuthRoutes` (from `@starter/ui`) registers the same four
 * auth-flow routes (login, OIDC callback, logout callback, forbidden) every
 * app mounts, against this app's own ZITADEL redirect URI.
 */
const { errorElement, notFoundRoute } = GlobalErrorRoutes({ dashboardPath: ROUTES.DASHBOARD });

export const router = createBrowserRouter([
  ...GlobalAuthRoutes({
    returnTo: ROUTES.DASHBOARD,
    tagline: 'Starter',
    dashboardPath: ROUTES.DASHBOARD,
    // Single, self-contained app — never hard-redirect to another portal's
    // origin after the OIDC callback (the PORTALS map's localhost ports
    // don't exist in this deployment).
    skipRoleRedirect: true,
  }),
  {
    element: (
      <ProtectedRoute
        roles={PREFERRED_ROLES}
        redirectTo={ROUTES.LOGIN}
        forbiddenTo={ROUTES.FORBIDDEN}
      />
    ),
    errorElement,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, lazy: () => import('@/features/dashboard/pages/Dashboard') },
          { path: ROUTES.DASHBOARD, lazy: () => import('@/features/dashboard/pages/Dashboard') },
        ],
      },
    ],
  },
  // The ONLY catch-all in this router — deliberately outside every layout.
  // NotFoundPage/ErrorPage are styled `min-h-screen` (a standalone full-page
  // screen); nesting a second one inside MainLayout renders it squeezed
  // inside the sidebar/header shell.
  notFoundRoute,
]);
