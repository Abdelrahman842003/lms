export interface KpiCard {
  key: string;
  title: string;
  current_value: number;
  baseline_value: number | null;
  change_pct: number | null;
  direction: 'up' | 'down' | 'stable';
  status_color: string | null;
  note: string | null;
  drilldown_key: string | null;
}

export interface AcademySnapshot {
  kpis: KpiCard[];
  period: {
    start: string;
    end: string;
    preset: string;
  };
}

export interface GradeDistribution {
  grade: string;
  count: number;
}

export interface GroupDistribution {
  group: string;
  teacher: string;
  count: number;
}

export interface TeacherStudentDistribution {
  teacher: string;
  count: number;
}

export interface TimeSeriesPoint {
  date: string;
  count: number;
}

export interface StudentDistribution {
  by_grade: GradeDistribution[];
  by_group: GroupDistribution[];
  by_teacher: TeacherStudentDistribution[];
  active_vs_inactive: {
    active: number;
    inactive: number;
  };
  new_students_over_time: TimeSeriesPoint[];
}

export interface TeacherPerformanceRow {
  teacher_name: string;
  linked_students: number;
  active_students: number;
  attendance_pct: number;
  groups_count: number;
  delivered_sessions: number;
  trend: 'up' | 'down' | 'stable';
}

export interface BreakdownData<T = Record<string, unknown>> {
  data: T[];
  schema: Record<string, string>;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
  sort: {
    column: string;
    direction: string;
  };
}

export type TeacherPerformanceResponse = BreakdownData<TeacherPerformanceRow>;

export interface TeacherAttendanceRate {
  teacher: string;
  rate: number;
}

export interface GroupAttendanceRate {
  group: string;
  teacher: string;
  rate: number;
  students_count: number;
}

export interface RankedGroup {
  group: string;
  rate: number;
}

export interface AttendanceQuality {
  overall_rate: number;
  by_teacher: TeacherAttendanceRate[];
  by_group: GroupAttendanceRate[];
  trend: TimeSeriesPoint[];
  best_groups: RankedGroup[];
  weakest_groups: RankedGroup[];
}

export interface SessionExecutionSummary {
  scheduled: number;
  delivered: number;
  canceled: number;
  postponed: number;
  avg_attendance: number;
}

export interface SessionRow {
  title: string;
  teacher: string;
  date: string;
  status: string;
  attendance_count: number;
  total_students: number;
}

export interface SessionExecution {
  summary: SessionExecutionSummary;
  sessions: BreakdownData<SessionRow>;
}

export interface SubscriptionUsage {
  plan_name: string;
  plan_price: number;
  student_limit: number;
  used_slots: number;
  usage_percentage: number;
  renewal_date: string | null;
  subscription_status: string;
}

export interface MetricChange {
  metric: string;
  label: string;
  current: number;
  previous: number;
  change_pct: number | null;
  direction: 'up' | 'down' | 'stable';
}

export interface TimeComparison {
  current_period: Record<string, number>;
  comparison_period: Record<string, number>;
  comparison_mode: string;
  changes: MetricChange[];
}

export interface AcademyAlert {
  rule: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: Record<string, unknown>;
}

export interface AcademyReportFilters {
  preset?: string;
  start_at?: string;
  end_at?: string;
  comparison_mode?: string;
  teacher_id?: string;
  grade_id?: string;
  group_id?: string;
  student_status?: string;
  session_status?: string;
}

export interface AcademyReportOverview {
  snapshot: AcademySnapshot;
  alerts_summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
  highlights: KpiCard[];
}
