// Admin Module Types
import { TeacherUser, AcademyInfo } from './auth.types';

/**
 * Admin dashboard statistics
 */
export interface AdminDashboardStats {
  total_teachers: number;
  active_teachers: number;
  pending_teachers: number;
  suspended_teachers: number;
  total_students: number;
  total_academies: number;
  active_academies: number;
  total_revenue: number;
  monthly_revenue: number;
  database_size?: string;
}

/**
 * Teacher entity (admin view)
 */
export interface AdminTeacher extends TeacherUser {
  students_count: number;
  revenue: number;
  subscription_status: 'active' | 'expired' | 'pending';
  subscription_ends_at?: string;
  type: 'independent' | 'academy' | 'both';
  academies?: AdminTeacherAcademy[];
  last_login_at?: string;
  is_approved: boolean;
  is_active: boolean;
}

/**
 * Teacher's academy (admin view)
 */
export interface AdminTeacherAcademy {
  id: string;
  name: string;
  logo?: string;
  is_active: boolean;
  joined_at: string;
}

/**
 * Academy entity (admin view)
 */
export interface AdminAcademy extends AcademyInfo {
  phone: string;
  address?: string;
  teachers_count: number;
  students_count: number;
  revenue: number;
  plan_type?: 'trial' | 'fixed' | 'custom' | 'term';
  plan_expires_at?: string;
  subscription_status: 'active' | 'expired' | 'pending' | 'paid' | 'partial' | 'unpaid';
  subscription_ends_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Student entity (admin view)
 */
export interface AdminStudent {
  id: string;
  name: string;
  phone: string;
  parent_phone?: string;
  avatar?: string;
  teachers_count: number;
  total_spent: number;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

/**
 * Create teacher request
 */
export interface CreateTeacherRequest {
  name: string;
  phone: string;
  password: string;
  is_independent_active?: boolean;
  academy_ids?: string[];
}

/**
 * Update teacher request
 */
export interface UpdateTeacherRequest {
  name?: string;
  phone?: string;
  password?: string;
  is_independent_active?: boolean;
}

/**
 * Create academy request
 */
export interface CreateAcademyRequest {
  name: string;
  phone: string;
  password: string;
  logo?: string;
  address?: string;
}

/**
 * Update academy request
 */
export interface UpdateAcademyRequest {
  name?: string;
  phone?: string;
  password?: string;
  logo?: string;
  address?: string;
}

/**
 * Teacher subscription data
 */
export interface TeacherSubscription {
  id: string;
  teacher_id: string;
  month: string;
  year: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paid_at?: string;
  notes?: string;
  created_at: string;
}

/**
 * Academy subscription data (plan-based, not monthly billing)
 */
export interface AcademySubscription {
  id: string;
  academy_id: string;
  plan_type: 'trial' | 'term' | 'custom';
  plan_expires_at?: string;
  max_students?: number;
  is_unlimited_students: boolean;
  created_at: string;
}

/**
 * Update subscription request
 */
export interface UpdateSubscriptionRequest {
  amount?: number;
  status?: 'pending' | 'paid' | 'overdue';
  notes?: string;
}

/**
 * Admin report data
 */
export interface AdminReportData {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_teachers: number;
    new_teachers: number;
    total_students: number;
    new_students: number;
    total_academies: number;
    total_revenue: number;
  };
  revenue_breakdown: {
    teacher_subscriptions: number;
    academy_subscriptions: number;
    other: number;
  };
  top_teachers: {
    id: string;
    name: string;
    students_count: number;
    revenue: number;
  }[];
  top_academies: {
    id: string;
    name: string;
    teachers_count: number;
    revenue: number;
  }[];
  daily_stats: {
    date: string;
    new_teachers: number;
    new_students: number;
    revenue: number;
  }[];
}

/**
 * Academy report data
 */
export interface AcademyReportData {
  academy: AdminAcademy;
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_teachers: number;
    total_students: number;
    total_revenue: number;
    total_billing: number;
    paid_billing: number;
  };
  teachers: {
    id: string;
    name: string;
    students_count: number;
    revenue: number;
  }[];
  daily_stats: {
    date: string;
    students: number;
    revenue: number;
  }[];
}

/**
 * System statistics
 */
export interface SystemStats {
  total_tenants: number;
  active_tenants: number;
  total_students: number;
  total_revenue: number;
  database_size: string;
  server_status: 'healthy' | 'degraded' | 'down';
  last_backup_at?: string;
}

/**
 * Role entity
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  users_count: number;
  permissions_count: number;
  created_at: string;
}

/**
 * Student statistics
 */
export interface StudentStatistics {
  total: number;
  active: number;
  inactive: number;
  by_teacher: {
    teacher_id: string;
    teacher_name: string;
    count: number;
  }[];
  growth: {
    period: string;
    count: number;
  }[];
}
