/**
 * Admin Service
 * Handles all admin-related API calls
 */

import { fetchApi, getAuthHeaders, API_BASE_URL } from '../api/baseApi';
import type {
  AdminTeacher,
  AdminAcademy,
  AdminStudent,
  AdminDashboardStats,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  CreateAcademyRequest,
  UpdateAcademyRequest,
  TeacherSubscription,
  AcademySubscription,
  UpdateSubscriptionRequest,
  AcademyBilling,
  GenerateBillingRequest,
  UpdateBillingStatusRequest,
  PayBillingRequest,
  AdminReportData,
  AcademyReportData,
  StudentStatistics,
} from '@/types/admin.types';
import type { TeacherFilters, StudentFilters, AcademyFilters, ReportParams } from '@/types/api.types';
import type { TeacherReportData } from '@/types/teacher.types';

// ============================================
// Dashboard
// ============================================

/**
 * Get dashboard stats
 */
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  return await fetchApi('/admin/dashboard/stats');
}

/**
 * Get student statistics
 */
export async function getStudentStatistics(): Promise<StudentStatistics> {
  return await fetchApi('/admin/students/statistics');
}

// ============================================
// Teachers
// ============================================

/**
 * Get all teachers
 */
export async function getTeachers(
  page = 1, 
  perPage = 10, 
  filters?: TeacherFilters
): Promise<{ teachers: AdminTeacher[]; total: number }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.type && { type: filters.type }),
    ...(filters?.payment_status && { payment_status: filters.payment_status }),
  });
  return await fetchApi(`/admin/teachers?${queryParams}`);
}

/**
 * Create a new teacher
 */
