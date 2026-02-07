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

import { API_CONFIG, getVersionedApiUrl } from '@/config/api-config';
import { getCSRFToken } from './csrf';
import { getAccessToken, refreshAccessToken as tokenRefresh } from './tokenManager';
import { ApiError, handleApiError } from './errorHandler';

/**
 * HTTP Methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request Options
 */
interface RequestOptions extends Omit<RequestInit, 'headers' | 'method'> {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
  skipAcademy?: boolean;
}

/**
 * API Client Class
 */
class ApiClient {
  private academyContext: string | null = null;
  private baseUrl: string;

  constructor() {
    this.baseUrl = getVersionedApiUrl();
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

  /**
   * Build request headers
   */
  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    // Add CSRF token
    const xsrfToken = getCSRFToken();
    if (xsrfToken) {
      headers['X-XSRF-TOKEN'] = xsrfToken;
    }

    // Add authorization token
    if (!options.skipAuth) {
      const token = getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Add academy context header
    if (!options.skipAcademy) {
      const academyId = this.academyContext || this.getAcademyFromLegacy();
      if (academyId) {
        headers['X-Academy-Id'] = academyId;
      }
    }

    return headers;
  }

  /**
   * Get academy ID from legacy localStorage (for backward compatibility)
   * TODO: Remove this once all components use AcademyContext
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
    let url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

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
      // Re-initialize CSRF token
      const response = await fetch(`${API_CONFIG.baseUrl}/sanctum/csrf-cookie`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        // Retry the original request
        return await originalRequest();
      }
    } catch {
      console.error('Failed to refresh CSRF token');
    }

    throw new ApiError('انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة.', 419);
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
    const headers = this.buildHeaders(options);

    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: 'include',
      ...options,
    };

    // Remove params from options as they're now in the URL
    delete (fetchOptions as any).params;

    const executeRequest = (): Promise<Response> => {
      return fetch(url, fetchOptions);
    };

    let response = await executeRequest();

    // Handle 419 CSRF Mismatch
    if (response.status === 419) {
      response = await this.handleCsrfMismatch(executeRequest);
    }

    // Handle 401 Unauthorized
    if (response.status === 401 && !options.skipAuth) {
      response = await this.handleUnauthorized(executeRequest);
    }

    // Handle error responses
    if (!response.ok) {
      await this.handleError(response);
    }

    return this.parseResponse<T>(response);
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
    if (response.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    if (response.status === 403) {
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
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  public async put<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PUT', endpoint, {
      ...options,
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  public async patch<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
    return this.request<T>('PATCH', endpoint, {
      ...options,
      body: JSON.stringify(data),
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
