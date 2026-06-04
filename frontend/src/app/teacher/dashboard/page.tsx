'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { TeacherStatsCharts } from '@/components/dashboard/TeacherStatsCharts';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { initializeEcho } from '@/lib/echo';
import { getAccessToken } from '@/lib/tokenManager';

export default function TeacherDashboard() {
  const { user, selectedAcademy, isLoading: authLoading, isAuthenticated } = useAuth();

  const [stats, setStats] = React.useState({
    totalStudents: 0,
    activeStudents: 0,
    totalGroups: 0,
    totalExams: 0,
    averageAttendance: 0,
    averageExamScore: 0,
    attendanceTrend: [],
    examPerformanceTrend: [],
  });
  const [students, setStudents] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchDashboardData = React.useCallback(async () => {
    if (authLoading || !isAuthenticated || user?.userType !== 'teacher') {
      return;
    }

    try {
      setIsLoading(true);
      const { getTeacherDashboardStats, getTeacherRecentStudents } = await import('@/services/authService');
      
      const academyId = selectedAcademy?.id || (selectedAcademy?.name === 'مدرس مستقل' ? 'independent' : null);
      
      const [statsData, studentsData] = await Promise.all([
        getTeacherDashboardStats(academyId),
        getTeacherRecentStudents(5, academyId),
      ]) as [any, any];

      setStats({
        totalStudents: statsData.total_students || 0,
        activeStudents: statsData.active_students || 0,
        totalGroups: statsData.total_groups || 0,
        totalExams: statsData.total_exams || 0,
        averageAttendance: statsData.average_attendance || 0,
        averageExamScore: statsData.average_exam_score || 0,
        attendanceTrend: statsData.attendance_trend || [],
        examPerformanceTrend: statsData.exam_performance_trend || [],
      });
      setStudents(studentsData.students || []);
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, authLoading, selectedAcademy]);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates via Echo
  React.useEffect(() => {
    if (!isAuthenticated || !user || user.userType !== 'teacher') return;

    const token = getAccessToken();
    if (!token) return;

    const echo = initializeEcho(token);
    const channelName = `teacher.${user.id}`;
    
    const channel = echo.private(channelName);
    
    channel.listen('.lecture.updated', (data: any) => {
      console.log('Real-time lecture.updated received for Teacher:', data);
      fetchDashboardData(); // Refresh all dashboard data
    });

    channel.listen('.lecture.activated', (data: any) => {
      console.log('Real-time lecture.activated received for Teacher:', data);
      fetchDashboardData();
    });

    channel.listen('.lecture.closed', (data: any) => {
      console.log('Real-time lecture.closed received for Teacher:', data);
      fetchDashboardData();
    });

    return () => {
      echo.leave(channelName);
    };
  }, [user, isAuthenticated, fetchDashboardData]);
  
  const tableColumns = [
    {
      key: 'name',
      label: 'الاسم',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="table-avatar-wrapper">
          <div className="table-avatar-circle">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={value}
                className="table-avatar-img"
              />
            ) : (
              <span className="table-avatar-placeholder">
                {value.charAt(0)}
              </span>
            )}
          </div>
          <span className="table-avatar-name">{value}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'رقم الطالب',
      sortable: true,
      className: 'd-none-md',
    },
    {
      key: 'grade_name',
      label: 'الصف الدراسي',
      sortable: true,
      className: 'd-none-sm',
    },
    {
      key: 'group_name',
      label: 'المجموعة',
      sortable: true,
      className: 'd-none-sm',
    },
  ];

  return (
    <DashboardLayout
      role={user?.userType as 'teacher' | 'secretary' || 'teacher'}
      user={user || undefined}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="الطلاب النشطين"
          value={stats.activeStudents}
          icon="fas fa-users"
          color="success"
          trend={{ value: 5, label: 'مقارنة بالشهر الماضي', isPositive: true }}
        />
        <StatCard
          title="عدد المجموعات"
          value={stats.totalGroups}
          icon="fas fa-layer-group"
          color="primary"
        />
        <StatCard
          title="عدد الامتحانات"
          value={stats.totalExams}
          icon="fas fa-file-alt"
          color="warning"
        />
        <StatCard
          title="متوسط الحضور"
          value={stats.averageAttendance}
          suffix="%"
          icon="fas fa-chart-pie"
          color="info"
        />
      </div>

        {/* Teacher Statistics Charts */}
        <div className="lg:col-span-2">
          <TeacherStatsCharts stats={stats} />
        </div>

      
      {/* Recent Students Table */}
      <div className="mt-6">
        <DashboardCard
          title="آخر الطلاب"
          noPadding
        >
          <DataTable
            columns={tableColumns.slice(0, 3)}
            data={students.slice(0, 5)}
            isLoading={isLoading}
            searchable={false}
            pagination={false}
          />
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
