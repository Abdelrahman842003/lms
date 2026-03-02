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
import { getAccessToken, setAccessToken, clearAccessToken, refreshAccessToken as tokenRefresh } from '@/lib/tokenManager';
import { ApiError, handleApiError, showErrorToast } from '@/lib/errorHandler';

// Re-export for backward compatibility
export const API_BASE_URL = API_CONFIG.baseUrl;
export const ENDPOINTS = FLAT_ENDPOINTS;
export { getErrorMessage as getDefaultArabicError };

/**
 * Get cookie by name (client-side only)
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  return null;
}

/**
 * Get auth token from memory (secure) or fallback to localStorage (legacy)
 * @deprecated Use tokenManager.getToken() directly for new code
 */
export function getAuthToken(): string | null {
  // Try in-memory token first (new secure approach)
  const memoryToken = getAccessToken();
  if (memoryToken) {
    console.debug('[getAuthToken] Using memory token');
    return memoryToken;
  }

  // Fallback to localStorage for backward compatibility during transition
  if (typeof window !== 'undefined') {
    const legacyToken = localStorage.getItem('token');
    if (legacyToken) {
      console.debug('[getAuthToken] Using localStorage token, migrating to memory');
      // Migrate to in-memory storage
      setAccessToken(legacyToken, 60);
      return legacyToken;
    }
    console.debug('[getAuthToken] No token found in memory or localStorage');
  }
  return null;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
}

/**
 * Get auth headers including token and academy context
 * Uses secure token management (memory-first approach)
 */
export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const xsrfToken = getCSRFToken();
  const token = getAuthToken();
  
  // Debug logging
  console.debug('[getAuthHeaders] Token present:', !!token);
  console.debug('[getAuthHeaders] Token source:', token ? (getAccessToken() ? 'memory' : 'localStorage') : 'none');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(xsrfToken && { 'X-XSRF-TOKEN': xsrfToken }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...additionalHeaders,
  };

  // Inject Academy Context Header
  if (typeof window !== 'undefined') {
    const selectedAcademyStr = localStorage.getItem('selectedAcademy');
    if (selectedAcademyStr) {
      try {
        const selectedAcademy = JSON.parse(selectedAcademyStr);
        if (selectedAcademy && selectedAcademy.id) {
          headers['X-Academy-Id'] = selectedAcademy.id;
        } else {
          headers['X-Academy-Id'] = 'independent';
        }
      } catch {
        // Ignore parse error
      }
    } else {
      const userType = localStorage.getItem('userType');
      if (userType === 'teacher') {
        headers['X-Academy-Id'] = 'independent';
      }
    }
  }

  return headers;
}

/**
 * Refresh the access token using the refresh token
 * Uses secure token management (cookies are httpOnly)
 */
async function refreshAccessToken(): Promise<string | null> {
  // Use the new secure token manager
  const newToken = await tokenRefresh();

  if (!newToken) {
    // Clear legacy localStorage tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  return newToken;
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
  const headers = getAuthHeaders(options.headers as Record<string, string>);

  // Ensure endpoint is valid
  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('Invalid endpoint: endpoint must be a non-empty string');
  }

  const cleanBaseUrl = getApiBaseUrl();
  
  // Build URL with version prefix
  let normalizedEndpoint = endpoint;
  
  // If endpoint starts with /api, handle it
  if (endpoint.startsWith('/api')) {
    // Check if it already has version prefix
    if (!endpoint.includes('/api/v1/')) {
      // Replace /api/ with /api/v1/
      normalizedEndpoint = endpoint.replace('/api/', '/api/v1/');
    }
  } else {
    // Endpoint doesn't start with /api
    // Check if it starts with /v1/
    if (endpoint.startsWith('/v1/')) {
      normalizedEndpoint = '/api' + endpoint;
    } else {
      // Add /api/v1 prefix
      normalizedEndpoint = '/api/v1' + endpoint;
    }
  }
  
  const url = `${cleanBaseUrl}${normalizedEndpoint}`;
  
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 419 CSRF Token Mismatch - Retry once
  if (response.status === 419) {
    await csrf();
    const newXsrfToken = getCSRFToken();

    if (newXsrfToken) {
      headers['X-XSRF-TOKEN'] = newXsrfToken;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  // Handle 401 Unauthorized - Attempt Refresh
  if (response.status === 401 && !skipAuthEvent) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
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

    const serverMessage = typeof error?.message === 'string' ? error.message : null;
    const arabicMessage = serverMessage || getErrorMessage(response.status);


    // Create ApiError instance
    const apiError = new ApiError(
      arabicMessage,
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
      if (isTeacherSuspended && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:teacher_suspended'));
      }
    }

    // Show error toast
    showErrorToast(apiError);

    throw apiError;
  }

  interface ApiResponse<T> {
    status: boolean;
    status_code: number;
    message: string;
    data: T;
  }

  const res: ApiResponse<T> = await response.json();
  return res.data !== undefined ? res.data : (res as unknown as T);
}
