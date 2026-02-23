/**
 * Report Service
 * Handles all report-related API calls with Zod validation and error handling
 * Aligned with DTOs and subscription_fee system per SUBSCRIPTION_SYSTEM_CHANGES.md
 */

import { fetchApi, getAuthHeaders } from '../api/baseApi';
import { getApiBaseUrl } from '@/config/api-config';
import type {
  TeacherListItem,
  AcademyListItem,
  TeacherReportData,
  AcademyReportData,
  AdminReportData,
  GenerateReportRequest,
} from '@/types/admin.types';
import type { ReportParams } from '@/types/api.types';
import {
  TeachersListResponseSchema,
  AcademiesListResponseSchema,
  TeacherReportResponseSchema,
  AcademyReportResponseSchema,
  AdminReportResponseSchema,
  GenerateReportRequestSchema,
  type PeriodPreset,
  type ReportType,
} from '@/schemas/report.schema';

// ============================================
// Error Types
// ============================================

export class ReportError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public validationErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ReportError';
  }
}

// ============================================
// List Fetching
// ============================================

/**
 * Get list of teachers for report selection
 * Returns teachers with subscription_fee information
 */
export async function getReportTeachers(): Promise<TeacherListItem[]> {
  try {
    interface ListResponse {
      teachers: TeacherListItem[];
      count: number;
    }
    
    const response = await fetchApi<ListResponse>('/admin/reports/teachers');

    // Validate response with Zod
    const validated = TeachersListResponseSchema.safeParse(response);
    if (!validated.success) {
      console.warn('Teachers list validation warning:', validated.error);
      return response.teachers;
    }

    return validated.data.teachers;
  } catch (error) {
    console.error('Failed to fetch teachers list:', error);
    throw handleReportError(error, 'TEACHERS_FETCH_ERROR');
  }
}

/**
 * Get list of academies for report selection
 * Returns academies with subscription_fee information
 */
export async function getReportAcademies(): Promise<AcademyListItem[]> {
  try {
    interface ListResponse {
      academies: AcademyListItem[];
      count: number;
    }
    const response = await fetchApi<ListResponse>('/admin/reports/academies');

    // Validate response with Zod
    const validated = AcademiesListResponseSchema.safeParse(response);
    if (!validated.success) {
      console.warn('Academies list validation warning:', validated.error);
      return response.academies;
    }

    return validated.data.academies;
  } catch (error) {
    console.error('Failed to fetch academies list:', error);
    throw handleReportError(error, 'ACADEMIES_FETCH_ERROR');
  }
}

// ============================================
// Report Generation (Unified Endpoint)
// ============================================

/**
 * Generate report using the unified endpoint
 * Supports admin, teacher, and academy reports
 */
export async function generateReport(
  request: GenerateReportRequest
): Promise<TeacherReportData | AcademyReportData | AdminReportData> {
  // Validate request with Zod
  const validatedRequest = GenerateReportRequestSchema.safeParse(request);
  if (!validatedRequest.success) {
    const errors = validatedRequest.error.flatten().fieldErrors;
    throw new ReportError(
      'بيانات التقرير غير صحيحة',
      'VALIDATION_ERROR',
      400,
      errors as Record<string, string[]>
    );
  }

  try {
    const response = await fetchApi('/admin/reports/generate', {
      method: 'POST',
      body: JSON.stringify(validatedRequest.data),
    });

    // Validate response based on report type
    return validateReportResponse(response, request.report_type);
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw handleReportError(error, 'REPORT_GENERATION_ERROR');
  }
}

// ============================================
// Legacy Individual Report Endpoints (Backward Compatibility)
// ============================================

/**
 * Get teacher report data (Legacy endpoint)
 */
export async function getTeacherReport(
  teacherId: string,
  params: ReportParams
): Promise<TeacherReportData> {
  try {
    const queryParams = new URLSearchParams({
      period_preset: 'custom',
      start_date: params.start_date,
      end_date: params.end_date,
    });

    const response = await fetchApi(`/admin/reports/teacher/${teacherId}?${queryParams}`);

    // Validate response with Zod
    const validated = TeacherReportResponseSchema.safeParse(response);
    if (!validated.success) {
      console.warn('Teacher report validation warning:', validated.error);
      return response as TeacherReportData;
    }

    return validated.data as TeacherReportData;
  } catch (error) {
    console.error('Failed to fetch teacher report:', error);
    throw handleReportError(error, 'TEACHER_REPORT_ERROR');
  }
}

