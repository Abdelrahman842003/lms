'use client';

import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function NetworkStatusBanner() {
  const { isOnline, isSyncing, pendingCount } = useOffline();

  if (!isOnline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs sm:text-sm font-medium font-arabic flex items-center justify-center gap-2 shadow-lg z-[9999] animate-fadeIn w-max max-w-[90vw]">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse-slow" />
        <span className="truncate">وضع عدم الاتصال</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500/95 backdrop-blur-md text-slate-900 px-4 py-2 rounded-full text-xs sm:text-sm font-medium font-arabic flex items-center justify-center gap-2 shadow-lg z-[9999] animate-fadeIn w-max max-w-[90vw]">
        <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-slate-800" />
        <span className="truncate">جاري المزامنة... ({pendingCount})</span>
      </div>
    );
  }

  return null;
}
