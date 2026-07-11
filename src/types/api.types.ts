/**
 * Global API response layout returned by the backend.
 * This structure is shared across all feature domains.
 */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: unknown;
  data?: T;
}
