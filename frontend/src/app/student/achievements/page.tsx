'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { Button, Icon } from '@/components/ui/index';
import { StudentHonorBoard } from '@/components/dashboard/StudentHonorBoard';

interface Level {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  min_points: number;
  max_points: number | null;
  is_current: boolean;
  is_achieved: boolean;
  history_id: string | null;
}

interface HistoryEntry {
  id: string;
  level_name: string;
  level_icon: string | null;
  level_color: string | null;
  achieved_at: string;
  has_certificate: boolean;
}

interface PointsBreakdown {
  teacher: {
    id: string;
    name: string;
    avatar_key?: string;
  };
  points: number;
}

interface AchievementsData {
  total_points: number;
  current_level: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    sort_order: number;
    min_points: number;
    max_points: number | null;
  } | null;
  next_level: {
    name: string;
    icon: string | null;
    min_points: number;
  } | null;
  progress_percentage: number;
  points_to_next_level: number;
  points_breakdown: PointsBreakdown[];
  levels_timeline: Level[];
  history: HistoryEntry[];
}

export default function StudentAchievementsPage() {
  const { user, selectedTeacher } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AchievementsData | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCertData, setPreviewCertData] = useState<{ studentName: string; levelName: string; date: string; historyId: string; color: string; gender?: string; teacherName?: string } | null>(null);
  const userEmail =
    user && 'email' in user && typeof (user as { email?: unknown }).email === 'string'
      ? ((user as { email?: string }).email ?? '')
      : '';

  const userGender = user && 'gender' in user ? (user as { gender?: string }).gender : '';

  const mockUser = {
    name: user?.name || 'طالب',
    email: userEmail,
    avatar: user?.avatar || '/images/avatars/default-avatar.png',
    role: 'student' as const,
    gender: userGender,
  };

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true);
        const url = selectedTeacher?.teacher_id 
          ? `/api/student/achievements?teacher_id=${selectedTeacher.teacher_id}`
          : '/api/student/achievements';
        const response = await fetchApi(url);
        const achievementsData =
          response && typeof response === 'object' && 'data' in response
            ? (response as { data?: AchievementsData }).data
            : (response as AchievementsData);

        if (!achievementsData) {
          throw new Error('Empty achievements payload');
        }

        setData(achievementsData);
        setError(null);
        setTimeout(() => setShowContent(true), 300);
      } catch (err: unknown) {
        console.error('Failed to load achievements:', err);
        setError('فشل في تحميل بيانات الإنجازات');
      } finally {
        setLoading(false);
      }
    };

    loadAchievements();
  }, [selectedTeacher?.teacher_id]);

  const handlePreviewCertificate = (historyId: string) => {
    const entry = data?.history?.find((h) => h.id === historyId);
    if (!entry) return;

    setPreviewCertData({
      studentName: mockUser.name,
      levelName: entry.level_name,
      date: entry.achieved_at,
      historyId: entry.id,
      color: entry.level_color || '#8B5CF6',
      gender: mockUser.gender
    });
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewCertData(null);
  };

  const levelColor = data?.current_level?.color || '#6366f1';
  const dedupedLevelsTimeline = useMemo(() => {
    const levels = data?.levels_timeline || [];
    const uniqueLevels = new Map<string, Level>();

    levels.forEach((level) => {
      const dedupeKey = `${level.sort_order}-${level.name}`;
      const existing = uniqueLevels.get(dedupeKey);

      if (!existing) {
        uniqueLevels.set(dedupeKey, level);
        return;
      }

      const existingScore = Number(existing.is_current) * 100 + Number(existing.is_achieved) * 10 + Number(Boolean(existing.history_id));
      const nextScore = Number(level.is_current) * 100 + Number(level.is_achieved) * 10 + Number(Boolean(level.history_id));

      if (nextScore > existingScore) {
        uniqueLevels.set(dedupeKey, level);
      }
    });

    return Array.from(uniqueLevels.values()).sort((a, b) => a.sort_order - b.sort_order);
  }, [data?.levels_timeline]);

  const visibleLevelsTimeline = dedupedLevelsTimeline; // إظهار كل المستويات حتى المقفلة

  const dedupedHistory = useMemo(() => {
    const history = data?.history || [];
    const uniqueHistory = new Map<string, HistoryEntry>();

    history.forEach((entry) => {
      // إخفاء المستويات التي لم يتم اجتيازها فعلياً
      const levelInfo = dedupedLevelsTimeline.find((l) => l.name === entry.level_name);
      if (!levelInfo || !levelInfo.is_achieved) {
        return;
      }

      const dedupeKey = entry.level_name;
      const existing = uniqueHistory.get(dedupeKey);

      if (!existing) {
        uniqueHistory.set(dedupeKey, entry);
        return;
      }

      const existingDate = new Date(existing.achieved_at).getTime();
      const nextDate = new Date(entry.achieved_at).getTime();

      if (nextDate >= existingDate) {
        uniqueHistory.set(dedupeKey, entry);
      }
    });

    return Array.from(uniqueHistory.values()).sort((a, b) => {
      const orderA = dedupedLevelsTimeline.find((l) => l.name === a.level_name)?.sort_order ?? 0;
      const orderB = dedupedLevelsTimeline.find((l) => l.name === b.level_name)?.sort_order ?? 0;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return new Date(a.achieved_at).getTime() - new Date(b.achieved_at).getTime();
    });
  }, [data?.history, dedupedLevelsTimeline]);

  return (
    <DashboardLayout role="student" user={mockUser}>
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px] animate-pulse opacity-20" 
          style={{ backgroundColor: levelColor }}
        />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-4">
        {/* Page Header */}
        <div className="relative mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 blur-[120px] translate-y-1/2 -translate-x-1/3"></div>

          <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary text-4xl shadow-2xl premium-border">
                <Icon name="medal" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">إنجازاتي ولوحة الشرف</h2>
                <p className="text-gray-light/60 text-lg font-medium">تتبع تقدمك، احصل على أوسمة جديدة، ونافس زملاءك في التفوق</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-center md:items-end">
                  <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">المعلم الحالي</span>
                  <span className="text-xl font-black text-white">
                    {selectedTeacher?.teacher_name || (selectedTeacher as any)?.name || 'اختر مدرساً'}
                  </span>
               </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? null : error ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
            <div className="text-6xl mb-2 sm:mb-3 lg:mb-4">😔</div>
            <p className="text-red-400 text-lg mb-3 sm:mb-2 sm:mb-3 lg:mb-4 lg:mb-6">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : data ? (
          <>
            {/* Current Level Hero Card */}
            <div className={`mb-12 transition-all duration-1000 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div 
                className="relative overflow-hidden premium-glass premium-border rounded-[3rem] p-8 md:p-12 shadow-2xl group"
              >
                {/* Advanced Background Effects */}
                <div 
                  className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity duration-500" 
                  style={{ backgroundColor: levelColor }} 
                />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                  {/* Level Icon - Orbit Effect */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl animate-pulse" />
                    <div 
                      className="relative w-40 h-40 md:w-52 md:h-52 rounded-[3rem] flex items-center justify-center text-6xl md:text-8xl shadow-2xl border-2 rotate-3 group-hover:rotate-0 transition-transform duration-700"
                      style={{ 
                        background: `linear-gradient(135deg, ${levelColor}30, ${levelColor}10)`,
                        borderColor: `${levelColor}40`,
                        boxShadow: `0 20px 50px ${levelColor}20`,
                      }}
                    >
                      <span className="drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">{data.current_level?.icon || '🌱'}</span>
                      
                      {/* Floating Particles */}
                      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-xl animate-bounce shadow-xl" style={{ animationDuration: '3s' }}>✨</div>
                      <div className="absolute -bottom-2 -left-6 w-10 h-10 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-lg animate-bounce shadow-xl" style={{ animationDuration: '4s', animationDelay: '1s' }}>🔥</div>
                    </div>
                    
                    {/* Level Badge */}
                    <div 
                      className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl text-white font-black text-sm shadow-2xl border border-white/10 backdrop-blur-xl"
                      style={{ backgroundColor: levelColor }}
                    >
                      المستوى {data.current_level?.sort_order || 1}
                    </div>
                  </div>

                  {/* Level Info & Progress */}
                  <div className="flex-1 text-center lg:text-right space-y-8">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black text-gray-light/40 uppercase tracking-widest">
                        <Icon name="star" className="text-yellow-500" />
                        <span>مستواك الحالي</span>
                      </div>
                      <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl">
                        {data.current_level?.name || 'طالب مبتدئ'}
                      </h2>
                      {data.current_level?.description && (
                        <p className="text-gray-light/60 text-lg md:text-xl font-medium max-w-2xl lg:ml-0 lg:mr-0 mx-auto leading-relaxed">
                          {data.current_level.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Progress Journey */}
                    {data.next_level ? (
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-lg">
                              {data.next_level.icon || '🚀'}
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">المستوى القادم</p>
                              <p className="text-lg font-bold text-white">{data.next_level.name}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center md:items-end">
                            <span className="text-4xl font-black text-white tabular-nums drop-shadow-lg" style={{ color: levelColor }}>
                              {data.progress_percentage}%
                            </span>
                            <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">نسبة الإنجاز</span>
                          </div>
                        </div>

                        {/* Premium Progress Bar */}
                        <div className="relative">
                          <div className="w-full h-4 bg-white/5 rounded-full border border-white/5 p-1 backdrop-blur-sm">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden group-hover:brightness-110"
                              style={{ 
                                width: `${data.progress_percentage}%`,
                                background: `linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`,
                                boxShadow: `0 0 20px ${levelColor}40`,
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                            </div>
                          </div>
                          
                          <div className="flex justify-between mt-4 text-[10px] font-black text-gray-light/20 uppercase tracking-[0.2em]">
                            <div className="flex flex-col items-start gap-1">
                               <span>البداية</span>
                               <span className="text-white/40">{data.current_level?.min_points} نقطة</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 bg-white/5 px-4 py-2 rounded-xl border border-white/5 animate-pulse">
                               <span className="text-white">باقي {data.points_to_next_level} نقطة</span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                               <span>الهدف</span>
                               <span className="text-white/40">{data.next_level.min_points} نقطة</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-4 p-6 rounded-3xl bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-xl animate-bounce">
                        <div className="text-4xl">👑</div>
                        <div className="text-right">
                          <h3 className="text-xl font-black text-yellow-500 uppercase tracking-widest">وصلت للقمة</h3>
                          <p className="text-sm font-bold text-white/60">أنت الآن في أعلى مستوى ممكن، استمر في التميز!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total Points Floating Card */}
                  <div className="lg:absolute lg:-top-6 lg:-left-6 bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl flex flex-col items-center justify-center min-w-[160px] hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-2xl mb-3">
                      <Icon name="coins" />
                    </div>
                    <div className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">
                      {data.total_points.toLocaleString('ar-EG')}
                    </div>
                    <div className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest mt-1">نقطة إجمالية</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Levels Journey Path */}
            <div className={`mb-16 transition-all duration-700 delay-400 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="premium-glass premium-border rounded-[3rem] p-8 md:p-12">
                <div className="flex items-center gap-4 mb-10 px-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
                      <Icon name="map-marked-alt" />
                   </div>
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black text-white">رحلة التطوير</h3>
                      <p className="text-gray-light/40 text-sm font-medium">خارطة طريقك للوصول إلى أعلى المراتب العلمية</p>
                   </div>
                </div>

                <div className="relative space-y-4">
                  {/* Vertical Connector Path */}
                  <div className="absolute top-0 bottom-0 right-[43px] md:right-[59px] w-1 bg-white/5 rounded-full" />
                  
                  <div className="space-y-6">
                    {visibleLevelsTimeline.map((level, idx) => {
                      const isAchieved = level.is_achieved;
                      const isCurrent = level.is_current;
                      
                      return (
                        <div
                          key={level.id}
                          className={`relative flex items-center gap-6 p-4 md:p-6 rounded-[2rem] transition-all duration-500
                            ${isCurrent ? 'bg-white/10 ring-1 ring-white/20 shadow-2xl scale-[1.02] z-10' : 
                              isAchieved ? 'bg-white/[0.03] hover:bg-white/5 cursor-pointer' : 'opacity-40 grayscale pointer-events-none'}`}
                          onClick={() => {
                            if (isAchieved && level.history_id) {
                              handlePreviewCertificate(level.history_id);
                            }
                          }}
                        >
                          {/* Step Indicator */}
                          <div className="relative z-10 shrink-0">
                             <div 
                                className={`w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center text-2xl md:text-4xl transition-all duration-500
                                  ${isCurrent ? 'shadow-[0_0_30px_rgba(255,255,255,0.1)] border-2' : 'border border-white/10'}`}
                                style={isAchieved ? {
                                  background: `linear-gradient(135deg, ${level.color || '#6366f1'}30, ${level.color || '#6366f1'}10)`,
                                  borderColor: isCurrent ? level.color || '#6366f1' : `${level.color || '#6366f1'}30`,
                                  boxShadow: isCurrent ? `0 0 30px ${level.color || '#6366f1'}40` : 'none',
                                } : {
                                  background: 'rgba(255,255,255,0.05)',
                                }}
                             >
                                {isAchieved ? (level.icon || '⭐') : <Icon name="lock" className="text-xl" />}
                             </div>
                             
                             {/* Small connector dot */}
                             {idx < visibleLevelsTimeline.length - 1 && (
                               <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-6 bg-white/5" />
                             )}
                          </div>

                          {/* Level Details */}
                          <div className="flex-1 min-w-0 text-right">
                             <div className="flex items-center gap-3 mb-1">
                                <h4 className={`text-xl md:text-2xl font-black tracking-tight ${isCurrent ? 'text-white' : 'text-white/70'}`}>
                                   {level.name}
                                </h4>
                                {isCurrent && (
                                   <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                      المستوى الحالي
                                   </span>
                                )}
                             </div>
                             <p className="text-sm md:text-base text-gray-light/40 font-medium line-clamp-1">{level.description || 'لم يتم إضافة وصف لهذا المستوى'}</p>
                          </div>

                          {/* Points Info */}
                          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                             <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em]">
                                {level.min_points.toLocaleString('ar-EG')} نقطة
                             </div>
                             {isAchieved && !isCurrent && (
                                <div className="text-emerald-500 text-[10px] font-black flex items-center gap-1">
                                   <Icon name="check-double" />
                                   <span>مكتمل</span>
                                </div>
                             )}
                          </div>
                          
                          {/* Action Arrow */}
                          {isAchieved && level.history_id && (
                             <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-light/20 group-hover:text-primary transition-colors">
                                <Icon name="chevron-left" />
                             </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Certificates Gallery */}
            {dedupedHistory.length > 0 && (
              <div className={`mb-16 transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                <div className="premium-glass premium-border rounded-[3rem] p-8 md:p-12">
                   <div className="flex items-center gap-4 mb-10 px-4">
                      <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500 text-xl">
                         <Icon name="award" />
                      </div>
                      <div className="space-y-1">
                         <h3 className="text-2xl font-black text-white">معرض الأوسمة</h3>
                         <p className="text-gray-light/40 text-sm font-medium">الشهادات التي حصلت عليها خلال مسيرتك</p>
                      </div>
                   </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dedupedHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="group relative overflow-hidden premium-glass premium-border rounded-[2.5rem] p-6 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                      >
                        {/* Level Gradient Background */}
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                          style={{ background: `linear-gradient(135deg, ${entry.level_color}, transparent)` }}
                        />
                        
                        <div className="relative flex flex-col items-center text-center space-y-6">
                          {/* Award Emblem */}
                          <div className="relative">
                            <div 
                              className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl shadow-xl border-2 rotate-3 group-hover:rotate-0 transition-transform duration-500"
                              style={{ 
                                background: `linear-gradient(135deg, ${entry.level_color}30, ${entry.level_color}10)`,
                                borderColor: `${entry.level_color}40`,
                                boxShadow: `0 10px 30px ${entry.level_color}20`,
                              }}
                            >
                              {entry.level_icon || '🏅'}
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs">
                               <Icon name="check" />
                            </div>
                          </div>

                          <div className="space-y-2">
                             <h4 className="text-xl font-black text-white tracking-tight">{entry.level_name}</h4>
                             <p className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em]">
                                {new Date(entry.achieved_at).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                             </p>
                          </div>

                          <button
                            onClick={() => handlePreviewCertificate(entry.id)}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 group/btn"
                          >
                            <Icon name="certificate" className="text-lg group-hover/btn:scale-110 transition-transform" />
                            <span>عرض الشهادة</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty History State */}
            {dedupedHistory.length === 0 && (
              <div className={`mb-2 sm:mb-3 lg:mb-4 sm:mb-3 sm:mb-2 sm:mb-3 lg:mb-4 lg:mb-6 lg:mb-8 transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                  <div className="text-5xl mb-2 sm:mb-3 lg:mb-4">🚀</div>
                  <p className="text-gray-400 text-lg mb-2">لم تحقق أي إنجازات بعد</p>
                  <p className="text-sm text-gray-500">استمر في جمع النقاط للوصول إلى مستويات جديدة والحصول على شهادات!</p>
                </div>
              </div>
            )}

            {/* Honor Board below achievements */}
            <StudentHonorBoard />
          </>
        ) : null}
      </div>


      {previewOpen && previewCertData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 print:bg-white print:items-start print:justify-start"
          onClick={handleClosePreview}
        >
          <div
            className="w-full max-w-4xl bg-slate-950/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] print:max-w-none print:w-full print:h-screen print:max-h-screen print:border-none print:rounded-none print:shadow-none print:bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0 print:hidden">
              <h3 className="text-white text-lg font-bold">معاينة الشهادة</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 print:hidden"
                >
                  <Icon name="print" />
                  <span>طباعة الشهادة</span>
                </Button>
                <Button variant="outline" onClick={handleClosePreview} className="print:hidden">
                  إغلاق
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 bg-slate-900/80 custom-scrollbar flex items-center justify-center print:overflow-hidden print:p-0 print:bg-white print:block">
              {/* React Native Certificate UI */}
              <div 
                id="certificate-print-wrapper"
                className="relative w-full max-w-2xl lg:max-w-3xl overflow-hidden rounded shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-slate-50 text-slate-800 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 text-center border-4 print:w-screen print:h-screen print:max-w-none print:border-8 print:shadow-none print:m-0 print:rounded-none"
                style={{ 
                   borderColor: '#000000',
                   minHeight: '350px',
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }}
              >
                <div className="absolute inset-2 border-2 border-dashed pointer-events-none" style={{ borderColor: `#00000050` }}></div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/50 to-white/90 pointer-events-none"></div>
                
                <div className="relative z-10 w-full h-full flex flex-col justify-center print:justify-evenly py-4 md:py-8 lg:py-12 print:py-16">
                  {/* Header */}
                  <h1 
                    className="text-2xl sm:text-xl sm:text-lg sm:text-xl md:text-2xl lg:text-3xl lg:text-4xl lg:text-5xl print:text-5xl font-bold mb-2 sm:mb-3 lg:mb-4 sm:mb-3 sm:mb-2 sm:mb-3 lg:mb-4 lg:mb-6 lg:mb-8 print:mb-8 font-serif uppercase tracking-widest"
                    style={{ color: '#000000' }}
                  >
                    شهادة إنجاز
                  </h1>
                  
                  {/* Body */}
                  <p className="text-sm sm:text-base md:text-xl lg:text-2xl print:text-2xl text-slate-600 mb-2 sm:mb-3 lg:mb-4 print:mb-6 font-medium">
                    {previewCertData.gender === 'female' ? 'بكل فخر واعتزاز، نشهد أن الطالبة' : 'بكل فخر واعتزاز، نشهد أن الطالب'}
                  </p>
                  
                  <div className="flex justify-center">
                    <h2 className="text-xl sm:text-lg sm:text-xl md:text-2xl lg:text-3xl lg:text-4xl print:text-4xl font-bold text-slate-900 mb-3 sm:mb-2 sm:mb-3 lg:mb-4 lg:mb-6 print:mb-8 border-b-2 pb-2 inline-block px-8" 
                        style={{ borderBottomColor: '#000000' }}>
                      {previewCertData.studentName}
                    </h2>
                  </div>
                  
                  <p className="text-sm sm:text-base md:text-xl lg:text-2xl print:text-2xl text-slate-600 mb-2 sm:mb-3 lg:mb-4 print:mb-6 font-medium">
                    {previewCertData.gender === 'female' ? 'قد اجتازت بنجاح وتفوق متطلبات مستوى' : 'قد اجتاز بنجاح وتفوق متطلبات مستوى'}
                  </p>
                  
                  <div className="flex justify-center">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl print:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 sm:mb-3 sm:mb-2 sm:mb-3 lg:mb-4 lg:mb-6 lg:mb-8 print:mb-10 inline-block px-6 py-2 rounded-full" 
                        style={{ backgroundColor: `${previewCertData.color}15`, color: previewCertData.color, border: `1px solid ${previewCertData.color}30` }}>
                      {previewCertData.levelName}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm md:text-lg lg:text-xl print:text-xl text-slate-500 mb-3 sm:mb-2 sm:mb-3 lg:mb-4 lg:mb-6 sm:mb-8 lg:mb-12 print:mb-16 italic font-medium">
                    مع خالص شكرنا وتقديرنا لما قدمه الوالدان الكريمان من دعم ومساندة وتوفير بيئة محفزة للنجاح
                  </p>

                  {/* Footer / Meta */}
                  <div className="flex justify-between items-end w-full mt-auto pt-2 sm:pt-4 md:pt-8 lg:pt-12 print:pt-16 relative px-0 sm:px-4 md:px-12 lg:px-24 print:px-32">
                    <div className="text-center w-24 sm:w-32 md:w-40 print:w-48">
                      <p className="text-[10px] sm:text-xs md:text-sm print:text-base text-slate-500 mb-1 sm:mb-2 print:mb-3 font-medium">تاريخ الإصدار</p>
                      <p className="font-bold text-slate-700 border-t border-slate-300 pt-1 sm:pt-2 print:pt-3 text-xs sm:text-sm md:text-lg print:text-xl">
                        {new Date(previewCertData.date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    
                    <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 print:w-32 print:h-32 rounded-full flex flex-col items-center justify-center border-2 md:border-[3px] print:border-4 bg-white shadow-lg relative transform rotate-[-15deg] shrink-0 mx-2"
                         style={{ borderColor: '#000000', color: '#000000' }}>
                      <div className="absolute inset-[2px] md:inset-1 border border-dashed rounded-full" style={{ borderColor: '#000000' }}></div>
                      <Icon name="award" className="text-sm sm:text-sm sm:text-base md:text-xl lg:text-2xl print:text-4xl mb-0 sm:mb-1 opacity-80" />
                      <span className="font-bold text-[5px] sm:text-[8px] md:text-[10px] print:text-xs uppercase tracking-wider mt-[-2px] sm:mt-0">اعتماد نطاق</span>
                    </div>

                    <div className="text-center w-24 sm:w-32 md:w-40 print:w-48">
                      <p className="text-[10px] sm:text-xs md:text-sm print:text-base text-slate-500 mb-1 sm:mb-2 print:mb-3 font-medium">توقيع الإدارة</p>
                      <p className="font-bold text-slate-700 border-t border-slate-300 pt-1 sm:pt-2 print:pt-3 text-sm sm:text-xs sm:text-sm md:text-lg lg:text-xl print:text-2xl leading-tight" style={{ fontFamily: "cursive" }}>
                        مؤسسة نطاق
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CSS for print & animations */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          
          html, body {
            width: 100%;
            height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background: white;
          }

          body * {
            visibility: hidden;
          }
          
          #certificate-print-wrapper,
          #certificate-print-wrapper * {
            visibility: visible;
          }

          #certificate-print-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 2rem !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            transform: scale(0.98);
            transform-origin: center;
          }
        }
      `}</style>
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }
      `}</style>
    </DashboardLayout>
  );
}
