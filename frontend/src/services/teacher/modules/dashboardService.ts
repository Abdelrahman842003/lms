/**
 * Teacher Dashboard Module
 * Handles dashboard-related operations for teachers
 */

import { fetchApi } from '../../api/baseApi';
import type { AcademyInfo } from '@/types/auth.types';

/**
 * Get teacher dashboard stats
 */
export async function getTeacherDashboardStats(academyId?: string | null): Promise<unknown> {
  const params = academyId ? `?academy_id=${academyId}` : '';
  return await fetchApi(`/api/teacher/dashboard/stats${params}`);
}

/**
 * Get teacher's recent students
 */
export async function getTeacherRecentStudents(limit: number = 5, academyId?: string | null): Promise<unknown> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (academyId) params.append('academy_id', academyId);
  return await fetchApi(`/api/teacher/dashboard/students?${params}`);
}

/**
 * Get teacher's upcoming lectures
 */
export async function getTeacherUpcomingLectures(limit: number = 3): Promise<unknown> {
  return await fetchApi(`/api/teacher/dashboard/lectures?limit=${limit}`);
}

/**
 * Get teacher's academies
 */
export async function getTeacherAcademies(): Promise<{ academies: AcademyInfo[] }> {
  return await fetchApi('/teacher/dashboard/academies');
}

/**
 * Get teacher student statistics
 */
export async function getTeacherStudentStatistics(): Promise<unknown> {
  return await fetchApi('/teacher/students/statistics');
}

/**
 * Get teacher performance metrics
 */
export async function getTeacherPerformanceMetrics(period: 'week' | 'month' | 'year' = 'month'): Promise<unknown> {
  return await fetchApi(`/api/teacher/dashboard/performance?period=${period}`);
}

/**
 * Get teacher revenue summary
 */
export async function getTeacherRevenueSummary(period: 'month' | 'quarter' | 'year' = 'month'): Promise<unknown> {
  return await fetchApi(`/api/teacher/dashboard/revenue?period=${period}`);
}