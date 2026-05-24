'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useNetworkStatus } from './useNetworkStatus';

export function useOfflineAcademy() {
  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(false);

  const getTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/academy/teachers', {
        offlineConfig: { storeName: 'academyTeachers', skipCache: false }
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/api/v1/academy/dashboard', {
        offlineConfig: { storeName: 'academyDashboard', skipCache: false }
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isOnline,
    loading,
    getTeachers,
    getDashboard
  };
}
