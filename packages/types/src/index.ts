/** Standard envelope returned by paginated list endpoints. */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/** Standard error shape surfaced by the API layer. */
export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
}
