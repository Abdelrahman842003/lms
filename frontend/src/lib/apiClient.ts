/**
 * API Client with Academy Context Support
 *
 * A centralized API client that automatically injects academy context
 * from the AcademyContext, decoupling the API layer from localStorage.
 *
 * This client provides:
 * - Automatic academy header injection
 * - Type-safe request methods
 * - Consistent error handling
 * - Request/response interceptors
 */

import { getApiBaseUrl, getVersionedApiUrl } from '@/config/api-config';
import { getCSRFToken, initializeCSRF } from './csrf';
import { getAccessToken, refreshAccessToken as tokenRefresh } from './tokenManager';
import { ApiError } from './errorHandler';
import { networkMonitor } from './offline/network-monitor';
import { syncEngine } from './offline/sync-engine';
import * as stores from './offline/stores';

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Request Options
 */
export interface RequestOptions extends Omit<RequestInit, 'headers' | 'method'> {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  skipAcademy?: boolean;
  offlineConfig?: {
    storeName?: string;
    entityId?: string;
    entityType?: string;
    skipCache?: boolean;
  };
}

/**
 * API Client Class
 */
class ApiClient {
  private academyContext: string | null = null;
  private baseUrl: string;
  private trustedApiOrigin: string;
  private trustedApiPath: string;

  constructor() {
    this.baseUrl = getVersionedApiUrl();

    const trustedApiUrl = new URL(getApiBaseUrl());
    this.trustedApiOrigin = trustedApiUrl.origin;
    this.trustedApiPath = trustedApiUrl.pathname.replace(/\/+$/, '') || '/';
  }

  /**
   * Set the current academy context
   * This should be called by the AcademyProvider
   */
  setAcademyContext(academyId: string | null): void {
    this.academyContext = academyId;
  }

  /**
   * Get the current academy context
   */
  getAcademyContext(): string | null {
    return this.academyContext;
  }

  private isTrustedRequestUrl(requestUrl: string): boolean {
    try {
      const parsedUrl = new URL(requestUrl);
      if (parsedUrl.origin !== this.trustedApiOrigin) {
        return false;
      }

      if (this.trustedApiPath === '/') {
        return true;
      }

      return parsedUrl.pathname === this.trustedApiPath ||
        parsedUrl.pathname.startsWith(`${this.trustedApiPath}/`);
    } catch {
      return false;
    }
  }

  private shouldSetJsonContentType(
    method: HttpMethod,
    body: BodyInit | null | undefined,
    headers: Record<string, string>
  ): boolean {
    const hasContentType = Object.keys(headers).some(
      (key) => key.toLowerCase() === 'content-type'
    );

    if (hasContentType || method === 'GET' || method === 'HEAD' || body == null) {
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

    return true;
  }

  /**
   * Build request headers
   */
  private buildHeaders(
    method: HttpMethod,
    requestUrl: string,
    options: RequestOptions
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...options.headers,
    };

    if (this.shouldSetJsonContentType(method, options.body, headers)) {
      headers['Content-Type'] = 'application/json';
    }

    const trustedRequest = this.isTrustedRequestUrl(requestUrl);

    // Add CSRF and authorization only for trusted API URLs
    if (trustedRequest) {
      const xsrfToken = getCSRFToken();
      if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
      }

      if (!options.skipAuth) {
        const token = getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } else {
      Object.keys(headers).forEach((headerKey) => {
        if (headerKey.toLowerCase() === 'authorization') {
          delete headers[headerKey];
        }
      });
    }

    // Add academy context header
    if (!options.skipAcademy && trustedRequest) {
      const academyId = this.academyContext || this.getAcademyFromLegacy();
      if (academyId) {
        headers['X-Academy-Id'] = academyId;
      }
    }

    return headers;
  }

  /**
   * Get academy ID from legacy localStorage (for backward compatibility)
   *
   * @deprecated Remove once all components use AcademyContext.setAcademyContext()
   * @todo Track usage and plan migration deadline
   *
   * This is a temporary bridge during the migration from localStorage-based
   * academy selection to the new AcademyContext system.
   */
  private getAcademyFromLegacy(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const selectedAcademy = localStorage.getItem('selectedAcademy');
      if (selectedAcademy) {
        const academy = JSON.parse(selectedAcademy);
        return academy?.id || null;
      }
    } catch {
      // Ignore parse errors
    }

    return null;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = /^https?:\/\//i.test(endpoint) ? endpoint : `${this.baseUrl}${cleanEndpoint}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  /**
   * Handle 401 Unauthorized - Attempt Token Refresh
   */
  private async handleUnauthorized(originalRequest: () => Promise<Response>): Promise<Response> {
    try {
      const newToken = await tokenRefresh();

      if (newToken) {
        // Retry the original request with new token
        return await originalRequest();
      }
    } catch {
      // Token refresh failed, clear storage
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    throw new ApiError('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.', 401);
  }

  /**
   * Handle 419 CSRF Mismatch
   */
  private async handleCsrfMismatch(originalRequest: () => Promise<Response>): Promise<Response> {
    try {
      await initializeCSRF(true);
      return await originalRequest();
    } catch {
      console.error('Failed to refresh CSRF token');
    }

    throw new ApiError('انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة.', 419);
  }

  private serializeBody(data: unknown): BodyInit | undefined {
    if (data === null || data === undefined) {
      return undefined;
    }

    if (typeof data === 'string') {
      return data;
    }

    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return data;
    }

    if (typeof URLSearchParams !== 'undefined' && data instanceof URLSearchParams) {
      return data;
    }

    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return data;
    }

