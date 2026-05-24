'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { syncEngine } from '@/lib/offline/sync-engine';
import { networkMonitor } from '@/lib/offline/network-monitor';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  triggerSync: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    setIsOnline(networkMonitor.isOnline);
    const handleNetworkChange = (status: boolean) => {
      setIsOnline(status);
    };

    networkMonitor.addListener(handleNetworkChange);

    const handleSyncStatus = (status: { isSyncing: boolean; pendingCount: number }) => {
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
      if (!status.isSyncing && status.pendingCount === 0) {
        setLastSyncAt(new Date().toISOString());
      }
    };

    syncEngine.addSyncListener(handleSyncStatus);

    return () => {
      networkMonitor.removeListener(handleNetworkChange);
      syncEngine.removeSyncListener(handleSyncStatus);
    };
  }, []);

  // Periodic background delta sync when online
  useEffect(() => {
    if (!isOnline || !user) return;

    const userType = (user as any).userType || (user as any).role || 'unknown';
    
    // Auto-sync every 5 minutes when online
    const intervalId = setInterval(() => {
      syncEngine.pullDeltaSync(String(user.id), userType).catch((err) => {
        console.error('[OfflineProvider] Background delta sync failed:', err);
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isOnline, user]);

  const triggerSync = async () => {
    if (!user) return;
    const userType = (user as any).userType || (user as any).role || 'unknown';
    
    try {
      setIsSyncing(true);
      await syncEngine.processQueue();
      await syncEngine.pullDeltaSync(String(user.id), userType);
      setLastSyncAt(new Date().toISOString());
    } catch (err) {
      console.error('[OfflineProvider] Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncAt,
        triggerSync,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
