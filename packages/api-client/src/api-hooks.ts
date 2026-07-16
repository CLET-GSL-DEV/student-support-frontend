import { useEffect, useRef } from 'react';

import { useToast } from '@rfdtech/components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

import type { EndpointDef } from './api-methods';
import { createService } from './api-service';
import type { MutationToastConfig, QueryToastConfig } from './api-toast';
import { useApiClientContext } from './useApiClientContext';

function resolveClient(explicit: AxiosInstance | undefined, contextual: AxiosInstance | null) {
  const client = explicit ?? contextual;
  if (!client) {
    throw new Error(
      'useQueryEndpoint/useMutationEndpoint: no axios client. Pass one explicitly or mount <ApiClientProvider client={...}> above this component.',
    );
  }
  return client;
}

export function useQueryEndpoint<TRes, TQuery = never>(
  endpoint: EndpointDef<TRes, never, TQuery>,
  args?: { params?: Record<string, string>; query?: TQuery },
  options?: { enabled?: boolean; toast?: QueryToastConfig<TRes> } & Record<string, unknown>,
  client?: AxiosInstance,
) {
  const contextClient = useApiClientContext();
  const svc = createService(endpoint, resolveClient(client, contextClient));
  const { toast: toastCfg, ...queryOptions } = options ?? {};
  const { toast } = useToast();

  const prevDataRef = useRef<TRes | undefined>(undefined);
  const prevErrorRef = useRef<unknown>(undefined);

  const query = useQuery({
    queryKey: [...(endpoint.queryKey ?? []), args?.params, args?.query],
    queryFn: () => svc({ params: args?.params, query: args?.query }),
    ...queryOptions,
  });

  useEffect(() => {
    const data = query.data;
    if (!toastCfg?.onSuccess || !data || data === prevDataRef.current) return;
    prevDataRef.current = data;
    toastCfg.onSuccess.forEach((item) => {
      if (item.condition(data as TRes)) {
        const title = typeof item.title === 'function' ? item.title(data) : item.title;
        toast({ title, variant: item.variant });
      }
    });
  }, [query.data]);

  useEffect(() => {
    const err = query.error;
    if (!toastCfg?.onError || !err || err === prevErrorRef.current) return;
    prevErrorRef.current = err;
    toastCfg.onError.forEach((item) => {
      if (item.condition(err)) {
        const title = typeof item.title === 'function' ? item.title(err) : item.title;
        toast({ title, variant: item.variant });
      }
    });
  }, [query.error]);

  return query;
}

export function useMutationEndpoint<TRes, TBody = never, TQuery = never>(
  endpoint: EndpointDef<TRes, TBody, TQuery>,
  options?: { client?: AxiosInstance; toast?: MutationToastConfig<TRes> },
) {
  const contextClient = useApiClientContext();
  const queryClient = useQueryClient();
  const { toast: toastCfg, client } = options ?? {};
  const svc = createService(endpoint, resolveClient(client, contextClient));
  const { toast } = useToast();

  return useMutation({
    mutationFn: (args?: { params?: Record<string, string>; body?: TBody; query?: TQuery }) =>
      svc(args),
    onSuccess: (data) => {
      endpoint.invalidates?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as readonly unknown[] });
      });
      toastCfg?.onSuccess?.forEach((item) => {
        if (item.condition(data)) {
          const title = typeof item.title === 'function' ? item.title(data) : item.title;
          toast({ title, variant: item.variant });
        }
      });
    },
    onError: (error) => {
      toastCfg?.onError?.forEach((item) => {
        if (item.condition(error)) {
          const title = typeof item.title === 'function' ? item.title(error) : item.title;
          toast({ title, variant: item.variant });
        }
      });
    },
  });
}
