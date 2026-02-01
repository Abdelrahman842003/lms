/**
 * Teacher Service
 * Handles all teacher-related API calls
 */

import { fetchApi, ENDPOINTS, getAuthHeaders, API_BASE_URL } from '../api/baseApi';
import type { 
  Grade, 
  Group, 
  Lecture, 
  Exam,
  Secretary,
  TeacherStudent,
  CreateStudentRequest,
  UpdateStudentRequest,
  CreateGradeRequest,
  CreateGroupRequest,
  CreateLectureRequest,
  CreateExamRequest,
  CreateSecretaryRequest,
  CreatePaymentRequest,
  StudentActivationDetails,
  Permission,
  TeacherReportData,
} from '@/types/teacher.types';
import type { AcademyInfo } from '@/types/auth.types';
import type { ReportParams } from '@/types/api.types';

// ============================================
// Dashboard
// ============================================

/**
 * Get teacher dashboard stats
 */
export async function getTeacherDashboardStats(academyId?: string | null): Promise<unknown> {
  const params = academyId ? `?academy_id=${academyId}` : '';
  return await fetchApi(`${ENDPOINTS.TEACHER_DASHBOARD_STATS}${params}`);
}

/**
 * Get teacher's recent students
 */
export async function getTeacherRecentStudents(limit: number = 5, academyId?: string | null): Promise<unknown> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (academyId) params.append('academy_id', academyId);
  return await fetchApi(`${ENDPOINTS.TEACHER_DASHBOARD_STUDENTS}?${params}`);
}

/**
 * Get teacher's upcoming lectures
 */
export async function getTeacherUpcomingLectures(limit: number = 3): Promise<unknown> {
  return await fetchApi(`${ENDPOINTS.TEACHER_DASHBOARD_LECTURES}?limit=${limit}`);
}

/**
 * Get teacher's academies
 */
export async function getTeacherAcademies(): Promise<{ academies: AcademyInfo[] }> {
  return await fetchApi(ENDPOINTS.TEACHER_DASHBOARD_ACADEMIES);
}

/**
 * Get teacher student statistics
 */
export async function getTeacherStudentStatistics(): Promise<unknown> {
  return await fetchApi('/teacher/students/statistics');
}

// ============================================
// Students
// ============================================

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
 * Activate student subscription
 */
export async function activateTeacherStudent(
  id: string, 
  paidAmount?: number, 
  pricingSource?: string
): Promise<unknown> {
  return await fetchApi(`/teacher/students/${id}/activate`, {
    method: 'PUT',
    body: JSON.stringify({ 
      paid_amount: paidAmount,
      pricing_source: pricingSource 
    }),
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
 * Create payment for student
 */
export async function createTeacherStudentPayment(
  studentId: string,
  data: Omit<CreatePaymentRequest, 'student_id'>
): Promise<unknown> {
  return await fetchApi(
    `/api/teacher/students/${studentId}/payments`,
    {
      method: 'POST',
      body: JSON.stringify({ ...data, student_id: studentId }),
    }
  );
}

// ============================================
// Grades
// ============================================

/**
 * Get all grades
 */
export async function getGrades(): Promise<Grade[]> {
  return await fetchApi('/teacher/grades');
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

// ============================================
// Groups
// ============================================

/**
 * Get all groups
 */
export async function getGroups(): Promise<Group[]> {
  return await fetchApi('/teacher/groups');
}

/**
 * Create a new group
 */
export async function createGroup(data: CreateGroupRequest): Promise<Group> {
  const res = await fetchApi<{ group: Group }>('/teacher/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.group;
}

/**
 * Update a group
 */
export async function updateGroup(id: string, data: Partial<CreateGroupRequest>): Promise<Group> {
  const res = await fetchApi<{ group: Group }>(`/teacher/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.group;
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/groups/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// Lectures
// ============================================

/**
 * Get all lectures
 */
export async function getLectures(): Promise<Lecture[]> {
  const res = await fetchApi<{ lectures: Lecture[] }>('/teacher/lectures');
  return res.lectures;
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
 * Generate QR Code for lecture
 */
export async function generateLectureQrCode(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/lectures/${id}/qr-code`, {
    method: 'POST',
  });
}

// ============================================
// Exams
// ============================================

/**
 * Get all exams
 */
export async function getExams(
  page = 1, 
  perPage = 10,
  filters?: { search?: string; date_from?: string; date_to?: string }
): Promise<{ exams: Exam[]; total: number }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
  });

  return await fetchApi(`/teacher/exams?${queryParams}`);
}

/**
 * Create a new exam
 */
export async function createExam(data: CreateExamRequest): Promise<{ exam: Exam; warning?: string }> {
  const res = await fetchApi<{ exam: Exam; warning?: string }>('/teacher/exams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return { exam: res.exam, warning: res.warning };
}

/**
 * Get single exam details
 */
export async function getExam(id: string): Promise<Exam> {
  const res = await fetchApi<{ exam: Exam }>(`/teacher/exams/${id}`);
  return res.exam;
}

/**
 * Update an exam
 */
export async function updateExam(id: string, data: Partial<CreateExamRequest>): Promise<{ exam: Exam; warning?: string }> {
  const res = await fetchApi<{ exam: Exam; warning?: string }>(`/teacher/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return { exam: res.exam, warning: res.warning };
}

/**
 * Delete an exam
 */
export async function deleteExam(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/exams/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toggle exam status
 */
export async function toggleExamStatus(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/exams/${id}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * Force end an exam
 */
export async function endExam(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/exams/${id}/end`, {
    method: 'PUT',
  });
}

/**
 * Copy an exam
 */
export async function copyExam(id: string, title?: string): Promise<Exam> {
  const res = await fetchApi<{ exam: Exam }>(`/teacher/exams/${id}/copy`, {
    method: 'POST',
    body: title ? JSON.stringify({ title }) : undefined,
  });
  return res.exam;
}

// ============================================
// Secretaries
// ============================================

/**
 * Get all secretaries
 */
export async function getSecretaries(
  page = 1, 
  search = '', 
  status = ''
): Promise<{ secretaries: Secretary[] }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    ...(search && { search }),
    ...(status && { status }),
  });
  return await fetchApi(`/teacher/secretaries?${queryParams}`);
}

