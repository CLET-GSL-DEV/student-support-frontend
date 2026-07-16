import axios, { type AxiosError } from 'axios';

export class ApiError extends Error {
  type: string;
  status: number;
  detail?: unknown;

  constructor(type: string, message: string, status: number, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.detail = detail;
  }
}

export interface APIErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  code?: number;
}

export function normalizeApiError(error: AxiosError<APIErrorResponse>): ApiError {
  const data = error.response?.data;
  const status = error.response?.status ?? 0;

  const message = data?.detail ?? data?.message ?? data?.error ?? 'An unexpected error occurred';

  let type = 'UNKNOWN';

  if (status === 401) type = 'UNAUTHORIZED';
  else if (status === 403) type = 'FORBIDDEN';
  else if (status === 404) type = 'NOT_FOUND';
  else if (status === 422) type = 'VALIDATION_ERROR';
  else if (status === 429) type = 'RATE_LIMITED';
  else if (status >= 500) type = 'SERVER_ERROR';

  return new ApiError(type, message, status, data);
}

/**
 * Extract a display-safe message from an error caught outside an axios
 * instance's own interceptor chain.
 */
export function apiErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (axios.isAxiosError<APIErrorResponse>(error))
    return normalizeApiError(error).message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}
