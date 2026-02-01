/**
 * Teacher Lectures Module
 * Handles lecture management for teachers
 */

import { fetchApi } from '../../api/baseApi';
import type { Lecture, CreateLectureRequest } from '@/types/teacher.types';

/**
 * Get all lectures for teacher
 */
export async function getLectures(filters?: {
  date_from?: string;
  date_to?: string;
  status?: 'scheduled' | 'active' | 'completed';
  group_id?: string;
}): Promise<Lecture[]> {
  const params = new URLSearchParams();
  if (filters?.date_from) params.append('date_from', filters.date_from);
  if (filters?.date_to) params.append('date_to', filters.date_to);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.group_id) params.append('group_id', filters.group_id);

  const queryString = params.toString();
  const res = await fetchApi<{ lectures: Lecture[] }>(`/teacher/lectures${queryString ? '?' + queryString : ''}`);
  return res.lectures;
}

/**
 * Get specific lecture details
 */
export async function getLecture(id: string): Promise<Lecture> {
  const res = await fetchApi<{ lecture: Lecture }>(`/teacher/lectures/${id}`);
  return res.lecture;
}

/**
 * Create a new lecture
 */
export async function createLecture(data: CreateLectureRequest): Promise<Lecture> {
  const res = await fetchApi<{ lecture: Lecture }>('/teacher/lectures', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.lecture;
}

/**
 * Update a lecture
 */
export async function updateLecture(id: string, data: Partial<CreateLectureRequest>): Promise<Lecture> {
  const res = await fetchApi<{ lecture: Lecture }>(`/teacher/lectures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.lecture;
}

/**
 * Delete a lecture
 */
export async function deleteLecture(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/lectures/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Start a lecture
 */
export async function startLecture(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/lectures/${id}/start`, {
    method: 'POST',
  });
}

/**
 * End a lecture
 */
export async function endLecture(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/lectures/${id}/end`, {
    method: 'POST',
  });
}

/**
 * Generate QR Code for lecture attendance
 */
export async function generateLectureQrCode(id: string): Promise<{ qr_code: string; expires_at: string }> {
  return await fetchApi(`/teacher/lectures/${id}/qr-code`, {
    method: 'POST',
  });
}

/**
 * Get lecture attendance
 */
export async function getLectureAttendance(id: string): Promise<{
  total_students: number;
  present_students: number;
  absent_students: number;
  attendance_list: Array<{
    student_id: string;
    student_name: string;
    status: 'present' | 'absent';
    attended_at?: string;
  }>;
}> {
  return await fetchApi(`/teacher/lectures/${id}/attendance`);
}

/**
 * Mark student attendance manually
 */
export async function markStudentAttendance(lectureId: string, studentId: string, status: 'present' | 'absent'): Promise<unknown> {
  return await fetchApi(`/teacher/lectures/${lectureId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({
      student_id: studentId,
      status,
    }),
  });
}