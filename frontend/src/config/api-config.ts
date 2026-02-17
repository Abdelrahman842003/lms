/**
 * Unified API Configuration
 *
 * This file contains all API-related configuration and utilities in one place
 * to eliminate duplication and improve maintainability.
 *
 * API Versioning:
 * - All endpoints use /api/v1 prefix
 * - Version can be changed in one place for future updates
 */

// Environment-based API URL configuration
export const API_CONFIG = {
  // Main API base URL
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',

  // Internal API URL (used for server-side requests)
  internalUrl: process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',

  // API Version
  version: 'v1',

  // API timeout settings
  timeout: 30000, // 30 seconds

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000, // 1 second base delay
  },

  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  }
} as const;

// Helper to get clean base URL
export function getApiBaseUrl(): string {
  const baseUrl = API_CONFIG.baseUrl;
  
  // Handle empty or invalid base URL
  if (!baseUrl || baseUrl === '/api') {
    return 'http://localhost:8000';
  }
  
  // Strip trailing /api if present, then trailing slash
  return baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

// Helper to get API URL with /api suffix
export function getApiUrl(): string {
  const cleanUrl = getApiBaseUrl();
  return `${cleanUrl}/api`;
}

// Helper to get versioned API URL
export function getVersionedApiUrl(): string {
  const cleanUrl = getApiBaseUrl();
  return `${cleanUrl}/api/${API_CONFIG.version}`;
}

// All API endpoints in one place (using v1 prefix)
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    loginAdmin: '/api/v1/admin/login',
    loginTeacher: '/api/v1/teacher/login',
    loginStudent: '/api/v1/student/login',
    loginSecretary: '/api/v1/login/secretary',
    loginParent: '/api/v1/parent/login',
    loginAcademy: '/api/v1/academy/login',

    logoutAdmin: '/api/v1/admin/logout',
    logoutTeacher: '/api/v1/teacher/logout',
    logoutStudent: '/api/v1/student/logout',
    logoutSecretary: '/api/v1/secretary/logout',
    logoutParent: '/api/v1/parent/logout',
    logoutAcademy: '/api/v1/academy/logout',

    meAdmin: '/api/v1/admin/me',
    meTeacher: '/api/v1/teacher/me',
    meStudent: '/api/v1/student/me',
    meSecretary: '/api/v1/secretary/me',
    meParent: '/api/v1/parent/me',
    meAcademy: '/api/v1/academy/me',

    refreshToken: '/api/v1/auth/refresh',
    csrf: '/sanctum/csrf-cookie',
  },

  // Admin endpoints
  admin: {
    profile: '/api/v1/admin/profile',
    changePassword: '/api/v1/admin/change-password',
    dashboard: '/api/v1/admin/dashboard',
    users: '/api/v1/admin/users',
    academies: '/api/v1/admin/academies',
    reports: '/api/v1/admin/reports',
    settings: '/api/v1/admin/settings',
  },

  // Teacher endpoints
  teacher: {
    dashboard: {
      stats: '/api/v1/teacher/dashboard/stats',
      students: '/api/v1/teacher/dashboard/students',
      lectures: '/api/v1/teacher/dashboard/lectures',
      academies: '/api/v1/teacher/dashboard/academies',
    },
    students: '/api/v1/teacher/students',
    grades: '/api/v1/teacher/grades',
    groups: '/api/v1/teacher/groups',
    exams: '/api/v1/teacher/exams',
    lectures: '/api/v1/teacher/lectures',
    secretaries: '/api/v1/teacher/secretaries',
    notifications: '/api/v1/teacher/notifications',
    reports: '/api/v1/teacher/reports',
    attendance: '/api/v1/teacher/attendance',
    profile: '/api/v1/teacher/profile',
  },

  // Student endpoints
  student: {
    dashboard: '/api/v1/student/dashboard',
    teachers: '/api/v1/student/teachers',
    exams: '/api/v1/student/exams',
    lectures: '/api/v1/student/lectures',
    grades: '/api/v1/student/grades',
    attendance: '/api/v1/student/attendance',
    notifications: '/api/v1/student/notifications',
    profile: '/api/v1/student/profile',
    leaderboard: '/api/v1/student/leaderboard',
  },

  // Academy endpoints
  academy: {
    dashboard: '/api/v1/academy/dashboard',
    teachers: '/api/v1/academy/teachers',
    students: '/api/v1/academy/students',
    billing: '/api/v1/academy/billing',
    reports: '/api/v1/academy/reports',
    settings: '/api/v1/academy/settings',
    profile: '/api/v1/academy/profile',
  },

  // Parent endpoints
  parent: {
    dashboard: '/api/v1/parent/dashboard',
    children: '/api/v1/parent/children',
    profile: '/api/v1/parent/profile',
    notifications: '/api/v1/parent/notifications',
  },

  // Public endpoints (outside versioning)
  public: {
    settings: '/api/v1/public-settings',
    maintenance: '/api/v1/maintenance-status',
    health: '/api/v1/health',
  },

  // File upload endpoints
  upload: {
    avatar: '/api/v1/avatar/upload',
    document: '/api/v1/upload/document',
    audio: '/api/v1/upload/audio',
    image: '/api/v1/upload/image',
  },

  // Notification endpoints
  notifications: {
    send: '/api/v1/notifications/send',
    markRead: '/api/v1/notifications/mark-read',
    getAll: '/api/v1/notifications',
    subscribe: '/api/v1/notifications/subscribe',
    unsubscribe: '/api/v1/notifications/unsubscribe',
  }
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

