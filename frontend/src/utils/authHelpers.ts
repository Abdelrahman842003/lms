/**
 * Authentication Helper Functions
 * Utility functions for auth-related operations
 */

import type { User } from '@/types';
import type { TeacherInfo, ChildInfo, AcademyInfo } from '@/types/auth.types';
import { setAccessToken } from '@/lib/tokenManager';

/**
 * Storage keys constants
 */
export const AUTH_STORAGE_KEYS = {
  USER: 'user',
  USER_TYPE: 'userType',
  SELECTED_TEACHER: 'selectedTeacher',
  SELECTED_CHILD: 'selectedChild',
  SELECTED_ACADEMY: 'selectedAcademy',
  STUDENT_TEACHERS: 'studentTeachers',
  PARENT_CHILDREN: 'parentChildren',
} as const;

const LEGACY_TOKEN_STORAGE_KEYS = [
  'token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'auth_token',
] as const;

/**
 * Cookie names
 */
export const AUTH_COOKIES = {
  AUTH_STATE: 'auth_state',
  USER_ROLE: 'user_role',
} as const;

/**
 * Set auth cookie
 * Note: HttpOnly cannot be set from JavaScript. Sensitive cookies must be set by the server.
 */
export function setAuthCookie(name: string, value: string, maxAge: number = 2592000): void {
  if (typeof document === 'undefined') return;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secure = isHttps ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Clear auth cookie
 */
export function clearAuthCookie(name: string): void {
  if (typeof document === 'undefined') return;
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const secure = isHttps ? '; Secure' : '';
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}

/**
 * Clear all auth cookies
 */
export function clearAllAuthCookies(): void {
  clearAuthCookie(AUTH_COOKIES.AUTH_STATE);
  clearAuthCookie(AUTH_COOKIES.USER_ROLE);
}

function clearLegacyTokenStorage(): void {
  if (typeof window === 'undefined') return;

  LEGACY_TOKEN_STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuthStorage(): void {
  if (typeof localStorage === 'undefined') return;
  Object.values(AUTH_STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  clearLegacyTokenStorage();
}

/**
 * Get stored user from localStorage
 */
export function getStoredUser(): User | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store user in localStorage
 */
export function storeUser(user: User): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
}

/**
 * Get stored teacher selection
 */
export function getStoredTeacher(): TeacherInfo | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_TEACHER);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store selected teacher
 */
export function storeSelectedTeacher(teacher: TeacherInfo | null): void {
  if (typeof localStorage === 'undefined') return;
  if (teacher) {
    localStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_TEACHER, JSON.stringify(teacher));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SELECTED_TEACHER);
  }
}

/**
 * Get stored academy selection
 */
export function getStoredAcademy(): AcademyInfo | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_ACADEMY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store selected academy
 */
export function storeSelectedAcademy(academy: AcademyInfo | null): void {
  if (typeof localStorage === 'undefined') return;
  if (academy) {
    localStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_ACADEMY, JSON.stringify(academy));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SELECTED_ACADEMY);
  }
}

/**
 * Get stored children list (for parent)
 */
export function getStoredChildren(): ChildInfo[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.PARENT_CHILDREN);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Store children list
 */
export function storeChildren(children: ChildInfo[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.PARENT_CHILDREN, JSON.stringify(children));
}

/**
 * Get stored child selection
 */
export function getStoredChild(): ChildInfo | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.SELECTED_CHILD);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Store selected child
 */
export function storeSelectedChild(child: ChildInfo | null): void {
  if (typeof localStorage === 'undefined') return;
  if (child) {
    localStorage.setItem(AUTH_STORAGE_KEYS.SELECTED_CHILD, JSON.stringify(child));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEYS.SELECTED_CHILD);
  }
}

/**
 * Get stored user type
 */
export function getStoredUserType(): 'teacher' | 'student' | 'secretary' | 'academy' | 'parent' | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEYS.USER_TYPE) as ReturnType<typeof getStoredUserType>;
}

/**
 * Store user type
 */
export function storeUserType(userType: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEYS.USER_TYPE, userType);
}

/**
 * Store access token in memory only (secure)
 */
export function storeTokens(token: string, _refreshToken?: string): void {
  if (!token) return;
  void _refreshToken;
  clearLegacyTokenStorage();
  setAccessToken(token, 43200);
}

/**
 * Select best teacher for student based on status
 * Prioritizes: Active > Grace Period > None (filters out suspended)
 */
export function selectBestTeacher(teachers: TeacherInfo[]): TeacherInfo | null {
  const activeTeacher = teachers.find(
    (t) => t.status === 'active' && !t.is_suspended
  );
  const graceTeacher = teachers.find(
    (t) => t.status === 'grace_period' && !t.is_suspended
  );
  return activeTeacher || graceTeacher || null;
}

/**
 * Validate and update selected teacher from list
 * Returns updated teacher if still valid, or best available teacher
 */
export function validateSelectedTeacher(
  currentTeacher: TeacherInfo | null,
  teachers: TeacherInfo[]
): TeacherInfo | null {
  if (!currentTeacher) {
    return selectBestTeacher(teachers);
  }

  const updatedCurrent = teachers.find(
    (t) => t.teacher_id === currentTeacher.teacher_id
  );

  // If current teacher is still valid, keep it
  if (
    updatedCurrent &&
    (updatedCurrent.status === 'active' || updatedCurrent.status === 'grace_period') &&
    !updatedCurrent.is_suspended
  ) {
    return updatedCurrent;
  }

  // Otherwise, select best available
  return selectBestTeacher(teachers);
}

/**
 * Create User object from API response
 */
export function createUserFromResponse(response: {
  user: Record<string, unknown>;
  role: string;
  teachers?: TeacherInfo[];
  children?: ChildInfo[];
  academies?: AcademyInfo[];
  parent_phone?: string;
}): User {
  const user: User = {
    id: response.user.id as string | number,
    name: response.user.name as string,
    userType: response.role as User['userType'],
    createdAt: (response.user.created_at as string) || new Date().toISOString(),
    updatedAt: (response.user.updated_at as string) || new Date().toISOString(),
    avatar: response.user.avatar as string | undefined,
    phone: response.user.phone as string | undefined,
    parent_phone: (response.parent_phone || response.user.parent_phone) as string | undefined,
    location: response.user.location as string | undefined,
    gender: response.user.gender as string | undefined,
    education_type: response.user.education_type as string | undefined,
    teachers: (response.teachers || response.user.teachers) as TeacherInfo[] | undefined,
    permissions: response.user.permissions as string[] | undefined,
    is_independent_active: response.user.is_independent_active as boolean | undefined,
    academies: (response.academies || response.user.academies) as AcademyInfo[] | undefined,
  };
  
  if (response.user.username) {
    user.username = response.user.username as string;
  }
  
  return user;
}
