'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  fetchTeacherReportOverview,
  fetchTeacherDrilldown,
  type TeacherReportFilters
} from '@/services/teacherReportService';
import type {
  TeacherReportOverview,
  TeacherDrilldownResponse
} from '@/types/teacher-report.types';

import ReportFilters from '@/components/reports/teacher/ReportFilters';
import TeacherSnapshot from '@/components/reports/teacher/TeacherSnapshot';
import IncomeTrends from '@/components/reports/teacher/IncomeTrends';
import MonthlyIncomeTable from '@/components/reports/teacher/MonthlyIncomeTable';
import StudentActivity from '@/components/reports/teacher/StudentActivity';
import StudentActivityTable from '@/components/reports/teacher/StudentActivityTable';
import AttendancePerformanceCard from '@/components/reports/teacher/AttendancePerformance';
import AttendanceDetailTable from '@/components/reports/teacher/AttendanceDetailTable';
import GroupBreakdown from '@/components/reports/teacher/GroupBreakdown';
import SubscriptionCapacity from '@/components/reports/teacher/SubscriptionCapacity';
import AlertsRecommendations from '@/components/reports/teacher/AlertsRecommendations';
import DrilldownTable from '@/components/reports/DrilldownTable';
import { KpiGridSkeleton, ChartSkeleton, TableSkeleton } from '@/components/reports/teacher/ReportSkeletons';

export default function TeacherReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [filters, setFilters] = useState<TeacherReportFilters>({ preset: 'this_month' });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TeacherReportOverview | null>(null);
  const [drilldown, setDrilldown] = useState<TeacherDrilldownResponse | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user?.userType !== 'teacher' && user?.userType !== 'secretary'))) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTeacherReportOverview(filters);
      setReport(data);
    } catch {
      toast.error('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user && (user.userType === 'teacher' || user.userType === 'secretary')) {
      loadReport();
    }
  }, []);

  const handleDrilldown = useCallback(async (key: string) => {
    setDrilldownLoading(true);
    try {
      const data = await fetchTeacherDrilldown(key);
      setDrilldown(data);
    } catch {
      toast.error('فشل تحميل التفاصيل');
    } finally {
      setDrilldownLoading(false);
    }
  }, []);

  if (!authLoading && (!user || (user.userType !== 'teacher' && user.userType !== 'secretary'))) return null;

  const sections = report?.sections;
  const incomeTrends = sections?.income_trends;
  const monthlyIncome = sections?.income_trends?.monthly_table;
  const studentActivity = sections?.student_activity;
  const attendance = sections?.attendance;
  const groupBreakdown = sections?.group_breakdown;
  const subscription = sections?.subscription;
  const alerts = report?.alerts;

  return (
    <DashboardLayout role={(user?.userType as 'teacher' | 'secretary') || 'teacher'} user={user || undefined}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Icon name="chart" className="text-primary" />
          التقارير
        </h1>

        <ReportFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApply={loadReport}
          loading={loading}
        />

        {loading ? (
          <>
            <KpiGridSkeleton />
            <ChartSkeleton />
            <TableSkeleton />
            <ChartSkeleton />
            <TableSkeleton />
          </>
        ) : (
          <>
            <TeacherSnapshot
              kpis={report?.summary ?? null}
              loading={false}
              onDrilldown={handleDrilldown}
            />

            {incomeTrends && (
              <>
                <IncomeTrends data={incomeTrends.summary} series={incomeTrends.series} />
                {monthlyIncome && monthlyIncome.length > 0 && (
                  <MonthlyIncomeTable data={monthlyIncome} />
                )}
              </>
            )}

            {studentActivity && (
              <>
                <StudentActivity metrics={studentActivity.metrics} />
                {studentActivity.students && studentActivity.students.length > 0 && (
                  <StudentActivityTable students={studentActivity.students} />
                )}
              </>
            )}

            {attendance && (
              <>
                <AttendancePerformanceCard data={attendance} />
                {attendance.by_group && attendance.by_group.length > 0 && (
                  <AttendanceDetailTable groups={attendance.by_group} />
                )}
              </>
            )}

            {groupBreakdown && groupBreakdown.groups.length > 0 && (
              <GroupBreakdown groups={groupBreakdown.groups} />
            )}

            {subscription && (
              <SubscriptionCapacity data={subscription} />
            )}

            {alerts && alerts.length > 0 && (
              <AlertsRecommendations alerts={alerts} onDrilldown={handleDrilldown} />
            )}
          </>
        )}

        {drilldown && !drilldownLoading && (
          <DrilldownTable
            data={drilldown}
            onClose={() => setDrilldown(null)}
            onPageChange={async (page) => {
              setDrilldownLoading(true);
              try {
                const data = await fetchTeacherDrilldown(drilldown.drilldown_key, page);
                setDrilldown(data);
              } catch {
                toast.error('فشل تحميل الصفحة');
              } finally {
                setDrilldownLoading(false);
              }
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
