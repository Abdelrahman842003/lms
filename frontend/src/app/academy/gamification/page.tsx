'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getGrades, getGroups, getLeaderboard } from '@/services/academyService';
import { Filter } from '@/components/Filter';
import Link from 'next/link';

import { Button, Icon, Input, LoadingSpinner } from '@/components/ui';
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
      // Error handled silently
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
      // Error handled silently
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
      // Error handled silently
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
              <Icon name="trophy" className="text-yellow-500" />
              لوحة الشرف للأكاديمية
            </h1>
            <p className="text-gray-400">ترتيب الطلاب في الأكاديمية</p>
          </div>
          <Link href="/academy/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/5 transition-colors text-sm">
            <Icon name="arrow-right" className="ml-2" />
            العودة
          </Link>
        </div>

        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Input
                type="text"
                placeholder="ابحث عن طالب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-3 pr-12"
              />
              <Icon name="search" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <Filter
                options={gradeOptions}
                value={selectedGrade}
                onChange={setSelectedGrade}
                placeholder="اختر الصف"
                icon="graduation-cap"
              />

              <Filter
                options={groupOptions}
                value={selectedGroup}
                onChange={setSelectedGroup}
                placeholder="اختر المجموعة"
                icon="users"
                disabled={!selectedGrade}
              />
            </div>

            {/* Leaderboard Type Toggle */}
            <div className="flex gap-2 justify-center">
              <Button
                variant={leaderboardType === 'weekly' ? 'primary' : 'ghost'}
                onClick={() => setLeaderboardType('weekly')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  leaderboardType === 'weekly'
                    ? 'shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Icon name="calendar-week" className="ml-2" />
                أشطر الطلاب هذا الشهر
              </Button>
              <Button
                variant={leaderboardType === 'all_time' ? 'secondary' : 'ghost'}
                onClick={() => setLeaderboardType('all_time')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  leaderboardType === 'all_time'
                    ? 'shadow-lg shadow-secondary/20'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Icon name="infinity" className="ml-2" />
                أشطر الطلاب على الإطلاق
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <LoadingSpinner size="sm" color="primary" />
                <p className="text-gray-400 mt-4">جاري التحميل...</p>
              </div>
            ) : (
              <>
                {/* Single Leaderboard */}
                <DashboardCard 
                  title={leaderboardType === 'weekly' ? 'أشطر الطلاب هذا الشهر' : 'أشطر الطلاب على الإطلاق'} 
                  icon={leaderboardType === 'weekly' ? 'calendar-week' : 'infinity'}
                >
                  {(leaderboardType === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard)
                    .filter(entry => entry.student.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Icon name="chart-line" className="text-3xl mb-3 opacity-50" />
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
                    <Button
                      variant="primary"
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <LoadingSpinner size="sm" color="primary" />
                          <span>جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="chevron-down" />
                          <span>عرض المزيد</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </DashboardLayout>
  );
}
