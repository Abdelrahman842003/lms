// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API Endpoints
const ENDPOINTS = {
  LOGIN_ADMIN: '/api/admin/login',
  LOGIN_TEACHER: '/api/login/teacher',
  LOGIN_STUDENT: '/api/login/student',
  LOGIN_SECRETARY: '/api/login/secretary',
  LOGIN_PARENT: '/api/login/parent',
  LOGIN_ACADEMY: '/api/academy/login', // Direct academy login
  LOGOUT_ADMIN: '/api/admin/logout',
  LOGOUT_TEACHER: '/api/teacher/logout',
  LOGOUT_STUDENT: '/api/student/logout',
  LOGOUT_SECRETARY: '/api/secretary/logout',
  LOGOUT_PARENT: '/api/parent/logout',
  LOGOUT_ACADEMY: '/api/academy/logout',
  ME_TEACHER: '/api/teacher/me',
  ME_STUDENT: '/api/student/me',
  ME_SECRETARY: '/api/secretary/me',
  ME_ADMIN: '/api/admin/me',
  ME_PARENT: '/api/parent/me',
  ME_ACADEMY: '/api/academy/me',
  UPDATE_ADMIN_PROFILE: '/api/admin/profile',
  CHANGE_ADMIN_PASSWORD: '/api/admin/change-password',
  TEACHER_DASHBOARD_STATS: '/api/teacher/dashboard/stats',
  TEACHER_DASHBOARD_STUDENTS: '/api/teacher/dashboard/students',
  TEACHER_DASHBOARD_LECTURES: '/api/teacher/dashboard/lectures',
  TEACHER_DASHBOARD_ACADEMIES: '/api/teacher/dashboard/academies',
  // Student endpoints
  STUDENT_TEACHERS: '/api/student/teachers',
  STUDENT_TEACHER_DASHBOARD: '/api/student/teachers', // + /{teacherId}/dashboard
} as const;

export interface AuthResponse {
  token: string;
  refresh_token?: string;
  user: any;
  role: 'teacher' | 'student' | 'secretary' | 'admin' | 'parent' | 'academy';
  teachers?: TeacherInfo[]; // For student login - list of enrolled teachers
  children?: ChildInfo[]; // For parent login - list of children
  parent_phone?: string; // For parent login
}

export interface ChildInfo {
  id: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  teachers: {
    id: string;
    name: string;
    avatar: string | null;
    grade: string | null;
    group: string | null;
  }[];
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
  academy_id?: string | null;
  academy_name?: string | null;
}

export interface AcademyInfo {
  id: string | null;
  name: string;
  logo: string | null;
  is_active: boolean;
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
 * Get default Arabic error message for HTTP status codes
 */
function getDefaultArabicError(status: number): string {
  const errors: Record<number, string> = {
    400: 'طلب غير صالح',
    401: 'غير مصرح لك بالدخول. يرجى تسجيل الدخول.',
    403: 'غير مصرح لك بهذا الإجراء',
    404: 'العنصر المطلوب غير موجود',
    405: 'طريقة الطلب غير مسموحة',
    419: 'انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة.',
    422: 'البيانات المدخلة غير صالحة',
    429: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار.',
    500: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
    503: 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.',
  };
  return errors[status] || 'حدث خطأ غير متوقع';
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
/**
 * Get auth headers including token and academy context
 */
export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
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
    ...additionalHeaders,
  };

