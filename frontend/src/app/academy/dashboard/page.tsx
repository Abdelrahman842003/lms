'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { AcademyStatsCharts } from '@/components/dashboard/AcademyStatsCharts';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import academyService from '@/services/academyService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AcademyDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    teachers_count: 0,
    students_count: 0,
    total_enrollments: 0,
    expected_revenue: 0,
    actual_revenue: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Redirect if not authenticated or not academy
  React.useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.userType !== 'academy')) {
      router.push('/login');
    }
  }, [isAuthenticated, user, authLoading, router]);

  React.useEffect(() => {
    if (!user || user.userType !== 'academy') return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch academy dashboard stats
        const response = await academyService.getDashboardStats();

        if (response) {
          // The service returns response.data, so we use it directly or check structure
          // Based on service implementation: return response.data
          // And controller returns: { data: stats } or similar
          // Let's look at the service again. 
          // Service: return response.data
          // Controller: return $this->successResponse($stats); -> { status: true, data: $stats }
          
          const data = response.data || response;
          setStats(data || {});
          setTeachers(data.teachers || []);
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (authLoading || !user || user.userType !== 'academy') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const tableColumns = [
    {
      key: 'name',
      label: 'اسم المدرس',
      sortable: true,
      render: (value: any, row: any) => (
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
      key: 'students_count',
      label: 'عدد الطلاب',
      sortable: true,
      className: 'hidden sm:table-cell',
    },

  ];

  return (
    <DashboardLayout
      role="academy"
      user={user}
    >
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          مرحباً بك في {user.name || 'الأكاديمية'}
        </h1>
        <p className="text-gray-400">
          نظرة عامة على إحصائيات الأكاديمية
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي المدرسين"
          value={stats.teachers_count || 0}
          icon="fas fa-chalkboard-teacher"
          color="primary"
        />
        <StatCard
          title="إجمالي الطلاب"
          value={stats.students_count || 0}
          icon="fas fa-user-graduate"
          color="secondary"
        />
        <StatCard
          title="إجمالي الارتباطات"
          value={stats.total_enrollments || 0}
          icon="fas fa-link"
          color="info"
        />

      </div>

      {/* Charts */}
      <div className="lg:col-span-2 mb-8">
        <AcademyStatsCharts stats={stats} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Teachers Overview */}
        <DashboardCard
          title="المدرسين في الأكاديمية"
          action={
            <Link href="/academy/teachers" className="text-primary text-sm hover:text-primary-light transition-colors">
              عرض الكل
            </Link>
          }
          noPadding
        >
          {teachers.length > 0 ? (
            <DataTable
              columns={tableColumns}
              data={teachers.slice(0, 10)}
              isLoading={isLoading}
              searchable={false}
              pagination={false}
            />
          ) : (
            <div className="p-8 text-center text-gray-400">
              <i className="fas fa-users text-4xl mb-4 opacity-50"></i>
              <p>لا يوجد مدرسين مسجلين في الأكاديمية حالياً</p>
            </div>
          )}
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

export default AcademyDashboard;