// HTTP Status Codes with Arabic error messages
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Default Arabic error messages for HTTP status codes
export const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.BAD_REQUEST]: 'طلب غير صالح',
  [HTTP_STATUS.UNAUTHORIZED]: 'غير مصرح لك بالدخول. يرجى تسجيل الدخول.',
  [HTTP_STATUS.FORBIDDEN]: 'غير مصرح لك بهذا الإجراء',
  [HTTP_STATUS.NOT_FOUND]: 'العنصر المطلوب غير موجود',
  [HTTP_STATUS.METHOD_NOT_ALLOWED]: 'طريقة الطلب غير مسموحة',
  [HTTP_STATUS.CONFLICT]: 'تضارب في البيانات',
  [HTTP_STATUS.UNPROCESSABLE_ENTITY]: 'البيانات المدخلة غير صالحة',
  [HTTP_STATUS.TOO_MANY_REQUESTS]: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار.',
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.',
  419: 'انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة.',
};

// Content Types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
} as const;

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': CONTENT_TYPES.JSON,
  'Accept': CONTENT_TYPES.JSON,
} as const;

// Request configuration interface
export interface RequestConfig {
  method?: string;
  headers?: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
  retries?: number;
  cache?: RequestCache;
  credentials?: RequestCredentials;
}

// API Response interface
export interface ApiResponse<T = any> {
  status: boolean;
  status_code: number;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

// Error response interface
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  data?: Record<string, unknown>;
}

// Utility function to get error message
export function getErrorMessage(status: number, defaultMessage?: string): string {
  return DEFAULT_ERROR_MESSAGES[status] || defaultMessage || 'حدث خطأ غير متوقع';
}

// Utility to build query string
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
}

// Utility to build full URL with query params
export function buildUrl(endpoint: string, params?: Record<string, any>): string {
  const baseUrl = endpoint.startsWith('/api') ? getApiBaseUrl() : '';
  const fullUrl = `${baseUrl}${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    const queryString = buildQueryString(params);
    return `${fullUrl}?${queryString}`;
  }
  
  return fullUrl;
}

// Validate API response structure
export function isValidApiResponse(response: any): response is ApiResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    'status_code' in response &&
    'message' in response
  );
}

// Helper to extract data from API response
export function extractApiData<T>(response: any): T {
  if (isValidApiResponse(response)) {
    return response.data;
  }
  
  return response as T;
}

// Flat endpoint references for backward compatibility
export const FLAT_ENDPOINTS = {
  // Auth endpoints
  LOGIN_ADMIN: API_ENDPOINTS.auth.loginAdmin,
  LOGIN_TEACHER: API_ENDPOINTS.auth.loginTeacher,
  LOGIN_STUDENT: API_ENDPOINTS.auth.loginStudent,
  LOGIN_SECRETARY: API_ENDPOINTS.auth.loginSecretary,
  LOGIN_PARENT: API_ENDPOINTS.auth.loginParent,
  LOGIN_ACADEMY: API_ENDPOINTS.auth.loginAcademy,
  
  LOGOUT_ADMIN: API_ENDPOINTS.auth.logoutAdmin,
  LOGOUT_TEACHER: API_ENDPOINTS.auth.logoutTeacher,
  LOGOUT_STUDENT: API_ENDPOINTS.auth.logoutStudent,
  LOGOUT_SECRETARY: API_ENDPOINTS.auth.logoutSecretary,
  LOGOUT_PARENT: API_ENDPOINTS.auth.logoutParent,
  LOGOUT_ACADEMY: API_ENDPOINTS.auth.logoutAcademy,
  
  ME_ADMIN: API_ENDPOINTS.auth.meAdmin,
  ME_TEACHER: API_ENDPOINTS.auth.meTeacher,
  ME_STUDENT: API_ENDPOINTS.auth.meStudent,
  ME_SECRETARY: API_ENDPOINTS.auth.meSecretary,
  ME_PARENT: API_ENDPOINTS.auth.meParent,
  ME_ACADEMY: API_ENDPOINTS.auth.meAcademy,
  
  // Teacher dashboard endpoints
  TEACHER_DASHBOARD_ACADEMIES: API_ENDPOINTS.teacher.dashboard.academies,
  TEACHER_DASHBOARD_STATS: API_ENDPOINTS.teacher.dashboard.stats,
  TEACHER_DASHBOARD_STUDENTS: API_ENDPOINTS.teacher.dashboard.students,
  TEACHER_DASHBOARD_LECTURES: API_ENDPOINTS.teacher.dashboard.lectures,
  
  // Student endpoints
  STUDENT_TEACHERS: API_ENDPOINTS.student.teachers,
  STUDENT_TEACHER_DASHBOARD: '/api/student/teacher', // Manual endpoint
} as const;

export default {
  API_CONFIG,
  API_ENDPOINTS,
  FLAT_ENDPOINTS,
  HTTP_METHODS,
  HTTP_STATUS,
  DEFAULT_ERROR_MESSAGES,
  CONTENT_TYPES,
  DEFAULT_HEADERS,
  getApiBaseUrl,
  getApiUrl,
  getErrorMessage,
  buildQueryString,
  buildUrl,
  isValidApiResponse,
  extractApiData,
};
