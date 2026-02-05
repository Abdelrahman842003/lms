'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { withAdminAuth } from '@/components/auth/withAdminAuth';
import Link from 'next/link';

function AdminDashboard() {
  const { user } = useAuth();
  const [teachers, setTeachers] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState({
    teachers_count: 0,
    students_count: 0,
    secretaries_count: 0,
    total_revenue: 0,
    active_enrollments_count: 0,
    price_per_student: 0,
  });
  const [systemActivity, setSystemActivity] = React.useState<any[]>([]);

  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Dynamic import to avoid circular dependency issues if any
        const { getTeachers, getDashboardStats } = await import('@/services/authService');
        const [teachersRes, statsRes] = await Promise.all([
          getTeachers(),
          getDashboardStats()
        ]);
        
        const teachersList = teachersRes.data || [];
        setTeachers(teachersList);
        
        // Calculate total revenue by summing each teacher's revenue
        // This ensures: sum of (each teacher's students × price)
        const sumOfTeacherRevenues = teachersList.reduce((sum: number, teacher: any) => {
          return sum + (teacher.revenue || 0);
        }, 0);
        
        // Calculate sum of all students across teachers
        const totalStudentsAcrossTeachers = teachersList.reduce((sum: number, teacher: any) => {
          return sum + (teacher.students_count || 0);
        }, 0);
        
        setStats({
          ...statsRes,
          total_revenue: sumOfTeacherRevenues > 0 ? sumOfTeacherRevenues : statsRes.total_revenue,
          active_enrollments_count: totalStudentsAcrossTeachers > 0 ? totalStudentsAcrossTeachers : statsRes.active_enrollments_count,
        });
        
        // If there's an API for system activity, fetch it here. Otherwise, leave it empty.
        setSystemActivity([]); 
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const tableColumns = [
    {
      key: 'name',
      label: 'الاسم',
      sortable: true,
    },
    {
      key: 'students_count',
      label: 'عدد الطلاب',
      sortable: true,
      className: 'hidden sm:table-cell',
    },
    {
      key: 'secretaries_count',
      label: 'عدد السكرتارية',
      sortable: true,
      className: 'hidden md:table-cell',
    },
    {
      key: 'revenue',
      label: 'الإيرادات',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (value: number, item: any) => {
        // Fallback calculation if backend returns 0 (due to potential caching/resource issues)
        const revenue = value || (item.students_count * (stats.price_per_student || 0));
        return `$${revenue?.toLocaleString() || '0'}`;
      },
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
    {
      key: 'joined',
      label: 'تاريخ الانضمام',
      sortable: true,
      className: 'hidden xl:table-cell',
    },
  ];

  return (
    <DashboardLayout
      role="admin"
      user={user || undefined}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="إجمالي المدرسين"
          value={stats.teachers_count}
          icon="fas fa-chalkboard-teacher"
          color="primary"
          trend={{ value: 12, label: 'مقارنة بالشهر الماضي', isPositive: true }}
        />
        <StatCard
          title="إجمالي الطلاب"
          value={stats.students_count}
          icon="fas fa-user-graduate"
          color="secondary"
          trend={{ value: 8, label: 'مقارنة بالشهر الماضي', isPositive: true }}
        />
        <StatCard
          title="إجمالي السكرتارية"
          value={stats.secretaries_count}
          icon="fas fa-user-tie"
          color="warning"
          trend={{ value: 2, label: 'مقارنة بالشهر الماضي', isPositive: true }}
        />
        <StatCard
          title="الإيرادات"
          value={stats.total_revenue}
          icon="fas fa-wallet"
          color="success"
          trend={{ value: 15, label: 'مقارنة بالشهر الماضي', isPositive: true }}
        >
          <div className="text-xs text-gray-400 mt-2">
            {stats.active_enrollments_count} اشتراك × {stats.price_per_student || 0} ج.م
          </div>
        </StatCard>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers Overview */}
        <DashboardCard
          title="نظرة عامة على المدرسين"
          action={
            <Link href="/admin/teachers" className="text-primary text-sm hover:text-primary-light transition-colors">
              عرض الكل
            </Link>
          }
          noPadding
        >
          <DataTable
            columns={tableColumns}
            data={teachers.slice(0, 5)}
            isLoading={isLoading}
            searchable={false}
            pagination={false}
          />
        </DashboardCard>

        {/* System Activity */}
        <DashboardCard
          title="نشاط النظام"
          action={<i className="fas fa-history text-gray-400"></i>}
        >
          <div className="flex flex-col gap-3">
            {systemActivity.length > 0 ? (
              systemActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <i className="fas fa-bell text-primary"></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[0.95rem] font-semibold text-white mb-1">
                        {activity.action}
                      </h4>
                      <p className="text-[0.85rem] text-gray-400">
                        بواسطة {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 p-5">
                لا توجد نشاطات
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}

// Export protected component
export default withAdminAuth(AdminDashboard);
