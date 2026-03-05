'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import Link from 'next/link';
import { LoadingSpinner, Icon } from '@/components/ui';

interface ChildSummary {
  id: string;
  name: string;
  avatar: string | null;
  attendance_rate: number;
  exam_average: number;
  total_points: number;
  pending_mistakes: number;
  teacher_count: number;
}

export default function ParentDashboard() {
  const router = useRouter();
  const { user, children, isLoading: authLoading, isAuthenticated } = useAuth();
  const [childrenSummaries, setChildrenSummaries] = useState<ChildSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isAuthenticated || user?.userType !== 'parent') {
      return;
    }

    const loadDashboardData = async () => {
      if (!children || children.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch summary for each child
        const summaries = await Promise.all(
          children.map(async (child) => {
            try {
              const data = await fetchApi(`/parent/children/${child.id}/summary?period=month&date=${new Date().toISOString().split('T')[0]}`);
              
              // Calculate aggregated stats
              const stats = data.teachers?.reduce(
                (acc: any, t: any) => ({
                  attendance_rate: acc.attendance_rate + t.attendance.rate,
                  exam_average: acc.exam_average + t.exams.average,
                  total_points: acc.total_points + t.points.total,
                  pending_mistakes: acc.pending_mistakes + t.mistakes.pending,
                  teacher_count: acc.teacher_count + 1,
                }),
                { attendance_rate: 0, exam_average: 0, total_points: 0, pending_mistakes: 0, teacher_count: 0 }
              ) || { attendance_rate: 0, exam_average: 0, total_points: 0, pending_mistakes: 0, teacher_count: 0 };

              return {
                id: child.id,
                name: child.name,
                avatar: child.avatar,
                attendance_rate: stats.teacher_count > 0 ? Math.round(stats.attendance_rate / stats.teacher_count) : 0,
                exam_average: stats.teacher_count > 0 ? Math.round(stats.exam_average / stats.teacher_count) : 0,
                total_points: stats.total_points,
                pending_mistakes: stats.pending_mistakes,
                teacher_count: stats.teacher_count,
              };
            } catch (error) {
              return {
                id: child.id,
                name: child.name,
                avatar: child.avatar,
                attendance_rate: 0,
                exam_average: 0,
                total_points: 0,
                pending_mistakes: 0,
                teacher_count: child.teachers?.length || 0,
              };
            }
          })
        );

        setChildrenSummaries(summaries);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [children, authLoading, isAuthenticated, user?.userType]);

  // Calculate overall stats
  const overallStats = childrenSummaries.reduce(
    (acc, child) => ({
      totalChildren: acc.totalChildren + 1,
      avgAttendance: acc.avgAttendance + child.attendance_rate,
      avgExams: acc.avgExams + child.exam_average,
      totalPoints: acc.totalPoints + child.total_points,
      totalMistakes: acc.totalMistakes + child.pending_mistakes,
    }),
    { totalChildren: 0, avgAttendance: 0, avgExams: 0, totalPoints: 0, totalMistakes: 0 }
  );

  const avgAttendance = overallStats.totalChildren > 0 
    ? Math.round(overallStats.avgAttendance / overallStats.totalChildren) 
    : 0;
  const avgExams = overallStats.totalChildren > 0 
    ? Math.round(overallStats.avgExams / overallStats.totalChildren) 
    : 0;

  return (
    <DashboardLayout
      role="parent"
      user={{ name: user?.name || 'ولي الأمر', avatar: user?.avatar }}
    >
      <div className="max-w-[1200px] mx-auto">
        {/* Overall Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-8">
          <StatCard
            title="إجمالي الأبناء"
            value={children.length}
            icon="users"
            color="primary"
          />
          <StatCard
            title="متوسط الحضور"
            value={avgAttendance}
            suffix="%"
            icon="check-circle"
            color="success"
          />
          <StatCard
            title="متوسط الدرجات"
            value={avgExams}
            suffix="%"
            icon="chart-line"
            color="info"
          />
          <StatCard
            title="إجمالي النقاط"
            value={overallStats.totalPoints}
            icon="star"
            color="warning"
          />
        </div>

        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/parent/children" className="block group">
            <div className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-2xl p-6 transition-all duration-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary text-xl group-hover:scale-110 transition-transform">
                  <Icon name="users" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">أبنائي</h3>
                  <p className="text-sm text-gray-400">عرض جميع الأبناء والتقارير</p>
                </div>
              </div>
              <Icon name="arrow-left" className="text-gray-500 group-hover:text-primary transition-colors" />
            </div>
          </Link>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 text-xl">
                <Icon name="exclamation-triangle" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">أخطاء معلقة</h3>
                <p className="text-2xl font-bold text-red-400">{overallStats.totalMistakes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Children Summaries */}
        <DashboardCard
          title="آخر التحديثات"
          icon="chart-bar"
          action={
            <Link href="/parent/children" className="text-primary hover:underline text-sm">
              عرض الكل
            </Link>
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" color="primary" />
            </div>
          ) : childrenSummaries.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Icon name="user-slash" size="2x" className="text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">لا يوجد أبناء</h3>
              <p className="text-gray-400">لم يتم تسجيل أي طالب برقم هاتفك</p>
            </div>
          ) : (
            <div className="space-y-4">
              {childrenSummaries.map((child) => (
                <div
                  key={child.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => router.push(`/parent/${child.id}/summary`)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                      {child.avatar ? (
                        <img src={child.avatar} alt={child.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-lg font-bold">
                          {child.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">{child.name}</h3>
                      <p className="text-sm text-gray-400">
                        <Icon name="chalkboard-teacher" className="ml-1" />
                        {child.teacher_count} مدرس
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-[#0D1120] rounded-lg p-3 text-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                        <Icon name="check" className="text-green-400 text-sm" />
                      </div>
                      <p className="text-lg font-bold text-white">{child.attendance_rate}%</p>
                      <p className="text-xs text-gray-400">الحضور</p>
                    </div>

                    <div className="bg-[#0D1120] rounded-lg p-3 text-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                        <Icon name="chart-line" className="text-blue-400 text-sm" />
                      </div>
                      <p className="text-lg font-bold text-white">{child.exam_average}%</p>
                      <p className="text-xs text-gray-400">الدرجات</p>
                    </div>

                    <div className="bg-[#0D1120] rounded-lg p-3 text-center">
                      <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-2">
                        <Icon name="star" className="text-yellow-400 text-sm" />
                      </div>
                      <p className="text-lg font-bold text-white">{child.total_points}</p>
                      <p className="text-xs text-gray-400">النقاط</p>
                    </div>

                    <div className="bg-[#0D1120] rounded-lg p-3 text-center">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-2">
                        <Icon name="exclamation-triangle" className="text-red-400 text-sm" />
                      </div>
                      <p className="text-lg font-bold text-white">{child.pending_mistakes}</p>
                      <p className="text-xs text-gray-400">أخطاء</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>
      </div>
    </DashboardLayout>
  );
}
