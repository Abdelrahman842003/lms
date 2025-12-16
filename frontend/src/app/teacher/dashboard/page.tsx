'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DataTable } from '@/components/dashboard/DataTable';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';


export default function TeacherDashboard() {
  const { user } = useAuth();

  const [stats, setStats] = React.useState({
    totalStudents: 0,
    activeStudents: 0,
    totalRevenue: 0,
    upcomingLectures: 0,
  });
  const [students, setStudents] = React.useState<any[]>([]);
  const [lectures, setLectures] = React.useState<any[]>([]);
  const [exams, setExams] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const { getTeacherDashboardStats, getTeacherRecentStudents, getTeacherUpcomingLectures, getExams } = await import('@/services/authService');
        
        const [statsData, studentsData, lecturesData, examsData] = await Promise.all([
          getTeacherDashboardStats(),
          getTeacherRecentStudents(5),
          getTeacherUpcomingLectures(3),
          getExams(),
        ]);

        setStats({
          totalStudents: statsData.total_students || 0,
          activeStudents: statsData.active_students || 0,
          totalRevenue: statsData.total_revenue || 0,
          upcomingLectures: statsData.upcoming_lectures || 0,
        });
        setStudents(studentsData.students || []);
        setLectures(lecturesData.lectures || []);
        setExams(examsData || []);
      } catch (error: any) {
        console.error('Failed to fetch dashboard data:', error);
        
        // If unauthorized, logout the user and clear storage
        if (error.status === 401 || error.message?.toLowerCase().includes('unauthenticated')) {
          // Clear localStorage and redirect to login
          // Clear localStorage and redirect to login
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
          title="المحاضرات القادمة"
          value={stats.upcomingLectures}
          icon="fas fa-calendar-check"
          color="danger"
          trend={{ value: 0, label: 'محاضرات مجدولة قريباً', isPositive: true }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {/* Recent Students */}
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

        {/* Upcoming Lectures */}
        <DashboardCard
          title="المحاضرات القادمة"
          action={
            <Link href="/teacher/lectures" className="btn btn-sm btn-outline">
              عرض الكل
            </Link>
          }
        >
          <div className="flex flex-col gap-3">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-20 flex flex-col justify-center p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="skeleton-item w-[60%] h-5 mb-2 bg-white/10 rounded"></div>
                  <div className="skeleton-item w-[40%] h-4 bg-white/10 rounded"></div>
                </div>
              ))
            ) : lectures.length > 0 ? (
              lectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/5 transition-all duration-300 hover:bg-white/10"
                >
                  <h3 className="text-[1rem] font-bold text-white mb-2">
                    {lecture.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[0.85rem] text-gray-400">
                    <span className="flex items-center gap-1">
                      <i className="fas fa-calendar"></i>
                      <span>{lecture.day_name}</span>
                    </span>
                    <span className="opacity-50">|</span>
                    <span>{lecture.date}</span>
                    <span className="opacity-50">|</span>
                    <span>{lecture.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 p-5">
                لا توجد محاضرات
              </p>
            )}
          </div>
        </DashboardCard>
      </div>

      {/* Quick Actions & Exams Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 mt-6">
        {/* Quick Actions */}
        <DashboardCard
          title="إجراءات سريعة"
        >
          <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4">
            <Link href="/teacher/students/add" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl">
                <i className="fas fa-user-plus"></i>
              </div>
              <span className="font-semibold">إضافة طالب</span>
            </Link>

            <Link href="/teacher/lectures" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20 text-success hover:bg-success/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl">
                <i className="fas fa-video"></i>
              </div>
              <span className="font-semibold">إضافة محاضرة</span>
            </Link>

            <Link href="/teacher/exams" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning hover:bg-warning/20 transition-all duration-300 hover:-translate-y-1">
              <div className="text-2xl">
                <i className="fas fa-file-alt"></i>
              </div>
              <span className="font-semibold">إنشاء امتحان</span>
            </Link>
          </div>
        </DashboardCard>

        {/* Upcoming Exams */}
        <DashboardCard
          title="الامتحانات القادمة"
          action={
            <Link href="/teacher/exams" className="btn btn-sm btn-outline">
              عرض الكل
            </Link>
          }
        >
          <div className="flex flex-col gap-3">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-20 flex flex-col justify-center p-4 bg-white/5 rounded-xl border border-white/5">
                  <div className="skeleton-item w-[60%] h-5 mb-2 bg-white/10 rounded"></div>
                  <div className="skeleton-item w-[40%] h-4 bg-white/10 rounded"></div>
                </div>
              ))
            ) : exams.length > 0 ? (
              exams.slice(0, 3).map((exam) => (
                <div
                  key={exam.id}
                  className="p-4 bg-white/5 rounded-xl border border-white/5 transition-all duration-300 hover:bg-white/10 flex justify-between items-center"
                >
                  <div>
                    <h3 className="text-[1rem] font-bold text-white mb-1">
                      {exam.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[0.85rem] text-gray-400">
                      <span>{exam.subject?.name || 'مادة عامة'}</span>
                      <span>•</span>
                      <span>{exam.grade?.name || 'جميع الصفوف'}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-[0.9rem] font-bold text-white">
                      {new Date(exam.start_date || exam.created_at).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="text-[0.8rem] text-gray-400">
                      {exam.duration} دقيقة
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 p-5">
                لا توجد امتحانات
              </p>
            )}
          </div>
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
