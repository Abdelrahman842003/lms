/**
 * CSRF Token Management Service
 * Handles CSRF token initialization, retrieval, and validation
 */

interface CSRFState {
  xsrfToken: string | null;
}

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
export async function initializeCSRF(): Promise<void> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
    }
  } catch (error) {
    console.error('CSRF initialization error:', error);
  }
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
