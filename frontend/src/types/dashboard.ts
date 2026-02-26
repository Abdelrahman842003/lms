// Dashboard Types and Interfaces
// Re-export from centralized type modules for backward compatibility

export type {
  StatCardProps,
  SidebarItem,
  TableColumn,
  TableAction,
  DataTableProps,
  ChartDataPoint,
  ChartCardProps,
} from './components.types';

export type {
  Grade,
  Lecture,
  Exam,
  Permission,
  PermissionGroup,
  Notification,
  TeacherStudent,
} from './teacher.types';

export type {
  WalletTransaction,
  AttendanceRecord,
} from './student.types';

export type {
  BaseUser,
} from './auth.types';

// Legacy type aliases for backward compatibility

/**
 * @deprecated Use BaseUser from auth.types instead
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  avatar?: string;
}

/**
 * @deprecated Use TeacherStudent from teacher.types instead
 */
export interface Student {
  id: number;
  name: string;
  email: string;
  joined_at: string;
  wallet_balance: number;
  attendance_rate: number;
  exam_average: number;
  is_active: boolean;
}
