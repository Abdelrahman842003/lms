// Teacher Module Types
import { StudentUser } from './auth.types';

/**
 * Teacher dashboard statistics
 */
export interface TeacherDashboardStats {
  total_students: number;
  active_students: number;
  total_lectures: number;
  total_exams: number;
  total_revenue: number;
  pending_students: number;
  expired_students: number;
  today_attendance: number;
}

/**
 * Grade entity
 */
export interface Grade {
  id: string;
  name: string;
  description?: string;
  order?: number;
  students_count?: number;
  groups_count?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Group entity
 */
export interface Group {
  id: string;
  name: string;
  grade_id: string;
  grade?: Grade;
  description?: string;
  max_students?: number;
  students_count?: number;
  schedule?: GroupSchedule[];
  created_at: string;
  updated_at: string;
}

/**
 * Group schedule
 */
export interface GroupSchedule {
  day: 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  start_time: string;
  end_time: string;
}

/**
 * Lecture entity
 */
export interface Lecture {
  id: string;
  title: string;
  description?: string;
  grade_id: string;
  grade?: Grade;
  group_id?: string;
  group?: Group;
  price: number;
  starts_at: string;
  ends_at?: string;
  duration_minutes?: number;
  is_free: boolean;
  is_active: boolean;
  attendance_count?: number;
  qr_code_url?: string;
  qr_code_expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Exam entity
 */
export interface Exam {
  id: string;
  title: string;
  description?: string;
  lecture_id?: string;
  lecture?: Lecture;
  grade_id: string;
  grade?: Grade;
  group_id?: string;
  group?: Group;
  duration_minutes: number;
  total_marks: number;
  passing_marks?: number;
  is_active: boolean;
  shuffle_questions: boolean;
  shuffle_answers: boolean;
  show_results: boolean;
  allow_review: boolean;
  starts_at?: string;
  ends_at?: string;
  questions_count?: number;
  attempts_count?: number;
  average_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Question types
 */
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

/**
 * Exam question
 */
export interface ExamQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  marks: number;
  order: number;
  options?: QuestionOption[];
  correct_answer?: string;
  explanation?: string;
  image_url?: string;
}

/**
 * Question option (for multiple choice)
 */
export interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
  order: number;
}

/**
 * Secretary entity
 */
export interface Secretary {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  is_active: boolean;
  permissions: string[];
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Teacher's student (enrolled student)
 */
export interface TeacherStudent extends StudentUser {
  enrollment_id: string;
  grade?: Grade;
  group?: Group;
  balance: number;
  subscription_status: 'active' | 'grace_period' | 'expired' | 'inactive';
  subscription_ends_at?: string;
  days_left?: number;
  is_suspended: boolean;
  attendance_rate?: number;
  exam_average?: number;
  last_payment_at?: string;
  enrolled_at: string;
  permissions?: string[];
}

/**
 * Create student request
 */
export interface CreateStudentRequest {
  name: string;
  phone: string;
  password: string;
  parent_phone?: string;
  grade_id: string;
  group_id?: string;
  gender?: 'male' | 'female';
  location?: string;
}

/**
 * Update student request
 */
export interface UpdateStudentRequest {
  name?: string;
  phone?: string;
  password?: string;
  parent_phone?: string;
  grade_id?: string;
  group_id?: string;
  gender?: 'male' | 'female';
  location?: string;
}

/**
 * Create grade request
 */
export interface CreateGradeRequest {
  name: string;
  description?: string;
  order?: number;
}

/**
 * Create group request
 */
export interface CreateGroupRequest {
  name: string;
  grade_id: string;
  description?: string;
  max_students?: number;
  schedule?: GroupSchedule[];
}

/**
 * Create lecture request
 */
export interface CreateLectureRequest {
  title: string;
  description?: string;
  grade_id: string;
  group_id?: string;
  price: number;
  starts_at: string;
  duration_minutes?: number;
  is_free?: boolean;
}

/**
 * Create exam request
 */
export interface CreateExamRequest {
  title: string;
  description?: string;
  lecture_id?: string;
  grade_id: string;
  group_id?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks?: number;
  shuffle_questions?: boolean;
  shuffle_answers?: boolean;
  show_results?: boolean;
  allow_review?: boolean;
  starts_at?: string;
  ends_at?: string;
  questions?: CreateQuestionRequest[];
}

/**
 * Create question request
 */
export interface CreateQuestionRequest {
  question_text: string;
  question_type: QuestionType;
  marks: number;
  order?: number;
  options?: { text: string; is_correct: boolean }[];
  correct_answer?: string;
  explanation?: string;
}

/**
 * Create secretary request
 */
export interface CreateSecretaryRequest {
  name: string;
  phone: string;
  password: string;
  permissions: string[];
}

/**
 * Payment creation request
 */
export interface CreatePaymentRequest {
  student_id: string;
  months: number;
  discount: number;
  notes?: string;
  client_side_uuid: string;
  start_date?: string;
}

/**
 * Student activation details
 */
export interface StudentActivationDetails {
  student: TeacherStudent;
  pricing: {
    monthly_price: number;
    academy_price?: number;
    independent_price?: number;
  };
  subscription_history: SubscriptionHistory[];
  payment_logs: PaymentLog[];
}

/**
 * Subscription history entry
 */
export interface SubscriptionHistory {
  id: string;
  starts_at: string;
  ends_at: string;
  months: number;
  amount: number;
  discount: number;
  status: 'active' | 'expired';
  created_at: string;
}

/**
 * Payment log entry
 */
export interface PaymentLog {
  id: string;
  amount: number;
  type: 'subscription' | 'lecture' | 'exam' | 'refund';
  description: string;
  created_at: string;
}

/**
 * Notification entity
 */
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

/**
 * Send notification request
 */
export interface SendNotificationRequest {
  title: string;
  message: string;
  target_type: 'all' | 'grade' | 'group' | 'students';
  target_ids?: string[];
  grade_id?: string;
  group_id?: string;
}

/**
 * Permission entity
 */
export interface Permission {
  id: string;
  name: string;
  slug: string;
  module: string;
  description?: string;
}

/**
 * Permission group
 */
export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

/**
 * Teacher report data with subscription_fee
 */
export interface TeacherReportData {
  teacher?: {
    id: string;
    name: string;
    phone: string;
    joined: string;
    status: string;
  };
  period: {
    start: string;
    end: string;
    duration_months: number;
  };
  summary: {
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
    // Legacy fields for backward compatibility
    new_students?: number;
    expired_students?: number;
    total_revenue?: number;
    total_lectures?: number;
    total_exams?: number;
  };
  revenue_breakdown?: {
    subscriptions: number;
    lectures: number;
    other: number;
  };
  financial_details: {
    total_revenue: number;
    total_confirmed_payments: number;
    subscription_fee: number;
    total_paid_to_platform: number;
    remaining_balance: number;
    price_per_student: number;
  };
  monthly_breakdown: Array<{
    month: string;
    month_name: string;
    new_enrollments: number;
    confirmed_payments: number;
  }>;
  subscription_breakdown: Array<{
    month: string;
    month_name: string;
    student_count: number;
    amount_due: number;
    amount_paid: number;
    amount_remaining: number;
    status: 'pending' | 'paid' | 'partial';
    status_label: string;
  }>;
  generated_at: string;
}

/**
 * Legacy Teacher report data (for backward compatibility)
 */
export interface LegacyTeacherReportData {
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_students: number;
    new_students: number;
    expired_students: number;
    total_revenue: number;
    total_lectures: number;
    total_exams: number;
  };
  revenue_breakdown: {
    subscriptions: number;
    lectures: number;
    other: number;
  };
  daily_stats: {
    date: string;
    students: number;
    revenue: number;
    attendance: number;
  }[];
}
