import type { AppItem } from '@rfdtech/components';
import type { AxiosInstance } from 'axios';
import { FileCheck2, GraduationCap, Landmark, LayoutGrid, ShieldCheck } from 'lucide-react';

import { useQueryEndpoint } from '@starter/api-client';

import { type IamApp, myAppsEndpoint } from './me-apps-api';
import { useAuth } from './useAuth';

/**
 * Best-effort icon per system code — falls back to a generic grid icon for
 * any system not listed here. Purely cosmetic; never blocks rendering.
 */
const SYSTEM_ICONS: Record<string, typeof LayoutGrid> = {
  EVS: FileCheck2,
  IAM: ShieldCheck,
  NBES: GraduationCap,
  NLEMS: GraduationCap,
  GOV: Landmark,
};

function toAppItem(app: IamApp): AppItem {
  const Icon = SYSTEM_ICONS[app.system_code] ?? LayoutGrid;
  return {
    id: app.system_code,
    name: app.system_name,
    icon: <Icon size={20} strokeWidth={2} aria-hidden />,
    href: app.frontend_url || undefined,
  };
}

/**
 * Feeds the GSL `AppSwitcher` from IAM's `GET /me/apps` (see `me-apps-api.ts`).
 * `client` must be an IAM-backend client reachable with CORS from this
 * origin (the deployed IAM gateway does not send CORS headers on most
 * routes — see `session-api.ts`'s doc comment) — pass it explicitly rather
 * than relying on the app's default `<ApiClientProvider>` client, which
 * targets the EVS backend.
 *
 * Never throws: any query error (network, CORS, 401) just leaves the
 * switcher empty, since losing the app switcher must never block the rest
 * of the portal.
 */
export function useMyApps(client: AxiosInstance): { apps: AppItem[]; loading: boolean } {
  const { isAuthenticated } = useAuth();

  const query = useQueryEndpoint(myAppsEndpoint, undefined, { enabled: isAuthenticated }, client);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const apps = (query.data ?? [])
    .filter((app) => {
      if (!app.frontend_url) return true;
      try {
        return new URL(app.frontend_url).origin !== currentOrigin;
      } catch {
        return true;
      }
    })
    .map(toAppItem);

  return { apps, loading: query.isLoading };
}
