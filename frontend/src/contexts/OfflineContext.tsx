'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getPendingPaymentsCount, getSyncErrors } from '@/services/offlineDb';
import { triggerSync, initSyncManager } from '@/services/syncManager';

// ===================
// Types
// ===================

interface SyncResult {
  synced: number;
  errors: number;
  total: number;
}

interface OfflineContextType {
  isOnline: boolean;
  pendingCount: number;
  errorCount: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  syncNow: () => Promise<SyncResult>;
  refreshCounts: () => Promise<void>;
}

// ===================
// Context
// ===================

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// ===================
// Provider
// ===================

export function OfflineProvider({ children }: { children: ReactNode }) {
  const isOnline = useNetworkStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Refresh pending counts
  const refreshCounts = async () => {
    try {
      const pending = await getPendingPaymentsCount();
      const errors = await getSyncErrors();
      setPendingCount(pending);
      setErrorCount(errors.length);
    } catch (error) {
      console.error('Failed to refresh counts:', error);
    }
  };

  // Initialize sync manager and refresh counts
  useEffect(() => {
    initSyncManager();
    refreshCounts();

    // Listen for sync complete events
    const handleSyncComplete = (_event: CustomEvent<SyncResult>) => {
      setLastSyncTime(new Date());
      refreshCounts();
    };

    window.addEventListener('sync:complete', handleSyncComplete as EventListener);

    return () => {
      window.removeEventListener('sync:complete', handleSyncComplete as EventListener);
    };
  }, []);

  // Refresh counts when coming back online
  useEffect(() => {
    if (isOnline) {
      refreshCounts();
    }
  }, [isOnline]);

  // Manual sync trigger
  const syncNow = async (): Promise<SyncResult> => {
    if (!isOnline) {
      throw new Error('لا يوجد اتصال بالإنترنت');
    }

    setIsSyncing(true);
    try {
      const result = await triggerSync();
      setLastSyncTime(new Date());
      await refreshCounts();
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  const value: OfflineContextType = {
    isOnline,
    pendingCount,
    errorCount,
    lastSyncTime,
    isSyncing,
    syncNow,
    refreshCounts,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

// ===================
// Hook
// ===================

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
