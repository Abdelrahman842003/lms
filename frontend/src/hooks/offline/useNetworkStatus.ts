'use client';

import { useState, useEffect } from 'react';
import { networkMonitor } from '@/lib/offline/network-monitor';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(networkMonitor.isOnline);

    const handleChange = (status: boolean) => {
      setIsOnline(status);
    };

    // Subscribe to changes
    networkMonitor.addListener(handleChange);

    return () => {
      networkMonitor.removeListener(handleChange);
    };
  }, []);

  return { isOnline };
}
