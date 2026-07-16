export { createEnv, type CreateEnvOptions } from './env';
export {
  authStore,
  type RefreshHandler,
  type AuthErrorHandler,
  type TokenReader,
} from './authStore';
export { createApiClient, type CreateApiClientOptions } from './apiClient';
export { createQueryClient } from './queryClient';

// Endpoints system — declarative EndpointDef + typed hooks with automatic
// toasts. This is the ONLY API-calling pattern in this workspace — do not
// hand-roll a basePath-bound service creator per module.
export { ApiClientProvider } from './ApiClientProvider';
export { useApiClientContext } from './useApiClientContext';
export { METHODS, GET, POST, PATCH, PUT, DELETE, type EndpointDef } from './api-methods';
export { createService } from './api-service';
export { useQueryEndpoint, useMutationEndpoint } from './api-hooks';
export type { ToastCondition, QueryToastConfig, MutationToastConfig } from './api-toast';
export { ApiError, normalizeApiError, apiErrorMessage, type APIErrorResponse } from './api-error';
