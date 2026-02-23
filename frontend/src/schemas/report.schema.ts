import { z } from 'zod';

/**
 * Report Schemas - Zod validation for report data
 * Aligned with DTOs and subscription_fee system per SUBSCRIPTION_SYSTEM_CHANGES.md
 */

// Period preset options
export const PeriodPresetSchema = z.enum([
  'last_month',
  'last_3_months',
  'last_6_months',
  'last_year',
  'custom',
]);

export type PeriodPreset = z.infer<typeof PeriodPresetSchema>;

// Report type options
export const ReportTypeSchema = z.enum(['admin', 'teacher', 'academy']);

export type ReportType = z.infer<typeof ReportTypeSchema>;

// Date range schema
export const DateRangeSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ البداية يجب أن يكون بتنسيق YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ النهاية يجب أن يكون بتنسيق YYYY-MM-DD'),
});

export type DateRange = z.infer<typeof DateRangeSchema>;

// Generate report request schema
export const GenerateReportRequestSchema = z.object({
  report_type: ReportTypeSchema,
  teacher_id: z.string().uuid().optional(),
  academy_id: z.string().uuid().optional(),
  period_preset: PeriodPresetSchema,
  start_date: z.string().optional(),
  end_date: z.string().optional(),
}).refine(
  (data) => {
    // Teacher report requires teacher_id
    if (data.report_type === 'teacher' && !data.teacher_id) {
      return false;
    }
    // Academy report requires academy_id
    if (data.report_type === 'academy' && !data.academy_id) {
      return false;
    }
    // Custom period requires dates
    if (data.period_preset === 'custom' && (!data.start_date || !data.end_date)) {
      return false;
    }
    return true;
  },
  {
    message: 'بيانات التقرير غير مكتملة',
  }
);

export type GenerateReportRequest = z.infer<typeof GenerateReportRequestSchema>;

// Report period schema
export const ReportPeriodSchema = z.object({
  start: z.string(),
  end: z.string(),
  duration_months: z.number().int().min(1),
});

export type ReportPeriod = z.infer<typeof ReportPeriodSchema>;

// Teacher report summary schema with subscription_fee
export const TeacherReportSummarySchema = z.object({
  total_students: z.number().int().min(0),
  active_students: z.number().int().min(0),
  new_enrollments: z.number().int().min(0),
  total_secretaries: z.number().int().min(0),
  subscription_fee: z.number().min(0), // السعر المدفوع للمنصة (Primary metric)
  confirmed_payments: z.number().min(0),
  pending_payments: z.number().min(0),
  paying_students_count: z.number().int().min(0),
  not_paying_students_count: z.number().int().min(0),
  price_per_student: z.number().min(0),
  payment_status: z.enum(['paid', 'partial', 'unpaid']),
});

export type TeacherReportSummary = z.infer<typeof TeacherReportSummarySchema>;

// Academy report summary schema with subscription_fee
export const AcademyReportSummarySchema = z.object({
  total_teachers: z.number().int().min(0),
  active_teachers: z.number().int().min(0),
  total_academy_students: z.number().int().min(0),
  total_enrollments: z.number().int().min(0),
  active_enrollments: z.number().int().min(0),
  total_subscriptions: z.number().int().min(0),
  total_payment_transactions: z.number().int().min(0),
  subscription_fee: z.number().min(0), // السعر المدفوع للمنصة (Primary metric)
  confirmed_payments: z.number().min(0),
  remaining_balance: z.number().min(0),
  payment_status: z.enum(['paid', 'partial', 'unpaid']),
  price_per_student: z.number().min(0),
});

export type AcademyReportSummary = z.infer<typeof AcademyReportSummarySchema>;

// Admin report summary schema with subscription_fee
export const AdminReportSummarySchema = z.object({
  total_academies: z.number().int().min(0),
  independent_teachers_count: z.number().int().min(0),
  total_teachers: z.number().int().min(0),
  active_teachers: z.number().int().min(0),
  suspended_teachers: z.number().int().min(0),
  new_teachers: z.number().int().min(0),
  total_students: z.number().int().min(0),
  new_students: z.number().int().min(0),
  total_secretaries: z.number().int().min(0),
  total_enrollments: z.number().int().min(0),
  active_enrollments: z.number().int().min(0),
  new_enrollments: z.number().int().min(0),
  total_subscriptions: z.number().int().min(0),
  academy_subscriptions: z.number().int().min(0),
  independent_subscriptions: z.number().int().min(0),
  total_subscription_fees: z.number().min(0), // Total from all sources
  confirmed_payments: z.number().min(0),
  independent_commission: z.number().min(0),
  academy_platform_share: z.number().min(0),
  net_platform_profit: z.number().min(0),
  price_per_student: z.number().min(0),
  academy_student_price: z.number().min(0),
});

