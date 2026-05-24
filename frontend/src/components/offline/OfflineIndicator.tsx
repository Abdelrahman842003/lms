'use client';

import React from 'react';
import { Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface OfflineIndicatorProps {
  status: 'pending-sync' | 'failed' | 'conflict' | 'synced';
  errorMessage?: string;
  children: React.ReactNode;
}

export default function OfflineIndicator({ status, errorMessage, children }: OfflineIndicatorProps) {
  if (status === 'synced') return <>{children}</>;

  const getBadgeStyle = () => {
    switch (status) {
      case 'pending-sync':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />,
          text: 'بانتظار المزامنة',
          className: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
        };
      case 'conflict':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
          text: 'تعارض البيانات',
          className: 'border-red-500/20 bg-red-500/10 text-red-400',
        };
      case 'failed':
      default:
        return {
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
          text: 'فشلت المزامنة',
          className: 'border-rose-500/20 bg-rose-500/10 text-rose-400',
        };
    }
  };

  const badge = getBadgeStyle();

  return (
    <div className="relative group/offline flex flex-col w-full">
      {/* Blurred container for non-synced items */}
      <div className={`transition-all duration-300 ${status === 'failed' || status === 'conflict' ? 'opacity-85' : ''}`}>
        {children}
      </div>

      {/* Floating Status Badge */}
      <div className={`absolute top-2.5 right-2.5 z-10 px-2 py-1 rounded-lg border flex items-center gap-1.5 text-[10px] font-bold font-arabic shadow-md pointer-events-none select-none backdrop-blur-md transition-all ${badge.className}`}>
        {badge.icon}
        <span>{badge.text}</span>
      </div>

      {/* Hover tooltip for failed errors */}
      {status === 'failed' && errorMessage && (
        <div className="absolute inset-x-0 bottom-0 bg-red-600/90 text-white p-2 text-xs font-arabic rounded-b-xl border-t border-red-500 transform translate-y-2 opacity-0 pointer-events-none group-hover/offline:translate-y-0 group-hover/offline:opacity-100 transition-all z-20">
          <span className="font-bold block">سبب الفشل:</span>
          <span className="opacity-90">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
