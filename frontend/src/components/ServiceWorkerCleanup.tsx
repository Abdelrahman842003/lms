'use client';

import { useEffect } from 'react';

/**
 * Cleans up old service workers to prevent cache accumulation
 * This runs once on app load and unregisters any non-essential service workers
 */
export default function ServiceWorkerCleanup() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          // Keep only firebase-messaging-sw.js, unregister everything else
          const swUrl = registration.active?.scriptURL || '';
          if (!swUrl.includes('firebase-messaging-sw.js')) {
            registration.unregister().then((success) => {
              if (success) {
                console.log('[Cleanup] Unregistered old service worker:', swUrl);
              }
            });
          }
        }
      });

      // Clear old caches
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            // Delete any lms-* caches (from old PWA)
            if (cacheName.startsWith('lms-')) {
              caches.delete(cacheName).then(() => {
                console.log('[Cleanup] Deleted old cache:', cacheName);
              });
            }
          });
        });
      }
    }
  }, []);

  return null;
}
