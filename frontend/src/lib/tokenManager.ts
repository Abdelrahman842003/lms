/**
 * Token Manager with Hybrid Storage Strategy
 *
 * Primary Storage: In-memory variable (cleared on page refresh)
 * Fallback Storage: sessionStorage (survives hard refresh)
 *
 * Security Note:
 * - sessionStorage is still accessible via JavaScript (XSS risk)
 * - For true security, refresh tokens are stored in httpOnly cookies by the backend
 * - Access tokens in memory/sessionStorage are a convenience for immediate API calls
 */

import { getVersionedApiUrl } from '@/config/api-config';

interface TokenState {
  accessToken: string | null;
  expiresAt: number | null;
}

const TOKEN_STORAGE_KEY = 'auth_access_token_state';
const ACCESS_TOKEN_FALLBACK_MINUTES = 43200; // 30 days

// Primary in-memory storage with sessionStorage fallback for hard refresh recovery
let tokenState: TokenState = {
  accessToken: null,
  expiresAt: null,
};

// Event listeners for token changes
type TokenListener = (token: string | null) => void;
const listeners: Set<TokenListener> = new Set();
let refreshInFlight: Promise<string | null> | null = null;

function decodeBase64Url(value: string): string | null {
  const base64 = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');

  try {
    if (typeof atob === 'function') {
      return atob(base64);
    }

    if (typeof Buffer !== 'undefined') {
      return Buffer.from(base64, 'base64').toString('utf-8');
    }
  } catch {
    // Ignore malformed base64url payload
  }

  return null;
}

function getJwtExpiryMs(token: string): number | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const decodedPayload = decodeBase64Url(parts[1]);
  if (!decodedPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodedPayload) as { exp?: unknown };
    if (typeof parsed.exp === 'number' && Number.isFinite(parsed.exp) && parsed.exp > 0) {
      return parsed.exp * 1000;
    }
  } catch {
    // Ignore malformed JWT payload
  }

  return null;
}

/**
 * Get access token from memory
 */
export function getAccessToken(): string | null {
  if (!tokenState.accessToken && typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TokenState;
        if (parsed?.accessToken) {
          tokenState = {
            accessToken: parsed.accessToken,
            expiresAt: parsed.expiresAt ?? null,
          };
        }
      }
    } catch {
      // Ignore malformed session token cache
    }
  }

  return tokenState.accessToken;
}

/**
 * Set access token in memory
 */
export function setAccessToken(token: string, expiresInMinutes: number = ACCESS_TOKEN_FALLBACK_MINUTES): void {
  const fallbackExpiresAt = Date.now() + (expiresInMinutes * 60 * 1000);
  const jwtExpiresAt = getJwtExpiryMs(token);
  const expiresAt = jwtExpiresAt && jwtExpiresAt > Date.now()
    ? jwtExpiresAt
    : fallbackExpiresAt;

  tokenState = {
    accessToken: token,
    expiresAt,
  };

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenState));
    } catch {
      // Ignore storage write failures
    }
  }

  // Notify listeners
  notifyListeners(token);
}

/**
 * Clear token from memory
 */
export function clearAccessToken(): void {
  tokenState = {
    accessToken: null,
    expiresAt: null,
  };

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage remove failures
    }
  }

  // Notify listeners
  notifyListeners(null);
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpired(thresholdSeconds: number = 300): boolean {
  // Ensure tokenState is hydrated from sessionStorage on hard refresh.
  getAccessToken();

  if (!tokenState.expiresAt) return false;

  const now = Date.now();
  const threshold = thresholdSeconds * 1000;

  return (tokenState.expiresAt - now) < threshold;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null && !isTokenExpired();
}

/**
 * Subscribe to token changes
 */
export function subscribe(listener: TokenListener): () => void {
  listeners.add(listener);

  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notify all listeners of token change
 */
function notifyListeners(token: string | null): void {
  listeners.forEach(listener => {
    try {
      listener(token);
    } catch (error) {
      console.error('Error in token listener:', error);
    }
  });
}

/**
 * Refresh access token using backend endpoint
 */
async function performTokenRefresh(): Promise<string | null> {
  const apiUrl = getVersionedApiUrl();
  try {
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // 401/403/419 are expected when session is expired or missing.
      if (response.status === 401 || response.status === 403 || response.status === 419) {
        clearAccessToken();
        return null;
      }

      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[tokenManager] refresh failed with status ${response.status}`);
      }
      return getAccessToken();
    }

    const data = await response.json().catch(() => null);

    if (data?.status && data?.data?.access_token) {
      setAccessToken(data.data.access_token, ACCESS_TOKEN_FALLBACK_MINUTES);
      return data.data.access_token;
    }

    return getAccessToken();
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Token refresh network error:', error);
    }
    return getAccessToken();
  }
}

/**
 * Refresh access token using backend endpoint (single-flight)
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = performTokenRefresh().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/**
 * Token Manager Service
 */
export const tokenManager = {
  getToken: getAccessToken,
  setToken: setAccessToken,
  clearToken: clearAccessToken,
  isExpired: isTokenExpired,
  isAuthenticated,
  subscribe,
  refresh: refreshAccessToken,
};

export default tokenManager;