export type AdminReportSummary = z.infer<typeof AdminReportSummarySchema>;

// Financial details schema
export const FinancialDetailsSchema = z.object({
  total_revenue: z.number().min(0),
  total_confirmed_payments: z.number().min(0),
  subscription_fee: z.number().min(0),
  total_paid_to_platform: z.number().min(0),
  remaining_balance: z.number().min(0),
  price_per_student: z.number().min(0),
});

export type FinancialDetails = z.infer<typeof FinancialDetailsSchema>;

// Monthly breakdown item schema
export const MonthlyBreakdownItemSchema = z.object({
  month: z.string(),
  month_name: z.string(),
  new_enrollments: z.number().int().min(0),
  confirmed_payments: z.number().min(0),
});

export type MonthlyBreakdownItem = z.infer<typeof MonthlyBreakdownItemSchema>;

// Subscription breakdown item schema
export const SubscriptionBreakdownItemSchema = z.object({
  month: z.string(),
  month_name: z.string(),
  student_count: z.number().int().min(0),
  amount_due: z.number().min(0),
  amount_paid: z.number().min(0),
  amount_remaining: z.number().min(0),
  status: z.enum(['pending', 'paid', 'partial']),
  status_label: z.string(),
});

export type SubscriptionBreakdownItem = z.infer<typeof SubscriptionBreakdownItemSchema>;

// Teacher info schema
export const TeacherInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  joined: z.string(),
  status: z.string(),
  total_secretaries: z.number().int().min(0).optional(),
  subscription_start_date: z.string().nullable().optional(),
  last_payment_date: z.string().nullable().optional(),
  subscription_expiry: z.string().nullable().optional(),
  has_subscription: z.boolean().optional(),
  amount_due: z.number().min(0).optional(),
  paid_amount: z.number().min(0).optional(),
  plan_type: z.string().nullable().optional(),
  plan_max_students: z.number().int().nullable().optional(),
  is_unlimited_students: z.boolean().optional(),
  days_remaining: z.number().int().nullable().optional(),
  payment_percentage: z.number().min(0).optional(),
  plan_duration_months: z.number().int().min(0).optional(),
  member_since_days: z.number().int().min(0).optional(),
});

export type TeacherInfo = z.infer<typeof TeacherInfoSchema>;

// Academy info schema
export const AcademyInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  joined: z.string(),
  status: z.string(),
  total_teachers: z.number().int().min(0).optional(),
  active_teachers: z.number().int().min(0).optional(),
  has_subscription: z.boolean().optional(),
  subscription_expiry: z.string().nullable().optional(),
  amount_due: z.number().min(0).optional(),
  paid_amount: z.number().min(0).optional(),
  plan_type: z.string().nullable().optional(),
  plan_max_students: z.number().int().nullable().optional(),
  is_unlimited_students: z.boolean().optional(),
  days_remaining: z.number().int().nullable().optional(),
  payment_percentage: z.number().min(0).optional(),
  plan_duration_months: z.number().int().min(0).optional(),
  member_since_days: z.number().int().min(0).optional(),
});

export type AcademyInfo = z.infer<typeof AcademyInfoSchema>;

// Teacher report response schema
export const TeacherReportResponseSchema = z.object({
  teacher: TeacherInfoSchema,
  period: ReportPeriodSchema,
  summary: TeacherReportSummarySchema,
  financial_details: FinancialDetailsSchema,
  monthly_breakdown: z.array(MonthlyBreakdownItemSchema),
  subscription_breakdown: z.array(SubscriptionBreakdownItemSchema),
  generated_at: z.string(),
});

export type TeacherReportResponse = z.infer<typeof TeacherReportResponseSchema>;

// Academy report response schema
export const AcademyReportResponseSchema = z.object({
  academy: AcademyInfoSchema,
  period: ReportPeriodSchema,
  summary: AcademyReportSummarySchema,
  monthly_breakdown: z.array(MonthlyBreakdownItemSchema),
  generated_at: z.string(),
});

export type AcademyReportResponse = z.infer<typeof AcademyReportResponseSchema>;

// Teacher breakdown item schema
export const TeacherBreakdownItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  total_students: z.number().int().min(0),
  active_students: z.number().int().min(0),
  secretaries: z.number().int().min(0),
  subscriptions: z.number().int().min(0),
  subscription_fee: z.number().min(0),
  revenue: z.number().min(0),
  paid: z.number().min(0),
  joined: z.string(),
});

export type TeacherBreakdownItem = z.infer<typeof TeacherBreakdownItemSchema>;

// Admin report response schema
export const AdminReportResponseSchema = z.object({
  period: ReportPeriodSchema,
  summary: AdminReportSummarySchema,
  teachers_breakdown: z.array(TeacherBreakdownItemSchema),
  monthly_breakdown: z.array(MonthlyBreakdownItemSchema),
  generated_at: z.string(),
});

