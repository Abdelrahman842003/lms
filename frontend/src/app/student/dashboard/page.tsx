'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import Link from 'next/link';
import { Button, Icon } from '@/components/ui/index';

export default function StudentDashboard() {
  const { user, selectedTeacher, isLoading: authLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    walletBalance: 0,
    mistakesCount: 0,
    totalPoints: 0,
    upcomingExamsCount: 0,
    attendanceRate: 0,
    examAverage: 0,
  });
  const [upcomingLectures, setUpcomingLectures] = useState<any[]>([]);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.userType !== 'student') {
      return;
    }

    const loadDashboardData = async () => {
      // Always load dashboard stats for the selected teacher (if any)
      if (selectedTeacher) {
        try {
            const timestamp = new Date().getTime();
            const dashboardResponse = await fetchApi(`/student/dashboard?teacher_id=${selectedTeacher.teacher_id}&t=${timestamp}`);
            if (dashboardResponse) {
                setStats(dashboardResponse.stats || {
                    walletBalance: 0,
                    mistakesCount: 0,
                    totalPoints: 0,
                    upcomingExamsCount: 0,
                    attendanceRate: 0,
                    examAverage: 0,
                });
                setLatestNews(dashboardResponse.latestNews || []);
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
  }, [selectedTeacher, user, authLoading, isAuthenticated, user?.userType]); // Wait for auth readiness
  
  const mockUser = {
    name: user?.name || 'الطالب',
    avatar: user?.avatar || '',
  };

  return (
    <DashboardLayout
      role="student"
      user={mockUser}
    >
      <div className="max-w-[1200px] mx-auto">
      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
        <StatCard
          title="أخطائي"
          value={stats.mistakesCount}
          icon="fas fa-exclamation-triangle"
          color="danger"
        />
        <StatCard
          title="نقاطي"
          value={stats.totalPoints}
          icon="fas fa-trophy"
          color="warning"
        />
        <StatCard
          title="نسبة الحضور"
          value={stats.attendanceRate}
          suffix="%"
          icon="fas fa-check-circle"
          color="success"
        />
        <StatCard
          title="متوسط الدرجات"
          value={stats.examAverage}
          suffix="%"
          icon="fas fa-chart-line"
          color="info"
        />
      </div>

      {/* Quick Access Section - Added for better navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/student/leaderboard" className="block group">
          <Button
            variant="ghost"
            className="w-full h-auto p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-2xl transition-all duration-300 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-xl group-hover:scale-110 transition-transform">
                <Icon name="trophy" className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">لوحة الشرف</h3>
                <p className="text-sm text-gray-400">نافس زملاءك واجمع النقاط</p>
              </div>
            </div>
            <Icon name="arrow-left" className="text-gray-500 group-hover:text-primary transition-colors" />
          </Button>
        </Link>

        <Link href="/student/mistakes" className="block group">
          <Button
            variant="ghost"
            className="w-full h-auto p-6 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-2xl transition-all duration-300 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 text-xl group-hover:scale-110 transition-transform">
                <Icon name="exclamation-circle" className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">أخطائي</h3>
                <p className="text-sm text-gray-400">راجع أخطاءك وتعلم منها</p>
              </div>
            </div>
            <Icon name="arrow-left" className="text-gray-500 group-hover:text-red-500 transition-colors" />
          </Button>
        </Link>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
        {/* Upcoming Lectures */}
        <DashboardCard
          title="المحاضرات القادمة"
          icon="fas fa-calendar-alt"
          action={
            <Link href="/student/lectures" className="inline-flex">
              <Button variant="outline" size="sm">
                عرض الكل
              </Button>
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
                            <Icon name="calendar" className="ml-1.5" />
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

        {/* Latest News */}
        <DashboardCard
          title="آخر الأخبار"
          icon="fas fa-newspaper"
        >
          <div className="flex flex-col gap-4">
            {latestNews.length === 0 ? (
                <p className="text-center text-gray-light p-5">لا توجد أخبار حديثة</p>
            ) : (
                latestNews.map((item, index) => (
                <div key={`${item.type}-${item.id}-${index}`} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        item.type === 'attendance'
                            ? (item.status === 'present' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger')
                            : 'bg-primary/20 text-primary'
                    }`}>
                        <Icon name={
                            item.type === 'attendance'
                                ? (item.status === 'present' ? 'check' : 'times')
                                : 'file-alt'
                        } />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-400">
                            {item.type === 'attendance' ? (
                                item.status === 'present' ? 'تم حضور المحاضرة' : 'غياب عن المحاضرة'
                            ) : (
                                `تم رصد درجة الامتحان: ${item.score}/${item.total}`
                            )}
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 block mb-1">{item.date}</span>
                        {item.type === 'exam' && (
                             <span className={`text-xs font-bold ${
                                (item.score / item.total) >= 0.5 ? 'text-success' : 'text-danger'
                             }`}>
                                {Math.round((item.score / item.total) * 100)}%
                             </span>
                        )}
                    </div>
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
