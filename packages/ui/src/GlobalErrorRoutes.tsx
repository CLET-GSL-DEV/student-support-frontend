import type { ReactElement } from 'react';
import type { RouteObject } from 'react-router';

import { GLOBAL_ROUTES, NotFoundPage, RouteErrorPage } from '@starter/auth';

export interface GlobalErrorRoutesConfig {
  /** Where NotFoundPage/RouteErrorPage's "Go to Dashboard" link points. */
  dashboardPath: string;
}

export interface GlobalErrorRoutesResult {
  /** Pass as any route node's `errorElement` — same branded screen everywhere. */
  errorElement: ReactElement;
  /** The app's single `path: '*'` catch-all. Must be the LAST entry in the
   * router array — every other route needs to get a chance to match first. */
  notFoundRoute: RouteObject;
}

/**
 * The two generic error surfaces every app needs — a React Router
 * `errorElement` for thrown/render errors and the `path: '*'` catch-all —
 * both branded via `RouteErrorPage`/`NotFoundPage`, both keyed on just the
 * app's dashboard path (login path is always `GLOBAL_ROUTES.LOGIN`).
 */
export function GlobalErrorRoutes({
  dashboardPath,
}: GlobalErrorRoutesConfig): GlobalErrorRoutesResult {
  const errorElement = (
    <RouteErrorPage dashboardPath={dashboardPath} loginPath={GLOBAL_ROUTES.LOGIN} />
  );

  return {
    errorElement,
    notFoundRoute: {
      path: '*',
      element: <NotFoundPage dashboardPath={dashboardPath} loginPath={GLOBAL_ROUTES.LOGIN} />,
      errorElement,
    },
  };
}
