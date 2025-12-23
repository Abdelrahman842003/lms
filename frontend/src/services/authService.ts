// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API Endpoints
const ENDPOINTS = {
  LOGIN_ADMIN: '/api/admin/login',
  LOGIN_TEACHER: '/api/login/teacher',
  LOGIN_STUDENT: '/api/login/student',
  LOGIN_SECRETARY: '/api/login/secretary',
  LOGOUT_ADMIN: '/api/admin/logout',
  LOGOUT_TEACHER: '/api/teacher/logout',
  LOGOUT_STUDENT: '/api/student/logout',
  LOGOUT_SECRETARY: '/api/secretary/logout',
  ME_TEACHER: '/api/teacher/me',
  ME_STUDENT: '/api/student/me',
  ME_SECRETARY: '/api/secretary/me',
  ME_ADMIN: '/api/admin/me',
  UPDATE_ADMIN_PROFILE: '/api/admin/profile',
  CHANGE_ADMIN_PASSWORD: '/api/admin/change-password',
  TEACHER_DASHBOARD_STATS: '/api/teacher/dashboard/stats',
  TEACHER_DASHBOARD_STUDENTS: '/api/teacher/dashboard/students',
  TEACHER_DASHBOARD_LECTURES: '/api/teacher/dashboard/lectures',
  // Student endpoints
  STUDENT_TEACHERS: '/api/student/teachers',
  STUDENT_TEACHER_DASHBOARD: '/api/student/teachers', // + /{teacherId}/dashboard
} as const;

export interface AuthResponse {
  token: string;
  refresh_token?: string;
  user: any;
  role: 'teacher' | 'student' | 'secretary' | 'admin';
  teachers?: TeacherInfo[]; // For student login - list of enrolled teachers
}

export interface TeacherInfo {
  enrollment_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  grade_name: string | null;
  group_name: string | null;
  balance: number;
  enrolled_at: string;
  status?: 'active' | 'grace_period' | 'expired' | 'inactive';
  days_left?: number;
  is_suspended?: boolean;
}

export interface AdminAuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: any;
  role: 'admin';
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T;
  errors?: any;
}

/**
 * Helper to get cookie by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  return null;
}

/**
 * Get auth token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
}

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return null;
    return null;
  }

  try {
    // Ensure API_BASE_URL does not end with /api or /
    const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
    const url = `${cleanBaseUrl}/api/refresh-token`;
    


    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${refreshToken}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Refresh token failed response:', response.status, errText);
      throw new Error('Failed to refresh token');
    }

    const resText = await response.text();
    const res = JSON.parse(resText);
    const newAccessToken = res.data.access_token;
    
    if (newAccessToken) {

      localStorage.setItem('token', newAccessToken);
      return newAccessToken;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // If refresh fails, clear tokens to force login
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    return null;
  }
}

/**
 * Generic API fetch wrapper
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}, skipAuthEvent: boolean = false): Promise<any> {
  const xsrfToken = getCookie('XSRF-TOKEN');
  
  // Get token from localStorage only on client side
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(xsrfToken && { 'X-XSRF-TOKEN': xsrfToken }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers as Record<string, string>),
  };

  // Ensure API_BASE_URL does not end with /api or /
  const cleanBaseUrl = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const url = `${cleanBaseUrl}${endpoint.startsWith('/api') ? endpoint : '/api' + endpoint}`;
  

  
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Important for Sanctum SPA
  });

  // Handle 419 CSRF Token Mismatch - Retry once
  if (response.status === 419) {
    await csrf(); // Refresh the cookie
    const newXsrfToken = getCookie('XSRF-TOKEN');
    
    if (newXsrfToken) {
      headers['X-XSRF-TOKEN'] = newXsrfToken;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  // Handle 401 Unauthorized - Attempt Refresh (only if not a login request)
  if (response.status === 401 && !skipAuthEvent) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

    if (!response.ok) {
      let error: any;
      try {
        // Read response as text first
        const text = await response.text();
        // Try to parse as JSON
        try {
          error = JSON.parse(text);
        } catch (e) {
          // If not valid JSON, use text as message
          error = { message: text || `API Error: ${response.status}` };
        }
      } catch (e) {
        error = { message: `API Error: ${response.status}` };
      }

      console.error('API Error:', response.status, error);

      const errorWithStatus = new Error(error.message || 'API request failed') as any;
      errorWithStatus.status = response.status;
      errorWithStatus.errors = error.errors;
      
      // Only dispatch auth:unauthorized for non-login 401 errors or 403 (Forbidden/Suspended)
      if ((response.status === 401 || response.status === 403) && !skipAuthEvent) {
        // Dispatch event for AuthContext to handle logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
      
      throw errorWithStatus;
    }

  const res: ApiResponse<any> = await response.json();
  return res.data;
}

/**
 * CSRF Cookie initialization
 */
