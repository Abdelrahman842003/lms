/**
 * Academy Attendance Service
 * Handles attendance tracking and management
 */

import { API_BASE_URL, getAuthHeaders } from '../api/baseApi';
import axios from 'axios';

export interface AttendanceFilters {
  page?: number;
  per_page?: number;
  teacher_id?: string;
  student_id?: string;
  date_from?: string;
  date_to?: string;
  status?: 'present' | 'absent' | 'late';
}

export interface MarkAttendanceData {
  teacher_id?: string;
  student_id?: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_rate: number;
}

// ========== Attendance Management ==========
export const getAttendanceLogs = async (params: AttendanceFilters) => {
  const response = await axios.get(`${API_BASE_URL}/academy/attendance`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const getTodayAttendance = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/attendance/today`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const markAttendance = async (data: MarkAttendanceData) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/attendance`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const markAbsent = async (data: {
  teacher_id?: string;
  student_id?: string;
  date: string;
  notes?: string;
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/attendance/mark-absent`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateAttendanceNotes = async (logId: string, notes: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/attendance/${logId}/notes`,
    { notes },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getAttendanceStats = async (dateFrom: string, dateTo: string, teacherId?: string, studentId?: string): Promise<AttendanceStats> => {
  const params: any = { date_from: dateFrom, date_to: dateTo };
  if (teacherId) params.teacher_id = teacherId;
  if (studentId) params.student_id = studentId;

  const response = await axios.get(`${API_BASE_URL}/academy/attendance/stats`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const getMonthlyAttendance = async (year: number, month: number, teacherId?: string) => {
  const params: any = { year, month };
  if (teacherId) params.teacher_id = teacherId;

  const response = await axios.get(`${API_BASE_URL}/academy/attendance/monthly`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const exportAttendanceReport = async (params: AttendanceFilters, format: 'excel' | 'pdf' = 'excel') => {
  const response = await axios.get(`${API_BASE_URL}/academy/attendance/export`, {
    headers: getAuthHeaders(),
    params: { ...params, format },
    responseType: 'blob',
  });
  return response.data;
};