/**
 * Get academy report data (Legacy endpoint)
 */
export async function getAcademyReport(
  academyId: string,
  params: ReportParams
): Promise<AcademyReportData> {
  try {
    const queryParams = new URLSearchParams({
      period_preset: 'custom',
      start_date: params.start_date,
      end_date: params.end_date,
    });

    const response = await fetchApi(`/admin/reports/academy/${academyId}?${queryParams}`);

    // Validate response with Zod
    const validated = AcademyReportResponseSchema.safeParse(response);
    if (!validated.success) {
      console.warn('Academy report validation warning:', validated.error);
      return response as AcademyReportData;
    }

    return validated.data as AcademyReportData;
  } catch (error) {
    console.error('Failed to fetch academy report:', error);
    throw handleReportError(error, 'ACADEMY_REPORT_ERROR');
  }
}

/**
 * Get admin overview report (Legacy endpoint)
 */
export async function getAdminReport(params: ReportParams): Promise<AdminReportData> {
  try {
    const queryParams = new URLSearchParams({
      period_preset: 'custom',
      start_date: params.start_date,
      end_date: params.end_date,
    });

    const response = await fetchApi(`/admin/reports/admin?${queryParams}`);

    // Validate response with Zod
    const validated = AdminReportResponseSchema.safeParse(response);
    if (!validated.success) {
      console.warn('Admin report validation warning:', validated.error);
      return response as AdminReportData;
    }

    return validated.data as AdminReportData;
  } catch (error) {
    console.error('Failed to fetch admin report:', error);
    throw handleReportError(error, 'ADMIN_REPORT_ERROR');
  }
}

// ============================================
// PDF Downloads
// ============================================

/**
 * Download teacher report as PDF
 */
export async function downloadTeacherReportPdf(
  teacherId: string,
  params: ReportParams
): Promise<void> {
  await downloadPdf(
    `/admin/reports/teacher/${teacherId}/pdf`,
    params,
    `teacher-report-${teacherId}`
  );
}

/**
 * Download academy report as PDF
 */
export async function downloadAcademyReportPdf(
  academyId: string,
  params: ReportParams
): Promise<void> {
  await downloadPdf(
    `/admin/reports/academy/${academyId}/pdf`,
    params,
    `academy-report-${academyId}`
  );
}

/**
 * Download admin report as PDF
 */
export async function downloadAdminReportPdf(params: ReportParams): Promise<void> {
  await downloadPdf(
    `/admin/reports/admin/pdf`,
    params,
    `admin-report`
  );
}

// ============================================
// Helper Functions
// ============================================

/**
 * Helper to download PDF files
 */
