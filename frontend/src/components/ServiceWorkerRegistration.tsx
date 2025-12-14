'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    console.log('🔧 Attempting to register Service Worker...');
    
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker is supported');
      
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration);
          console.log('📍 Scope:', registration.scope);
          console.log('🔄 Installing?', registration.installing);
          console.log('⏳ Waiting?', registration.waiting);
          console.log('✔️ Active?', registration.active);
        })
        .catch((error) => {
          console.error('❌ Service Worker registration FAILED:', error);
          console.error('Error details:', error.message);
        });
    } else {
      console.warn('⚠️ Service Worker NOT supported in this browser');
    }
  }, []);

  return null;
}
