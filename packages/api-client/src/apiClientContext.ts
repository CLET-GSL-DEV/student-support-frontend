import { createContext } from 'react';

import type { AxiosInstance } from 'axios';

/** Shared between `ApiClientProvider` and `useApiClientContext` — kept out of
 * either so both files can stay component/hook-only for fast refresh. */
export const ApiClientContext = createContext<AxiosInstance | null>(null);
