'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type {
  AcademyReportFilters,
  AcademySnapshot as AcademySnapshotType,
  StudentDistribution,
  TeacherPerformanceResponse,
  AttendanceQuality,
  SessionExecution,
  SubscriptionUsage,
  TimeComparison as TimeComparisonType,
  AcademyAlert,
} from '@/types/academyReport.types';
import {
  getAcademySnapshot,
  getStudentDistribution,
  getTeacherPerformance,
  getAttendanceQuality,
  getSessionExecution,
  getSubscriptionUsage,
  getTimeComparison,
  getAcademyAlerts,
} from '@/services/academyReportService';

import ReportFiltersBar from './components/ReportFiltersBar';
import AcademySnapshot from './components/AcademySnapshot';
import StudentDistributionCharts from './components/StudentDistributionCharts';
import TeacherPerformanceTable from './components/TeacherPerformanceTable';
import AttendanceQualityPanel from './components/AttendanceQualityPanel';
import SessionExecutionReport from './components/SessionExecutionReport';
import SubscriptionUsageCard from './components/SubscriptionUsageCard';
import TimeComparisonPanel from './components/TimeComparisonPanel';
import AlertsPanel from './components/AlertsPanel';

type ReportTab = 'snapshot' | 'students' | 'teachers' | 'attendance' | 'sessions' | 'subscription' | 'comparison' | 'alerts';

const TABS: { key: ReportTab; label: string; icon: string }[] = [
  { key: 'snapshot', label: 'نظرة عامة', icon: 'chart-bar' },
  { key: 'students', label: 'توزيع الطلاب', icon: 'users' },
  { key: 'teachers', label: 'أداء المعلمين', icon: 'chalkboard-teacher' },
  { key: 'attendance', label: 'جودة الحضور', icon: 'check-circle' },
  { key: 'sessions', label: 'تنفيذ الحصص', icon: 'book-open' },
  { key: 'subscription', label: 'الاشتراك', icon: 'credit-card' },
  { key: 'comparison', label: 'مقارنة الفترات', icon: 'clock' },
  { key: 'alerts', label: 'التنبيهات', icon: 'bell' },
];

