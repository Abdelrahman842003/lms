import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { syncEngine } from '@/lib/offline/sync-engine';
import { networkMonitor } from '@/lib/offline/network-monitor';

export function useOfflineSync() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setIsOnline(networkMonitor.isOnline);
    const handleNetworkChange = (status: boolean) => {
      setIsOnline(status);
    };

    networkMonitor.addListener(handleNetworkChange);

    const handleSyncStatus = (status: { isSyncing: boolean; pendingCount: number }) => {
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
    };

    syncEngine.addSyncListener(handleSyncStatus);

    return () => {
      networkMonitor.removeListener(handleNetworkChange);
      syncEngine.removeSyncListener(handleSyncStatus);
    };
  }, []);

  const triggerSync = async () => {
    if (!user) return;
    const userType = (user as any).userType || (user as any).role || 'unknown';
    
    try {
      // Process sync queue first (push mutations)
      await syncEngine.processQueue();
      // Then pull updates (pull delta)
      await syncEngine.pullDeltaSync(String(user.id), userType);
    } catch (err) {
      console.error('[useOfflineSync] Sync failed:', err);
    }
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    triggerSync,
  };
}
