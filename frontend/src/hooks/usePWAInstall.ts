import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    console.log('🔍 PWA Hook: Initializing...');
    
    const handler = (e: Event) => {
      console.log('✅ beforeinstallprompt EVENT FIRED!');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      console.log('📦 Deferred prompt saved');
    };

    window.addEventListener('beforeinstallprompt', handler);
    console.log('👂 Listening for beforeinstallprompt...');

    const installHandler = () => {
        console.log('🎉 App installed! (appinstalled event)');
        setIsInstalled(true);
        setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installHandler);

    // For iOS: detect when user returns after adding to home screen
    const visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
            console.log('👀 Page became visible, checking standalone mode...');
            // Check if running as standalone (installed)
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('✅ Running in standalone mode - App is installed!');
                setIsInstalled(true);
                setDeferredPrompt(null);
            } else {
                console.log('❌ NOT in standalone mode');
            }
        }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('🔍 Initial check - Standalone mode:', isStandalone);
    if (isStandalone) {
      console.log('✅ App is already installed!');
      setIsInstalled(true);
    }

    // Check after 3 seconds if event didn't fire
    const timeoutId = setTimeout(() => {
        console.warn('⚠️ beforeinstallprompt did NOT fire after 3 seconds');
        console.log('Possible reasons:');
        console.log('1. User dismissed install prompt before');
        console.log('2. App is already installed');
        console.log('3. Browser doesn\'t support PWA install');
        console.log('4. Manifest.json has issues');
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
      clearTimeout(timeoutId);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    promptInstall,
    isInstalled
  };
}