export async function csrf(): Promise<void> {
  await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
  });
}

/**
 * Login as an admin
 */
export async function loginAdmin(
  username: string,
  password: string
): Promise<AuthResponse> {
  // await csrf();
  // We use fetchApi here to handle headers automatically, but we need to pass the endpoint directly
  // Note: fetchApi assumes /api prefix if not present, but ENDPOINTS already have it.
  // The fetchApi logic I wrote handles both cases.
  
  // However, login endpoints return different structures sometimes.
  // Let's use fetchApi but we need to handle the response structure carefully.
  // Admin login returns { access_token, user, role } inside data?
  // Let's look at previous implementation: res.data had user and role.
  
  // Wait, fetchApi returns res.data.
  // So 'data' variable below will be res.data.
  
  const data = await fetchApi(ENDPOINTS.LOGIN_ADMIN, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, true); // skipAuthEvent: true

  return {
    token: data.access_token || '', 
    refresh_token: data.refresh_token,
    user: data.user,
    role: data.role,
  };
}

/**
 * Login as a teacher
 */
export async function loginTeacher(
  phone: string,
  password: string
): Promise<AuthResponse> {
  // await csrf();
  return await fetchApi(ENDPOINTS.LOGIN_TEACHER, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true); // skipAuthEvent: true - don't dispatch auth:unauthorized for login
}

/**
 * Login as a student (with Egyptian phone number)
 */
export async function loginStudent(
  phone: string,
  password: string
): Promise<AuthResponse> {
  // await csrf();
  const data = await fetchApi(ENDPOINTS.LOGIN_STUDENT, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true); // skipAuthEvent: true
  return {
    token: data.token,
    refresh_token: data.refresh_token,
    user: data.user,
    role: data.role,
    teachers: data.teachers, // List of enrolled teachers
  };
}

/**
 * Get enrolled teachers for student
 */
export async function getStudentTeachers(): Promise<TeacherInfo[]> {
  const data = await fetchApi(ENDPOINTS.STUDENT_TEACHERS);
  return data.teachers;
}

/**
 * Get teacher dashboard for student
 */
export async function getStudentTeacherDashboard(teacherId: string): Promise<any> {
  return await fetchApi(`${ENDPOINTS.STUDENT_TEACHER_DASHBOARD}/${teacherId}/dashboard`);
}

/**
 * Login as a secretary
 */
export async function loginSecretary(
  phone: string,
  password: string
): Promise<AuthResponse> {
  // await csrf();
  return await fetchApi(ENDPOINTS.LOGIN_SECRETARY, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true); // skipAuthEvent: true
}

/**
 * Logout user (admin, teacher or student)
 */
export async function logout(
  userType: 'admin' | 'teacher' | 'student' | 'secretary',
  fcmToken?: string | null
): Promise<{ message: string }> {
  const endpoint = userType === 'admin'
    ? ENDPOINTS.LOGOUT_ADMIN
    : userType === 'teacher' 
      ? ENDPOINTS.LOGOUT_TEACHER 
      : userType === 'student'
        ? ENDPOINTS.LOGOUT_STUDENT
        : ENDPOINTS.LOGOUT_SECRETARY;

  await fetchApi(endpoint, {
    method: 'POST',
    body: fcmToken ? JSON.stringify({ fcm_token: fcmToken }) : undefined,
  });

  return { message: 'تم تسجيل الخروج بنجاح' };
}

/**
 * Get current user data
 */