export default function ReportsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ReportTab>('snapshot');
  const [filters, setFilters] = useState<AcademyReportFilters>({ preset: 'this_month' });
  const [loadingSections, setLoadingSections] = useState<Set<string>>(new Set());

  const [snapshot, setSnapshot] = useState<AcademySnapshotType | null>(null);
  const [studentDistribution, setStudentDistribution] = useState<StudentDistribution | null>(null);
  const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformanceResponse | null>(null);
  const [attendanceQuality, setAttendanceQuality] = useState<AttendanceQuality | null>(null);
  const [sessionExecution, setSessionExecution] = useState<SessionExecution | null>(null);
  const [subscriptionUsage, setSubscriptionUsage] = useState<SubscriptionUsage | null>(null);
  const [timeComparison, setTimeComparison] = useState<TimeComparisonType | null>(null);
  const [alerts, setAlerts] = useState<AcademyAlert[] | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  const setLoading = (section: string, state: boolean) => {
    setLoadingSections((prev) => {
      const next = new Set(prev);
      if (state) next.add(section);
      else next.delete(section);
      return next;
    });
  };

  const loadSnapshot = useCallback(async () => {
    setLoading('snapshot', true);
    try {
      const data = await getAcademySnapshot(filters);
      setSnapshot(data);
    } catch {
      toast.error('فشل تحميل نظرة عامة');
    } finally {
      setLoading('snapshot', false);
    }
  }, [filters]);

  const loadStudentDistribution = useCallback(async () => {
    setLoading('students', true);
    try {
      const data = await getStudentDistribution(filters);
      setStudentDistribution(data);
    } catch {
      toast.error('فشل تحميل توزيع الطلاب');
    } finally {
      setLoading('students', false);
    }
  }, [filters]);

  const loadTeacherPerformance = useCallback(async (page = 1) => {
    setLoading('teachers', true);
    try {
      const data = await getTeacherPerformance(filters, page);
      setTeacherPerformance(data);
    } catch {
      toast.error('فشل تحميل أداء المعلمين');
    } finally {
      setLoading('teachers', false);
    }
  }, [filters]);

  const loadAttendanceQuality = useCallback(async () => {
    setLoading('attendance', true);
    try {
      const data = await getAttendanceQuality(filters);
      setAttendanceQuality(data);
    } catch {
      toast.error('فشل تحميل جودة الحضور');
    } finally {
      setLoading('attendance', false);
    }
  }, [filters]);

  const loadSessionExecution = useCallback(async (page = 1) => {
    setLoading('sessions', true);
    try {
      const data = await getSessionExecution(filters, page);
      setSessionExecution(data);
    } catch {
      toast.error('فشل تحميل تنفيذ الحصص');
    } finally {
      setLoading('sessions', false);
    }
  }, [filters]);

  const loadSubscriptionUsage = useCallback(async () => {
    setLoading('subscription', true);
    try {
      const data = await getSubscriptionUsage();
      setSubscriptionUsage(data);
    } catch {
      toast.error('فشل تحميل بيانات الاشتراك');
    } finally {
      setLoading('subscription', false);
    }
  }, []);

  const loadTimeComparison = useCallback(async () => {
    setLoading('comparison', true);
    try {
      const data = await getTimeComparison({ ...filters, comparison_mode: filters.comparison_mode || 'previous_period' });
      setTimeComparison(data);
    } catch {
      toast.error('فشل تحميل مقارنة الفترات');
    } finally {
      setLoading('comparison', false);
    }
  }, [filters]);

  const loadAlerts = useCallback(async () => {
    setLoading('alerts', true);
    try {
      const data = await getAcademyAlerts(filters);
      setAlerts(data);
    } catch {
      toast.error('فشل تحميل التنبيهات');
    } finally {
      setLoading('alerts', false);
    }
  }, [filters]);

  const loadActiveSection = useCallback(() => {
    switch (activeTab) {
      case 'snapshot': loadSnapshot(); break;
      case 'students': loadStudentDistribution(); break;
      case 'teachers': loadTeacherPerformance(); break;
      case 'attendance': loadAttendanceQuality(); break;
      case 'sessions': loadSessionExecution(); break;
      case 'subscription': loadSubscriptionUsage(); break;
      case 'comparison': loadTimeComparison(); break;
      case 'alerts': loadAlerts(); break;
    }
  }, [activeTab, loadSnapshot, loadStudentDistribution, loadTeacherPerformance, loadAttendanceQuality, loadSessionExecution, loadSubscriptionUsage, loadTimeComparison, loadAlerts]);

  useEffect(() => {
    if (user?.userType === 'academy') {
      loadActiveSection();
    }
  }, [activeTab]);

  const handleApplyFilters = () => {
    loadActiveSection();
  };

  if (!authLoading && (!user || user.userType !== 'academy')) return null;

  return (
    <DashboardLayout role="academy" user={user || { name: 'الأكاديمية' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">التقارير</h1>

        <ReportFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          onApply={handleApplyFilters}
          loading={loadingSections.size > 0}
        />

        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'snapshot' && (
          <AcademySnapshot data={snapshot} loading={loadingSections.has('snapshot')} />
        )}

        {activeTab === 'students' && (
          <StudentDistributionCharts data={studentDistribution} loading={loadingSections.has('students')} />
        )}

        {activeTab === 'teachers' && (
          <TeacherPerformanceTable
            data={teacherPerformance}
            loading={loadingSections.has('teachers')}
            onSort={() => loadTeacherPerformance()}
            onPageChange={(page) => loadTeacherPerformance(page)}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceQualityPanel data={attendanceQuality} loading={loadingSections.has('attendance')} />
        )}

        {activeTab === 'sessions' && (
          <SessionExecutionReport
            data={sessionExecution}
            loading={loadingSections.has('sessions')}
            onPageChange={(page) => loadSessionExecution(page)}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionUsageCard data={subscriptionUsage} loading={loadingSections.has('subscription')} />
        )}

        {activeTab === 'comparison' && (
          <TimeComparisonPanel data={timeComparison} loading={loadingSections.has('comparison')} />
        )}

        {activeTab === 'alerts' && (
          <AlertsPanel alerts={alerts} loading={loadingSections.has('alerts')} />
        )}
      </div>
    </DashboardLayout>
  );
}
