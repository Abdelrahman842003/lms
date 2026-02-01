// API Response Types

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T> {
  status: boolean;
  status_code: number;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

/**
 * API Error structure
 */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  data?: {
    attempts_remaining?: number;
    retry_after?: number;
    [key: string]: unknown;
  };
}

/**
 * Report parameters
 */
export interface ReportParams {
  start_date: string;
  end_date: string;
}

/**
 * Common filter parameters
 */
export interface BaseFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface DateRangeFilters extends BaseFilters {
  date_from?: string;
  date_to?: string;
}

export interface StatusFilters extends BaseFilters {
  status?: string;
}

/**
 * Teacher list filters
 */
export interface TeacherFilters extends DateRangeFilters, StatusFilters {
  type?: string;
  payment_status?: string;
}

/**
 * Student list filters
 */
export interface StudentFilters extends DateRangeFilters, StatusFilters {}

/**
 * Academy list filters
 */
export interface AcademyFilters extends StatusFilters {}

/**
 * Exam list filters
 */
export interface ExamFilters extends DateRangeFilters {}
