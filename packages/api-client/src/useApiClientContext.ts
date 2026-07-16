import { useContext } from 'react';

import type { AxiosInstance } from 'axios';

import { ApiClientContext } from './apiClientContext';

/** The app's default axios instance, or `null` if no `ApiClientProvider` is mounted. */
export function useApiClientContext(): AxiosInstance | null {
  return useContext(ApiClientContext);
}
