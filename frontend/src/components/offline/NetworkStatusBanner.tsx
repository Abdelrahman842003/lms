'use client';

import React, { useEffect, useState } from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function NetworkStatusBanner() {
  const { isOnline, isSyncing, pendingCount } = useOffline();
  const [showOnlineStatus, setShowOnlineStatus] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowOnlineStatus(true);
      const timer = setTimeout(() => {
        setShowOnlineStatus(false);
      }, 4000); // Hide green online banner after 4 seconds
      return () => clearTimeout(timer);
    } else {
      setShowOnlineStatus(false);
    }
  }, [isOnline]);

  if (!isOnline) {
    return (
      <div className="w-full bg-red-600/90 backdrop-blur-md text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold font-arabic flex items-center justify-center gap-2 relative z-50 animate-fadeIn animate-pulse-slow">
        <WifiOff className="w-4 h-4 animate-bounce-slow" />
        <span>أنت غير متصل بالإنترنت حالياً. التعديلات ستُحفظ محلياً وسيتم مزامنتها عند عودة الاتصال.</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="w-full bg-[#f59f00]/95 backdrop-blur-md text-slate-900 px-4 py-2 text-center text-xs sm:text-sm font-semibold font-arabic flex items-center justify-center gap-2 relative z-50 animate-fadeIn">
        <RefreshCw className="w-4 h-4 animate-spin text-slate-800" />
        <span>جاري مزامنة التغييرات المحلية... (متبقي: {pendingCount} عملية)</span>
      </div>
    );
  }

  if (showOnlineStatus) {
    return (
      <div className="w-full bg-emerald-600/90 backdrop-blur-md text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold font-arabic flex items-center justify-center gap-2 relative z-50 animate-fadeIn animate-fadeOutDelay">
        <Wifi className="w-4 h-4" />
        <span>تمت استعادة الاتصال بالإنترنت بنجاح! البيانات متزامنة الآن.</span>
      </div>
    );
  }

  return null;
}
