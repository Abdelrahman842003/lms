'use client';

import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import { Cloud, CloudLightning, CloudOff, RefreshCw } from 'lucide-react';

export default function SyncStatusIndicator() {
  const { isOnline, isSyncing, pendingCount, triggerSync } = useOffline();

  const getStatusContent = () => {
    if (!isOnline) {
      return {
        icon: <CloudOff className="w-5 h-5 text-red-400" />,
        text: 'وضع غير متصل بالشبكة',
        className: 'border-red-500/20 bg-red-500/5 text-red-400',
      };
    }
    
    if (isSyncing) {
      return {
        icon: <RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" />,
        text: `جاري المزامنة... (${pendingCount})`,
        className: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400',
      };
    }

    if (pendingCount > 0) {
      return {
        icon: <CloudLightning className="w-5 h-5 text-amber-400 animate-pulse" />,
        text: `بانتظار المزامنة (${pendingCount})`,
        className: 'border-amber-500/20 bg-amber-500/5 text-amber-400',
      };
    }

    return {
      icon: <Cloud className="w-5 h-5 text-emerald-400" />,
      text: 'البيانات متزامنة بالكامل',
      className: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400',
    };
  };

  const status = getStatusContent();

  return (
    <button
      onClick={() => isOnline && !isSyncing && triggerSync()}
      disabled={!isOnline || isSyncing}
      title={status.text}
      className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-semibold font-arabic transition-all active:scale-[0.97] group cursor-pointer disabled:cursor-default select-none ${status.className}`}
    >
      {status.icon}
      <span className="hidden md:inline group-hover:underline">{status.text}</span>
      {pendingCount > 0 && (
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      )}
    </button>
  );
}
