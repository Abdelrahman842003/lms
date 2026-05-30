'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        registration.update().catch(() => undefined);
      } catch (error) {
        console.warn('[SW] Registration failed:', error);
      }
    };

    window.addEventListener('load', register);
    return () => window.removeEventListener('load', register);
  }, []);

  return null;
}
