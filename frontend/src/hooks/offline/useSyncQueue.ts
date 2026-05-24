'use client';

import { useState, useEffect } from 'react';
import { syncEngine } from '@/lib/offline/sync-engine';

export function useSyncQueue() {
  const [queueStatus, setQueueStatus] = useState({
    pending: 0,
    inProgress: 0,
    failed: 0,
    conflict: 0
  });

  const refreshStatus = async () => {
    const status = await syncEngine.getQueueStatus();
    setQueueStatus(status);
  };

  useEffect(() => {
    refreshStatus();
    
    // Poll queue status periodically
    const interval = setInterval(refreshStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return { queueStatus, refreshStatus };
}
