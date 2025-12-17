'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/services/authService';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student: {
    id: string;
    name: string;
    avatar_key?: string;
  };
  weekly_points?: number;
  total_points?: number;
}

interface MyStats {
  total_points: number;
  weekly_points: number;
  rank: number;
  attendance_streak: number;
}

export default function LeaderboardPage() {
  const { user, selectedTeacher } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'allTime'>('weekly');

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!selectedTeacher) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetchApi(`/student/leaderboard/${selectedTeacher.teacher_id}`);
        if (response.success) {
          setWeeklyLeaderboard(response.data.weekly || []);
          setAllTimeLeaderboard(response.data.all_time || []);
          setMyStats(response.data.my_stats || null);
        }
      } catch (err: any) {
        console.error('Failed to load leaderboard:', err);
        if (err.message?.includes('403')) {
          setError('لوحة الشرف غير متاحة من هذا المدرس');
        } else {
          setError('فشل في تحميل لوحة الشرف');
        }
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [selectedTeacher]);

  const mockUser = {
    name: user?.name || 'الطالب',
    avatar: user?.avatar || '',
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30';
    if (rank === 2) return 'from-gray-400/20 to-gray-500/5 border-gray-400/30';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/5 border-amber-600/30';
    return 'from-white/5 to-transparent border-white/10';
  };

  const currentLeaderboard = activeTab === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard;
  const pointsKey = activeTab === 'weekly' ? 'weekly_points' : 'total_points';

  return (
    <DashboardLayout role="student" user={mockUser}>
      <div className="max-w-[1000px] mx-auto">
        {/* Header with My Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <i className="fas fa-trophy text-yellow-500"></i>
                لوحة الشرف
              </h1>
              <p className="text-gray-400">أشطر الطلاب هذا الأسبوع 🔥</p>
            </div>
            <Link 
              href="/student/dashboard" 
              className="btn btn-outline btn-sm flex items-center gap-2"
            >
              <i className="fas fa-arrow-right"></i>
              العودة
            </Link>
          </div>

          {/* My Stats Card */}
          {myStats && (
            <div className="bg-gradient-to-r from-primary/20 to-secondary/10 rounded-2xl p-6 border border-primary/30 mb-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary/30">
                    #{myStats.rank}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">ترتيبك الحالي</h3>
                    <p className="text-gray-400">استمر في التقدم! 💪</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{myStats.weekly_points}</div>
                    <div className="text-sm text-gray-400">نقاط الأسبوع</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary">{myStats.total_points}</div>
                    <div className="text-sm text-gray-400">إجمالي النقاط</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success flex items-center gap-1">
                      {myStats.attendance_streak}
                      <span className="text-base">🔥</span>
                    </div>
                    <div className="text-sm text-gray-400">سلسلة الحضور</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('weekly')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'weekly'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <i className="fas fa-calendar-week ml-2"></i>
            هذا الأسبوع
          </button>
          <button
            onClick={() => setActiveTab('allTime')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'allTime'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <i className="fas fa-infinity ml-2"></i>
            كل الوقت
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p className="text-gray-400">جاري تحميل لوحة الشرف...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <i className="fas fa-lock text-4xl text-gray-500 mb-4"></i>
            <p className="text-gray-400">{error}</p>
          </div>
        )}

        {/* No Teacher Selected */}
        {!selectedTeacher && !loading && (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <i className="fas fa-user-graduate text-4xl text-gray-500 mb-4"></i>
            <p className="text-gray-400">اختر مدرس لعرض لوحة الشرف</p>
          </div>
        )}

        {/* Leaderboard */}
        {!loading && !error && selectedTeacher && (
          <DashboardCard
            title={activeTab === 'weekly' ? 'أشطر 5 طلاب هذا الأسبوع' : 'أشطر 5 طلاب على الإطلاق'}
            icon="fas fa-medal"
          >
            {currentLeaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <i className="fas fa-chart-line text-4xl mb-4 opacity-50"></i>
                <p>لا توجد بيانات بعد</p>
                <p className="text-sm mt-2">احضر المحاضرات واجتز الامتحانات لتظهر في لوحة الشرف!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentLeaderboard.map((entry) => (
                  <div
                    key={entry.student_id}
                    className={`flex items-center justify-between p-4 rounded-xl bg-gradient-to-r ${getRankColor(entry.rank)} border transition-all hover:scale-[1.02] ${
                      entry.student_id === user?.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-dark' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl w-10 text-center">
                        {getRankBadge(entry.rank)}
                      </div>
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
                        {entry.student.avatar_key ? (
                          <img 
                            src={entry.student.avatar_key} 
                            alt={entry.student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <i className="fas fa-user text-gray-400"></i>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {entry.student.name}
                          {entry.student_id === user?.id && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full mr-2">
                              أنت
                            </span>
                          )}
                        </h3>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-primary">
                        {entry[pointsKey as keyof LeaderboardEntry] as number}
                      </div>
                      <div className="text-xs text-gray-400">نقطة</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>
        )}

        {/* Points Guide */}
        <div className="mt-8 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-info-circle text-primary"></i>
            كيف تجمع النقاط؟
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm text-gray-400">حضور الحصة</div>
              <div className="text-lg font-bold text-success">+10</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm text-gray-400">درجة الامتحان</div>
              <div className="text-lg font-bold text-success">حتى +50</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-sm text-gray-400">سلسلة 5 حصص</div>
              <div className="text-lg font-bold text-success">+15</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm text-gray-400">أول الدفعة</div>
              <div className="text-lg font-bold text-success">+25</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
