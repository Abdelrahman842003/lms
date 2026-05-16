/**
 * Unified Error Handling Service
 * Provides consistent error handling across the application
 * with user-friendly Arabic messages and toast notifications
 */

import { toast } from 'react-hot-toast';

const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * API Error class with extended properties
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: Record<string, string[]>,
    public data?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return this.statusCode === 422;
  }

  /**
   * Check if this is an auth error
   */
  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  /**
   * Check if this is a permission error
   */
  isPermissionError(): boolean {
    return this.statusCode === 403;
  }

  /**
   * Check if this is a rate limit error
   */
  isRateLimitError(): boolean {
    return this.statusCode === 429;
  }

  /**
   * Check if this is a network error
   */
  isNetworkError(): boolean {
    return this.statusCode === 0 || !this.statusCode;
  }

  /**
   * Get the first validation error message
   */
  getFirstValidationError(): string | null {
    if (!this.errors) return null;

    const firstField = Object.keys(this.errors)[0];
    const firstError = this.errors[firstField]?.[0];

    return firstError || null;
  }

  /**
   * Get all error messages as a flat array
   */
  getAllErrorMessages(): string[] {
    const messages: string[] = [];

    if (this.errors) {
      Object.values(this.errors).forEach(fieldErrors => {
        fieldErrors.forEach(msg => messages.push(msg));
      });
    }

    if (messages.length === 0 && this.message) {
      messages.push(this.message);
    }

    return messages;
  }
}

/**
 * Default Arabic error messages by status code
 */
const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: 'طلب غير صالح',
  401: 'غير مصرح لك بالدخول. يرجى تسجيل الدخول.',
  403: 'غير مصرح لك بهذا الإجراء',
  404: 'العنصر المطلوب غير موجود',
  405: 'طريقة الطلب غير مسموحة',
  409: 'تضارب في البيانات',
  419: 'انتهت صلاحية الجلسة. يرجى إعادة تحميل الصفحة.',
  422: 'البيانات المدخلة غير صالحة',
  429: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار.',
  500: 'حدث خطأ في الخادم. يرجى المحاولة لاحقاً.',
  503: 'الخدمة غير متاحة حالياً. يرجى المحاولة لاحقاً.',
};

/**
 * Special error codes
 */
const SPECIAL_ERROR_MESSAGES: Record<string, string> = {
  'TEACHER_SUSPENDED': 'تم تعليق حساب المعلم. يرجى التواصل مع الإدارة.',
  'ACCOUNT_RESTRICTED': 'عذراً، حسابك معلق حالياً لعدم وجود نشاط مستقل أو انتماء لأكاديمية نشطة.',
  'ACADEMY_EXPIRED': 'انتهت صلاحية اشتراك الأكاديمي.',
  'LECTURE_ENDED': 'انتهت المحاضرة.',
  'EXAM_TERMINATED': 'تم إنهاء الامتحان.',
  'INVALID_QR_CODE': 'رمز QR غير صالح أو منتهي الصلاحية.',
};

/**
 * Get Arabic error message for status code
 */
export function getErrorMessage(status: number, defaultMessage?: string): string {
  return DEFAULT_ERROR_MESSAGES[status] || defaultMessage || 'حدث خطأ غير متوقع';
}

/**
 * Handle API error and return ApiError instance
 */
export function handleApiError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }

  if (error instanceof Error) {
    // Check if it's a fetch error (network error)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new ApiError(
        'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.',
        0
      );
    }

    // Check if it has status property (from our fetch wrapper)
    const status = (error as { status?: number })?.status;
    if (status) {
      const message = error.message || getErrorMessage(status);
      throw new ApiError(
        message,
        status,
        (error as { errors?: Record<string, string[]> })?.errors,
        (error as { data?: Record<string, unknown> })?.data
      );
    }

    // Generic error
    throw new ApiError(error.message, 500);
  }

  // Unknown error type
  throw new ApiError('حدث خطأ غير متوقع', 500);
}

/**
 * Show toast notification for error
 * Note: This should be integrated with your toast library (react-hot-toast, sonner, etc.)
 */
export function showErrorToast(error: ApiError | Error): void {
  let displayMessage = error.message;

  // For validation errors, try to get the first specific field error
  if (error instanceof ApiError && error.isValidationError()) {
    const firstError = error.getFirstValidationError();
    if (firstError) {
      displayMessage = firstError;
    }
  }

  // Use react-hot-toast
  toast.error(displayMessage);

  // For now, keep logs in non-production only
  if (!IS_PROD) {
    const isExpectedClientError =
      error instanceof ApiError
      && error.statusCode >= 400
      && error.statusCode < 500;

    if (isExpectedClientError) {
      console.warn('[Handled API Error]', error.message);
    } else {
      console.error('[Error]', error.message);
    }
  }

  // Dispatch custom event for global error handling
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:error', { detail: error }));
  }
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string): void {
  toast.success(message);

  if (!IS_PROD) {
    console.info('[Success]', message);
  }

  // Dispatch custom event for global success handling
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('api:success', { detail: message }));
  }
}

/**
 * Process API response and throw error if needed
 */
export function processApiResponse<T>(
  response: { status: boolean; status_code: number; message: string; data?: T; errors?: Record<string, string[]> },
  dataKey: string = 'data'
): T {
  if (!response.status) {
    throw new ApiError(
      response.message || 'حدث خطأ غير متوقع',
      response.status_code,
      response.errors
    );
  }

  const responseWithDynamicData = response as Record<string, unknown>;
  const dynamicData = responseWithDynamicData[dataKey];

  return dynamicData !== undefined ? (dynamicData as T) : response as unknown as T;
}

/**
 * Check for special error codes and return appropriate message
 */
export function getSpecialErrorMessage(errorCode: string): string | null {
  return SPECIAL_ERROR_MESSAGES[errorCode] || null;
}

/**
 * Format rate limit retry time
 */
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} ثانية`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} دقيقة`;
}

/**
 * Error Handler Service
 */
export const errorHandler = {
  handle: handleApiError,
  show: showErrorToast,
  success: showSuccessToast,
  process: processApiResponse,
  getSpecial: getSpecialErrorMessage,
  formatRetry: formatRetryTime,
  getMessage: getErrorMessage,
};

export default errorHandler;
