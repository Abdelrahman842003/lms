import axios from '@/lib/axios';
import { getAuthHeaders } from './api/baseApi';
import { getVersionedApiUrl } from '@/config/api-config';
import type {
  AcademyReportFilters,
  AcademySnapshot,
  StudentDistribution,
  TeacherPerformanceResponse,
  AttendanceQuality,
  SessionExecution,
  SubscriptionUsage,
  TimeComparison,
  AcademyAlert,
  AcademyReportOverview,
} from '@/types/academyReport.types';

const API_BASE_URL = getVersionedApiUrl();

export const getAcademySnapshot = async (filters?: AcademyReportFilters): Promise<AcademySnapshot> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/snapshot`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getStudentDistribution = async (filters?: AcademyReportFilters): Promise<StudentDistribution> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/student-distribution`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getTeacherPerformance = async (
  filters?: AcademyReportFilters,
  page = 1,
  perPage = 15,
  sortColumn = 'linked_students',
  sortDirection = 'desc'
): Promise<TeacherPerformanceResponse> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/teacher-performance`, {
    headers: getAuthHeaders(),
    params: { ...filters, page, per_page: perPage, sort_column: sortColumn, sort_direction: sortDirection },
  });
  return response.data;
};

export const getAttendanceQuality = async (filters?: AcademyReportFilters): Promise<AttendanceQuality> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/attendance-quality`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getSessionExecution = async (
  filters?: AcademyReportFilters,
  page = 1,
  perPage = 15
): Promise<SessionExecution> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/session-execution`, {
    headers: getAuthHeaders(),
    params: { ...filters, page, per_page: perPage },
  });
  return response.data;
};

export const getSubscriptionUsage = async (): Promise<SubscriptionUsage> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/subscription-usage`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getTimeComparison = async (filters?: AcademyReportFilters): Promise<TimeComparison> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/time-comparison`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getAcademyAlerts = async (filters?: AcademyReportFilters): Promise<AcademyAlert[]> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/alerts`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const getAcademyReportOverview = async (filters?: AcademyReportFilters): Promise<AcademyReportOverview> => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/overview`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};
