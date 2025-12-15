'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/services/authService';
import Link from 'next/link';

export default function StudentDashboard() {
  const { user, selectedTeacher } = useAuth();
  const [stats, setStats] = useState({
    walletBalance: 0,
    purchasedLectures: 0,
    attendanceRate: 0,
    examAverage: 0,
  });
  const [upcomingLectures, setUpcomingLectures] = useState<any[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Always load dashboard stats for the selected teacher (if any)
      if (selectedTeacher) {
        try {
            const dashboardResponse = await fetchApi(`/student/dashboard?teacher_id=${selectedTeacher.teacher_id}`);
            if (dashboardResponse) {
                setStats(dashboardResponse.stats || {
                    walletBalance: 0,
                    purchasedLectures: 0,
                    attendanceRate: 0,
                    examAverage: 0,
                });
                setRecentExams(dashboardResponse.recentExams || []);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
      }

      // Load lectures from ALL teachers
      if (user && user.teachers && user.teachers.length > 0) {
        try {
            const lecturePromises = user.teachers.map(teacher => 
                fetchApi(`/student/lectures?teacher_id=${teacher.teacher_id}`)
                    .then(res => ({ teacher, data: res.data || [] }))
                    .catch(err => {
                        console.error(`Failed to load lectures for teacher ${teacher.teacher_name}:`, err);
                        return { teacher, data: [] };
                    })
            );

            const results = await Promise.all(lecturePromises);
            
            let allLectures: any[] = [];
            results.forEach(({ teacher, data }) => {
                const lecturesWithTeacher = data.map((lecture: any) => ({
                    ...lecture,
                    teacher_avatar: teacher.teacher_avatar,
                    teacher_name: teacher.teacher_name
                }));
                allLectures = [...allLectures, ...lecturesWithTeacher];
            });

            const now = new Date();
            
            // Filter for upcoming/active lectures
            const upcoming = allLectures.filter((lecture: any) => {
                if (lecture.iso_end_time) {
                    return new Date(lecture.iso_end_time) > now;
                }
                return true; 
            });

            // Sort by active status first, then by date ascending (nearest first)
            upcoming.sort((a: any, b: any) => {
                // Prioritize active lectures
                if (a.is_active && !b.is_active) return -1;
                if (!a.is_active && b.is_active) return 1;

                // Then sort by date
                const dateA = new Date(a.iso_start_time || a.date);
                const dateB = new Date(b.iso_start_time || b.date);
                return dateA.getTime() - dateB.getTime();
            });

            setUpcomingLectures(upcoming.slice(0, 4));

        } catch (error) {
            console.error('Failed to load aggregated lectures:', error);
        }
      }
    };

    loadDashboardData();
  }, [selectedTeacher, user]); // Added user dependency
  
  const mockUser = {
    name: user?.name || 'الطالب',
    avatar: user?.avatar || '',
  };

  // if (loading) {
  //   return (
  //     <DashboardLayout role="student" user={mockUser}>
  //       <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
  //         <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '16px' }}></i>
  //         <p>جاري تحميل البيانات...</p>
  //       </div>
  //     </DashboardLayout>
  //   );
  // }


  return (
    <DashboardLayout
      role="student"
      user={mockUser}
    >
      <div className="max-w-[1200px] mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="المحاضرات المشتراة"
          value={stats.purchasedLectures}
          icon="fas fa-book-open"
          color="primary"
        />
        <StatCard
          title="نسبة الحضور"
          value={stats.attendanceRate}
          suffix="%"
          icon="fas fa-check-circle"
          color="warning"
        />
        <StatCard
          title="متوسط الدرجات"
          value={stats.examAverage}
          suffix="%"
          icon="fas fa-chart-line"
          color="danger"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {/* Upcoming Lectures */}
        <DashboardCard
          title="المحاضرات القادمة"
          icon="fas fa-calendar-alt"
          action={
            <Link href="/student/lectures" className="btn btn-sm btn-outline">
              عرض الكل
            </Link>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingLectures.length === 0 ? (
                <div className="col-span-full text-center text-gray-light p-5">
                  لا توجد محاضرات قادمة
                </div>
            ) : (
                upcomingLectures.slice(0, 4).map((lecture) => {
                  const isActive = lecture.is_active; // Assuming API returns is_active, or use time check
                  return (
                <div
                    key={lecture.id}
                    className={`p-4 rounded-xl flex justify-between items-center transition-all duration-300 relative overflow-hidden card-hover ${
                      isActive 
                        ? 'bg-[#2ecc71]/5 border border-success' 
                        : 'bg-white/3 border border-white/5'
                    }`}
                >
                    <div className="flex items-center gap-3">
                      {lecture.teacher_avatar && (
                        <img 
                          src={lecture.teacher_avatar} 
                          alt={lecture.teacher_name} 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
                        />
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-white mb-1.5">
                            {lecture.title}
                        </h3>
                        <p className="text-sm text-gray-light">
                            <i className="fas fa-calendar ml-1.5"></i>
                            {lecture.date} - {lecture.time}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${isActive ? 'badge-success' : 'badge-primary'}`}>
                      {isActive ? 'جاري الآن' : lecture.status}
                    </span>
                    {isActive && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-success" />
                    )}
                </div>
                )})
            )}
          </div>
        </DashboardCard>

        {/* Recent Exams */}
        <DashboardCard
          title="آخر النتائج"
          icon="fas fa-trophy"
          action={
            <Link href="/student/exams" className="btn btn-sm btn-outline">
              عرض الكل
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            {recentExams.length === 0 ? (
                <p className="text-center text-gray-light p-5">لا توجد نتائج امتحانات حديثة</p>
            ) : (
                recentExams.map((exam) => (
                <div key={exam.id}>
                    <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">
                        {exam.title}
                    </span>
                    <span
                        className={`font-bold text-[1.1rem] ${
                          exam.score >= 80 ? 'text-success' : exam.score >= 60 ? 'text-warning' : 'text-danger'
                        }`}
                    >
                        {exam.score}/{exam.total}
                    </span>
                    </div>
                    <div className="progress-bar">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${(exam.score / exam.total) * 100}%` }}
                    ></div>
                    </div>
                    <p className="text-xs text-gray-light mt-1">
                    {exam.date}
                    </p>
                </div>
                ))
            )}
          </div>
        </DashboardCard>
      </div>

      </div>
    </DashboardLayout>
  );
}
