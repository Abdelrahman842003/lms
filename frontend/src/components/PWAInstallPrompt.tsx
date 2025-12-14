"use client";

import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isInstallable && isMobile) {
      // Small delay to ensure smooth entrance after page load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  if (!isInstallable || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in-up">
      <div className="bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-6 border-t border-gray-100">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-2xl">
             {/* Placeholder Icon - In a real app, use the actual app logo */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-dark mb-1 font-arabic">تثبيت التطبيق</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 font-arabic">
              قم بتثبيت تطبيق منصة العمل الحر على جهازك لتجربة استخدام أفضل وأسرع.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={promptInstall}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all duration-200 font-arabic"
              >
                تثبيت الآن
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                className="px-4 py-3 rounded-xl font-medium text-gray-500 hover:bg-gray-50 transition-colors font-arabic"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
