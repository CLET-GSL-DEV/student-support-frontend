import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export interface CreateApiClientOptions {
  baseURL: string;
  /** Returns the current access token to attach as a Bearer header. */
  getToken?: () => string | null;
  /**
   * Called once on a 401 to obtain a fresh access token (e.g. by hitting a
   * refresh endpoint that reads the httpOnly refresh cookie). Return the new
   * token, or null if the session can no longer be refreshed.
   */
  onRefresh?: () => Promise<string | null>;
  /** Called when refresh fails or is unavailable — apps use this to log out. */
  onAuthError?: () => void;
  headers?: Record<string, string>;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/**
 * Create a configured axios instance with auth + single-flight refresh.
 * Generalizes the old `config/api.ts` singleton so every portal builds its own
 * client with its own token source and logout behavior.
 */
export function createApiClient(options: CreateApiClientOptions): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL,
    // Send the httpOnly refresh cookie on same-site/CORS-allowed requests.
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  instance.interceptors.request.use((config) => {
    const token = options.getToken?.();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Single-flight refresh: concurrent 401s share one refresh call.
  let refreshPromise: Promise<string | null> | null = null;

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const original = error.config as RetriableConfig | undefined;
      const isAuthEndpointFailure = original?._retry === true;

      if (
        error.response?.status === 401 &&
        original &&
        !isAuthEndpointFailure &&
        options.onRefresh
      ) {
        original._retry = true;
        try {
          refreshPromise ??= options.onRefresh();
          const newToken = await refreshPromise;
          refreshPromise = null;

          if (newToken) {
            original.headers.Authorization = `Bearer ${newToken}`;
            return instance(original);
          }
        } catch {
          refreshPromise = null;
        }
        options.onAuthError?.();
      }

      return Promise.reject(error);
    },
  );

  return instance;
}
