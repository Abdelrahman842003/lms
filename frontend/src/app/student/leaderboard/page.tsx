'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import Link from 'next/link';

// Custom Confetti Component - Enhanced Celebration
const Confetti = ({ show }: { show: boolean }) => {
  if (!show) return null;
  
  const colors = ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#98FB98', '#FF69B4', '#00CED1', '#7B68EE', '#FFE066', '#FF85A2'];
  const confettiPieces = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 6 + Math.random() * 12,
    rotation: Math.random() * 360,
    type: Math.random() > 0.6 ? 'star' : (Math.random() > 0.5 ? 'circle' : 'square'),
  }));

  // Sparkles
  const sparkles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 2,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Confetti pieces */}
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            borderRadius: piece.type === 'circle' ? '50%' : piece.type === 'star' ? '2px' : '2px',
            transform: `rotate(${piece.rotation}deg)`,
            animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s forwards`,
            clipPath: piece.type === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : 'none',
          }}
        />
      ))}
      
      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={`sparkle-${sparkle.id}`}
          className="absolute text-yellow-400"
          style={{
            left: `${sparkle.left}%`,
            top: `${sparkle.top}%`,
            fontSize: `${sparkle.size}px`,
            animation: `sparkle 1.5s ease-in-out ${sparkle.delay}s infinite`,
          }}
        >
          ✨
        </div>
      ))}
      
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};


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

export default function StudentLeaderboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // State for data
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myStats, setMyStats] = useState<MyStats | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'weekly' | 'allTime'>('weekly');

  // Mock user for layout
  const mockUser = {
    name: user?.name || 'طالب',
    email: (user as any)?.email || '',
    avatar: user?.avatar || '/images/avatars/default-avatar.png',
    role: 'student' as const,
  };

  // Confetti celebration function
  const triggerCelebration = () => {
    setShowConfetti(true);
    // Hide confetti after animation completes
    setTimeout(() => setShowConfetti(false), 6000);
  };

  // Load selected teacher from localStorage
  useEffect(() => {
    const storedTeacher = localStorage.getItem('selectedTeacher');
    if (storedTeacher) {
      setSelectedTeacher(JSON.parse(storedTeacher));
    } else {
      setLoading(false);
      setError('لم يتم اختيار مدرس');
    }
  }, []);

  // Fetch leaderboard data
  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!selectedTeacher) {
        return;
      }

      try {
        setLoading(true);
        const data = await fetchApi(`/api/student/leaderboard/${selectedTeacher.teacher_id}`);
        
        if (data) {
          const weekly = data.weekly || data.data?.weekly || [];
          const allTime = data.all_time || data.data?.all_time || [];
          const stats = data.my_stats || data.data?.my_stats || null;

          setWeeklyLeaderboard(weekly);
          setAllTimeLeaderboard(allTime);
          setMyStats(stats);
          setError(null);
          
          // Trigger celebration after data loads
          setTimeout(() => {
            setShowContent(true);
            if (weekly.length > 0 || allTime.length > 0) {
              triggerCelebration();
            }
          }, 300);
        } else {
          setError('لم يتم استلام بيانات من الخادم');
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

  const currentLeaderboard = activeTab === 'weekly' ? weeklyLeaderboard : allTimeLeaderboard;
  const top3 = currentLeaderboard.slice(0, 3);
  const restOfList = currentLeaderboard.slice(3);

  const getPoints = (entry: LeaderboardEntry) => {
    return activeTab === 'weekly' ? entry.weekly_points : entry.total_points;
  };

  // Podium configuration for top 3
  const podiumConfig = [
    { 
      position: 1, 
      order: 'order-2', 
      height: 'h-36 md:h-44',
      bgGradient: 'bg-gradient-to-b from-yellow-400/30 to-yellow-600/10',
      borderColor: 'border-yellow-400',
      glowColor: 'shadow-yellow-400/50',
      crownColor: 'text-yellow-400',
      badge: '👑',
      label: 'المركز الأول'
    },
    { 
      position: 2, 
      order: 'order-1', 
      height: 'h-28 md:h-36',
      bgGradient: 'bg-gradient-to-b from-slate-300/30 to-slate-500/10',
      borderColor: 'border-slate-300',
      glowColor: 'shadow-slate-300/50',
      crownColor: 'text-slate-300',
      badge: '🥈',
      label: 'المركز الثاني'
    },
    { 
      position: 3, 
      order: 'order-3', 
      height: 'h-24 md:h-28',
      bgGradient: 'bg-gradient-to-b from-amber-600/30 to-amber-800/10',
      borderColor: 'border-amber-600',
      glowColor: 'shadow-amber-600/50',
      crownColor: 'text-amber-600',
      badge: '🥉',
      label: 'المركز الثالث'
    },
  ];

  return (
    <DashboardLayout role="student" user={mockUser}>
      {/* Confetti Animation */}
      <Confetti show={showConfetti} />
      
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="text-center sm:text-right">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center sm:justify-start gap-3">
              <span className="text-4xl md:text-5xl animate-bounce">🏆</span>
              لوحة الشرف
            </h1>
            <p className="text-gray-400 text-lg">
              {activeTab === 'weekly' ? 'أشطر الطلاب هذا الأسبوع 🔥' : 'أشطر الطلاب على الإطلاق 🌟'}
            </p>
          </div>
          <Link 
            href="/student/dashboard" 
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 text-white"
          >
            <span>العودة</span>
            <i className="fas fa-arrow-right" />
          </Link>
        </div>

        {/* Toggle Tabs */}
        <div className={`flex items-center justify-center mb-8 transition-all duration-700 delay-100 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex gap-2 p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'weekly' 
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg shadow-primary/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <i className="fas fa-calendar-week" />
              هذا الأسبوع
            </button>
            <button
              onClick={() => setActiveTab('allTime')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                activeTab === 'allTime' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <i className="fas fa-trophy" />
              أشطر الطلاب على الإطلاق
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
            </div>
            <p className="text-gray-400 mt-4 text-lg">جاري تحميل لوحة الشرف...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-red-400 text-lg mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-xl transition-all duration-300 hover:scale-105 text-white font-medium"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {/* My Stats Card */}
            {myStats && (
              <div className={`mb-10 transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-purple-500/10 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl">
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl" />
                  
                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-lg shadow-primary/30">
                          #{activeTab === 'weekly' ? myStats.weekly_rank : myStats.rank}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-lg shadow-lg">
                          ⭐
                        </div>
                      </div>
                      <div className="text-center md:text-right">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">ترتيبك الحالي</h3>
                        <p className="text-gray-300 flex items-center gap-2 justify-center md:justify-start">
                          <span>استمر في التقدم!</span>
                          <span className="text-xl animate-pulse">💪</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-4 md:gap-8">
                      <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                          {myStats.weekly_points}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">نقاط الأسبوع</div>
                      </div>
                      <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                        <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {myStats.total_points}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">إجمالي النقاط</div>
                      </div>
                      <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                        <div className="text-2xl md:text-3xl font-bold text-orange-400 flex items-center gap-1 justify-center">
                          {myStats.attendance_streak}
                          <span className="text-xl animate-bounce">🔥</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">سلسلة الحضور</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Top 3 Podium Section */}
            {top3.length > 0 && (
              <div className={`mb-12 transition-all duration-700 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-16 flex items-center justify-center gap-3">
                  <span className="text-3xl">🏅</span>
                  الأوائل
                  <span className="text-3xl">🏅</span>
                </h2>
                
                <div className="flex items-end justify-center gap-4 md:gap-6">
                  {podiumConfig.map((config) => {
                    const entry = top3.find(e => e.rank === config.position);
                    if (!entry) return null;
                    
                    return (
                      <div 
                        key={config.position}
                        className={`${config.order} flex flex-col items-center transition-all duration-500 hover:scale-105`}
                        style={{ animationDelay: `${config.position * 100}ms` }}
                      >
                        {/* Badge/Medal Icon - Above Avatar */}
                        <div className={`text-4xl md:text-5xl ${config.crownColor} drop-shadow-lg mb-3 animate-bounce`}
                             style={{ animationDelay: `${config.position * 200}ms` }}>
                          {config.badge}
                        </div>
                        
                        {/* Avatar */}
                        <div className="relative mb-4">
                          <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-4 ${config.borderColor} overflow-hidden shadow-xl ${config.glowColor} shadow-lg bg-white/10 backdrop-blur-sm`}>
                            {entry.student.avatar_key ? (
                              <img 
                                src={entry.student.avatar_key} 
                                alt={entry.student.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800">
                                <i className="fas fa-user text-gray-400 text-xl md:text-3xl" />
                              </div>
                            )}
                          </div>
                          {entry.student_id === user?.id && (
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                              أنت
                            </div>
                          )}
                        </div>
                        
                        {/* Name */}
                        <h3 className="text-white font-bold text-sm md:text-lg text-center mb-2 max-w-[100px] md:max-w-[140px] truncate">
                          {entry.student.name}
                        </h3>
                        
                        {/* Points Badge */}
                        <div className={`px-4 py-1.5 rounded-full ${config.bgGradient} border ${config.borderColor} mb-4`}>
                          <span className="text-white font-bold text-sm md:text-base">{getPoints(entry)}</span>
                          <span className="text-gray-300 text-xs md:text-sm mr-1">نقطة</span>
                        </div>
                        
                        {/* Podium Stand */}
                        <div className={`w-24 md:w-36 ${config.height} ${config.bgGradient} border-t-4 ${config.borderColor} rounded-t-2xl flex items-center justify-center backdrop-blur-xl shadow-2xl`}>
                          <span className={`text-4xl md:text-6xl font-bold ${config.crownColor} drop-shadow-lg`}>
                            {config.position}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


            {/* Rest of Leaderboard (Glassmorphic Cards) */}
            {restOfList.length > 0 && (
              <div className={`mb-10 transition-all duration-700 delay-400 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <i className="fas fa-list-ol text-primary" />
                  باقي المتسابقين
                </h2>
                
                <div className="space-y-3">
                  {restOfList.map((entry, index) => (
                    <div
                      key={entry.student_id}
                      className="group relative overflow-hidden bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Rank */}
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg md:text-xl text-gray-300 border border-white/10">
                            #{entry.rank}
                          </div>
                          
                          {/* Avatar */}
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-white/20 bg-white/10">
                            {entry.student.avatar_key ? (
                              <img 
                                src={entry.student.avatar_key} 
                                alt={entry.student.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <i className="fas fa-user text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Name */}
                          <div>
                            <h3 className="font-bold text-white text-sm md:text-base">{entry.student.name}</h3>
                            {entry.student_id === user?.id && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">أنت</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Points */}
                        <div className="text-left">
                          <div className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                            {getPoints(entry)}
                          </div>
                          <div className="text-xs text-gray-400">نقطة</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {currentLeaderboard.length === 0 && (
              <div className={`text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-400 text-lg mb-2">لا توجد بيانات بعد</p>
                <p className="text-sm text-gray-500">احضر المحاضرات واجتز الامتحانات لتظهر في لوحة الشرف!</p>
              </div>
            )}

            {/* Points Guide */}
            <div className={`bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10 transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <i className="fas fa-info-circle text-primary" />
                </span>
                كيف تجمع النقاط؟
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: '📚', label: 'حضور الحصة', points: '+10', color: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30' },
                  { icon: '📝', label: 'درجة الامتحان', points: 'حتى +50', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30' },
                  { icon: '🔥', label: 'سلسلة 5 حصص', points: '+15', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30' },
                  { icon: '🏆', label: 'أول الدفعة', points: '+25', color: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30' },
                ].map((item, index) => (
                  <div 
                    key={index}
                    className={`group text-center p-5 bg-gradient-to-b ${item.color} rounded-2xl border ${item.border} hover:scale-105 transition-all duration-300 cursor-default`}
                  >
                    <div className="text-3xl md:text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{item.icon}</div>
                    <div className="text-sm text-gray-300 mb-2">{item.label}</div>
                    <div className="text-lg md:text-xl font-bold text-green-400">{item.points}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
