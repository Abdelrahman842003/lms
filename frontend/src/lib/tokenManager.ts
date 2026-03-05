/**
 * Secure Token Manager
 * Uses in-memory storage instead of localStorage for security
 * Tokens are stored in httpOnly cookies by the backend
 */

import { getVersionedApiUrl } from '@/config/api-config';

interface TokenState {
  accessToken: string | null;
  expiresAt: number | null;
}

// In-memory storage (not persisted - safer against XSS)
let tokenState: TokenState = {
  accessToken: null,
  expiresAt: null,
};

// Event listeners for token changes
type TokenListener = (token: string | null) => void;
const listeners: Set<TokenListener> = new Set();
let refreshInFlight: Promise<string | null> | null = null;

/**
 * Get access token from memory
 */
export function getAccessToken(): string | null {
  return tokenState.accessToken;
}

/**
 * Set access token in memory
 */
export function setAccessToken(token: string, expiresInMinutes: number = 60): void {
  const expiresAt = Date.now() + (expiresInMinutes * 60 * 1000);

  tokenState = {
    accessToken: token,
    expiresAt,
  };

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

  // Notify listeners
  notifyListeners(null);
}

/**
 * Check if token is expired or will expire soon
 */
export function isTokenExpired(thresholdSeconds: number = 300): boolean {
  if (!tokenState.expiresAt) return false;

  const now = Date.now();
  const threshold = thresholdSeconds * 1000;

  return (tokenState.expiresAt - now) < threshold;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return tokenState.accessToken !== null && !isTokenExpired();
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
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();

    if (data.status && data.data?.access_token) {
      setAccessToken(data.data.access_token, 60);
      return data.data.access_token;
    }

    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAccessToken();
    return null;
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
