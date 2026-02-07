/**
 * React Hook to initialize CSRF protection
 * Call this in your app root component or layout
 */

import { useEffect } from 'react';
import { initializeCSRF } from '@/lib/csrf';

/**
 * Initialize CSRF tokens when the app mounts
 * Should be called once at app startup
 */
export function useCSRFInit(): void {
  useEffect(() => {
    // Initialize CSRF cookie on mount
    const initCsrf = async () => {
      try {
        await initializeCSRF();
      } catch (error) {
        console.error('Failed to initialize CSRF:', error);
      }
    };

    initCsrf();
  }, []);
}

/**
 * Hook that also auto-refreshes CSRF periodically
 * For enhanced security in long-running sessions
 */
export function useCSRFAutoRefresh(intervalMinutes: number = 30): void {
  useEffect(() => {
    // Initialize on mount
    initializeCSRF(). undefined;

    // Set up periodic refresh
    const intervalId = setInterval(() => {
      initializeCSRF().catch(console.error);
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [intervalMinutes]);
}

export default useCSRFInit;
