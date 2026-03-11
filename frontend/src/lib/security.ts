/**
 * Security Utilities
 *
 * This file contains security-related utilities for:
 * - Input sanitization
 * - XSS prevention
 * - Security headers helpers
 *
 * SECURITY NOTE: Client-side encryption has been removed.
 * Tokens are now stored securely via HttpOnly cookies (managed by Laravel Sanctum).
 * No sensitive data should be stored in localStorage.
 */

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for database queries
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent basic XSS
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers like onclick=
}

/**
 * Validate and sanitize phone numbers (Egyptian format)
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Keep only digits
  const digits = phone.replace(/\D/g, '');

  // Ensure Egyptian phone format (11 digits starting with 01)
  if (digits.length === 11 && digits.startsWith('01')) {
    return digits;
  }

  return '';
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Standard localStorage wrapper (without encryption)
 * For secure token storage, use HttpOnly cookies via Sanctum
 *
 * SECURITY WARNING: Do NOT store sensitive data (tokens, PII) in localStorage.
 */
export const standardStorage = {
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage set failed:', error);
    }
  },

  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(keys: string[] = []): void {
    keys.forEach((key) => localStorage.removeItem(key));
  }
};

/**
 * Generate Content Security Policy headers
 *
 * CSP directs browsers to only load resources from approved sources.
 * This prevents XSS attacks by blocking inline scripts and untrusted domains.
 *
 * NOTE: 'unsafe-inline' is needed for styled-jsx and some third-party components.
 * Consider using nonces or hashes for stricter CSP in the future.
 */
export function generateCSPHeader(): string {
  const isDev = process.env.NODE_ENV === 'development';

  const csp = [
    "default-src 'self'",
    // Development needs 'unsafe-eval' for Next.js hot reload
    isDev ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'" : "script-src 'self' 'unsafe-inline'",
    // Allow Google Fonts + cdnjs (Font Awesome) stylesheets
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    // Allow Google Fonts + cdnjs (Font Awesome) font files
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https: blob: https://images.neetaq.com",
    "media-src 'self' data: https: blob:",
    // In dev, also allow http://127.0.0.1 and http://localhost for direct API calls
    isDev
      ? "connect-src 'self' https: http://127.0.0.1:* http://localhost:* wss: ws:"
      : "connect-src 'self' https: wss: ws:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ];

  return csp.join('; ');
}

/**
 * Check if content contains potentially dangerous scripts
 */
export function containsDangerousContent(content: string): boolean {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<link[^>]*javascript:/gi
  ];

  return dangerousPatterns.some(pattern => pattern.test(content));
}

/**
 * Rate limiting helper for client-side operations
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];

    // Clean old attempts outside the window
    const validAttempts = userAttempts.filter(time => now - time < this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    validAttempts.push(now);
    this.attempts.set(identifier, validAttempts);

    return true;
  }

  getRemainingTime(identifier: string): number {
    const userAttempts = this.attempts.get(identifier) || [];
    if (userAttempts.length === 0) return 0;

    const oldestAttempt = Math.min(...userAttempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);

    return Math.max(0, remainingTime);
  }
}

/**
 * DEPRECATED: Token storage via sessionStorage
 *
 * Use HttpOnly cookies (Laravel Sanctum) instead.
 * This is kept only for backward compatibility during migration.
 *
 * @deprecated Use HttpOnly cookies managed by Sanctum instead
 */
export const legacyTokenStorage = {
  setToken(token: string): void {
    sessionStorage.setItem('auth_token', token);
  },

  getToken(): string | null {
    return sessionStorage.getItem('auth_token');
  },

  removeToken(): void {
    sessionStorage.removeItem('auth_token');
  },

  setRefreshToken(token: string): void {
    sessionStorage.setItem('refresh_token', token);
  },

  getRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  },

  removeRefreshToken(): void {
    sessionStorage.removeItem('refresh_token');
  }
};

/**
 * Security logger for audit trails
 */
export const securityLogger = {
  logSecurityEvent(event: string, details: Record<string, unknown> = {}): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security Event]', event, details);
    }

    // In production, you might want to send this to a security monitoring service
    // Example: send to monitoring service
  },

  logSuspiciousActivity(activity: string, userAgent?: string): void {
    this.logSecurityEvent('SUSPICIOUS_ACTIVITY', {
      activity,
      userAgent: userAgent || navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  }
};
