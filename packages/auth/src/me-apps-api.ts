import { GET } from '@starter/api-client';

/**
 * One entry per system the caller can open — `GET /v1/me/apps`
 * (`iam-3.0`'s `apps/oidc_rp/views.py::my_apps`). `frontend_url` is derived
 * server-side from the system's registered OIDC-client redirect URIs (origin
 * of the first valid one), so it's empty for a system whose SPA app has none
 * registered yet.
 */
export interface IamApp {
  system_code: string;
  system_name: string;
  frontend_url: string;
  role: string;
  permissions: string[];
}

export const meAppsKeys = {
  all: ['iam', 'me-apps'] as const,
  list: () => [...meAppsKeys.all] as const,
} as const;

export const myAppsEndpoint = GET<IamApp[]>({
  path: '/me/apps',
  queryKey: meAppsKeys.list(),
});