export async function getCurrentUser(
  userType: 'teacher' | 'student' | 'secretary' | 'admin'
): Promise<AuthResponse> {
  const endpoint = userType === 'teacher' 
    ? ENDPOINTS.ME_TEACHER 
    : userType === 'student'
      ? ENDPOINTS.ME_STUDENT
      : userType === 'admin'
        ? ENDPOINTS.ME_ADMIN
        : ENDPOINTS.ME_SECRETARY;

  return await fetchApi(endpoint, {
    method: 'GET',
  });
}

/**
 * Update admin profile
 */
export async function updateAdminProfile(
  data: { name: string; username: string }
): Promise<{ message: string; user: any }> {
  const res = await fetchApi(ENDPOINTS.UPDATE_ADMIN_PROFILE, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  // Assuming res contains { user: ... }
  return { message: 'تم التحديث بنجاح', user: res.user };
}

/**
 * Change admin password
 */
export async function changeAdminPassword(
  data: { current_password: string; new_password: string; new_password_confirmation: string }
): Promise<{ message: string }> {
  await fetchApi(ENDPOINTS.CHANGE_ADMIN_PASSWORD, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return { message: 'تم تغيير كلمة المرور بنجاح' };
}

/**
 * Get all teachers (Admin only)
 */
export async function getTeachers(
  page = 1, 
  perPage = 10, 
  filters?: { search?: string; date_from?: string; date_to?: string; status?: string }
): Promise<any> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
    ...(filters?.status && { status: filters.status }),
  });
  return await fetchApi(`/admin/teachers?${queryParams}`);
}

/**
 * Create a new teacher (Admin only)
 */
