'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { getGrades, getGroups, getLeaderboard } from '@/services/academyService';
import { Filter } from '@/components/Filter';
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

export default function AcademyGamificationPage() {
  const { user } = useAuth();
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'all_time'>('weekly');
  const [loadingMore, setLoadingMore] = useState(false);

  const [grades, setGrades] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    loadData(1);
    fetchGrades();
  }, []);

  useEffect(() => {
    loadData(1);
  }, [selectedGrade, selectedGroup]);

  useEffect(() => {
    if (selectedGrade) {
      fetchGroups(selectedGrade);
    } else {
      setGroups([]);
    }
    setSelectedGroup('');
  }, [selectedGrade]);

  const fetchGrades = async () => {
    try {
      const res = await getGrades(1, 100); // Fetch more grades for dropdown
      if (res && res.data && res.data.data) {
        setGrades(res.data.data);
      } else if (res && res.data && Array.isArray(res.data)) {
        setGrades(res.data);
      } else if (Array.isArray(res)) {
        setGrades(res);
      }
    } catch (error) {
      console.error('Failed to fetch grades', error);
    }
  };

  const fetchGroups = async (gradeId: string) => {
    try {
      const res = await getGroups(1, 100, { grade_name: gradeId }); // Fetch groups filtered by grade name
      if (res && res.data && res.data.data) {
        setGroups(res.data.data);
      } else if (res && res.data && Array.isArray(res.data)) {
        setGroups(res.data);
      } else if (Array.isArray(res)) {
        setGroups(res);
      }
    } catch (error) {
      console.error('Failed to fetch groups', error);
    }
  };

  const loadData = async (pageNum = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const filters = {
        grade_name: selectedGrade,
        group_id: selectedGroup,
      };

      const leaderboardRes = await getLeaderboard(pageNum, 10, filters);
      
      if (leaderboardRes && leaderboardRes.data) {
        const { weekly, all_time } = leaderboardRes.data;
        
        if (append) {
          // Append new data to existing
          setWeeklyLeaderboard(prev => [...prev, ...(weekly.data || [])]);
          setAllTimeLeaderboard(prev => [...prev, ...(all_time.data || [])]);
        } else {
          // Replace data
          setWeeklyLeaderboard(weekly.data || []);
          setAllTimeLeaderboard(all_time.data || []);
        }
        
        // Check if there's more data
        const weeklyHasMore = weekly.current_page < weekly.last_page;
        const allTimeHasMore = all_time.current_page < all_time.last_page;
        setHasMore(weeklyHasMore || allTimeHasMore);
        setPage(pageNum);
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

  const mockUser = {
    name: user?.name || 'الأكاديمية',
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

  const gradeOptions = [
    { value: '', label: 'كل الصفوف' },
    ...grades.map(g => ({ value: g.name, label: g.name }))
  ];

  const groupOptions = [
    { value: '', label: 'كل المجموعات' },
    ...groups.map(g => ({ value: g.id?.toString() || '', label: g.name }))
  ];

  return (
    <DashboardLayout role="academy" user={mockUser}>
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <i className="fas fa-trophy text-yellow-500"></i>
              لوحة الشرف للأكاديمية
            </h1>
            <p className="text-gray-400">ترتيب الطلاب في الأكاديمية</p>
          </div>
          <Link href="/academy/dashboard" className="btn btn-outline btn-sm">
            <i className="fas fa-arrow-right ml-2"></i>
            العودة
          </Link>
        </div>

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

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <Filter
                options={gradeOptions}
                value={selectedGrade}
                onChange={setSelectedGrade}
                placeholder="اختر الصف"
                icon="fas fa-graduation-cap"
              />

              <Filter
                options={groupOptions}
                value={selectedGroup}
                onChange={setSelectedGroup}
                placeholder="اختر المجموعة"
                icon="fas fa-users"
                disabled={!selectedGrade}
              />
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

            {loading ? (
              <div className="text-center py-16">
                <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                <p className="text-gray-400 mt-4">جاري التحميل...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
