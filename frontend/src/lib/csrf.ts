/**
 * CSRF Token Management Service
 * Handles CSRF token initialization, retrieval, and validation
 */

import { getApiBaseUrl } from '@/config/api-config';

let csrfInitInFlight: Promise<void> | null = null;
let csrfInitializedAt: number | null = null;
const CSRF_REUSE_WINDOW_MS = 10_000;

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='));

  if (!match) return null;

  try {
    return decodeURIComponent(match.split('=')[1]);
  } catch {
    return null;
  }
}

/**
 * Initialize CSRF token by calling the sanctum endpoint
 */
async function performCSRFInitialization(): Promise<void> {
  const apiUrl = getApiBaseUrl();
  try {
    const response = await fetch(`${apiUrl}/sanctum/csrf-cookie`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to initialize CSRF:', response.status);
      return;
    }

    csrfInitializedAt = Date.now();
  } catch (error) {
    console.error('CSRF initialization error:', error);
  }
}

/**
 * Initialize CSRF token by calling the sanctum endpoint (single-flight)
 */
export async function initializeCSRF(force: boolean = false): Promise<void> {
  const hasToken = getCSRFToken() !== null;
  const recentlyInitialized = csrfInitializedAt !== null &&
    (Date.now() - csrfInitializedAt) < CSRF_REUSE_WINDOW_MS;

  if (!force && hasToken && recentlyInitialized) {
    return;
  }

  if (csrfInitInFlight) {
    return csrfInitInFlight;
  }

  csrfInitInFlight = performCSRFInitialization().finally(() => {
    csrfInitInFlight = null;
  });

  return csrfInitInFlight;
}

/**
 * Validate that CSRF token exists
 */
export function validateCSRF(): boolean {
  return getCSRFToken() !== null;
}

/**
 * CSRF Service object for easy usage
 */
export const csrfService = {
  getToken: getCSRFToken,
  initialize: initializeCSRF,
  validate: validateCSRF,
};

/**
 * Export default
 */
export default csrfService;