export async function createTeacher(data: any): Promise<any> {
  const res = await fetchApi('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.teacher;
}

/**
 * Update teacher (Admin only)
 */
export async function updateTeacher(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/admin/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.teacher;
}

/**
 * Get teacher details (Admin only)
 */
export async function getTeacherDetails(id: string): Promise<any> {
  const res = await fetchApi(`/admin/teachers/${id}`);
  return res.teacher;
}

/**
 * Toggle teacher status (suspend/activate)
 */
export async function toggleTeacherStatus(id: string): Promise<any> {
  const res = await fetchApi(`/admin/teachers/${id}/toggle-status`, {
    method: 'PUT',
  });
  return res.teacher;
}

/**
 * Login as a teacher (Admin only)
 */
export async function loginAsTeacher(id: string): Promise<any> {
  const res = await fetchApi(`/admin/teachers/${id}/login`, {
    method: 'POST',
  });
  return res;
}

/**
 * Update teacher subscription (Admin only)
 */
export async function updateTeacherSubscription(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/admin/teachers/${id}/subscription`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
}

/**
 * Get teacher subscription for a month (Admin only)
 */
export async function getTeacherSubscription(id: string, month: string): Promise<any> {
  const res = await fetchApi(`/admin/teachers/${id}/subscription?month=${month}`, {
    method: 'GET',
  });
  return res;
}

/**
 * Get all students (Admin only)
 */
export async function getStudents(
  page = 1, 
  perPage = 10,
  filters?: { search?: string; status?: string; date_from?: string; date_to?: string }
): Promise<any> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
  });
  return await fetchApi(`/admin/students?${queryParams}`);
}

/**
 * Update student (Admin only)
 */
export async function updateStudent(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.student;
}

/**
 * Create a new student (Admin only)
 */
export async function createStudent(data: any): Promise<any> {
  const res = await fetchApi('/admin/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.student;
}

/**
 * Get dashboard stats (Admin only)
 */
export async function getDashboardStats(): Promise<any> {
  return await fetchApi('/admin/dashboard/stats');
}

export async function getStudentStatistics(): Promise<any> {
  return await fetchApi('/admin/students/statistics');
}

/**
 * Get teacher dashboard stats
 */
export async function getTeacherDashboardStats(): Promise<any> {
  return await fetchApi(ENDPOINTS.TEACHER_DASHBOARD_STATS);
}

/**
 * Get teacher's recent students
 */
export async function getTeacherRecentStudents(limit: number = 5): Promise<any> {
  return await fetchApi(`${ENDPOINTS.TEACHER_DASHBOARD_STUDENTS}?limit=${limit}`);
}

/**
 * Get teacher's upcoming lectures
 */
export async function getTeacherUpcomingLectures(limit: number = 3): Promise<any> {
  return await fetchApi(`${ENDPOINTS.TEACHER_DASHBOARD_LECTURES}?limit=${limit}`);
}

/**
 * Get teacher student statistics
 */
export async function getTeacherStudentStatistics(): Promise<any> {
  return await fetchApi('/teacher/students/statistics');
}

/**
 * Get all students for teacher (with pagination)
 */
export async function getTeacherStudents(page = 1, perPage = 10, search = '', status = ''): Promise<any> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(search && { search }),
    ...(status && { status }),
  });

  const res = await fetchApi(`/teacher/students?${queryParams}`);
  return res.students;
}

/**
 * Search for student by phone number
 */
export async function searchStudentByPhone(phone: string): Promise<any> {
  return await fetchApi(`/teacher/students/search-phone?phone=${phone}`);
}

/**
 * Create a new student for teacher
 */
export async function createTeacherStudent(data: any): Promise<any> {
  return await fetchApi('/teacher/students', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Update a student for teacher
 */
export async function updateTeacherStudent(id: string, data: any): Promise<any> {
  return await fetchApi(`/teacher/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Update student permissions for teacher
 */
export async function updateTeacherStudentPermissions(id: string, permissions: string[]): Promise<any> {
  return await fetchApi(`/teacher/students/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
}

/**
 * Get a single student details for teacher
 */
export async function getTeacherStudentDetails(id: string): Promise<any> {
  const res = await fetchApi(`/teacher/students/${id}`);
  return res.student;
}

/**
 * Delete a student for teacher
 */
export async function deleteTeacherStudent(id: string): Promise<any> {
  return await fetchApi(`/teacher/students/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Activate student subscription for teacher
 */
export async function activateTeacherStudent(id: string, paidAmount?: number, pricingSource?: string): Promise<any> {
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
export async function getStudentActivationDetails(id: string): Promise<any> {
  return await fetchApi(`/teacher/students/${id}/activation-details`);
}

/**
 * Toggle student status for teacher
 */
export async function toggleTeacherStudentStatus(id: string): Promise<any> {
  return await fetchApi(`/teacher/students/${id}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * Get all grades
 */
export async function getGrades(): Promise<any> {
  const res = await fetchApi('/teacher/grades');
  return res;
}

/**
 * Create a new grade
 */
export async function createGrade(data: any): Promise<any> {
  const res = await fetchApi('/teacher/grades', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.grade;
}

/**
 * Update a grade
 */
export async function updateGrade(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/teacher/grades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.grade;
}

/**
 * Delete a grade
 */
export async function deleteGrade(id: string): Promise<any> {
  return await fetchApi(`/teacher/grades/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get all groups
 */
export async function getGroups(): Promise<any> {
  const res = await fetchApi('/teacher/groups');
  return res;
}

/**
 * Create a new group
 */
export async function createGroup(data: any): Promise<any> {
  const res = await fetchApi('/teacher/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.group;
}

/**
 * Update a group
 */
export async function updateGroup(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/teacher/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.group;
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string): Promise<any> {
  return await fetchApi(`/teacher/groups/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toggle exam status (active/inactive)
 */
export async function toggleExamStatus(id: string): Promise<any> {
  const res = await fetchApi(`/teacher/exams/${id}/toggle-status`, {
    method: 'PUT',
  });
  return res;
}

/**
 * Force end an exam
 */
export async function endExam(id: string): Promise<any> {
  const res = await fetchApi(`/teacher/exams/${id}/end`, {
    method: 'PUT',
  });
  return res;
}

/**
 * Get all lectures
 */
export async function getLectures(): Promise<any> {
  const res = await fetchApi('/teacher/lectures');
  return res.lectures;
}

/**
 * Create a new lecture
 */
export async function createLecture(data: any): Promise<any> {
  const res = await fetchApi('/teacher/lectures', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.lecture;
}

/**
 * Update a lecture
 */
export async function updateLecture(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/teacher/lectures/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.lecture;
}

/**
 * Delete a lecture
 */
export async function deleteLecture(id: string): Promise<any> {
  return await fetchApi(`/teacher/lectures/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Generate QR Code for lecture
 */
export async function generateLectureQrCode(id: string): Promise<any> {
  return await fetchApi(`/teacher/lectures/${id}/qr-code`, {
    method: 'POST',
  });
}

/**
 * Get all exams
 */
export async function getExams(
  page = 1, 
  perPage = 10,
  filters?: { search?: string; date_from?: string; date_to?: string }
): Promise<any> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.date_from && { date_from: filters.date_from }),
    ...(filters?.date_to && { date_to: filters.date_to }),
  });

  const res = await fetchApi(`/teacher/exams?${queryParams}`, {
    method: 'GET',
  });
  return res;
}

/**
 * Create a new exam
 */
export async function createExam(data: any): Promise<any> {
  const res = await fetchApi('/teacher/exams', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.exam;
}

/**
 * Get single exam details
 */
export async function getExam(id: string): Promise<any> {
  const res = await fetchApi(`/teacher/exams/${id}`, {
    method: 'GET',
  });
  return res.exam;
}

/**
 * Update an exam
 */
export async function updateExam(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/teacher/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.exam;
}

/**
 * Delete an exam
 */
export async function deleteExam(id: string): Promise<any> {
  return await fetchApi(`/teacher/exams/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get all secretaries
 */
export async function getSecretaries(page = 1, search = '', status = ''): Promise<any> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    ...(search && { search }),
    ...(status && { status }),
  });
  const res = await fetchApi(`/teacher/secretaries?${queryParams}`);
  return res.secretaries;
}

/**
 * Create a new secretary
 */
export async function createSecretary(data: any): Promise<any> {
  const res = await fetchApi('/teacher/secretaries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.secretary;
}

/**
 * Update a secretary
 */
export async function updateSecretary(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/teacher/secretaries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.secretary;
}

/**
 * Update secretary permissions
 */
export async function updateSecretaryPermissions(id: string, permissions: string[]): Promise<any> {
  return await fetchApi(`/teacher/secretaries/${id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  });
}

/**
 * Toggle secretary status
 */
export async function toggleSecretaryStatus(id: string): Promise<any> {
  return await fetchApi(`/teacher/secretaries/${id}/toggle-status`, {
    method: 'PUT',
  });
}

/**
 * Delete a secretary
 */
export async function deleteSecretary(id: string): Promise<any> {
  return await fetchApi(`/teacher/secretaries/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get all permissions
 */
export async function getPermissions(): Promise<any> {
  const res = await fetchApi('/teacher/permissions');
  return res.permissions;
}

/**
 * Get notifications
 */
export async function getNotifications(page = 1): Promise<any> {
  return await fetchApi(`/teacher/notifications?page=${page}`);
}

/**
 * Send notification
 */
export async function sendNotification(data: any): Promise<any> {
  return await fetchApi('/teacher/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================
// Reports API Functions
// ============================================

export interface ReportParams {
  start_date: string;
  end_date: string;
}

/**
 * Get list of teachers for report selection
 */
export async function getReportTeachers(): Promise<any[]> {
  return await fetchApi('/admin/reports/teachers');
}

/**
 * Get teacher report data (JSON)
 */
export async function getTeacherReport(teacherId: string, params: ReportParams): Promise<any> {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return await fetchApi(`/admin/reports/teacher/${teacherId}?${queryParams}`);
}

/**
 * Get admin overview report (JSON)
 */
export async function getAdminReport(params: ReportParams): Promise<any> {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return await fetchApi(`/admin/reports/admin?${queryParams}`);
}

/**
 * Download teacher report as PDF
 */
export async function downloadTeacherReportPdf(teacherId: string, params: ReportParams): Promise<void> {
  const token = getAuthToken();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBaseUrl = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  const response = await fetch(`${cleanBaseUrl}/api/admin/reports/teacher/${teacherId}/pdf?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
    },
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
  const token = getAuthToken();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBaseUrl = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  const response = await fetch(`${cleanBaseUrl}/api/admin/reports/admin/pdf?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
    },
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

// ============================================
// Teacher Reports API Functions (for teacher dashboard)
// ============================================

/**
 * Get report for the authenticated teacher
 */
export async function getMyTeacherReport(params: ReportParams): Promise<any> {
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
  const token = getAuthToken();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBaseUrl = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  
  const response = await fetch(`${cleanBaseUrl}/api/teacher/reports/my-report/pdf?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/pdf',
    },
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
