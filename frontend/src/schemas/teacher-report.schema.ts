import { z } from 'zod';

export const PeriodPresetSchema = z.enum([
  'today',
  'last_7_days',
  'this_month',
  'last_month',
  'last_3_months',
  'this_year',
  'custom'
]);

export const ComparisonModeSchema = z.enum([
  'previous_period',
  'same_period_last_year'
]);

export const DirectionSchema = z.enum(['up', 'down', 'stable']);

export const TeacherReportKpiSchema = z.object({
  key: z.string(),
  title: z.string(),
  current_value: z.number(),
  baseline_value: z.number().nullable(),
  change_pct: z.number().nullable(),
  direction: DirectionSchema,
  status_color: z.string().optional(),
  note: z.string().optional(),
  drilldown_key: z.string().optional()
});

export const IncomeTrendSeriesSchema = z.object({
  label: z.string(),
  value: z.number()
});

export const IncomeTrendSummarySchema = z.object({
  current: z.number(),
  baseline: z.number().nullable(),
  change_pct: z.number().nullable(),
  direction: DirectionSchema
});

export const IncomeTrendsSchema = z.object({
  summary: IncomeTrendSummarySchema,
  series: z.array(IncomeTrendSeriesSchema)
});

export const MonthlyIncomeRowSchema = z.object({
  month: z.string(),
  month_name: z.string(),
  amount: z.number(),
  previous_amount: z.number().nullable(),
  change_pct: z.number().nullable(),
  direction: DirectionSchema
});

export const StudentActivityMetricsSchema = z.object({
  total_students: z.number(),
  active_students: z.number(),
  inactive_students: z.number(),
  new_students: z.number(),
  activity_trend: z.array(IncomeTrendSeriesSchema)
});

export const StudentActivityTableRowSchema = z.object({
  student_name: z.string(),
  group_name: z.string(),
  activity_state: z.string(),
  last_activity_date: z.string().nullable()
});

export const StudentActivitySchema = z.object({
  metrics: StudentActivityMetricsSchema,
  students: z.array(StudentActivityTableRowSchema)
});

export const AttendanceGroupMetricsSchema = z.object({
  group_name: z.string(),
  students_count: z.number(),
  attendance_rate: z.number(),
  sessions_count: z.number(),
  trend: DirectionSchema
});

export const AttendancePerformanceSchema = z.object({
  overall_rate: z.number(),
  overall_direction: DirectionSchema,
  by_group: z.array(AttendanceGroupMetricsSchema),
  best_group: z.string(),
  worst_group: z.string(),
  change_from_previous: z.number().nullable()
});

export const GroupBreakdownRowSchema = z.object({
  group_name: z.string(),
  students_count: z.number(),
  active_students: z.number(),
  attendance_rate: z.number(),
  delivered_sessions: z.number(),
  income_contribution: z.number(),
  trend: DirectionSchema
});

export const GroupBreakdownSchema = z.object({
  groups: z.array(GroupBreakdownRowSchema)
});

export const SubscriptionCapacitySchema = z.object({
  plan_name: z.string(),
  student_limit: z.number().nullable(),
  used_slots: z.number(),
  remaining_capacity: z.number(),
  usage_percentage: z.number(),
  renewal_date: z.string().nullable(),
  status: z.string()
});

export const TeacherAlertSchema = z.object({
  alert_key: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
  context: z.record(z.unknown()).optional(),
  source_section: z.string().optional(),
  drilldown_key: z.string().optional()
});

export const AppliedFiltersSchema = z.object({
  preset: z.string().nullable(),
  start_at: z.string(),
  end_at: z.string(),
  comparison_mode: z.string().nullable(),
  timezone: z.string()
});

export const TeacherReportSectionsSchema = z.object({
  income_trends: IncomeTrendsSchema.optional(),
  monthly_income: z.array(MonthlyIncomeRowSchema).optional(),
  student_activity: StudentActivitySchema.optional(),
  attendance: AttendancePerformanceSchema.optional(),
  group_breakdown: GroupBreakdownSchema.optional(),
  subscription: SubscriptionCapacitySchema.optional()
});

export const TeacherReportOverviewSchema = z.object({
  meta: z.object({
    generated_at: z.string(),
    timezone: z.string(),
    report_scope: z.string(),
    version: z.string()
  }),
  applied_filters: AppliedFiltersSchema,
  summary: z.array(TeacherReportKpiSchema),
  sections: TeacherReportSectionsSchema,
  alerts: z.array(TeacherAlertSchema)
});

export const TeacherDrilldownResponseSchema = z.object({
  drilldown_key: z.string(),
  title: z.string(),
  schema: z.object({
    columns: z.array(z.object({
      key: z.string(),
      label: z.string(),
      sortable: z.boolean().optional()
    }))
  }),
  rows: z.array(z.record(z.unknown())),
  pagination: z.object({
    current_page: z.number(),
    per_page: z.number(),
    total: z.number()
  })
});

export type PeriodPreset = z.infer<typeof PeriodPresetSchema>;
export type ComparisonMode = z.infer<typeof ComparisonModeSchema>;
export type Direction = z.infer<typeof DirectionSchema>;
export type TeacherReportKpi = z.infer<typeof TeacherReportKpiSchema>;
export type IncomeTrendSeries = z.infer<typeof IncomeTrendSeriesSchema>;
export type IncomeTrendSummary = z.infer<typeof IncomeTrendSummarySchema>;
export type IncomeTrends = z.infer<typeof IncomeTrendsSchema>;
export type MonthlyIncomeRow = z.infer<typeof MonthlyIncomeRowSchema>;
export type StudentActivityMetrics = z.infer<typeof StudentActivityMetricsSchema>;
export type StudentActivityTableRow = z.infer<typeof StudentActivityTableRowSchema>;
export type StudentActivity = z.infer<typeof StudentActivitySchema>;
export type AttendanceGroupMetrics = z.infer<typeof AttendanceGroupMetricsSchema>;
export type AttendancePerformance = z.infer<typeof AttendancePerformanceSchema>;
export type GroupBreakdownRow = z.infer<typeof GroupBreakdownRowSchema>;
export type GroupBreakdown = z.infer<typeof GroupBreakdownSchema>;
export type SubscriptionCapacity = z.infer<typeof SubscriptionCapacitySchema>;
export type TeacherAlert = z.infer<typeof TeacherAlertSchema>;
export type AppliedFilters = z.infer<typeof AppliedFiltersSchema>;
export type TeacherReportSections = z.infer<typeof TeacherReportSectionsSchema>;
export type TeacherReportOverview = z.infer<typeof TeacherReportOverviewSchema>;
export type TeacherDrilldownResponse = z.infer<typeof TeacherDrilldownResponseSchema>;
