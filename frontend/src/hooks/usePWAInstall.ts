import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installHandler = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installHandler);

    // For iOS: detect when user returns after adding to home screen
    const visibilityHandler = () => {
        if (document.visibilityState === 'visible') {
            // Check if running as standalone (installed)
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
                setDeferredPrompt(null);
            }
        }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installHandler);
      document.removeEventListener('visibilitychange', visibilityHandler);
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
