import type { AxiosInstance } from 'axios';

import type { EndpointDef } from './api-methods';

/**
 * Bind an `EndpointDef` to a concrete axios instance, returning a plain async
 * function. Unlike a module-level singleton client, this package has no
 * default client — every app builds its own via `createApiClient` — so
 * `client` is required here. `useQueryEndpoint`/`useMutationEndpoint` default
 * it from `ApiClientProvider` for call sites that don't need one explicitly.
 */
export function createService<TRes, TBody = never, TQuery = never>(
  endpoint: EndpointDef<TRes, TBody, TQuery>,
  client: AxiosInstance,
) {
  return async (args?: {
    params?: Record<string, string>;
    body?: TBody;
    query?: TQuery;
  }): Promise<TRes> => {
    const url =
      typeof endpoint.path === 'function' ? endpoint.path(args?.params ?? {}) : endpoint.path;

    const response = await client.request<TRes>({
      method: endpoint.method,
      url,
      data: args?.body,
      params: args?.query,
    });

    return response.data;
  };
}
