/**
 * Security Utilities
 * 
 * This file contains security-related utilities for:
 * - Input sanitization
 * - Data encryption/decryption for localStorage
 * - XSS prevention
 * - Security headers helpers
 */

// Use built-in Web Crypto API for encryption (better security)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fallback-key-should-be-changed-in-production';

/**
 * Generate encryption key from password using PBKDF2
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_KEY),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('static-salt-change-in-production'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt sensitive data before storing in localStorage
 */
export async function encryptData(data: string): Promise<string> {
  try {
    if (!crypto.subtle) {
      console.warn('Web Crypto API not available, storing data unencrypted');
      return data;
    }

    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return data; // Fallback to unencrypted if encryption fails
  }
}

/**
 * Decrypt data from localStorage
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    if (!crypto.subtle) {
      return encryptedData;
    }

    const key = await getEncryptionKey();
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedData; // Fallback to original data
  }
}

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
 * Secure localStorage wrapper with encryption
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await encryptData(value);
      localStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Secure storage set failed:', error);
      localStorage.setItem(key, value); // Fallback
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return null;
      
      return await decryptData(encryptedValue);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return localStorage.getItem(key); // Fallback
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
 */
export function generateCSPHeader(): string {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: ws:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
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
 * Secure token storage using sessionStorage for sensitive operations
 */
export const tokenStorage = {
  async setToken(token: string): Promise<void> {
    // Use sessionStorage for tokens (cleared on tab close)
    const encryptedToken = await encryptData(token);
    sessionStorage.setItem('auth_token', encryptedToken);
  },

  async getToken(): Promise<string | null> {
    const encryptedToken = sessionStorage.getItem('auth_token');
    if (!encryptedToken) return null;
    
    return await decryptData(encryptedToken);
  },

  removeToken(): void {
    sessionStorage.removeItem('auth_token');
  },

  async setRefreshToken(token: string): Promise<void> {
    // Keep refresh token out of localStorage (session scope only)
    const encryptedToken = await encryptData(token);
    sessionStorage.setItem('refresh_token', encryptedToken);
  },

  async getRefreshToken(): Promise<string | null> {
    const encryptedToken = sessionStorage.getItem('refresh_token');
    if (!encryptedToken) return null;

    return await decryptData(encryptedToken);
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
