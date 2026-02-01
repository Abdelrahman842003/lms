/**
 * Teacher Grades Module
 * Handles grade/class management for teachers
 */

import { fetchApi } from '../../api/baseApi';
import type { Grade, CreateGradeRequest } from '@/types/teacher.types';

/**
 * Get all grades for teacher
 */
export async function getGrades(): Promise<Grade[]> {
  return await fetchApi('/teacher/grades');
}

/**
 * Get specific grade details
 */
export async function getGrade(id: string): Promise<Grade> {
  const res = await fetchApi<{ grade: Grade }>(`/teacher/grades/${id}`);
  return res.grade;
}

/**
 * Create a new grade
 */
export async function createGrade(data: CreateGradeRequest): Promise<Grade> {
  const res = await fetchApi<{ grade: Grade }>('/teacher/grades', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.grade;
}

/**
 * Update a grade
 */
export async function updateGrade(id: string, data: Partial<CreateGradeRequest>): Promise<Grade> {
  const res = await fetchApi<{ grade: Grade }>(`/teacher/grades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.grade;
}

/**
 * Delete a grade
 */
export async function deleteGrade(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/grades/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get grade statistics
 */
export async function getGradeStatistics(id: string): Promise<{
  total_students: number;
  active_students: number;
  average_performance: number;
}> {
  return await fetchApi(`/teacher/grades/${id}/statistics`);
}

/**
 * Get students in a grade
 */
export async function getGradeStudents(id: string, page = 1, perPage = 10): Promise<{
  students: any[];
  total: number;
}> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  return await fetchApi(`/teacher/grades/${id}/students?${params}`);
}