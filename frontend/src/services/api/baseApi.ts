/**
 * Base API Configuration and Utilities
 * Central place for all API-related helpers
 * Updated to use secure token management (httpOnly cookies + in-memory storage)
 * and unified error handling
 */

import {
  API_CONFIG,
  FLAT_ENDPOINTS,
  getErrorMessage,
  getApiBaseUrl
} from '@/config/api-config';

import { getCSRFToken, initializeCSRF } from '@/lib/csrf';
import { getAccessToken, refreshAccessToken as refreshAccessTokenFromManager } from '@/lib/tokenManager';
import { ApiError, showErrorToast } from '@/lib/errorHandler';
import { networkMonitor } from '@/lib/offline/network-monitor';
import { syncEngine } from '@/lib/offline/sync-engine';
import * as stores from '@/lib/offline/stores';

// Re-export for backward compatibility
export const API_BASE_URL = API_CONFIG.baseUrl;
export const ENDPOINTS = FLAT_ENDPOINTS;
export { getErrorMessage as getDefaultArabicError };
export type ApiErrorExtended = ApiError;
const IS_API_DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_API_LOGS === 'true';

function debugLog(...args: unknown[]): void {
  if (IS_API_DEBUG_ENABLED) {
    console.debug(...args);
  }
}

/**
 * Get auth token from memory (secure)
 */
export function getAuthToken(): string | null {
  const token = getAccessToken();
  debugLog('[getAuthToken] Token present in memory:', !!token);
  return token;
}

/**
 * Legacy compatibility helper.
 * Refresh token is now managed via httpOnly cookies, so no client-side access is exposed.
 */
export function getRefreshToken(): null {
  return null;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function buildRequestUrl(endpoint: string): string {
  if (isAbsoluteUrl(endpoint)) {
    return endpoint;
  }

  const cleanBaseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let normalizedEndpoint = cleanEndpoint;

  if (cleanEndpoint.startsWith('/api/v1/')) {
    normalizedEndpoint = cleanEndpoint;
  } else if (cleanEndpoint.startsWith('/api/')) {
    normalizedEndpoint = cleanEndpoint.replace('/api/', '/api/v1/');
  } else if (cleanEndpoint === '/api') {
    normalizedEndpoint = '/api/v1';
  } else if (cleanEndpoint.startsWith('/v1/')) {
    normalizedEndpoint = `/api${cleanEndpoint}`;
  } else {
    normalizedEndpoint = `/api/v1${cleanEndpoint}`;
  }

  return `${cleanBaseUrl}${normalizedEndpoint}`;
}

function isTrustedApiUrl(targetUrl: string): boolean {
  try {
    const target = new URL(targetUrl);
    const apiBase = new URL(getApiBaseUrl());
    const apiPath = apiBase.pathname.replace(/\/+$/, '') || '/';

    if (target.origin !== apiBase.origin) {
      return false;
    }

    if (apiPath === '/') {
      return true;
    }

    return target.pathname === apiPath || target.pathname.startsWith(`${apiPath}/`);
  } catch {
    return false;
  }
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    const normalized: Record<string, string> = {};
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return { ...headers };
}

function hasHeader(headers: Record<string, string>, headerName: string): boolean {
  const normalizedName = headerName.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === normalizedName);
}

function shouldSetJsonContentType(
  method: string | undefined,
  body: BodyInit | null | undefined,
  headers: Record<string, string>
): boolean {
  if (hasHeader(headers, 'Content-Type')) {
    return false;
  }

  const upperMethod = (method || 'GET').toUpperCase();
  if (upperMethod === 'GET' || upperMethod === 'HEAD' || body == null) {
    return false;
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return false;
  }

  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    return false;
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return false;
  }

  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) {
    return false;
  }

  return true;
}

function createNetworkError(error: unknown): ApiError {
  const message = error instanceof Error && error.message
    ? `فشل الاتصال بالخادم: ${error.message}`
    : 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';

  return new ApiError(message, 0);
}

function isSafeAcademyId(value: unknown): value is string | number {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false;
  }
  return /^[a-zA-Z0-9_-]+$/.test(String(value));
}

/**
 * Client-side academy context is only a routing hint.
 * Server-side authorization must validate tenant access independently.
 */
function resolveAcademyContextHeader(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const selectedAcademyStr = localStorage.getItem('selectedAcademy');
  if (selectedAcademyStr) {
    try {
      const selectedAcademy = JSON.parse(selectedAcademyStr) as { id?: unknown } | null;
      if (selectedAcademy?.id && isSafeAcademyId(selectedAcademy.id)) {
        return String(selectedAcademy.id);
      }
    } catch {
      // Ignore malformed localStorage and fallback below.
    }
  }

  const userType = localStorage.getItem('userType');
  if (userType === 'teacher') {
    return 'independent';
  }

  return null;
}

/**
 * Get auth headers including token and academy context
 * Uses secure token management (memory-first approach)
 */