async function downloadPdf(
  endpoint: string,
  params: ReportParams,
  filename: string
): Promise<void> {
  try {
    // FIX: Use getApiBaseUrl() which has proper fallback to localhost:8000
    const cleanBaseUrl = getApiBaseUrl();

    const queryParams = new URLSearchParams({
      period_preset: 'custom',
      start_date: params.start_date,
      end_date: params.end_date,
    });

    const headers = getAuthHeaders({
      'Accept': 'application/pdf',
    });

    // FIX: Add /api/v1 prefix to endpoint (same logic as fetchApi)
    let normalizedEndpoint = endpoint;
    if (endpoint.startsWith('/api')) {
      if (!endpoint.includes('/api/v1/')) {
        normalizedEndpoint = endpoint.replace('/api/', '/api/v1/');
      }
    } else {
      if (endpoint.startsWith('/v1/')) {
        normalizedEndpoint = '/api' + endpoint;
      } else {
        normalizedEndpoint = '/api/v1' + endpoint;
      }
    }

    const response = await fetch(`${cleanBaseUrl}${normalizedEndpoint}?${queryParams}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new ReportError(
        'فشل تحميل ملف PDF',
        'PDF_DOWNLOAD_ERROR',
        response.status
      );
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${params.start_date}-to-${params.end_date}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download PDF:', error);
    throw handleReportError(error, 'PDF_DOWNLOAD_ERROR');
  }
}

/**
 * Validate report response based on type
 */
function validateReportResponse(
  response: unknown,
  reportType: ReportType
): TeacherReportData | AcademyReportData | AdminReportData {
  switch (reportType) {
    case 'teacher': {
      const validated = TeacherReportResponseSchema.safeParse(response);
      if (!validated.success) {
        console.warn('Teacher report validation warning:', validated.error);
        return response as TeacherReportData;
      }
      return validated.data as TeacherReportData;
    }
    case 'academy': {
      const validated = AcademyReportResponseSchema.safeParse(response);
      if (!validated.success) {
        console.warn('Academy report validation warning:', validated.error);
        return response as AcademyReportData;
      }
      return validated.data as AcademyReportData;
    }
    case 'admin': {
      const validated = AdminReportResponseSchema.safeParse(response);
      if (!validated.success) {
        console.warn('Admin report validation warning:', validated.error);
        return response as AdminReportData;
      }
      return validated.data as AdminReportData;
    }
    default:
      return response as TeacherReportData | AcademyReportData | AdminReportData;
  }
}

/**
 * Handle report-specific errors
 */
function handleReportError(error: unknown, code: string): ReportError {
  if (error instanceof ReportError) {
    return error;
  }

  // Handle ApiError with status code
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const apiError = error as { statusCode?: number; message?: string };
    const statusCode = apiError.statusCode;
    
    console.log('[handleReportError] ApiError with statusCode:', statusCode, 'message:', apiError.message);
    
    if (statusCode === 401) {
      return new ReportError(
        'جلسة العمل منتهية. يرجى تسجيل الدخول مرة أخرى.',
        'UNAUTHORIZED',
        401
      );
    }
    
    if (statusCode === 403) {
      return new ReportError(
        'ليس لديك صلاحية الوصول إلى هذا التقرير',
        'FORBIDDEN',
        403
      );
    }
    
    if (statusCode === 404) {
      return new ReportError(
        'التقرير غير موجود',
        'NOT_FOUND',
        404
      );
    }
  }

  if (error instanceof Error) {
    // Handle specific HTTP status codes
    const message = error.message.toLowerCase();
    
    console.log('[handleReportError] Error message:', error.message);

    if (message.includes('unauthorized') || message.includes('401') ||
        message.includes('مصرح') || message.includes('تسجيل الدخول')) {
      return new ReportError(
        'جلسة العمل منتهية. يرجى تسجيل الدخول مرة أخرى.',
        'UNAUTHORIZED',
        401
      );
    }

    if (message.includes('forbidden') || message.includes('403') || message.includes('صلاحية')) {
      return new ReportError(
        'ليس لديك صلاحية الوصول إلى هذا التقرير',
        'FORBIDDEN',
        403
      );
    }

    if (message.includes('not found') || message.includes('404') || message.includes('غير موجود')) {
      return new ReportError(
        'التقرير غير موجود',
        'NOT_FOUND',
        404
      );
    }

    if (message.includes('timeout') || message.includes('network') || message.includes('مهلة')) {
      return new ReportError(
        'انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.',
        'NETWORK_ERROR',
        0
      );
    }

    // Handle case where error.message might be undefined or empty
    const errorMessage = error.message || 'حدث خطأ غير متوقع';
    console.log('[handleReportError] Returning generic error with message:', errorMessage);
    return new ReportError(errorMessage, code);
  }

  // Handle non-Error objects
  console.log('[handleReportError] Unknown error type:', error);
  return new ReportError('حدث خطأ غير متوقع', code);
}

// ============================================
// Date Range Helpers
// ============================================

/**
 * Get date range from period preset
 */
export function getDateRangeFromPreset(preset: PeriodPreset): ReportParams {
  const today = new Date();
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const endDate = formatDate(today);
  let startDate: Date;

  switch (preset) {
    case 'last_month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'last_3_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      break;
    case 'last_6_months':
      startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      break;
    case 'last_year':
      startDate = new Date(today.getFullYear() - 1, today.getMonth() + 1, 1);
      break;
    default:
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  return {
    start_date: formatDate(startDate),
    end_date: endDate,
  };
}

/**
 * Format period preset for display
 */
export function getPeriodPresetLabel(preset: PeriodPreset): string {
  const labels: Record<PeriodPreset, string> = {
    last_month: 'الشهر الحالي',
    last_3_months: 'آخر 3 أشهر',
    last_6_months: 'آخر 6 أشهر',
    last_year: 'آخر سنة',
    custom: 'فترة مخصصة',
  };
  return labels[preset];
}

// ============================================
// Re-exports for convenience
// ============================================

export type { PeriodPreset, ReportType } from '@/schemas/report.schema';
