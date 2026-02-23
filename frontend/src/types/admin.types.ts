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
  subscription_fee?: number; // السعر المدفوع للمنصة
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
  subscription_fee?: number; // السعر المدفوع للمنصة
  plan_max_students?: number;
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
  subscription_fee?: number; // السعر المدفوع للمنصة
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
 * Report Period
 */
export interface ReportPeriod {
  start: string;
  end: string;
  duration_months: number;
}

/**
 * Teacher Report Summary with subscription_fee
 */
export interface TeacherReportSummary {
  total_students: number;
  active_students: number;
  new_enrollments: number;
  total_secretaries: number;
  subscription_fee: number; // السعر المدفوع للمنصة (Primary metric)
  confirmed_payments: number;
  pending_payments: number;
  paying_students_count: number;
  not_paying_students_count: number;
  price_per_student: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
}

/**
 * Academy Report Summary with subscription_fee
 */
export interface AcademyReportSummary {
  total_teachers: number;
  active_teachers: number;
  total_academy_students: number;
  total_enrollments: number;
  active_enrollments: number;
  total_subscriptions: number;
  total_payment_transactions: number;
  subscription_fee: number; // السعر المدفوع للمنصة (Primary metric)
  confirmed_payments: number;
  remaining_balance: number;
  payment_status: 'paid' | 'partial' | 'unpaid';
  price_per_student: number;
}

/**
 * Admin Report Summary with subscription_fee
 */
export interface AdminReportSummary {
  total_academies: number;
  independent_teachers_count: number;
  total_teachers: number;
  active_teachers: number;
  suspended_teachers: number;
  new_teachers: number;
  total_students: number;
  new_students: number;
  total_secretaries: number;
  total_enrollments: number;
  active_enrollments: number;
  new_enrollments: number;
  total_subscriptions: number;
  academy_subscriptions: number;
  independent_subscriptions: number;
  total_subscription_fees: number; // Total from all sources
  confirmed_payments: number;
  independent_commission: number;
  academy_platform_share: number;
  net_platform_profit: number;
  price_per_student: number;
  academy_student_price: number;
}

/**
 * Financial Details
 */
export interface FinancialDetails {
  total_revenue: number;
  total_confirmed_payments: number;
  subscription_fee: number;
  total_paid_to_platform: number;
  remaining_balance: number;
  price_per_student: number;
}

/**
 * Monthly Breakdown Item
 */
export interface MonthlyBreakdownItem {
  month: string;
  month_name: string;
  new_enrollments: number;
  confirmed_payments: number;
}

/**
 * Subscription Breakdown Item
 */
export interface SubscriptionBreakdownItem {
  month: string;
  month_name: string;
  student_count: number;
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  status: 'pending' | 'paid' | 'partial';
  status_label: string;
}

/**
 * Teacher Info for reports
 */
export interface TeacherInfo {
  id: string;
  name: string;
  phone: string;
  joined: string;
  status: string;
  total_secretaries?: number;
  subscription_start_date?: string;
  last_payment_date?: string;
  subscription_expiry?: string;
  has_subscription?: boolean;
  amount_due?: number;
  paid_amount?: number;
  plan_type?: string;
  plan_max_students?: number;
  is_unlimited_students?: boolean;
  days_remaining?: number | null;
  payment_percentage?: number;
  plan_duration_months?: number;
  member_since_days?: number;
}

/**
 * Academy Info for reports
 */
export interface ReportAcademyInfo {
  id: string;
  name: string;
  phone: string;
  joined: string;
  status: string;
  total_teachers?: number;
  active_teachers?: number;
  has_subscription?: boolean;
  subscription_expiry?: string;
  amount_due?: number;
  paid_amount?: number;
  plan_type?: string;
  plan_max_students?: number;
  is_unlimited_students?: boolean;
  days_remaining?: number | null;
  payment_percentage?: number;
  plan_duration_months?: number;
  member_since_days?: number;
}

/**
 * Teacher Breakdown Item for admin reports
 */
export interface TeacherBreakdownItem {
  id: string;
  name: string;
  status: string;
  total_students: number;
  active_students: number;
  secretaries: number;
  subscriptions: number;
  subscription_fee: number;
  revenue: number;
  paid: number;
  joined: string;
}

/**
 * Teacher Report Data
 */
export interface TeacherReportData {
  teacher: TeacherInfo;
  period: ReportPeriod;
  summary: TeacherReportSummary;
  financial_details: FinancialDetails;
  monthly_breakdown: MonthlyBreakdownItem[];
  subscription_breakdown: SubscriptionBreakdownItem[];
  generated_at: string;
}

/**
 * Academy Report Data
 */
export interface AcademyReportData {
  academy: ReportAcademyInfo;
  period: ReportPeriod;
  summary: AcademyReportSummary;
  monthly_breakdown: MonthlyBreakdownItem[];
  generated_at: string;
}

/**
 * Admin Report Data with subscription_fee
 */
export interface AdminReportData {
  period: ReportPeriod;
  summary: AdminReportSummary;
  teachers_breakdown: TeacherBreakdownItem[];
  monthly_breakdown: MonthlyBreakdownItem[];
  generated_at: string;
}

/**
 * Teacher List Item
 */
export interface TeacherListItem {
  id: string;
  name: string;
  phone: string;
  status: string;
  students_count: number;
  secretaries_count: number;
  joined: string;
  subscription_fee: number;
}

/**
 * Academy List Item
 */
export interface AcademyListItem {
  id: string;
  name: string;
  phone: string;
  status: string;
  teachers_count: number;
  students_count: number;
  joined: string;
  subscription_fee: number;
  plan_max_students?: number;
  plan_expires_at?: string;
}

/**
 * Report Params
 */
export interface ReportParams {
  start_date: string;
  end_date: string;
}

/**
 * Generate Report Request
 */
export interface GenerateReportRequest {
  report_type: 'admin' | 'teacher' | 'academy';
  teacher_id?: string;
  academy_id?: string;
  period_preset: 'last_month' | 'last_3_months' | 'last_6_months' | 'last_year' | 'custom';
  start_date?: string;
  end_date?: string;
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