export function getAuthHeaders(
  additionalHeaders: Record<string, string> = {},
  requestUrl?: string,
  requestOptions: Pick<RequestInit, 'method' | 'body'> = {}
): Record<string, string> {
  const allowSensitiveHeaders = requestUrl ? isTrustedApiUrl(requestUrl) : true;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...additionalHeaders,
  };

  if (shouldSetJsonContentType(requestOptions.method, requestOptions.body, headers)) {
    headers['Content-Type'] = 'application/json';
  }

  if (allowSensitiveHeaders) {
    const xsrfToken = getCSRFToken();
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken;
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } else {
    Object.keys(headers).forEach((headerKey) => {
      if (headerKey.toLowerCase() === 'authorization') {
        delete headers[headerKey];
      }
    });
  }

  debugLog('[getAuthHeaders] Token present:', !!token);
  debugLog('[getAuthHeaders] Allow sensitive headers:', allowSensitiveHeaders);

  if (allowSensitiveHeaders) {
    const academyContext = resolveAcademyContextHeader();
    if (academyContext) {
      headers['X-Academy-Id'] = academyContext;
    }
  }

  return headers;
}

/**
 * Refresh the access token using the refresh token
 * Uses secure token management (cookies are httpOnly)
 * NOTE: Uses centralized tokenManager.refreshAccessToken() for single-flight guarantee
 */
async function refreshAccessToken(): Promise<string | null> {
  return await refreshAccessTokenFromManager();
}

/**
 * CSRF Cookie initialization
 * Uses the dedicated CSRF service
 */
export async function csrf(): Promise<void> {
  await initializeCSRF();
}

/**
 * Generic API fetch wrapper
 */
