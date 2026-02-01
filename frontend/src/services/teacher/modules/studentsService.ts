/**
 * Teacher Students Module
 * Handles student management operations for teachers
 */

import { fetchApi } from '../../api/baseApi';
import type { 
  TeacherStudent,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentActivationDetails,
  CreatePaymentRequest
} from '@/types/teacher.types';

/**
 * Get all students for teacher
 */
export async function getTeacherStudents(
  page = 1, 
  perPage = 10, 
  search = '', 
  status = ''
): Promise<{ students: TeacherStudent[]; total: number }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(search && { search }),
    ...(status && { status }),
  });

  const res = await fetchApi<{ students: TeacherStudent[]; total: number }>(`/teacher/students?${queryParams}`);
  return res;
}

/**
 * Search for student by phone number
 */
export async function searchStudentByPhone(phone: string): Promise<unknown> {
  return await fetchApi(`/teacher/students/search-phone?phone=${phone}`);
}

/**
 * Create a new student
 */
export async function createTeacherStudent(data: CreateStudentRequest): Promise<unknown> {
  return await fetchApi('/teacher/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a student
 */
export async function updateTeacherStudent(id: string, data: UpdateStudentRequest): Promise<unknown> {
  return await fetchApi(`/teacher/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Update student permissions
 */
export async function updateTeacherStudentPermissions(id: string, permissions: string[]): Promise<unknown> {
  return await fetchApi(`/teacher/students/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
}

/**
 * Get a single student details
 */
export async function getTeacherStudentDetails(id: string): Promise<TeacherStudent & { 
  subscription_history: unknown[]; 
  payment_logs: unknown[];
}> {
  const res = await fetchApi<{ 
    student: TeacherStudent; 
    subscription_history: unknown[]; 
    payment_logs: unknown[];
  }>(`/teacher/students/${id}`);
  
  return { 
    ...res.student, 
    subscription_history: res.subscription_history,
    payment_logs: res.payment_logs 
  };
}

/**
 * Delete a student
 */
export async function deleteTeacherStudent(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/students/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Activate a student
 */
export async function activateTeacherStudent(
  id: string,
  data: {
    start_date: string;
    duration: number;
    price: number;
    notes?: string;
  }
): Promise<unknown> {
  return await fetchApi(`/teacher/students/${id}/activate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get student activation details
 */
export async function getStudentActivationDetails(id: string): Promise<StudentActivationDetails> {
  return await fetchApi(`/teacher/students/${id}/activation-details`);
}

/**
 * Toggle student status
 */
export async function toggleTeacherStudentStatus(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/students/${id}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * Create student payment
 */
export async function createTeacherStudentPayment(
  studentId: string, 
  data: CreatePaymentRequest
): Promise<unknown> {
  return await fetchApi(`/teacher/students/${studentId}/payments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}