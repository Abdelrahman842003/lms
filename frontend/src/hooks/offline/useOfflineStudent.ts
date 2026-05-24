'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineStudent() {
  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(false);

  const getLectures = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/student/lectures', {
        offlineConfig: { storeName: 'studentLectures', skipCache: false }
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPoints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/student/points', {
        offlineConfig: { storeName: 'studentPoints', skipCache: false }
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isOnline,
    loading,
    getLectures,
    getPoints
  };
}
