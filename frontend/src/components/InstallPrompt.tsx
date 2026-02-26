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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-[#1e1e2d] border border-white/10 p-4 rounded-xl shadow-2xl z-[9999] animate-slide-up">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold mb-1">تثبيت التطبيق</h3>
          <p className="text-gray-400 text-sm mb-4">
            قم بتثبيت التطبيق للوصول السريع وتلقي الإشعارات بشكل أفضل
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleInstall}
              className="flex-1"
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