export async function createTeacher(data: CreateTeacherRequest): Promise<AdminTeacher> {
  const res = await fetchApi<{ teacher: AdminTeacher }>('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.teacher;
}

/**
 * Update teacher
 */
export async function updateTeacher(id: string, data: UpdateTeacherRequest): Promise<AdminTeacher> {
  const res = await fetchApi<{ teacher: AdminTeacher }>(`/admin/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.teacher;
}

/**
 * Get teacher details
 */
export async function getTeacherDetails(id: string): Promise<AdminTeacher> {
  const res = await fetchApi<{ teacher: AdminTeacher }>(`/admin/teachers/${id}`);
  return res.teacher;
}

/**
 * Toggle teacher status (suspend/activate)
 */
export async function toggleTeacherStatus(id: string): Promise<AdminTeacher> {
  const res = await fetchApi<{ teacher: AdminTeacher }>(`/admin/teachers/${id}/toggle-status`, {
    method: 'PUT',
  });
  return res.teacher;
}

/**
 * Toggle independent status
 */
export async function toggleIndependentStatus(id: string): Promise<AdminTeacher> {
  const res = await fetchApi<{ teacher: AdminTeacher }>(`/admin/teachers/${id}/independent-status/toggle`, {
    method: 'PUT',
  });
  return res.teacher;
}

/**
 * Toggle teacher academy status
 */
export async function toggleTeacherAcademyStatus(teacherId: string, academyId: string): Promise<AdminTeacher> {
  const res = await fetchApi<{ teacher: AdminTeacher }>(`/admin/teachers/${teacherId}/academies/${academyId}/toggle-status`, {
    method: 'PUT',
  });
  return res.teacher;
}

/**
 * Approve teacher
 */
export async function approveTeacher(id: string): Promise<AdminTeacher> {
  const res = await fetchApi<{ teacher: AdminTeacher }>(`/admin/teachers/${id}/approve`, {
    method: 'POST',
  });
  return res.teacher;
}

/**
 * Enable independent for teacher
 */
export async function enableIndependent(id: string): Promise<unknown> {
  return await fetchApi(`/admin/teachers/${id}/enable-independent`, {
    method: 'POST',
  });
}

/**
 * Disable independent for teacher
 */
export async function disableIndependent(id: string): Promise<unknown> {
  return await fetchApi(`/admin/teachers/${id}/disable-independent`, {
    method: 'POST',
  });
}

/**
 * Add teacher to academy
 */
export async function addToAcademy(teacherId: string, academyId: string): Promise<unknown> {
  return await fetchApi(`/api/admin/teachers/${teacherId}/academies`, {
    method: 'POST',
    body: JSON.stringify({ academy_id: academyId }),
  });
}

/**
 * Remove teacher from academy
 */
export async function removeFromAcademy(teacherId: string, academyId: string): Promise<unknown> {
  return await fetchApi(`/api/admin/teachers/${teacherId}/academies/${academyId}`, {
    method: 'DELETE',
  });
}

/**
 * Delete teacher
 */
export async function deleteTeacher(id: string): Promise<unknown> {
  return await fetchApi(`/api/admin/teachers/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Login as a teacher
 */
export async function loginAsTeacher(id: string): Promise<unknown> {
  return await fetchApi(`/api/admin/teachers/${id}/login`, {
    method: 'POST',
  });
}

/**
 * Update teacher subscription
 */
export async function updateTeacherSubscription(id: string, data: UpdateSubscriptionRequest): Promise<TeacherSubscription> {
  return await fetchApi(`/api/admin/teachers/${id}/subscription`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get teacher subscription for a month
 */
export async function getTeacherSubscription(id: string, month: string): Promise<TeacherSubscription> {
  return await fetchApi(`/api/admin/teachers/${id}/subscription?month=${month}`);
}

// ============================================
// Students
// ============================================

/**
 * Get all students
 */
export async function getStudents(
  page = 1, 
  perPage = 10,
  filters?: StudentFilters
): Promise<{ students: AdminStudent[]; total: number }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
  });
  return await fetchApi(`/api/admin/students?${queryParams}`);
}

/**
 * Update student
 */
export async function updateStudent(id: string, data: Record<string, unknown>): Promise<AdminStudent> {
  const res = await fetchApi<{ student: AdminStudent }>(`/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.student;
}

/**
 * Create a new student
 */
export async function createStudent(data: Record<string, unknown>): Promise<AdminStudent> {
  const res = await fetchApi<{ student: AdminStudent }>('/admin/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.student;
}

// ============================================
// Academies
// ============================================

/**
 * Get all academies
 */
export async function getAcademies(
  page = 1,
  perPage = 10,
  filters?: AcademyFilters
): Promise<{ academies: AdminAcademy[]; total: number }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && { status: filters.status }),
  });
  return await fetchApi(`/api/admin/academies?${queryParams}`);
}

/**
 * Create a new academy
 */
export async function createAcademy(data: CreateAcademyRequest): Promise<AdminAcademy> {
  const res = await fetchApi<{ academy: AdminAcademy }>('/admin/academies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.academy;
}

/**
 * Update academy
 */
export async function updateAcademy(id: string, data: UpdateAcademyRequest): Promise<AdminAcademy> {
  const res = await fetchApi<{ academy: AdminAcademy }>(`/admin/academies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.academy;
}

/**
 * Get academy details
 */
export async function getAcademyDetails(id: string): Promise<AdminAcademy> {
  const res = await fetchApi<{ academy: AdminAcademy }>(`/admin/academies/${id}`);
  return res.academy;
}

/**
 * Toggle academy status
 */
export async function toggleAcademyStatus(id: string): Promise<unknown> {
  return await fetchApi(`/api/admin/academies/${id}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * Update academy subscription
 */
export async function updateAcademySubscription(id: string, data: UpdateSubscriptionRequest): Promise<AcademySubscription> {
  return await fetchApi(`/api/admin/academies/${id}/subscription`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get academy subscription for a month
 */
export async function getAcademySubscription(id: string, month: string): Promise<AcademySubscription> {
  return await fetchApi(`/api/admin/academies/${id}/subscription?month=${month}`);
}

// ============================================
// Academy Billing
// ============================================

/**
 * Get academy billing for a specific month
 */
export async function getAcademyBilling(
  academyId: string, 
  month: string, 
  year: string
): Promise<AcademyBilling[]> {
  const res = await fetchApi<unknown>(`/admin/academy-billings?academy_id=${academyId}&month=${parseInt(month)}&year=${parseInt(year)}`);
  
  // Handle various response formats
  if (Array.isArray(res)) return res as AcademyBilling[];
  
  const resObj = res as Record<string, unknown>;
  if (resObj.billings && Array.isArray(resObj.billings)) return resObj.billings as AcademyBilling[];
  if (resObj.billing) return [resObj.billing] as AcademyBilling[];
  if (resObj.data) {
    if (Array.isArray(resObj.data)) return resObj.data as AcademyBilling[];
    return [resObj.data] as AcademyBilling[];
  }
  if (resObj.id) return [resObj as unknown as AcademyBilling];
  
  return [];
}

/**
 * Generate academy billing
 */
export async function generateAcademyBilling(data: GenerateBillingRequest): Promise<AcademyBilling> {
  const res = await fetchApi<{ billing: AcademyBilling }>('/admin/academy-billings/generate', {
    method: 'POST',
    body: JSON.stringify({ 
      academy_id: data.academy_id, 
      month: data.month, 
      year: data.year 
    }),
  });
  return res.billing;
}

/**
 * Update academy billing status
 */
export async function updateAcademyBillingStatus(
  billingId: string, 
  data: UpdateBillingStatusRequest
): Promise<AcademyBilling> {
  const res = await fetchApi<{ billing: AcademyBilling }>(`/admin/academy-billings/${billingId}/status`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.billing;
}

/**
 * Pay academy billing
 */
export async function payAcademyBilling(billingId: string, data: PayBillingRequest): Promise<AcademyBilling> {
  const res = await fetchApi<{ billing: AcademyBilling }>(`/admin/academy-billings/${billingId}/pay`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.billing;
}

// ============================================
// Admin Profile
// ============================================

/**
 * Update admin profile
 */
export async function updateAdminProfile(
  data: { name: string; username: string }
): Promise<{ message: string; user: unknown }> {
  const res = await fetchApi<{ user: unknown }>('/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return { message: 'تم التحديث بنجاح', user: res.user };
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
  data: { current_password: string; new_password: string; new_password_confirmation: string }
): Promise<{ message: string }> {
  await fetchApi('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return { message: 'تم تغيير كلمة المرور بنجاح' };
}

// ============================================
// Reports
// ============================================

/**
 * Get list of teachers for report selection
 */
export async function getReportTeachers(): Promise<Array<{ id: string; name: string }>> {
  return await fetchApi('/admin/reports/teachers');
}

/**
 * Get list of academies for report selection
 */
export async function getReportAcademies(): Promise<Array<{ id: string; name: string }>> {
  return await fetchApi('/admin/reports/academies');
}

/**
 * Get teacher report data
 */
export async function getTeacherReport(teacherId: string, params: ReportParams): Promise<TeacherReportData> {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return await fetchApi(`/api/admin/reports/teacher/${teacherId}?${queryParams}`);
}

/**
 * Get academy report data
 */
export async function getAcademyReport(academyId: string, params: ReportParams): Promise<AcademyReportData> {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return await fetchApi(`/api/admin/reports/academy/${academyId}?${queryParams}`);
}

/**
 * Get admin overview report
 */
export async function getAdminReport(params: ReportParams): Promise<AdminReportData> {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return await fetchApi(`/api/admin/reports/admin?${queryParams}`);
}

/**
 * Download teacher report as PDF
 */
export async function downloadTeacherReportPdf(teacherId: string, params: ReportParams): Promise<void> {
  const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  const headers = getAuthHeaders({
    'Accept': 'application/pdf',
  });
  
  const response = await fetch(`${cleanBaseUrl}/api/admin/reports/teacher/${teacherId}/pdf?${queryParams}`, {
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
  a.download = `teacher-report-${teacherId}-${params.start_date}-to-${params.end_date}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

/**
 * Download admin report as PDF
 */
export async function downloadAdminReportPdf(params: ReportParams): Promise<void> {
  const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  const headers = getAuthHeaders({
    'Accept': 'application/pdf',
  });
  
  const response = await fetch(`${cleanBaseUrl}/api/admin/reports/admin/pdf?${queryParams}`, {
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
  a.download = `admin-report-${params.start_date}-to-${params.end_date}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}
