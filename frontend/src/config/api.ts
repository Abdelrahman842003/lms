export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const ENDPOINTS = {
  LOGIN_ADMIN: '/api/admin/login',
  LOGIN_TEACHER: '/api/login/teacher',
  LOGIN_STUDENT: '/api/login/student',
  LOGIN_SECRETARY: '/api/login/secretary',
  GRADES: '/teacher/grades', // Relative to axios base URL (/api)
  EXAMS: '/teacher/exams',
} as const;
