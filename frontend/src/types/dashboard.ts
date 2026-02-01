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
  AdminDashboardStats,
  AdminTeacher,
  AdminAcademy,
  AdminStudent,
  SystemStats,
  Role,
} from './admin.types';

export type {
  BaseUser,
} from './auth.types';

// Legacy type aliases for backward compatibility
// These should be gradually replaced with imports from specific modules

/**
 * @deprecated Use BaseUser from auth.types instead
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
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

/**
 * @deprecated Use AdminTeacher from admin.types instead
 */
export interface Tenant {
  id: number;
  teacher_name: string;
  domain: string;
  database_name: string;
  created_at: string;
  status: 'active' | 'suspended';
  students_count: number;
  revenue: number;
}
