// Student Module Types
import { Grade, Group, Lecture, Exam, ExamQuestion } from './teacher.types';

/**
 * Student dashboard data
 */
export interface StudentDashboardData {
  teacher: {
    id: string;
    name: string;
    avatar: string | null;
  };
  balance: number;
  subscription_status: 'active' | 'grace_period' | 'expired' | 'inactive';
  subscription_ends_at: string | null;
  days_left: number | null;
  upcoming_lectures: StudentLecture[];
  recent_exams: StudentExamResult[];
}

/**
 * Student's view of lecture
 */
export interface StudentLecture extends Lecture {
  purchased: boolean;
  attended: boolean;
  can_purchase: boolean;
  attendance_qr_code?: string;
}

/**
 * Student exam with availability info
 */
export interface StudentExam extends Exam {
  status: 'available' | 'completed' | 'locked' | 'upcoming' | 'expired';
  can_attempt: boolean;
  attempts_remaining?: number;
  best_score?: number;
  last_attempt_at?: string;
}

/**
 * Student exam result
 */
export interface StudentExamResult {
  id: string;
  exam_id: string;
  exam: Exam;
  score: number;
  total_marks: number;
  percentage: number;
  passed: boolean;
  started_at: string;
  completed_at: string;
  time_spent_minutes: number;
  answers?: StudentAnswer[];
}

/**
 * Student's answer to exam question
 */
export interface StudentAnswer {
  question_id: string;
  question: ExamQuestion;
  answer: string;
  is_correct: boolean;
  marks_obtained: number;
}

/**
 * Exam attempt (in progress)
 */
export interface ExamAttempt {
  id: string;
  exam_id: string;
  exam: Exam;
  questions: ExamQuestion[];
  answers: Record<string, string>;
  started_at: string;
  time_remaining_seconds: number;
}

/**
 * Submit exam request
 */
export interface SubmitExamRequest {
  attempt_id: string;
  answers: Record<string, string>;
}

/**
 * Wallet balance info
 */
export interface WalletInfo {
  balance: number;
  pending_balance: number;
  total_deposited: number;
  total_spent: number;
}

/**
 * Wallet transaction
 */
export interface WalletTransaction {
  id: string;
  amount: number;
  type: 'deposit' | 'purchase' | 'refund' | 'subscription';
  reference_type?: 'lecture' | 'exam' | 'subscription';
  reference_id?: string;
  description: string;
  balance_after: number;
  created_at: string;
}

/**
 * Attendance record
 */
export interface AttendanceRecord {
  id: string;
  lecture_id: string;
  lecture: Lecture;
  scanned_at: string;
  method: 'qr_code' | 'manual';
}

/**
 * Student profile data
 */
export interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  parent_phone?: string;
  avatar?: string;
  gender?: 'male' | 'female';
  location?: string;
  education_type?: string;
  grade?: Grade;
  group?: Group;
  created_at: string;
}

/**
 * Update student profile request
 */
export interface UpdateProfileRequest {
  name?: string;
  parent_phone?: string;
  avatar?: string;
  location?: string;
}

/**
 * QR code scan result
 */
export interface QrScanResult {
  success: boolean;
  message: string;
  lecture?: Lecture;
  already_attended?: boolean;
}

/**
 * Purchase lecture request
 */
export interface PurchaseLectureRequest {
  lecture_id: string;
  use_wallet: boolean;
}

/**
 * Student notification preferences
 */
export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  sms_enabled: boolean;
  lecture_reminders: boolean;
  exam_reminders: boolean;
  payment_alerts: boolean;
}
