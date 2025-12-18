import { fetchApi } from './authService';
import {
  savePaymentOffline,
  getAllPayments,
  getPendingPaymentsCount,
} from './offlineDb';

// ===================
// Types
// ===================

export interface Student {
  id: string;
  name: string;
  phone?: string;
}

export interface PaymentLog {
  id: string;
  client_side_uuid: string;
  student_id: string;
  student: Student;
  amount: number;
  confirmation_code: string;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
  payment_method: string;
  confirmed_at: string | null;
  expires_at: string;
  notes: string | null;
  created_at: string;
}

export interface PaymentStatistics {
  total: number;
  pending: number;
  confirmed: number;
  expired: number;
  total_amount: number;
  pending_amount: number;
}

export interface CreatePaymentData {
  student_id: string;
  student_name: string;
  amount: number;
  notes?: string;
}

export interface CreatePaymentResult {
  confirmation_code: string;
  is_offline: boolean;
  payment?: PaymentLog;
}

// ===================
// API Calls (Online)
// ===================

/**
 * Get all payments from server
 */
export async function getPayments(params?: {
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<{ payments: PaymentLog[]; meta?: Record<string, unknown> }> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());

  const queryString = searchParams.toString();
  const url = `/api/teacher/payments${queryString ? `?${queryString}` : ''}`;

  const response = await fetchApi(url);
  return response.data;
}

/**
 * Get pending payments from server
 */
export async function getPendingPaymentsFromServer(): Promise<PaymentLog[]> {
  const response = await fetchApi('/api/teacher/payments/pending');
  return response.data.payments;
}

/**
 * Get payment statistics
 */
export async function getPaymentStatistics(): Promise<PaymentStatistics> {
  const response = await fetchApi('/api/teacher/payments/statistics');
  return response.data;
}

/**
 * Cancel a payment
 */
export async function cancelPayment(paymentId: string): Promise<void> {
  await fetchApi(`/api/teacher/payments/${paymentId}/cancel`, {
    method: 'POST',
  });
}

// ===================
// Create Payment (Online/Offline)
// ===================

/**
 * Create a new payment - works both online and offline
 */
export async function createPayment(
  data: CreatePaymentData
): Promise<CreatePaymentResult> {
  // Try online first
  if (navigator.onLine) {
    try {
      const response = await fetchApi('/api/teacher/payments', {
        method: 'POST',
        body: JSON.stringify({
          student_id: data.student_id,
          amount: data.amount,
          notes: data.notes,
          client_side_uuid: crypto.randomUUID(),
        }),
      });

      return {
        confirmation_code: response.data.confirmation_code,
        is_offline: false,
        payment: response.data.payment,
      };
    } catch (error) {
      // If network error, fall through to offline
      if (!(error instanceof Error) || !error.message.includes('Network')) {
        throw error;
      }
    }
  }

  // Offline mode
  const confirmationCode = await savePaymentOffline({
    student_id: data.student_id,
    student_name: data.student_name,
    amount: data.amount,
    notes: data.notes,
  });

  return {
    confirmation_code: confirmationCode,
    is_offline: true,
  };
}

// ===================
// Offline Data
// ===================

/**
 * Get offline payments for display
 */
export async function getOfflinePayments() {
  return getAllPayments();
}

/**
 * Get offline pending count
 */
export async function getOfflinePendingCount(): Promise<number> {
  return getPendingPaymentsCount();
}

// ===================
// Student Payment Confirmation
// ===================

/**
 * Confirm payment with code (for students)
 */
export async function confirmPayment(code: string): Promise<{
  message: string;
  amount: number;
  teacher_name: string;
  subscription_end: string;
  days_left: number;
}> {
  const response = await fetchApi('/api/student/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ code: code.toUpperCase() }),
  });
  return response.data;
}

/**
 * Get pending payments for student
 */
export async function getStudentPendingPayments(): Promise<
  Array<{
    id: string;
    amount: number;
    teacher_name: string;
    created_at: string;
    expires_at: string;
    days_until_expiration: number;
  }>
> {
  const response = await fetchApi('/api/student/payments/pending');
  return response.data.payments;
}

/**
 * Get payment history for student
 */
export async function getStudentPaymentHistory(params?: {
  page?: number;
  per_page?: number;
}): Promise<{ payments: PaymentLog[]; meta?: Record<string, unknown> }> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.per_page) searchParams.set('per_page', params.per_page.toString());

  const queryString = searchParams.toString();
  const url = `/api/student/payments/history${queryString ? `?${queryString}` : ''}`;

  const response = await fetchApi(url);
  return response.data;
}