  // Inject Academy Context Header
  if (typeof window !== 'undefined') {
    const selectedAcademyStr = localStorage.getItem('selectedAcademy');
    if (selectedAcademyStr) {
      try {
        const selectedAcademy = JSON.parse(selectedAcademyStr);
        if (selectedAcademy && selectedAcademy.id) {
          headers['X-Academy-Id'] = selectedAcademy.id;
        } else {
           // Explicitly set to 'independent' or 'null' if selected but has no ID (Independent mode)
           headers['X-Academy-Id'] = 'independent';
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }

  return headers;
}

/**
 * Generic API fetch wrapper
 */
export async function fetchApi(endpoint: string, options: RequestInit = {}, skipAuthEvent: boolean = false): Promise<any> {
  const headers = getAuthHeaders(options.headers as Record<string, string>);

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

      // استخدام الرسالة العربية من الـ API إذا وجدت، وإلا استخدام الرسالة الافتراضية
      const arabicMessage = error.message || getDefaultArabicError(response.status);
      const errorWithStatus = new Error(arabicMessage) as any;
      errorWithStatus.status = response.status;
      errorWithStatus.errors = error.errors;
      errorWithStatus.data = error.data; // Include data for attempts_remaining, retry_after, etc.
      
      // Only dispatch auth:unauthorized for non-login 401 errors
      // 403 errors should NOT trigger logout (unless it's a specific suspension case handled below)
      if (response.status === 401 && !skipAuthEvent) {
          // Dispatch event for AuthContext to handle logout
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:unauthorized'));
          }
      }
      
      // Handle Teacher Suspension (usually 403)
      if (response.status === 403 && !skipAuthEvent) {
        const isTeacherSuspended = error?.error === 'TEACHER_SUSPENDED';
        
        if (isTeacherSuspended) {
          // Dispatch event for AuthContext to handle teacher suspension (switch teacher)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:teacher_suspended'));
          }
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
 * Login as a parent (guardian)
 */
export async function loginParent(
  phone: string,
  password: string
): Promise<AuthResponse> {
  const data = await fetchApi(ENDPOINTS.LOGIN_PARENT, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true); // skipAuthEvent: true
  return {
    token: data.token,
    refresh_token: data.refresh_token,
    user: { 
      id: data.user.id, 
      name: data.user.name || 'ولي الأمر', 
      phone: data.user.phone || data.parent_phone,
      avatar: data.user.avatar
    },
    role: data.role,
    children: data.children,
    parent_phone: data.parent_phone,
  };
}

/**
 * Login as academy (direct academy login)
 */
export async function loginAcademy(
  phone: string,
  password: string
): Promise<AuthResponse> {
  const data = await fetchApi(ENDPOINTS.LOGIN_ACADEMY, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true); // skipAuthEvent: true
  
  return {
    token: data.token,
    refresh_token: data.refresh_token,
    user: data.user,
    role: data.role, // Should be 'academy' from backend
  };
}

/**
 * Logout user (admin, teacher, student, secretary, parent, or academy)
 */
export async function logout(
  userType: 'admin' | 'teacher' | 'student' | 'secretary' | 'parent' | 'academy',
  fcmToken?: string | null
): Promise<{ message: string }> {
  const endpoint = userType === 'admin'
    ? ENDPOINTS.LOGOUT_ADMIN
    : userType === 'teacher' 
      ? ENDPOINTS.LOGOUT_TEACHER 
      : userType === 'student'
        ? ENDPOINTS.LOGOUT_STUDENT
        : userType === 'parent'
          ? ENDPOINTS.LOGOUT_PARENT
          : userType === 'academy'
            ? ENDPOINTS.LOGOUT_ACADEMY
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
  userType: 'teacher' | 'student' | 'secretary' | 'admin' | 'parent' | 'academy'
): Promise<AuthResponse> {
  const endpoint = userType === 'teacher' 
    ? ENDPOINTS.ME_TEACHER 
    : userType === 'student'
      ? ENDPOINTS.ME_STUDENT
      : userType === 'admin'
        ? ENDPOINTS.ME_ADMIN
        : userType === 'parent'
          ? ENDPOINTS.ME_PARENT
          : userType === 'academy'
            ? ENDPOINTS.ME_ACADEMY
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
 * Approve teacher (Admin only)
 */
export async function approveTeacher(id: string): Promise<any> {
  const res = await fetchApi(`/admin/teachers/${id}/approve`, {
    method: 'POST',
  });
  return res.teacher;
}

export async function enableIndependent(id: string): Promise<any> {
  return await fetchApi(`/admin/teachers/${id}/enable-independent`, {
    method: 'POST',
  });
}

export async function disableIndependent(id: string): Promise<any> {
  return await fetchApi(`/admin/teachers/${id}/disable-independent`, {
    method: 'POST',
  });
}

export async function addToAcademy(teacherId: string, academyId: string): Promise<any> {
  return await fetchApi(`/admin/teachers/${teacherId}/academies`, {
    method: 'POST',
    body: JSON.stringify({ academy_id: academyId }),
  });
}

export async function removeFromAcademy(teacherId: string, academyId: string): Promise<any> {
  return await fetchApi(`/admin/teachers/${teacherId}/academies/${academyId}`, {
    method: 'DELETE',
  });
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
export async function getTeacherDashboardStats(academyId?: string | null): Promise<any> {
  const params = academyId ? `?academy_id=${academyId}` : '';
  return await fetchApi(`${ENDPOINTS.TEACHER_DASHBOARD_STATS}${params}`);
}

/**
 * Get teacher's recent students
 */
export async function getTeacherRecentStudents(limit: number = 5, academyId?: string | null): Promise<any> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (academyId) params.append('academy_id', academyId);
  return await fetchApi(`${ENDPOINTS.TEACHER_DASHBOARD_STUDENTS}?${params}`);
}

/**
 * Get teacher's upcoming lectures
 */
export async function getTeacherUpcomingLectures(limit: number = 3): Promise<any> {
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
export async function getTeacherStudentStatistics(): Promise<any> {
  return await fetchApi('/teacher/students/statistics');
}

/**
 * Get all academies (Admin only)
 */
export async function getAcademies(
  page = 1,
  perPage = 10,
  filters?: { search?: string; status?: string }
): Promise<any> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.status && { status: filters.status }),
  });
  return await fetchApi(`/admin/academies?${queryParams}`);
}

/**
 * Create a new academy (Admin only)
 */
export async function createAcademy(data: any): Promise<any> {
  const res = await fetchApi('/admin/academies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.academy;
}

/**
 * Update academy (Admin only)
 */
export async function updateAcademy(id: string, data: any): Promise<any> {
  const res = await fetchApi(`/admin/academies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.academy;
}

/**
 * Get academy details (Admin only)
 */
export async function getAcademyDetails(id: string): Promise<any> {
  const res = await fetchApi(`/admin/academies/${id}`);
  return res.academy;
}

/**
 * Toggle academy status (activate/deactivate)
 */
export async function toggleAcademyStatus(id: string): Promise<any> {
  const res = await fetchApi(`/admin/academies/${id}/toggle-status`, {
    method: 'PUT',
  });
  return res;
}

/**
 * Get academy billing for a specific month (Admin only)
 */
export async function getAcademyBilling(academyId: string, month: string, year: string): Promise<any> {
  const res = await fetchApi(`/admin/academy-billings?academy_id=${academyId}&month=${month}&year=${year}`, {
    method: 'GET',
  });
  return res.billings;
}

/**
 * Generate academy billing (Admin only)
 */
export async function generateAcademyBilling(academyId: string, month: string, year: string): Promise<any> {
  const res = await fetchApi('/admin/academy-billings/generate', {
    method: 'POST',
    body: JSON.stringify({ academy_id: academyId, month, year }),
  });
  return res.billing;
}

/**
 * Update academy billing status (Admin only)
 */
export async function updateAcademyBillingStatus(billingId: string, status: string, notes?: string): Promise<any> {
  const res = await fetchApi(`/admin/academy-billings/${billingId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  });
  return res.billing;
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
  return { ...res.student, subscription_history: res.subscription_history };
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
  return { exam: res.exam, warning: res.warning };
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
  return { exam: res.exam, warning: res.warning };
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
 * Copy an exam
 */
export async function copyExam(id: string, title?: string): Promise<any> {
  const res = await fetchApi(`/teacher/exams/${id}/copy`, {
    method: 'POST',
    body: title ? JSON.stringify({ title }) : undefined,
  });
  return res.exam;
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
 * Get list of academies for report selection
 */
export async function getReportAcademies(): Promise<any[]> {
  return await fetchApi('/admin/reports/academies');
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
 * Get academy report data (JSON)
 */
export async function getAcademyReport(academyId: string, params: ReportParams): Promise<any> {
  const queryParams = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
  });
  return await fetchApi(`/admin/reports/academy/${academyId}?${queryParams}`);
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
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBaseUrl = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
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
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBaseUrl = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
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
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const cleanBaseUrl = API_BASE.replace(/\/api\/?$/, '').replace(/\/$/, '');
  
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
