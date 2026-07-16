import type { AxiosInstance } from 'axios';

import { authStore, createApiClient } from '@starter/api-client';

/**
 * IAM backend location. Supplied by the app (from its validated `config/env.ts`)
 * so this package never touches `import.meta.env` and each portal can point at
 * its own IAM deployment.
 */
export interface IamEnv {
  /** IAM API root, e.g. `/api/iam` — absolute URL or /-relative path. */
  baseUrl: string;
  /** Version segment appended to `baseUrl`. IAM routes everything under `v1/`. */
  apiVersion?: string;
}

const DEFAULT_API_VERSION = 'v1';

/**
 * IAM's canonical response envelope (`shared/responses.py::success_response`).
 * Every 2xx body is wrapped; the payload lives under `data`.
 */
interface IamEnvelope {
  success: boolean;
  message?: string;
  data: unknown;
  /** Present on paginated list responses (iam-3.0 `paginated_response`). */
  meta?: { total?: number; page?: number; page_size?: number };
}

function isEnvelope(body: unknown): body is IamEnvelope {
  return typeof body === 'object' && body !== null && 'success' in body && 'data' in body;
}

/**
 * The IAM axios instance. Separate from the app's Student Support client because IAM is a
 * separate service (`CLET-GSL-DEV/iam-3.0`) on its own base URL — the `/me`
 * profile, admin user/role administration and invitations all live there, and
 * none of those paths exist on the Student Support backend.
 *
 * Shares the same in-memory `authStore` as the Student Support client, so both send the
 * current access token and both defer to the same silent-renew / re-login
 * handlers wired by `AuthTokenBridge`.
 *
 * The extra response interceptor unwraps IAM's `{ success, message, data }`
 * envelope, so `createService`/`useQueryEndpoint` hand callers the payload
 * rather than the wrapper. The Student Support backend does not wrap, which is why this
 * lives here and not in `createApiClient`.
 */
export function createIamClient(env: IamEnv): AxiosInstance {
  const client = createApiClient({
    baseURL: `${env.baseUrl}/${env.apiVersion ?? DEFAULT_API_VERSION}`,
    getToken: authStore.getToken,
    onRefresh: authStore.runRefresh,
    onAuthError: authStore.runAuthError,
  });

  client.interceptors.response.use((response) => {
    if (isEnvelope(response.data)) {
      const env = response.data;
      if (Array.isArray(env.data) && env.meta) {
        // Paginated list: iam-3.0 returns `{ data: [...], meta: { total } }`.
        // The frontend endpoints are typed against Django-REST's
        // `{ results, count }`, so map it here instead of at every call site.
        response.data = { results: env.data, count: env.meta.total ?? env.data.length };
      } else {
        response.data = env.data;
      }
    }
    return response;
  });

  return client;
}
