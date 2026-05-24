'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineGuardian() {
  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(false);

  const getChildren = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/guardian/children', {
        offlineConfig: { storeName: 'children', skipCache: false }
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const getChildSummary = useCallback(async (childId: string) => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/v1/guardian/children/${childId}/summary`, {
        offlineConfig: { storeName: 'childSummaries', skipCache: false }
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isOnline,
    loading,
    getChildren,
    getChildSummary
  };
}
