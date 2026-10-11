/**
 * VirtualTrade API Client
 *
 * Implements:
 * 1. In-memory access token storage (never stored in localStorage)
 * 2. Automatic credentials: 'include' for secure HttpOnly refresh token cookie
 * 3. Automatic 401 interceptor with silent token rotation and transparent request retry
 * 4. Session expiry callback for clean logout/redirect
 */

let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

const onRefreshed = (token: string | null) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = (): string | null => {
  return inMemoryAccessToken;
};

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefreshRetry?: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
  };
}

let sessionExpiredHandler: (() => void) | null = null;

export const setOnSessionExpired = (handler: () => void) => {
  sessionExpiredHandler = handler;
};

const BASE_URL = '/api/v1';

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { skipAuth = false, skipRefreshRetry = false, ...fetchOptions } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(fetchOptions.headers || {});
  headers.set('Content-Type', 'application/json');

  if (!skipAuth && inMemoryAccessToken) {
    headers.set('Authorization', `Bearer ${inMemoryAccessToken}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  });

  // Handle 401 Unauthorized (attempt refresh and retry)
  if (response.status === 401 && !skipRefreshRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newToken = refreshData.data?.accessToken;
          setAccessToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);

          // Retry the original request with the new access token
          headers.set('Authorization', `Bearer ${newToken}`);
          const retryResponse = await fetch(url, {
            ...fetchOptions,
            headers,
            credentials: 'include',
          });
          return await retryResponse.json();
        } else {
          isRefreshing = false;
          setAccessToken(null);
          onRefreshed(null);
          if (sessionExpiredHandler) {
            sessionExpiredHandler();
          }
        }
      } catch {
        isRefreshing = false;
        setAccessToken(null);
        onRefreshed(null);
        if (sessionExpiredHandler) {
          sessionExpiredHandler();
        }
      }
    } else {
      // If already refreshing, queue the request until refresh finishes
      return new Promise<ApiResponse<T>>((resolve, reject) => {
        refreshSubscribers.push(async (newToken) => {
          if (!newToken) {
            resolve({
              success: false,
              error: { code: 'TOKEN_EXPIRED', message: 'Session expired' },
            });
            return;
          }
          headers.set('Authorization', `Bearer ${newToken}`);
          try {
            const retryResponse = await fetch(url, {
              ...fetchOptions,
              headers,
              credentials: 'include',
            });
            resolve(await retryResponse.json());
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }

  const data: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    error: {
      code: 'PARSE_ERROR',
      message: `HTTP error ${response.status}: Failed to parse server response`,
    },
  }));

  return data;
}
