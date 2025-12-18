'use client';

import React from 'react';
import { useOffline } from '@/contexts/OfflineContext';
import toast from 'react-hot-toast';

export default function SyncIndicator() {
  const { isOnline, pendingCount, isSyncing, syncNow, lastSyncTime } = useOffline();

  const handleSync = async () => {
    try {
      const result = await syncNow();
      if (result.synced > 0) {
        toast.success(`تم مزامنة ${result.synced} عملية`);
      }
      if (result.errors > 0) {
        toast.error(`فشل في مزامنة ${result.errors} عملية`);
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Don't show if online and no pending
  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg mb-4 ${
        isOnline
          ? 'bg-yellow-500/10 border border-yellow-500/30'
          : 'bg-red-500/10 border border-red-500/30'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        {isOnline ? (
          <div className="relative">
            <i className="fas fa-cloud-arrow-up text-yellow-400 text-xl"></i>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-dark text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
        ) : (
          <i className="fas fa-wifi-slash text-red-400 text-xl"></i>
        )}

        {/* Status Text */}
        <div>
          {isOnline ? (
            <>
              <p className="text-yellow-400 font-medium text-sm">
                {pendingCount} عملية في انتظار المزامنة
              </p>
              {lastSyncTime && (
                <p className="text-yellow-400/60 text-xs">
                  آخر مزامنة: {lastSyncTime.toLocaleTimeString('ar-EG')}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-red-400 font-medium text-sm">أنت غير متصل بالإنترنت</p>
              <p className="text-red-400/60 text-xs">
                العمليات ستُحفظ محلياً وتُرفع عند الاتصال
              </p>
            </>
          )}
        </div>
      </div>

      {/* Sync Button */}
      {isOnline && pendingCount > 0 && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-yellow-500 text-dark rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>جاري المزامنة...</span>
            </>
          ) : (
            <>
              <i className="fas fa-sync"></i>
              <span>مزامنة الآن</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
