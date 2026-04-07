'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/services/authService';
import { LoadingSpinner, Icon } from '@/components/ui/index';

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student: {
    id: string;
    name: string;
    avatar_key?: string;
  };
  total_points?: number;
  weekly_points?: number;
}

interface MyStats {
  rank: number;
  weekly_rank: number;
  total_points: number;
  weekly_points: number;
  attendance_streak: number;
}

export function StudentHonorBoard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'weekly' | 'allTime'>('weekly');
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  useEffect(() => {
    const storedTeacher = localStorage.getItem('selectedTeacher');
    if (storedTeacher) {
      setSelectedTeacher(JSON.parse(storedTeacher));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!selectedTeacher) return;
      try {
        setLoading(true);
        const data = await fetchApi(`/api/student/leaderboard/${selectedTeacher.teacher_id}`) as any;
        if (data) {
          setWeeklyLeaderboard(data.weekly || data.data?.weekly || []);
          setAllTimeLeaderboard(data.all_time || data.data?.all_time || []);
          setMyStats(data.my_stats || data.data?.my_stats || null);
          setError(null);
          setTimeout(() => setShowContent(true), 300);
        }
      } catch (err: any) {
        console.error('Failed to load leaderboard:', err);
        setError('لوحة الشرف غير متاحة لهذا المدرس حالياً.');
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, [selectedTeacher]);

  if (loading) {
    return (
      <div className="flex justify-center py-10 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 mt-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  // Only show if teacher is selected and we don't have errors or we have data
  if (!selectedTeacher) {
    return (
      <div className="text-center py-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 mt-8">
        <p className="text-gray-400">اختر مدرساً لعرض لوحة الشرف الخاصة به.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 mt-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const currentLeaderboard = activeTab === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard;
  const top3 = currentLeaderboard.slice(0, 3);

  const getPoints = (entry: LeaderboardEntry) => activeTab === 'weekly' ? entry.weekly_points : entry.total_points;

  const podiumConfig = [
    { position: 1, order: 'order-2', height: 'h-32 md:h-40', bgGradient: 'bg-gradient-to-b from-yellow-400/30 to-yellow-600/10', borderColor: 'border-yellow-400', crownColor: 'text-yellow-400', badge: '👑' },
    { position: 2, order: 'order-1', height: 'h-24 md:h-32', bgGradient: 'bg-gradient-to-b from-slate-300/30 to-slate-500/10', borderColor: 'border-slate-300', crownColor: 'text-slate-300', badge: '🥈' },
    { position: 3, order: 'order-3', height: 'h-20 md:h-24', bgGradient: 'bg-gradient-to-b from-amber-600/30 to-amber-800/10', borderColor: 'border-amber-600', crownColor: 'text-amber-600', badge: '🥉' },
  ];

  return (
    <div className={`mt-8 bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          لوحة الشرف البطل ({selectedTeacher.teacher_name})
        </h3>
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          <button onClick={() => setActiveTab('weekly')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'weekly' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>هذا الأسبوع</button>
          <button onClick={() => setActiveTab('allTime')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'allTime' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>على الإطلاق</button>
        </div>
      </div>

      {myStats && (
        <div className="mb-8 flex items-center justify-between bg-primary/10 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-xl font-bold text-white shadow-lg">
              #{activeTab === 'weekly' ? myStats.weekly_rank : myStats.rank}
            </div>
            <div>
              <p className="text-white font-bold">ترتيبك الحالي</p>
              <p className="text-sm text-primary">استمر في التقدم المذهل!</p>
            </div>
          </div>
          <div className="text-center px-4">
            <div className="text-xl font-bold text-white">{activeTab === 'weekly' ? myStats.weekly_points : myStats.total_points}</div>
            <div className="text-xs text-gray-400">نقطة</div>
          </div>
        </div>
      )}

      {top3.length > 0 ? (
        <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6 mt-8">
          {podiumConfig.map((config) => {
            const entry = top3.find(e => e.rank === config.position);
            if (!entry) return null;
            return (
              <div key={config.position} className={`${config.order} flex flex-col items-center transition-all duration-500 hover:scale-105`}>
                <div className={`text-3xl sm:text-4xl md:text-5xl drop-shadow-lg mb-2 animate-bounce`}>{config.badge}</div>
                <div className="relative mb-3">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-4 ${config.borderColor} overflow-hidden shadow-xl bg-white/10 backdrop-blur-sm`}>
                    {entry.student.avatar_key ? (
                      <img src={entry.student.avatar_key} alt={entry.student.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
                        <Icon name="user" className="text-gray-400 text-lg md:text-2xl" />
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="text-white font-bold text-xs sm:text-sm md:text-base text-center mb-1 max-w-[80px] md:max-w-[120px] truncate">{entry.student.name}</h3>
                <div className={`px-2 md:px-4 py-1 rounded-full ${config.bgGradient} border ${config.borderColor} mb-3`}>
                  <span className="text-white font-bold text-xs md:text-sm">{getPoints(entry)} نقطة</span>
                </div>
                <div className={`w-20 sm:w-24 md:w-32 ${config.height} ${config.bgGradient} border-t-4 ${config.borderColor} rounded-t-2xl flex items-center justify-center backdrop-blur-xl shadow-2xl`}>
                  <span className={`text-3xl md:text-5xl font-bold ${config.crownColor} drop-shadow-lg`}>{config.position}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-400">لا يوجد بيانات للوحة الشرف حالياً.</p>
        </div>
      )}
    </div>
  );
}
