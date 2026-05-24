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
          // Keep only firebase-messaging-sw.js and our main sw.js, unregister everything else
          const swUrl = registration.active?.scriptURL || '';
          const isAllowedSw = swUrl.includes('firebase-messaging-sw.js') || swUrl.includes('sw.js');
          if (!isAllowedSw) {
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
            // Delete stale app caches that may serve outdated JS/CSS bundles.
            // Exclude new Serwist cache namespaces.
            const shouldDeleteCache =
              (cacheName.startsWith('lms-') ||
              cacheName.startsWith('workbox-') ||
              cacheName.startsWith('next-') ||
              cacheName.startsWith('pwa-') ||
              cacheName.includes('precache')) &&
              !cacheName.startsWith('serwist');

            if (shouldDeleteCache) {
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