export async function fetchApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  skipAuthEvent: boolean = false
): Promise<T> {
  // Ensure endpoint is valid
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint: endpoint must be a non-empty string');
  }

  const method = (options.method || 'GET').toUpperCase();
  const url = buildRequestUrl(endpoint);
  const isTrustedUrl = isTrustedApiUrl(url);
  const additionalHeaders = normalizeHeaders(options.headers);
  const headers = getAuthHeaders(additionalHeaders, url, {
    method: options.method,
    body: options.body,
  });

  const offlineOptions = options as RequestInit & {
    offlineConfig?: {
      storeName?: string;
      entityId?: string;
      entityType?: string;
      skipCache?: boolean;
    };
  };

  const isOnline = networkMonitor.isOnline;

  if (!isOnline) {
    if (method === 'GET') {
      if (offlineOptions.offlineConfig?.storeName) {
        const storeName = offlineOptions.offlineConfig.storeName;
        const entityId = offlineOptions.offlineConfig.entityId;
        const targetStore = (stores as any)[storeName + 'Store'];
        if (targetStore) {
          console.log(`[fetchApi] Offline: Serving from store ${storeName}`);
          if (entityId) {
            const data = await targetStore.getById(entityId);
            if (data !== undefined) return data as T;
          } else {
            const data = await targetStore.getAll();
            return data as T;
          }
        }
        throw new ApiError('أنت غير متصل بالإنترنت والبيانات المطلوبة غير متوفرة محلياً.', 0);
      }
      // If NO offlineConfig, do nothing and let it proceed to fetch() for Service Worker caching
    } else {
      if ((method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') && offlineOptions.offlineConfig?.entityType) {
        const entityType = offlineOptions.offlineConfig.entityType;
        const entityId = offlineOptions.offlineConfig.entityId;
        
        const safeHeaders: Record<string, string> = {};
        if (headers['X-Academy-Id']) safeHeaders['X-Academy-Id'] = headers['X-Academy-Id'];
        if (headers['X-XSRF-TOKEN']) safeHeaders['X-XSRF-TOKEN'] = headers['X-XSRF-TOKEN'];
        if (headers['Authorization']) safeHeaders['Authorization'] = headers['Authorization'];

        console.log(`[fetchApi] Offline: Enqueuing mutation for ${entityType}`);
        const queueId = await syncEngine.enqueue(
          url,
          method as any,
          options.body ? JSON.parse(options.body as string) : {},
          entityType,
          entityId,
          safeHeaders
        );

        return {
          status: 'offline_queued',
          message: 'تم حفظ العملية محلياً وسيتم مزامنتها تلقائياً عند اتصالك بالإنترنت.',
          queueId,
          id: entityId,
        } as unknown as T;
      }

      throw new ApiError('يرجى الاتصال بالإنترنت لإجراء هذه العملية.', 0);
    }
  }

  const executeRequest = async (): Promise<Response> => {
    try {
      return await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (error) {
      // Sudden connection failure fallback
      if (method === 'GET' && offlineOptions.offlineConfig?.storeName) {
        const storeName = offlineOptions.offlineConfig.storeName;
        const entityId = offlineOptions.offlineConfig.entityId;
        const targetStore = (stores as any)[storeName + 'Store'];
        if (targetStore) {
          console.warn('[fetchApi] Network failed, falling back to cache');
          if (entityId) {
            const data = await targetStore.getById(entityId);
            if (data !== undefined) return new Response(JSON.stringify({ status: true, data }), { headers: { 'Content-Type': 'application/json' } });
          } else {
            const data = await targetStore.getAll();
            return new Response(JSON.stringify({ status: true, data }), { headers: { 'Content-Type': 'application/json' } });
          }
        }
      }
      const networkError = createNetworkError(error);
      showErrorToast(networkError);
      throw networkError;
    }
  };

  // On hard refresh, in-memory token can be empty while httpOnly refresh cookie is still valid.
  // Prime Authorization once before the first protected request to avoid noisy first-load 401s.
  if (isTrustedUrl && !skipAuthEvent && !headers['Authorization'] && typeof window !== 'undefined') {
    const hasStoredSessionHint = !!localStorage.getItem('userType');
    if (hasStoredSessionHint) {
      const primedToken = await refreshAccessToken();
      if (primedToken) {
        headers['Authorization'] = `Bearer ${primedToken}`;
      }
    }
  }

  let response = await executeRequest();

  // Handle 419 CSRF Token Mismatch - Retry once
  if (response.status === 419 && isTrustedUrl) {
    await initializeCSRF(true);
    const newXsrfToken = getCSRFToken();

    if (newXsrfToken) {
      headers['X-XSRF-TOKEN'] = newXsrfToken;
      response = await executeRequest();
    }
  }

  // Handle 401 Unauthorized - Attempt Refresh
  if (response.status === 401 && !skipAuthEvent && isTrustedUrl) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await executeRequest();
    }
  }

  if (!response.ok) {
    let error: Record<string, unknown>;
    try {
      const text = await response.text();
      try {
        error = JSON.parse(text);
      } catch {
        error = { message: text || `API Error: ${response.status}` };
      }
    } catch {
      error = { message: `API Error: ${response.status}` };
    }

    const safeMessage = getErrorMessage(response.status);
    const serverMessage = typeof error?.message === 'string' ? error.message : null;
    const resolvedMessage = response.status >= 500
      ? safeMessage
      : (serverMessage || safeMessage);
    if (IS_API_DEBUG_ENABLED && serverMessage) {
      console.error('[API Error Payload]', serverMessage);
    }


    // Create ApiError instance
    const apiError = new ApiError(
      resolvedMessage,
      response.status,
      error.errors as Record<string, string[]> | undefined,
      error.data as Record<string, unknown> | undefined
    );

    // Dispatch auth events
    if (response.status === 401 && !skipAuthEvent) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    if (response.status === 403 && !skipAuthEvent) {
      const isTeacherSuspended = error?.error === 'TEACHER_SUSPENDED';
      const isAccountRestricted = error?.error === 'ACCOUNT_RESTRICTED';
      const isEnrollmentInactive = error?.error === 'ENROLLMENT_INACTIVE';
      const isAccountSuspended = error?.error === 'ACCOUNT_SUSPENDED';
      
      if (typeof window !== 'undefined') {
        if (isTeacherSuspended || isAccountSuspended) {
          window.dispatchEvent(new Event('auth:suspended'));
        } else if (isAccountRestricted || isEnrollmentInactive) {
          window.dispatchEvent(new Event('auth:restricted'));
        }
      }
    }

    // Show error toast (skip for restricted or unapproved accounts as they are handled by global logic/redirection)
    const skipToast = (response.status === 403 && (error?.error === 'ACCOUNT_RESTRICTED' || error?.error === 'ACCOUNT_NOT_APPROVED'));
    if (!skipToast) {
      showErrorToast(apiError);
    }

    throw apiError;
  }

  interface ApiResponse<T> {
    status: boolean;
    status_code: number;
    message: string;
    data: T;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const responseContentType = response.headers.get('content-type') || '';
  if (!responseContentType.includes('application/json')) {
    const textResponse = await response.text();
    return textResponse as T;
  }

  const res: ApiResponse<T> = await response.json();
  const dataResult = res.data !== undefined ? res.data : (res as unknown as T);

  // Auto-cache to IndexedDB when online GET succeeds
  if (method === 'GET' && response.ok && offlineOptions.offlineConfig?.storeName && !offlineOptions.offlineConfig.skipCache) {
    const storeName = offlineOptions.offlineConfig.storeName;
    const targetStore = (stores as any)[storeName + 'Store'];
    if (targetStore && dataResult) {
      if (Array.isArray(dataResult)) {
        targetStore.putMany(dataResult).catch((err: any) => console.error(`[fetchApi] Auto-cache putMany failed for ${storeName}:`, err));
      } else {
        targetStore.put(dataResult).catch((err: any) => console.error(`[fetchApi] Auto-cache put failed for ${storeName}:`, err));
      }
    }
  }

  return dataResult;
}
