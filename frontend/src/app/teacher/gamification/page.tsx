'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button, LoadingSpinner, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { getGrades, getGroups } from '@/services/teacherService';
import { Filter } from '@/components/Filter';
import { cn } from '@/utils';

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

export default function TeacherGamificationPage() {
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
    if (selectedGrade) fetchGroups(selectedGrade);
    else setGroups([]);
    setSelectedGroup('');
  }, [selectedGrade]);

  const fetchGrades = async () => {
    try {
      const res = await getGrades();
      setGrades(res?.data || res || []);
    } catch { /* ignore */ }
  };

  const fetchGroups = async (gradeId: string) => {
    try {
      const res = await getGroups(gradeId);
      setGroups(res?.data || res || []);
    } catch { /* ignore */ }
  };

  const loadData = async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        per_page: '10',
        ...(selectedGrade && { grade_id: selectedGrade }),
        ...(selectedGroup && { group_id: selectedGroup }),
      });

      const res = await fetchApi(`/teacher/leaderboard?${queryParams.toString()}`);
      if (res) {
        if (append) {
          setWeeklyLeaderboard(prev => [...prev, ...(res.weekly.data || [])]);
          setAllTimeLeaderboard(prev => [...prev, ...(res.all_time.data || [])]);
        } else {
          setWeeklyLeaderboard(res.weekly.data || []);
          setAllTimeLeaderboard(res.all_time.data || []);
        }
        setHasMore(res.weekly.current_page < res.weekly.last_page || res.all_time.current_page < res.all_time.last_page);
        setPage(pageNum);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const currentData = (leaderboardType === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard)
    .filter(e => e.student.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const top3 = currentData.slice(0, 3);
  const others = currentData.slice(3);

  return (
    <DashboardLayout role={user?.userType as any} user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}>
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Immersive Hall of Fame Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-2xl shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <Icon name="trophy" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">لوحة شرف الأكاديمية</h1>
              <p className="text-[10px] font-bold text-gray-light/20 uppercase tracking-widest">تكريم الطلاب الأكثر اجتهاداً ونشاطاً</p>
            </div>
          </div>

          {/* Segmented Toggle - Compact */}
          <div className="flex p-1 rounded-xl premium-glass premium-border min-w-[280px]">
            {(['weekly', 'all_time'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setLeaderboardType(type)}
                className={cn(
                  "flex-1 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  leaderboardType === type ? "bg-primary text-white shadow-lg" : "text-gray-light/40 hover:text-white"
                )}
              >
                {type === 'weekly' ? 'هذا الشهر' : 'كل الأوقات'}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
          <div className="relative">
             <div className="absolute inset-y-0 right-3 flex items-center text-gray-light/20 pointer-events-none">
               <Icon name="search" size="xs" />
             </div>
             <input 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="ابحث عن طالب..."
               className="w-full h-11 pr-10 pl-4 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-white focus:border-primary/50 outline-none transition-all"
             />
          </div>
          <Filter 
            options={[{ value: '', label: 'كل الصفوف' }, ...grades.map(g => ({ value: g.id.toString(), label: g.name }))]} 
            value={selectedGrade} 
            onChange={setSelectedGrade} 
            className="h-11"
          />
          <Filter 
            options={[{ value: '', label: 'كل المجموعات' }, ...groups.map(g => ({ value: g.id.toString(), label: g.name }))]} 
            value={selectedGroup} 
            onChange={setSelectedGroup} 
            disabled={!selectedGrade}
            className="h-11"
          />
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 text-gray-light/20">
            <LoadingSpinner size="md" />
            <span className="text-[10px] font-black uppercase tracking-widest">جاري ترتيب القائمة...</span>
          </div>
        ) : currentData.length === 0 ? (
          <div className="py-32 text-center premium-glass premium-border rounded-[3rem] opacity-30">
            <Icon name="award" className="text-4xl mb-4" />
            <p className="text-sm font-black">لا توجد بيانات متاحة حالياً</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Top 3 Podium */}
            {!searchQuery && page === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10">
                {/* 2nd Place */}
                {top3[1] && (
                  <div className="order-2 md:order-1 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-100">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full scale-150" />
                      <div className="w-24 h-24 rounded-3xl premium-glass border-2 border-blue-400/30 flex items-center justify-center relative z-10 shadow-2xl">
                        <span className="text-4xl">🥈</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-black text-white text-lg">{top3[1].student.name}</h3>
                      <p className="text-blue-400 font-black text-sm">{leaderboardType === 'weekly' ? top3[1].weekly_points : top3[1].total_points} نقطة</p>
                    </div>
                  </div>
                )}
                {/* 1st Place */}
                {top3[0] && (
                  <div className="order-1 md:order-2 flex flex-col items-center gap-6 animate-in slide-in-from-bottom-12 duration-1000">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-yellow-500/30 blur-[60px] rounded-full scale-150" />
                      <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-yellow-400/20 to-yellow-600/5 border-2 border-yellow-500/50 flex items-center justify-center relative z-10 shadow-[0_20px_50px_rgba(234,179,8,0.3)]">
                        <span className="text-6xl">🥇</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-black text-white text-2xl">{top3[0].student.name}</h3>
                      <div className="inline-flex px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 font-black text-lg">
                        {leaderboardType === 'weekly' ? top3[0].weekly_points : top3[0].total_points} نقطة
                      </div>
                    </div>
                  </div>
                )}
                {/* 3rd Place */}
                {top3[2] && (
                  <div className="order-3 md:order-3 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-amber-600/20 blur-2xl rounded-full scale-150" />
                      <div className="w-24 h-24 rounded-3xl premium-glass border-2 border-amber-600/30 flex items-center justify-center relative z-10 shadow-2xl">
                        <span className="text-4xl">🥉</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h3 className="font-black text-white text-lg">{top3[2].student.name}</h3>
                      <p className="text-amber-600 font-black text-sm">{leaderboardType === 'weekly' ? top3[2].weekly_points : top3[2].total_points} نقطة</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* List of others */}
            <div className="space-y-3">
              {(page === 1 && !searchQuery ? others : currentData).map((entry) => (
                <div 
                  key={entry.student_id} 
                  className="group relative flex items-center justify-between p-4 rounded-2xl premium-glass border border-white/5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xs font-black text-gray-light/40 group-hover:text-primary transition-colors">
                      #{entry.rank}
                    </div>
                    <div>
                      <h4 className="font-black text-white group-hover:translate-x-1 transition-transform">{entry.student.name}</h4>
                      <p className="text-[9px] font-bold text-gray-light/20 uppercase tracking-widest">طالب مسجل في النظام</p>
                    </div>
                  </div>
                  <div className={cn(
                    "px-5 py-2 rounded-xl text-sm font-black shadow-inner",
                    leaderboardType === 'weekly' ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  )}>
                    {leaderboardType === 'weekly' ? entry.weekly_points : entry.total_points} <span className="text-[9px] opacity-40">نقطة</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center pt-6">
                <Button 
                  onClick={() => loadData(page + 1, true)} 
                  disabled={loadingMore}
                  className="h-12 px-10 rounded-2xl bg-white/5 text-gray-light hover:text-white border border-white/5 font-black uppercase tracking-widest"
                >
                  {loadingMore ? <LoadingSpinner size="sm" /> : 'عرض المزيد من الأبطال'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
