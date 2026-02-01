// UI Component Types
import React from 'react';

/**
 * Stat card props
 */
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

/**
 * Sidebar navigation item
 */
export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
  children?: SidebarItem[];
  permission?: string;
}

/**
 * Table column definition
 */
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

/**
 * Table action definition
 */
export interface TableAction<T = any> {
  label: string | ((row: T) => string);
  icon: string | ((row: T) => string);
  onClick: (row: T) => void;
  variant?: 'default' | 'danger' | 'success' | 'warning' | ((row: T) => 'default' | 'danger' | 'success' | 'warning');
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean;
}

/**
 * Data table props
 */
export interface DataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: TableAction<T>[];
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
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  mobileRenderer?: (row: T) => React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  emptyMessage?: string;
  emptyIcon?: string;
}

/**
 * Chart data point
 */
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

/**
 * Chart card props
 */
export interface ChartCardProps {
  title: string;
  icon?: string;
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'pie' | 'doughnut';
  height?: number;
}

/**
 * Modal props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

/**
 * Button variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'link';

/**
 * Button sizes
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Button props
 */
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

/**
 * Input props
 */
export interface InputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Select option
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Select props
 */
export interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

/**
 * Toast/Alert types
 */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast props
 */
export interface ToastProps {
  type: AlertType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

/**
 * Pagination props
 */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
}

/**
 * Dropdown menu item
 */
export interface DropdownMenuItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  divider?: boolean;
}

/**
 * Tab item
 */
export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  disabled?: boolean;
  content?: React.ReactNode;
}

/**
 * Tabs props
 */
export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'line' | 'pills' | 'enclosed';
}

/**
 * Breadcrumb item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: string;
}

/**
 * Loading state
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

/**
 * Form field error
 */
export interface FormFieldError {
  field: string;
  message: string;
}

/**
 * Confirmation dialog props
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}
