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
    <div className={`mt-12 transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
      <div className="relative overflow-hidden premium-glass premium-border rounded-[3rem] p-8 md:p-12 shadow-2xl">
        {/* Decorative Background Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl shadow-lg">
                <Icon name="crown" />
             </div>
             <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">لوحة الشرف</h3>
                <p className="text-gray-light/40 text-sm font-medium">أفضل الطلاب لدى ({selectedTeacher.teacher_name})</p>
             </div>
          </div>

          <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
            <button 
              onClick={() => setActiveTab('weekly')} 
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 
                ${activeTab === 'weekly' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-light/40 hover:text-white hover:bg-white/5'}`}
            >
              هذا الأسبوع
            </button>
            <button 
              onClick={() => setActiveTab('allTime')} 
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 
                ${activeTab === 'allTime' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-light/40 hover:text-white hover:bg-white/5'}`}
            >
              على الإطلاق
            </button>
          </div>
        </div>
  
        {myStats && (
          <div className="mb-12 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 border border-white/10 shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
              <div className="flex items-center gap-6">
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
                   <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-2xl md:text-3xl font-black text-white shadow-2xl ring-4 ring-white/10">
                    #{activeTab === 'weekly' ? myStats.weekly_rank : myStats.rank}
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-xl md:text-2xl font-black text-white mb-1">مركزك في لوحة الشرف</h4>
                  <p className="text-primary/60 font-black text-[10px] uppercase tracking-widest">أنت تقوم بعمل رائع، استمر في التقدم!</p>
                </div>
              </div>
              <div className="flex items-center gap-8 px-8 py-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-center">
                  <div className="text-2xl font-black text-white tabular-nums">{activeTab === 'weekly' ? myStats.weekly_points : myStats.total_points}</div>
                  <div className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">نقطة</div>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="text-center">
                  <div className="text-2xl font-black text-white tabular-nums">{myStats.attendance_streak}</div>
                  <div className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">يوم حضور</div>
                </div>
              </div>
            </div>
          </div>
        )}
  
        {top3.length > 0 ? (
          <div className="flex items-end justify-center gap-4 md:gap-12 mt-12 pb-4">
            {podiumConfig.map((config) => {
              const entry = top3.find(e => e.rank === config.position);
              if (!entry) return null;
              return (
                <div key={config.position} className={`${config.order} flex flex-col items-center transition-all duration-700 hover:-translate-y-3 group/podium`}>
                  <div className={`text-4xl md:text-6xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] mb-4 transition-transform duration-500 group-hover/podium:scale-125`}>{config.badge}</div>
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl opacity-0 group-hover/podium:opacity-100 transition-opacity"></div>
                    <div className={`relative w-20 h-20 md:w-32 md:h-32 rounded-full border-4 ${config.borderColor} overflow-hidden shadow-2xl bg-slate-900/50 ring-8 ring-white/5`}>
                      {entry.student.avatar_key ? (
                        <img src={entry.student.avatar_key} alt={entry.student.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/podium:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
                          <Icon name="user" className="text-gray-light/20 text-3xl md:text-5xl" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center space-y-3 mb-6">
                     <h3 className="text-white font-black text-sm md:text-lg max-w-[120px] md:max-w-[180px] truncate drop-shadow-lg">{entry.student.name}</h3>
                     <div className={`inline-flex px-4 py-1.5 rounded-full ${config.bgGradient} border ${config.borderColor} shadow-lg backdrop-blur-md`}>
                        <span className="text-white font-black text-[10px] md:text-xs tabular-nums uppercase tracking-widest">{getPoints(entry)} نقطة</span>
                     </div>
                  </div>

                  <div className={`w-24 md:w-44 ${config.height} ${config.bgGradient} border-t-4 ${config.borderColor} rounded-t-[2.5rem] flex items-center justify-center premium-glass shadow-[0_-20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group/box`}>
                    <div className="absolute inset-0 bg-white/[0.02] transition-colors group-hover/podium:bg-white/[0.05]"></div>
                    <span className={`text-5xl md:text-8xl font-black ${config.crownColor} drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover/podium:scale-110`}>{config.position}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/3 rounded-[2rem] border border-white/5">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-light/20 text-2xl mx-auto mb-4">
               <Icon name="users-slash" />
            </div>
            <p className="text-gray-light/30 font-black uppercase tracking-widest text-xs">لا يوجد بيانات للوحة الشرف حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
}
