/**
 * Unified API Configuration
 * 
 * This file contains all API-related configuration and utilities in one place
 * to eliminate duplication and improve maintainability.
 */

// Environment-based API URL configuration
export const API_CONFIG = {
  // Main API base URL
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
  // Internal API URL (used for server-side requests)
  internalUrl: process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  
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
  return API_CONFIG.baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

// Helper to get API URL with /api suffix
export function getApiUrl(): string {
  const cleanUrl = getApiBaseUrl();
  return `${cleanUrl}/api`;
}

// All API endpoints in one place
export const API_ENDPOINTS = {
  // Authentication endpoints
  auth: {
    loginAdmin: '/api/admin/login',
    loginTeacher: '/api/login/teacher',
    loginStudent: '/api/login/student',
    loginSecretary: '/api/login/secretary',
    loginParent: '/api/login/parent',
    loginAcademy: '/api/academy/login',
    
    logoutAdmin: '/api/admin/logout',
    logoutTeacher: '/api/teacher/logout',
    logoutStudent: '/api/student/logout',
    logoutSecretary: '/api/secretary/logout',
    logoutParent: '/api/parent/logout',
    logoutAcademy: '/api/academy/logout',
    
    meAdmin: '/api/admin/me',
    meTeacher: '/api/teacher/me',
    meStudent: '/api/student/me',
    meSecretary: '/api/secretary/me',
    meParent: '/api/parent/me',
    meAcademy: '/api/academy/me',
    
    refreshToken: '/api/refresh-token',
    csrf: '/sanctum/csrf-cookie',
  },
  
  // Admin endpoints
  admin: {
    profile: '/api/admin/profile',
    changePassword: '/api/admin/change-password',
    dashboard: '/api/admin/dashboard',
    users: '/api/admin/users',
    academies: '/api/admin/academies',
    reports: '/api/admin/reports',
    settings: '/api/admin/settings',
  },
  
  // Teacher endpoints
  teacher: {
    dashboard: {
      stats: '/api/teacher/dashboard/stats',
      students: '/api/teacher/dashboard/students',
      lectures: '/api/teacher/dashboard/lectures',
      academies: '/api/teacher/dashboard/academies',
    },
    students: '/api/teacher/students',
    grades: '/api/teacher/grades',
    groups: '/api/teacher/groups',
    exams: '/api/teacher/exams',
    lectures: '/api/teacher/lectures',
    secretaries: '/api/teacher/secretaries',
    notifications: '/api/teacher/notifications',
    reports: '/api/teacher/reports',
    attendance: '/api/teacher/attendance',
    profile: '/api/teacher/profile',
  },
  
  // Student endpoints
  student: {
    dashboard: '/api/student/dashboard',
    teachers: '/api/student/teachers',
    exams: '/api/student/exams',
    lectures: '/api/student/lectures',
    grades: '/api/student/grades',
    attendance: '/api/student/attendance',
    notifications: '/api/student/notifications',
    profile: '/api/student/profile',
    leaderboard: '/api/student/leaderboard',
  },
  
  // Academy endpoints
  academy: {
    dashboard: '/api/academy/dashboard',
    teachers: '/api/academy/teachers',
    students: '/api/academy/students',
    billing: '/api/academy/billing',
    reports: '/api/academy/reports',
    settings: '/api/academy/settings',
    profile: '/api/academy/profile',
  },
  
  // Parent endpoints
  parent: {
    dashboard: '/api/parent/dashboard',
    children: '/api/parent/children',
    profile: '/api/parent/profile',
    notifications: '/api/parent/notifications',
  },
  
  // Public endpoints
  public: {
    settings: '/public-settings',
    maintenance: '/maintenance-status',
    health: '/health',
  },
  
  // File upload endpoints
  upload: {
    avatar: '/api/upload/avatar',
    document: '/api/upload/document',
    audio: '/api/upload/audio',
    image: '/api/upload/image',
  },
  
  // Notification endpoints
  notifications: {
    send: '/api/notifications/send',
    markRead: '/api/notifications/mark-read',
    getAll: '/api/notifications',
    subscribe: '/api/notifications/subscribe',
    unsubscribe: '/api/notifications/unsubscribe',
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

export default {
  API_CONFIG,
  API_ENDPOINTS,
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