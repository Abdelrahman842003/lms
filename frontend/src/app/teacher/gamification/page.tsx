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

interface GamificationSettings {
  attendance_points: number;
  perfect_month_bonus: number;
  exam_max_points: number;
  exam_retake_bonus: number;
  exam_first_place_bonus: number;
  streak_5_bonus: number;
  streak_10_bonus: number;
  is_enabled: boolean;
  show_leaderboard: boolean;
  leaderboard_size: number;
}

export default function TeacherGamificationPage() {
  const { user } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [settings, setSettings] = useState<GamificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'settings'>('leaderboard');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'all_time'>('weekly');
  const [loadingMore, setLoadingMore] = useState(false);



  useEffect(() => {
    loadData(1);
  }, []);

  const loadData = async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const [leaderboardRes, settingsRes] = await Promise.all([
        fetchApi(`/teacher/leaderboard?page=${pageNum}&per_page=10`),
        !append ? fetchApi('/teacher/gamification/settings') : Promise.resolve(null),
      ]);
      
      if (leaderboardRes) {
        if (append) {
          // Append new data to existing
          setWeeklyLeaderboard(prev => [...prev, ...(leaderboardRes.weekly.data || [])]);
          setAllTimeLeaderboard(prev => [...prev, ...(leaderboardRes.all_time.data || [])]);
        } else {
          // Replace data
          setWeeklyLeaderboard(leaderboardRes.weekly.data || []);
          setAllTimeLeaderboard(leaderboardRes.all_time.data || []);
        }
        
        // Check if there's more data
        const weeklyHasMore = leaderboardRes.weekly.current_page < leaderboardRes.weekly.last_page;
        const allTimeHasMore = leaderboardRes.all_time.current_page < leaderboardRes.all_time.last_page;
        setHasMore(weeklyHasMore || allTimeHasMore);
        setPage(pageNum);
      }
      if (settingsRes) {
        setSettings(settingsRes);
      }
    } catch (error: any) {
      console.error('Failed to load gamification data:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    loadData(page + 1, true);
  };

  const updateSettings = async (updates: Partial<GamificationSettings>) => {
    try {
      setSaving(true);
      const response = await fetchApi('/teacher/gamification/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response) {
        setSettings(response);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const mockUser = {
    name: user?.name || 'المدرس',
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
    if (rank === 2) return 'from-blue-400/20 to-blue-500/5 border-blue-400/30';
    if (rank === 3) return 'from-amber-600/20 to-amber-700/5 border-amber-600/30';
    return 'from-white/5 to-transparent border-white/10';
  };

  return (
    <DashboardLayout role={user?.userType as 'teacher' | 'secretary' || 'teacher'} user={mockUser}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <i className="fas fa-trophy text-yellow-500"></i>
              نظام النقاط والليدربورد
            </h1>
            <p className="text-gray-400">إدارة نقاط الطلاب ولوحة الشرف</p>
          </div>
          <Link href="/teacher/dashboard" className="btn btn-outline btn-sm">
            <i className="fas fa-arrow-right ml-2"></i>
            العودة
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <i className="fas fa-medal ml-2"></i>
            لوحة الشرف
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-primary text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <i className="fas fa-cog ml-2"></i>
            الإعدادات
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
            <p className="text-gray-400 mt-4">جاري التحميل...</p>
          </div>
        ) : (
          <>
            {/* Leaderboard Tab */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-6">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث عن طالب..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                  <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                </div>

                {/* Leaderboard Type Toggle */}
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setLeaderboardType('weekly')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      leaderboardType === 'weekly'
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <i className="fas fa-calendar-week ml-2"></i>
                    أشطر الطلاب هذا الشهر
                  </button>
                  <button
                    onClick={() => setLeaderboardType('all_time')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      leaderboardType === 'all_time'
                        ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <i className="fas fa-infinity ml-2"></i>
                    أشطر الطلاب على الإطلاق
                  </button>
                </div>

                {/* Single Leaderboard */}
                <DashboardCard 
                  title={leaderboardType === 'weekly' ? 'أشطر الطلاب هذا الشهر' : 'أشطر الطلاب على الإطلاق'} 
                  icon={leaderboardType === 'weekly' ? 'fas fa-calendar-week' : 'fas fa-infinity'}
                >
                  {(leaderboardType === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard)
                    .filter(entry => entry.student.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <i className="fas fa-chart-line text-3xl mb-3 opacity-50"></i>
                      <p>لا توجد بيانات بعد</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(leaderboardType === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard)
                        .filter(entry => entry.student.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((entry) => (
                        <div
                          key={entry.student_id}
                          className={`flex items-center justify-between p-3 rounded-xl bg-gradient-to-r ${getRankColor(entry.rank)} border`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getRankBadge(entry.rank)}</span>
                            <span className="font-medium text-white">{entry.student.name}</span>
                          </div>
                          <div className={`${leaderboardType === 'weekly' ? 'text-primary' : 'text-secondary'} font-bold`}>
                            {leaderboardType === 'weekly' ? entry.weekly_points : entry.total_points} نقطة
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardCard>

                {/* Load More Button */}
                {hasMore && !searchQuery && (
                  <div className="flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 rounded-xl bg-primary hover:bg-primary/80 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-chevron-down"></i>
                          <span>عرض المزيد</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && settings && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <DashboardCard title="الإعدادات العامة" icon="fas fa-toggle-on">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <h4 className="font-medium text-white">تفعيل نظام النقاط</h4>
                        <p className="text-sm text-gray-400">تفعيل/تعطيل النظام بالكامل</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.is_enabled}
                          onChange={(e) => updateSettings({ is_enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                      <div>
                        <h4 className="font-medium text-white">عرض لوحة الشرف للطلاب</h4>
                        <p className="text-sm text-gray-400">السماح للطلاب برؤية الترتيب</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.show_leaderboard}
                          onChange={(e) => updateSettings({ show_leaderboard: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl">
                      <h4 className="font-medium text-white mb-2">عدد الطلاب في الليدربورد</h4>
                      <input
                        type="number"
                        min="3"
                        max="20"
                        value={settings.leaderboard_size}
                        onChange={(e) => updateSettings({ leaderboard_size: parseInt(e.target.value) })}
                        className="w-full bg-dark border border-white/10 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </DashboardCard>

                {/* Point Values */}
                <DashboardCard title="قيم النقاط" icon="fas fa-coins">
                  <div className="space-y-3">
                    {[
                      { key: 'attendance_points', label: 'حضور الحصة', icon: '📚' },
                      { key: 'perfect_month_bonus', label: 'حضور شهر كامل', icon: '🌟' },
                      { key: 'exam_max_points', label: 'الحد الأقصى للامتحان', icon: '📝' },
                      { key: 'exam_retake_bonus', label: 'بونص إعادة الامتحان', icon: '💪' },
                      { key: 'exam_first_place_bonus', label: 'أول الدفعة', icon: '🏆' },
                      { key: 'streak_5_bonus', label: 'سلسلة 5 حصص', icon: '🔥' },
                      { key: 'streak_10_bonus', label: 'سلسلة 10 حصص', icon: '🔥🔥' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span className="text-white text-sm">{item.label}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={(settings as any)[item.key]}
                          onChange={(e) => updateSettings({ [item.key]: parseInt(e.target.value) } as any)}
                          className="w-20 bg-dark border border-white/10 rounded-lg px-3 py-1 text-white text-center focus:border-primary focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </DashboardCard>
              </div>
            )}
          </>
        )}

        {saving && (
          <div className="fixed bottom-4 left-4 bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <i className="fas fa-spinner fa-spin"></i>
            جاري الحفظ...
          </div>
        )}


      </div>
    </DashboardLayout>
  );
}
