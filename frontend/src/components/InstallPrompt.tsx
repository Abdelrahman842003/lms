'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="ux-fixed ux-bottom-4 ux-left-4 ux-right-4 ux-md-left-auto ux-md-right-4 ux-md-w-96 ux-bg-1e1e2d ux-border ux-border-white-10 ux-p-4 ux-rounded-xl ux-shadow-2xl ux-z-9999 ux-animate-slide-up">
      <div className="ux-flex ux-items-start ux-gap-4">
        <div className="ux-bg-primary-10 ux-p-3 ux-rounded-lg">
          <img src="/logo.png" alt="Logo" className="ux-w-8 ux-h-8 ux-object-contain" />
        </div>
        <div className="ux-flex-1">
          <h3 className="ux-text-white ux-font-bold ux-mb-1">تثبيت التطبيق</h3>
          <p className="ux-text-gray-400 ux-text-sm ux-mb-4">
            قم بتثبيت التطبيق للوصول السريع وتلقي الإشعارات بشكل أفضل
          </p>
          <div className="ux-flex ux-gap-3">
            <Button
              onClick={handleInstall}
              className="ux-flex-1"
            >
              تثبيت
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowPrompt(false)}
            >
              لاحقاً
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
