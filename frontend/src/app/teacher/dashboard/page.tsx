'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { TeacherStatsCharts } from '@/components/dashboard/TeacherStatsCharts';
import { useAuth } from '@/contexts/AuthContext';


export default function TeacherDashboard() {
  const { user } = useAuth();

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

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const { getTeacherDashboardStats, getTeacherRecentStudents } = await import('@/services/authService');
        
        const [statsData, studentsData] = await Promise.all([
          getTeacherDashboardStats(),
          getTeacherRecentStudents(5),
        ]);

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
        
        // If unauthorized, logout the user and clear storage
        if (error.status === 401 || error.message?.toLowerCase().includes('unauthenticated')) {
          localStorage.clear();
          document.cookie = "auth_state=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "laravel_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          document.cookie = "XSRF-TOKEN=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  
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
    {
      key: 'attendance_stats',
      label: 'الحضور (الشهر)',
      className: 'd-none-lg',
      render: (stats: any) => (
        <div className="attendance-stats">
          <span>{stats?.present_count || 0} / {stats?.total_lectures || 8}</span>
          <span className="attendance-percentage">
            {stats?.average || 0}%
          </span>
        </div>
      ),
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
