// Authentication Types

/**
 * User type enum
 */
export type UserType = 'teacher' | 'student' | 'secretary' | 'parent' | 'academy';

/**
 * Base user interface
 */
export interface BaseUser {
  id: string | number;
  name: string;
  phone?: string;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  username?: string;
  parent_phone?: string;
  location?: string;
  gender?: string;
  education_type?: string;
  teachers?: any[];
  permissions?: string[];
  is_independent_active?: boolean;
  academies?: any[];
  trial_period_days?: number | null;
  effective_trial_period_days?: number;
}

/**
 * Teacher user
 */
export interface TeacherUser extends BaseUser {
  is_independent_active?: boolean;
  academies?: TeacherAcademy[];
  is_approved?: boolean;
  is_active?: boolean;
}

/**
 * Teacher's academy association
 */
export interface TeacherAcademy {
  id: string;
  name: string;
  logo?: string | null;
  is_active: boolean;
}

/**
 * Student user
 */
export interface StudentUser extends BaseUser {
  parent_phone?: string;
  location?: string;
  gender?: 'male' | 'female';
  education_type?: string;
  grade_id?: string;
  group_id?: string;
}

/**
 * Secretary user
 */
export interface SecretaryUser extends BaseUser {
  permissions?: string[];
  teacher_id?: string;
}

/**
 * Parent/Guardian user
 */
export interface ParentUser extends BaseUser {
  children?: ChildInfo[];
}

/**
 * Academy user (for direct academy login)
 */
export interface AcademyUser extends BaseUser {
  logo?: string | null;
  is_active: boolean;
}

/**
 * Child info for parent login
 */
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

/**
 * Teacher info for student login (enrolled teachers)
 */
export interface TeacherInfo {
  enrollment_id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  grade_name: string | null;
  group_name: string | null;
  balance: number;
  enrolled_at: string;
  status?: 'active' | 'grace_period' | 'trial' | 'expired' | 'inactive';
  days_left?: number;
  is_suspended?: boolean;
  is_teacher_suspended?: boolean;
  is_subscription_blocked?: boolean;
  academy_id?: string | null;
  academy_name?: string | null;
}

/**
 * Academy info
 */
export interface AcademyInfo {
  id: string | null;
  name: string;
  logo: string | null;
  is_active: boolean;
}

/**
 * Generic auth response
 */
export interface AuthResponse {
  token: string;
  refresh_token?: string;
  user: BaseUser;
  role: UserType;
  teachers?: TeacherInfo[];
  children?: ChildInfo[];
  parent_phone?: string;
  academies?: AcademyInfo[];
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  phone?: string;
  username?: string;
  password: string;
}

/**
 * Auth context state
 */
export interface AuthState {
  user: BaseUser | null;
  userType: UserType | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  teachers?: TeacherInfo[];
  children?: ChildInfo[];
  selectedTeacher?: TeacherInfo | null;
  selectedChild?: ChildInfo | null;
  selectedAcademy?: AcademyInfo | null;
  permissions?: string[];
}

/**
 * Stored auth data in localStorage
 */
export interface StoredAuthData {
  token: string;
  refreshToken?: string;
  user: BaseUser;
  userType: UserType;
  teachers?: TeacherInfo[];
  children?: ChildInfo[];
  selectedTeacher?: TeacherInfo;
  selectedChild?: ChildInfo;
  selectedAcademy?: AcademyInfo;
}
