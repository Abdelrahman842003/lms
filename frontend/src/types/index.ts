// Re-export all types from modules
export * from './api.types';
export * from './auth.types';
export * from './teacher.types';
export * from './student.types';
export * from './components.types';
export * from './academyReport.types';

// Legacy types for backward compatibility - prefer using specific type imports
// Example: import { AuthResponse } from '@/types/auth.types';

/**
 * @deprecated Use UserType from auth.types instead
 */
export type LegacyUserType = 'teacher' | 'student' | 'secretary' | 'parent' | 'academy';

/**
 * @deprecated Use BaseUser from auth.types instead
 */
export interface User {
    id: string | number
    name: string
    username?: string
    avatar?: string
    userType: 'teacher' | 'student' | 'secretary' | 'parent' | 'academy'
    createdAt: string
    updatedAt: string
    phone?: string
    parent_phone?: string
    location?: string
    gender?: string
    education_type?: string
    teachers?: TeacherInfo[]
    children?: ChildInfo[]
    permissions?: string[]
    is_independent_active?: boolean
    academies?: AcademyInfo[]
    trial_period_days?: number | null
    effective_trial_period_days?: number
    subject?: string
}

// Import for backward compatibility
import { TeacherInfo, AcademyInfo, ChildInfo } from './auth.types';

/**
 * @deprecated Use Grade from teacher.types instead
 */
export interface Teacher {
    id: number
    name: string
    created_at: string
    updated_at: string
}

/**
 * @deprecated Use StudentUser from auth.types instead
 */
export interface Student {
    id: number
    name: string
    created_at: string
    updated_at: string
}
