/**
 * Authentication Service
 * Handles login, logout, and user authentication
 * Updated to use secure token management (httpOnly cookies + in-memory storage)
 */

import { fetchApi, ENDPOINTS } from '../api/baseApi';
import { setAccessToken, clearAccessToken } from '@/lib/tokenManager';
import type {
  AuthResponse,
  TeacherInfo,
  ChildInfo,
  AcademyInfo,
  UserType
} from '@/types/auth.types';

// Re-export types for backward compatibility
export type { AuthResponse, TeacherInfo, ChildInfo, AcademyInfo };

/**
 * Login as a teacher
 */
export async function loginTeacher(
  phone: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetchApi<AuthResponse>(ENDPOINTS.LOGIN_TEACHER, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true);

  // Store token in memory (secure)
  if (response.token) {
    setAccessToken(response.token, 60);
  }

  return response;
}

/**
 * Login as a student
 */
export async function loginStudent(
  phone: string,
  password: string
): Promise<AuthResponse> {
  const data = await fetchApi<{
    token: string;
    refresh_token?: string;
    user: AuthResponse['user'];
    role: UserType;
    teachers: TeacherInfo[];
  }>(ENDPOINTS.LOGIN_STUDENT, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true);

  // Store token in memory (secure)
  if (data.token) {
    setAccessToken(data.token, 60);
  }

  return {
    token: data.token,
    refresh_token: data.refresh_token,
    user: data.user,
    role: data.role,
    teachers: data.teachers,
  };
}

/**
 * Login as a secretary
 */
export async function loginSecretary(
  phone: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetchApi<AuthResponse>(ENDPOINTS.LOGIN_SECRETARY, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true);

  // Store token in memory (secure)
  if (response.token) {
    setAccessToken(response.token, 60);
  }

  return response;
}

/**
 * Login as a parent (guardian)
 */
export async function loginParent(
  phone: string,
  password: string
): Promise<AuthResponse> {
  const data = await fetchApi<{
    token: string;
    refresh_token?: string;
    user: { id: string; name?: string; phone?: string; avatar?: string };
    role: UserType;
    children: ChildInfo[];
    parent_phone: string;
  }>(ENDPOINTS.LOGIN_PARENT, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true);

  // Store token in memory (secure)
  if (data.token) {
    setAccessToken(data.token, 60);
  }

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
  const data = await fetchApi<{
    token: string;
    refresh_token?: string;
    user: AuthResponse['user'];
    role: UserType;
  }>(ENDPOINTS.LOGIN_ACADEMY, {
    method: 'POST',
    body: JSON.stringify({ phone, password }),
  }, true);

  // Store token in memory (secure)
  if (data.token) {
    setAccessToken(data.token, 60);
  }

  return {
    token: data.token,
    refresh_token: data.refresh_token,
    user: data.user,
    role: data.role,
  };
}

/**
 * Logout user
 */
export async function logout(
  userType: UserType,
  fcmToken?: string | null
): Promise<{ message: string }> {
  const endpointMap: Record<UserType, string> = {
    teacher: ENDPOINTS.LOGOUT_TEACHER,
    student: ENDPOINTS.LOGOUT_STUDENT,
    secretary: ENDPOINTS.LOGOUT_SECRETARY,
    parent: ENDPOINTS.LOGOUT_PARENT,
    academy: ENDPOINTS.LOGOUT_ACADEMY,
  };

  await fetchApi(endpointMap[userType], {
    method: 'POST',
    body: fcmToken ? JSON.stringify({ fcm_token: fcmToken }) : undefined,
  });

  // Clear token from memory (secure)
  clearAccessToken();

  return { message: 'تم تسجيل الخروج بنجاح' };
}

/**
 * Get current user data
 */
export async function getCurrentUser(
  userType: UserType
): Promise<AuthResponse> {
  const endpointMap: Record<UserType, string> = {
    teacher: ENDPOINTS.ME_TEACHER,
    student: ENDPOINTS.ME_STUDENT,
    secretary: ENDPOINTS.ME_SECRETARY,
    parent: ENDPOINTS.ME_PARENT,
    academy: ENDPOINTS.ME_ACADEMY,
  };

  return await fetchApi<AuthResponse>(endpointMap[userType], {
    method: 'GET',
  });
}

/**
 * Get enrolled teachers for student
 */
export async function getStudentTeachers(): Promise<TeacherInfo[]> {
  const data = await fetchApi<{ teachers: TeacherInfo[] }>(ENDPOINTS.STUDENT_TEACHERS);
  return data.teachers;
}

/**
 * Get teacher dashboard for student
 */
export async function getStudentTeacherDashboard(teacherId: string): Promise<unknown> {
  return await fetchApi(`${ENDPOINTS.STUDENT_TEACHER_DASHBOARD}/${teacherId}/dashboard`);
}

/**
 * Get teacher's academies
 */
export async function getTeacherAcademies(): Promise<{ academies: AcademyInfo[] }> {
  return await fetchApi(ENDPOINTS.TEACHER_DASHBOARD_ACADEMIES);
}

// Re-export base API utilities for convenience
export { fetchApi, getAuthHeaders, csrf } from '../api/baseApi';
