/**
 * Base API Configuration and Utilities
 * Central place for all API-related helpers
 */

import { 
  API_CONFIG, 
  FLAT_ENDPOINTS, 
  getErrorMessage,
  getApiBaseUrl
} from '@/config/api-config';

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
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
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
 */
export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const xsrfToken = getCookie('XSRF-TOKEN');
  
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

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
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const cleanBaseUrl = getApiBaseUrl();
    const url = `${cleanBaseUrl}/api/refresh-token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const resText = await response.text();
    const res = JSON.parse(resText);
    const newAccessToken = res.data.access_token;
    
    if (newAccessToken) {
      localStorage.setItem('token', newAccessToken);
      return newAccessToken;
    }
    return null;
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return null;
  }
}

/**
 * CSRF Cookie initialization
 */
export async function csrf(): Promise<void> {
  await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * API Error with extended properties
 */
export interface ApiErrorExtended extends Error {
  status: number;
  errors?: Record<string, string[]>;
  data?: Record<string, unknown>;
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
  const url = `${cleanBaseUrl}${endpoint.startsWith('/api') ? endpoint : '/api' + endpoint}`;
  
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 419 CSRF Token Mismatch - Retry once
  if (response.status === 419) {
    await csrf();
    const newXsrfToken = getCookie('XSRF-TOKEN');
    
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
    const errorWithStatus = new Error(arabicMessage) as ApiErrorExtended;
    errorWithStatus.status = response.status;
    errorWithStatus.errors = error.errors as Record<string, string[]>;
    errorWithStatus.data = error.data as Record<string, unknown>;
    
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
    
    throw errorWithStatus;
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
