export interface TeacherReportKpi {
  key: string;
  title: string;
  current_value: number;
  baseline_value: number | null;
  change_pct: number | null;
  direction: 'up' | 'down' | 'stable';
  status_color?: string;
  note?: string;
  drilldown_key?: string;
}

export interface IncomeTrendSeries {
  label: string;
  value: number;
}

export interface IncomeTrendSummary {
  current: number;
  baseline: number | null;
  change_pct: number | null;
  direction: 'up' | 'down' | 'stable';
}

export interface MonthlyIncomeRow {
  month: string;
  month_name: string;
  amount: number;
  previous_amount: number | null;
  change_pct: number | null;
  direction: 'up' | 'down' | 'stable';
}

export interface StudentActivityMetrics {
  total_students: number;
  active_students: number;
  inactive_students: number;
  new_students: number;
  activity_trend: IncomeTrendSeries[];
}

export interface StudentActivityTableRow {
  student_name: string;
  group_name: string;
  activity_state: string;
  last_activity_date: string | null;
}

export interface AttendanceGroupMetrics {
  group_name: string;
  students_count: number;
  attendance_rate: number;
  sessions_count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AttendancePerformance {
  overall_rate: number;
  overall_direction: 'up' | 'down' | 'stable';
  by_group: AttendanceGroupMetrics[];
  best_group: string;
  worst_group: string;
  change_from_previous: number | null;
}

export interface GroupBreakdownRow {
  group_name: string;
  students_count: number;
  active_students: number;
  attendance_rate: number;
  delivered_sessions: number;
  income_contribution: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SubscriptionCapacity {
  plan_name: string;
  student_limit: number | null;
  used_slots: number;
  remaining_capacity: number;
  usage_percentage: number;
  renewal_date: string | null;
  status: string;
}

export interface TeacherAlert {
  alert_key: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  context?: Record<string, unknown>;
  source_section?: string;
  drilldown_key?: string;
}

export interface TeacherReportSections {
  income_trends?: {
    summary: IncomeTrendSummary;
    series: IncomeTrendSeries[];
  };
  monthly_income?: MonthlyIncomeRow[];
  student_activity?: {
    metrics: StudentActivityMetrics;
    students: StudentActivityTableRow[];
  };
  attendance?: AttendancePerformance;
  group_breakdown?: {
    groups: GroupBreakdownRow[];
  };
  subscription?: SubscriptionCapacity;
}

export interface TeacherReportOverview {
  meta: {
    generated_at: string;
    timezone: string;
    report_scope: string;
    version: string;
  };
  applied_filters: {
    preset: string | null;
    start_at: string;
    end_at: string;
    comparison_mode: string | null;
    timezone: string;
  };
  summary: TeacherReportKpi[];
  sections: TeacherReportSections;
  alerts: TeacherAlert[];
}

export interface TeacherDrilldownResponse {
  drilldown_key: string;
  title: string;
  schema: {
    columns: { key: string; label: string; sortable?: boolean }[];
  };
  rows: Record<string, unknown>[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

export type PeriodPreset = 'today' | 'last_7_days' | 'this_month' | 'last_month' | 'last_3_months' | 'this_year' | 'custom_range';
export type ComparisonMode = 'previous_period' | 'same_period_last_year';

export interface TeacherReportFilters {
  preset?: PeriodPreset;
  start_at?: string;
  end_at?: string;
  comparison_mode?: ComparisonMode;
  group_id?: string;
  student_activity_state?: 'active' | 'inactive';
  attendance_state?: 'good' | 'poor';
}
