// Dashboard Types and Interfaces

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  avatar?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number | React.ReactNode;
  icon: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  prefix?: string;
  suffix?: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  children?: SidebarItem[];
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: any, index: number) => React.ReactNode;
}

export interface TableAction {
  label: string | ((row: any) => string);
  icon: string | ((row: any) => string);
  onClick: (row: any) => void;
  variant?: 'default' | 'danger' | 'success' | 'warning' | ((row: any) => 'default' | 'danger' | 'success' | 'warning');
  hidden?: (row: any) => boolean;
}

export interface DataTableProps {
  columns: TableColumn[];
  data: any[];
  actions?: TableAction[];
  searchable?: boolean;
  pagination?: boolean;
  itemsPerPage?: number;
  isLoading?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (query: string) => void;
  totalItems?: number;
  headerActions?: React.ReactNode;
  rowClassName?: (row: any) => string;
  onRowClick?: (row: any) => void;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartCardProps {
  title: string;
  icon?: string;
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'pie';
}

// Student specific types
export interface Lecture {
  id: number;
  title: string;
  price: number;
  starts_at: string;
  purchased: boolean;
  attended?: boolean;
  qr_code_url?: string;
  qr_code_expires_at?: string;
}

export interface WalletTransaction {
  id: number;
  amount: number;
  type: 'deposit' | 'purchase' | 'refund';
  reference_id?: string;
  created_at: string;
  description: string;
}

export interface Exam {
  id: number;
  title: string;
  lecture_id: number;
  duration: number;
  total_marks: number;
  status: 'available' | 'completed' | 'locked';
  score?: number;
  attempted_at?: string;
}

// Teacher specific types
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

export interface AttendanceRecord {
  id: number;
  user_id: number;
  lecture_id: number;
  scanned_at: string;
  ip_address: string;
}

// Admin specific types
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

export interface SystemStats {
  total_tenants: number;
  active_tenants: number;
  total_students: number;
  total_revenue: number;
  database_size: string;
}

// User Management Types
export interface Role {
  id: number;
  name: string;
  description: string;
  users_count: number;
  created_at: string;
  permissions_count?: number;
}

export interface Permission {
  id: number;
  name: string;
  slug: string;
  module: string;
  description?: string;
}

export interface PermissionGroup {
  module: string;
  permissions: Permission[];
}

export interface Notification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: string;
  data: {
    title: string;
    message: string;
    sender_name?: string;
    sender_role?: string;
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}
