'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useNetworkStatus } from './useNetworkStatus';
import { 
  studentsStore, 
  lecturesStore, 
  attendancesStore 
} from '@/lib/offline/stores';

export function useOfflineTeacher() {
  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(false);

  const getStudents = useCallback(async (groupId: string) => {
    setLoading(true);
    try {
      const data = await apiClient.get(`/api/v1/teacher/groups/${groupId}/students`, {
        offlineConfig: { storeName: 'students', skipCache: false }
      });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordAttendance = useCallback(async (lectureId: string, studentId: string, status: string) => {
    return apiClient.post(`/api/v1/teacher/lectures/${lectureId}/attendance`, 
      { student_id: studentId, status },
      {
        offlineConfig: {
          entityType: 'attendance',
          entityId: `${lectureId}_${studentId}`
        }
      }
    );
  }, []);

  const createLecture = useCallback(async (groupId: string, data: any) => {
    return apiClient.post(`/api/v1/teacher/groups/${groupId}/lectures`, data, {
      offlineConfig: {
        entityType: 'lecture',
        entityId: `new_lecture_${Date.now()}`
      }
    });
  }, []);

  return {
    isOnline,
    loading,
    getStudents,
    recordAttendance,
    createLecture
  };
}