/**
 * Create a new secretary
 */
export async function createSecretary(data: CreateSecretaryRequest): Promise<Secretary> {
  const res = await fetchApi<{ secretary: Secretary }>('/teacher/secretaries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.secretary;
}

/**
 * Update a secretary
 */
export async function updateSecretary(id: string, data: Partial<CreateSecretaryRequest>): Promise<Secretary> {
  const res = await fetchApi<{ secretary: Secretary }>(`/teacher/secretaries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.secretary;
}

/**
 * Update secretary permissions
 */
export async function updateSecretaryPermissions(id: string, permissions: string[]): Promise<unknown> {
  return await fetchApi(`/teacher/secretaries/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
}

/**
 * Toggle secretary status
 */
export async function toggleSecretaryStatus(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/secretaries/${id}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * Delete a secretary
 */
export async function deleteSecretary(id: string): Promise<unknown> {
  return await fetchApi(`/teacher/secretaries/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get all permissions
 */
export async function getPermissions(): Promise<Permission[]> {
  const res = await fetchApi<{ permissions: Permission[] }>('/teacher/permissions');
  return res.permissions;
}

// ============================================
// Notifications
// ============================================

/**
 * Get notifications
 */
export async function getNotifications(page = 1): Promise<unknown> {
  return await fetchApi(`/teacher/notifications?page=${page}`);
}

/**
 * Send notification
 */
export async function sendNotification(data: {
  title: string;
  message: string;
  target_type: 'all' | 'grade' | 'group' | 'students';
  target_ids?: string[];
  grade_id?: string;
  group_id?: string;
}): Promise<unknown> {
  return await fetchApi('/teacher/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Reports
// ============================================

/**
 * Get report for the authenticated teacher
 */
export async function getMyTeacherReport(params: ReportParams): Promise<TeacherReportData> {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return await fetchApi(`/teacher/reports/my-report?${queryParams}`);
}

/**
 * Download teacher's own report as PDF
 */
export async function downloadMyTeacherReportPdf(params: ReportParams): Promise<void> {
  const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  const headers = getAuthHeaders({
    'Accept': 'application/pdf',
  });
  
  const response = await fetch(`${cleanBaseUrl}/api/teacher/reports/my-report/pdf?${queryParams}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to download PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-report-${params.start_date}-to-${params.end_date}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