    return JSON.stringify(data);
  }

  /**
   * Make an HTTP request
   */
  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const buildFetchOptions = (): RequestInit => {
      const headers = this.buildHeaders(method, url, options);
      const fetchOptions: RequestInit = {
        ...options,
        method,
        headers,
        credentials: 'include',
      };

      // Remove params from options as they're now in the URL
      delete (fetchOptions as RequestOptions).params;
      return fetchOptions;
    };

    // Check connection status
    const isOnline = networkMonitor.isOnline;

    if (!isOnline) {
      // 1. Handling GET request (read cache)
      if (method === 'GET') {
        if (options.offlineConfig?.storeName) {
          const storeName = options.offlineConfig.storeName;
          const entityId = options.offlineConfig.entityId;
          const targetStore = (stores as any)[storeName + 'Store'];
          if (targetStore) {
            console.log(`[ApiClient] Offline: Serving from store ${storeName}`);
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
        // 2. Handling mutations (write queue)
        if ((method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') && options.offlineConfig?.entityType) {
          const entityType = options.offlineConfig.entityType;
          const entityId = options.offlineConfig.entityId;
          
          const headers = this.buildHeaders(method, url, options);
          const safeHeaders: Record<string, string> = {};
          if (headers['X-Academy-Id']) safeHeaders['X-Academy-Id'] = headers['X-Academy-Id'];
          if (headers['X-XSRF-TOKEN']) safeHeaders['X-XSRF-TOKEN'] = headers['X-XSRF-TOKEN'];
          if (headers['Authorization']) safeHeaders['Authorization'] = headers['Authorization'];

          console.log(`[ApiClient] Offline: Enqueuing mutation for ${entityType}`);
          const queueId = await syncEngine.enqueue(
            url,
            method,
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

    // IMPORTANT: keep this dynamic so retries after CSRF/token refresh use fresh headers.
    const executeRequest = (): Promise<Response> => fetch(url, buildFetchOptions());
    const trustedUrl = this.isTrustedRequestUrl(url);
    let response: Response;

    try {
      response = await executeRequest();
    } catch (error) {
      // Offline fallback if fetch fails due to sudden network loss
      if (method === 'GET' && options.offlineConfig?.storeName) {
        const storeName = options.offlineConfig.storeName;
        const entityId = options.offlineConfig.entityId;
        const targetStore = (stores as any)[storeName + 'Store'];
        if (targetStore) {
          console.warn('[ApiClient] Connection failed, falling back to cache');
          if (entityId) {
            const data = await targetStore.getById(entityId);
            if (data !== undefined) return data as T;
          } else {
            const data = await targetStore.getAll();
            return data as T;
          }
        }
      }

      const message = error instanceof Error && error.message
        ? `فشل الاتصال بالخادم: ${error.message}`
        : 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
      throw new ApiError(message, 0);
    }

    // Handle 419 CSRF Mismatch
    if (response.status === 419 && trustedUrl) {
      response = await this.handleCsrfMismatch(executeRequest);
    }

    // Handle 401 Unauthorized
    if (response.status === 401 && !options.skipAuth && trustedUrl) {
      response = await this.handleUnauthorized(executeRequest);
    }

    // Handle error responses
    if (!response.ok) {
      await this.handleError(response);
    }

    const parsedResult = await this.parseResponse<T>(response);

    // Auto-update cache for GET requests when online
    if (method === 'GET' && response.ok && options.offlineConfig?.storeName && !options.offlineConfig.skipCache) {
      const storeName = options.offlineConfig.storeName;
      const targetStore = (stores as any)[storeName + 'Store'];
      if (targetStore && parsedResult) {
        if (Array.isArray(parsedResult)) {
          targetStore.putMany(parsedResult).catch((err: any) => console.error(`[ApiClient] Auto-cache putMany failed for ${storeName}:`, err));
        } else {
          targetStore.put(parsedResult).catch((err: any) => console.error(`[ApiClient] Auto-cache put failed for ${storeName}:`, err));
        }
      }
    }

    return parsedResult;
  }

  /**
   * Handle API error responses
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: Record<string, unknown> = {};

    try {
      const text = await response.text();
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { message: text || `HTTP Error: ${response.status}` };
      }
    } catch {
      errorData = { message: `HTTP Error: ${response.status}` };
    }

    const message = (errorData.message as string) || 'حدث خطأ غير متوقع';
    const apiError = new ApiError(
      message,
      response.status,
      errorData.errors as Record<string, string[]> | undefined,
      errorData.data as Record<string, unknown> | undefined
    );

    // Dispatch auth events
    if (typeof window !== 'undefined' && response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (typeof window !== 'undefined' && response.status === 403) {
      const isTeacherSuspended = errorData.error === 'TEACHER_SUSPENDED';
      if (isTeacherSuspended) {
        window.dispatchEvent(new Event('auth:teacher_suspended'));
      }
    }

    throw apiError;
  }

  /**
   * Parse successful response
   */
  private async parseResponse<T>(response: Response): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();

      // Handle standard API response format
      if (data.status !== undefined && data.data !== undefined) {
        return data.data as T;
      }

      return data as T;
    }

    // Handle non-JSON responses (text, blob, etc.)
    return (await response.text()) as unknown as T;
  }

  /**
   * GET request
   */
  public async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('GET', endpoint, { ...options, skipAcademy: false });
  }

  /**
   * POST request
   */
  public async post<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('POST', endpoint, {
      ...options,
      body: this.serializeBody(data),
    });
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body: this.serializeBody(data),
    });
  }

  /**
   * PATCH request
   */
  public async patch<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', endpoint, {
      ...options,
      body: this.serializeBody(data),
    });
  }

  /**
   * DELETE request
   */
  public async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

/**
 * Create singleton instance
 */
export const apiClient = new ApiClient();

/**
 * Convenience exports
 */
export const { get, post, put, patch, delete: del } = apiClient;

export default apiClient;