export type AdminReportResponse = z.infer<typeof AdminReportResponseSchema>;

// Teacher list item schema
export const TeacherListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  status: z.string(),
  students_count: z.number().int().min(0),
  secretaries_count: z.number().int().min(0),
  joined: z.string(),
  subscription_fee: z.number().min(0).default(0),
});

export type TeacherListItem = z.infer<typeof TeacherListItemSchema>;

// Academy list item schema
export const AcademyListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string(),
  status: z.string(),
  teachers_count: z.number().int().min(0),
  students_count: z.number().int().min(0),
  joined: z.string(),
  subscription_fee: z.number().min(0).default(0),
  plan_max_students: z.number().int().nullable().optional().default(0),
  plan_expires_at: z.string().nullable().optional(),
});

export type AcademyListItem = z.infer<typeof AcademyListItemSchema>;

// Teachers list response schema
export const TeachersListResponseSchema = z.object({
  teachers: z.array(TeacherListItemSchema),
  count: z.number().int().min(0),
});

export type TeachersListResponse = z.infer<typeof TeachersListResponseSchema>;

// Academies list response schema
export const AcademiesListResponseSchema = z.object({
  academies: z.array(AcademyListItemSchema),
  count: z.number().int().min(0),
});

export type AcademiesListResponse = z.infer<typeof AcademiesListResponseSchema>;

// Period preset options for UI
export const periodPresets = [
  { value: 'current_month' as const, label: 'الشهر الحالي', labelEn: 'Current Month' },
  { value: 'last_month' as const, label: 'الشهر الماضي', labelEn: 'Last Month' },
  { value: 'last_3_months' as const, label: 'آخر 3 أشهر', labelEn: 'Last 3 Months' },
  { value: 'last_6_months' as const, label: 'آخر 6 أشهر', labelEn: 'Last 6 Months' },
  { value: 'this_year' as const, label: 'السنة الحالية', labelEn: 'This Year' },
  { value: 'custom' as const, label: 'فترة مخصصة', labelEn: 'Custom Period' },
];

// Report type options for UI
export const reportTypes = [
  { value: 'teacher' as const, label: 'تقرير مدرس', labelEn: 'Teacher Report' },
  { value: 'academy' as const, label: 'تقرير أكاديمية', labelEn: 'Academy Report' },
  { value: 'admin' as const, label: 'تقرير المنصة', labelEn: 'Platform Report' },
];

/**
 * Calculate summary totals from multiple summaries
 */
export function calculateSummaryTotals(summaries: Array<{ total_students?: number; active_students?: number; new_enrollments?: number }>) {
  return summaries.reduce(
    (acc: { total_students: number; active_students: number; new_enrollments: number }, summary) => ({
      total_students: acc.total_students + (summary.total_students || 0),
      active_students: acc.active_students + (summary.active_students || 0),
      new_enrollments: acc.new_enrollments + (summary.new_enrollments || 0),
    }),
    { total_students: 0, active_students: 0, new_enrollments: 0 }
  );
}

/**
 * Calculate financial totals from multiple financial details
 */
export function calculateFinancialTotals(
  details: Array<{
    total_revenue?: number;
    total_expenses?: number;
    net_profit?: number;
    total_collected?: number;
    total_outstanding?: number;
    collection_rate?: number;
  }>
) {
  const initialTotals = {
    total_revenue: 0,
    total_expenses: 0,
    net_profit: 0,
    total_collected: 0,
    total_outstanding: 0,
    collection_rate: 0
  };
  
  const totals = details.reduce(
    (acc: typeof initialTotals, detail) => ({
      total_revenue: acc.total_revenue + (detail.total_revenue || 0),
      total_expenses: acc.total_expenses + (detail.total_expenses || 0),
      net_profit: acc.net_profit + (detail.net_profit || 0),
      total_collected: acc.total_collected + (detail.total_collected || 0),
      total_outstanding: acc.total_outstanding + (detail.total_outstanding || 0),
      collection_rate: acc.collection_rate + (detail.collection_rate || 0),
    }),
    initialTotals
  );

  // Average the collection rate
  if (details.length > 0) {
    totals.collection_rate = totals.collection_rate / details.length;
  }

  return totals;
}

/**
 * Format currency with locale
 */
export function formatCurrency(amount: number, locale: 'ar' | 'en' = 'ar'): string {
  const currency = locale === 'ar' ? 'ج.م' : 'EGP';
  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(amount);
  return locale === 'ar' ? `${formatted} ${currency}` : `${currency} ${formatted}`;
}

/**
 * Format number with locale
 */
export function formatNumber(num: number, locale: 'ar' | 'en' = 'ar'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US').format(num);
}
