'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { AcademyStatsCharts } from '@/components/dashboard/AcademyStatsCharts';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function AcademyDashboard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    teachers_count: 0,
    students_count: 0,
    total_revenue: 0,
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
        const response = await fetch('/api/academy/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data || {});
          setTeachers(data.data?.teachers || []);
        }
      } catch (error) {
        console.error('Failed to fetch academy dashboard data', error);
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
      key: 'students_count',
      label: 'عدد الطلاب',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'status',
      label: 'الحالة',
      sortable: true,
      render: (value: string) => (
        <span className={value === 'نشط' ? 'badge badge-success' : 'badge badge-danger'}>
          {value}
        </span>
      ),
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
          title="الإيرادات المتوقعة"
          value={stats.total_revenue || 0}
          icon="fas fa-wallet"
          color="success"
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
