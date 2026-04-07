'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { Button, LoadingSpinner, Icon } from '@/components/ui/index';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AchievementsData | null>(null);
  const [showContent, setShowContent] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);
  const userEmail =
    user && 'email' in user && typeof (user as { email?: unknown }).email === 'string'
      ? ((user as { email?: string }).email ?? '')
      : '';

  const mockUser = {
    name: user?.name || 'طالب',
    email: userEmail,
    avatar: user?.avatar || '/images/avatars/default-avatar.png',
    role: 'student' as const,
  };

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        setLoading(true);
        const response = await fetchApi('/api/student/achievements');
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
  }, []);

  const handleDownloadCertificate = async (historyId: string) => {
    try {
      setDownloadingCert(historyId);
      const response = await fetch(`/api/v1/student/achievements/certificate/${historyId}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `شهادة_إنجاز.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert('فشل في تحميل الشهادة');
    } finally {
      setDownloadingCert(null);
    }
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

  const currentLevelIndex = dedupedLevelsTimeline.findIndex((level) => level.is_current);
  const visibleLevelsTimeline = dedupedLevelsTimeline.filter((level, index) => {
    if (level.is_achieved || level.is_current) {
      return true;
    }

    return currentLevelIndex >= 0 && index === currentLevelIndex + 1;
  });

  const dedupedHistory = useMemo(() => {
    const history = data?.history || [];
    const uniqueHistory = new Map<string, HistoryEntry>();

    history.forEach((entry) => {
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

    return Array.from(uniqueHistory.values()).sort(
      (a, b) => new Date(b.achieved_at).getTime() - new Date(a.achieved_at).getTime(),
    );
  }, [data?.history]);

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
        {/* Header */}
        <div className={`flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="text-center sm:text-right">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center sm:justify-start gap-3">
              إنجازاتي
            </h1>
            <p className="text-gray-400 text-lg">
              تتبع تقدمك ومستواك في رحلة التعلم
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/student/dashboard'}
            className="flex items-center gap-2"
          >
            <span>العودة</span>
            <Icon name="arrow-right" />
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <LoadingSpinner size="lg" />
            </div>
            <p className="text-gray-400 mt-4 text-lg">جاري تحميل الإنجازات...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
            <div className="text-6xl mb-4">😔</div>
            <p className="text-red-400 text-lg mb-6">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </div>
        ) : data ? (
          <>
            {/* Current Level Card */}
            <div className={`mb-8 transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <div 
                className="relative overflow-hidden backdrop-blur-xl rounded-3xl p-6 md:p-8 border shadow-2xl"
                style={{ 
                  background: `linear-gradient(135deg, ${levelColor}20 0%, ${levelColor}08 50%, rgba(139,92,246,0.1) 100%)`,
                  borderColor: `${levelColor}40`,
                }}
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20" style={{ backgroundColor: levelColor }} />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
                  {/* Level Icon */}
                  <div className="relative">
                    <div 
                      className="w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center text-5xl md:text-6xl shadow-2xl border-4"
                      style={{ 
                        background: `linear-gradient(135deg, ${levelColor}30, ${levelColor}10)`,
                        borderColor: `${levelColor}60`,
                        boxShadow: `0 0 40px ${levelColor}30`,
                      }}
                    >
                      {data.current_level?.icon || '🌱'}
                    </div>
                    {/* Level number badge */}
                    <div 
                      className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                      style={{ backgroundColor: levelColor }}
                    >
                      {data.current_level?.sort_order || 1}
                    </div>
                  </div>

                  {/* Level Info */}
                  <div className="flex-1 text-center md:text-right">
                    <div className="text-sm text-gray-400 mb-1">مستواك الحالي</div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {data.current_level?.name || 'طالب مبتدئ'}
                    </h2>
                    {data.current_level?.description && (
                      <p className="text-gray-300 text-lg mb-4">{data.current_level.description}</p>
                    )}
                    
                    {/* Progress Bar */}
                    {data.next_level && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2 text-sm">
                          <span className="text-gray-400">
                            التقدم نحو مستوى <span className="text-white font-medium">{data.next_level.name}</span>
                          </span>
                          <span className="font-bold" style={{ color: levelColor }}>
                            {data.progress_percentage}%
                          </span>
                        </div>
                        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{ 
                              width: `${data.progress_percentage}%`,
                              background: `linear-gradient(90deg, ${levelColor}, ${levelColor}cc)`,
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                          <span>{data.current_level?.min_points} نقطة</span>
                          <span className="text-gray-400">
                            باقي <span className="font-bold text-white">{data.points_to_next_level}</span> نقطة
                          </span>
                          <span>{data.next_level.min_points} نقطة</span>
                        </div>
                      </div>
                    )}
                    {!data.next_level && data.current_level && (
                      <div className="mt-4 flex items-center gap-2 text-yellow-400">
                        <span className="text-xl">👑</span>
                        <span className="font-bold">وصلت لأعلى مستوى! مبروك!</span>
                      </div>
                    )}
                  </div>

                  {/* Total Points */}
                  <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-5 border border-white/10">
                    <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                      {data.total_points.toLocaleString('ar-EG')}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">إجمالي النقاط</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Points Breakdown & Levels Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Points Breakdown */}
              {data.points_breakdown.length > 0 && (
                <div className={`transition-all duration-700 delay-300 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 h-full">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Icon name="chart-bar" className="text-primary" />
                      </span>
                      توزيع النقاط
                    </h3>
                    <div className="space-y-4">
                      {data.points_breakdown.map((item, index) => {
                        const maxPoints = Math.max(...data.points_breakdown.map(p => p.points), 1);
                        const percentage = (item.points / maxPoints) * 100;
                        return (
                          <div key={index} className="group">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                  <Icon name="chalkboard-teacher" className="text-gray-400 text-xs" />
                                </div>
                                <span className="text-white font-medium text-sm">{item.teacher.name}</span>
                              </div>
                              <span className="text-primary font-bold">{item.points.toLocaleString('ar-EG')}</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-700"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Levels Timeline */}
              <div className={`transition-all duration-700 delay-400 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 h-full">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    المستويات
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pl-2">
                    {visibleLevelsTimeline.map((level) => (
                      <div
                        key={level.id}
                        className={`relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                          level.is_current
                            ? 'bg-white/10 border border-white/20 shadow-lg'
                            : level.is_achieved
                            ? 'bg-white/5 border border-white/5'
                            : 'opacity-50'
                        }`}
                      >
                        {/* Timeline line removed */}
                        
                        {/* Level icon */}
                        <div 
                          className={`relative z-10 w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-xl border-2 transition-all ${
                            level.is_achieved ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-not-allowed'
                          } ${
                            level.is_current
                              ? 'shadow-lg'
                              : level.is_achieved
                              ? 'border-green-500/50'
                              : 'border-white/10 bg-white/5'
                          }`}
                          onClick={() => {
                            if (level.is_achieved && level.history_id) {
                              handleDownloadCertificate(level.history_id);
                            }
                          }}
                          title={level.is_achieved ? 'تحميل الشهادة' : 'مستوى مقفل'}
                          style={level.is_current ? {
                            borderColor: level.color || '#6366f1',
                            backgroundColor: `${level.color || '#6366f1'}20`,
                            boxShadow: `0 0 20px ${level.color || '#6366f1'}30`,
                          } : level.is_achieved ? {
                            backgroundColor: `${level.color || '#6366f1'}15`,
                          } : {}}
                        >
                          {level.is_achieved ? (
                            level.icon || '⭐'
                          ) : (
                            <span className="text-gray-500">🔒</span>
                          )}

                          {/* Downloading Indicator on Icon */}
                          {downloadingCert === level.history_id && (
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                              <LoadingSpinner size="sm" />
                            </div>
                          )}
                        </div>

                        {/* Level info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${level.is_current ? 'text-white' : level.is_achieved ? 'text-gray-300' : 'text-gray-500'}`}>
                              {level.name}
                            </span>
                            {level.is_current && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${level.color}30`, color: level.color || '#fff' }}>
                                أنت هنا
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {level.min_points.toLocaleString('ar-EG')} {level.max_points ? `– ${level.max_points.toLocaleString('ar-EG')}` : '+'} نقطة
                          </div>
                        </div>

                        {/* Right side info remains, left side icon removed */}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Certificates History */}
            {dedupedHistory.length > 0 && (
              <div className={`mb-8 transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    الشهادات والإنجازات
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dedupedHistory.map((entry) => (
                      <div
                        key={entry.id}
                        className="relative overflow-hidden bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/10 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent opacity-0 transition-opacity duration-300"
                          style={{ background: `linear-gradient(135deg, ${entry.level_color}10, transparent)` }}
                        />
                        
                        <div className="relative">
                          <div className="flex items-center gap-3 mb-3">
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
                              style={{ 
                                borderColor: `${entry.level_color}60`,
                                backgroundColor: `${entry.level_color}15`,
                              }}
                            >
                              {entry.level_icon || '🏅'}
                            </div>
                            <div>
                              <h4 className="text-white font-bold">{entry.level_name}</h4>
                              <p className="text-gray-500 text-xs">
                                {new Date(entry.achieved_at).toLocaleDateString('ar-EG', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>

                          {entry && (
                            <button
                              onClick={() => handleDownloadCertificate(entry.id)}
                              disabled={downloadingCert === entry.id}
                              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
                              style={{
                                background: `linear-gradient(135deg, ${entry.level_color}30, ${entry.level_color}15)`,
                                border: `1px solid ${entry.level_color}40`,
                                color: entry.level_color || '#fff',
                              }}
                            >
                              {downloadingCert === entry.id ? (
                                <>
                                  <LoadingSpinner size="sm" />
                                  <span>جاري التحميل...</span>
                                </>
                              ) : (
                                <>
                                  <Icon name="download" />
                                  <span>تحميل الشهادة</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty History State */}
            {dedupedHistory.length === 0 && (
              <div className={`mb-8 transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center py-12 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                  <div className="text-5xl mb-4">🚀</div>
                  <p className="text-gray-400 text-lg mb-2">لم تحقق أي إنجازات بعد</p>
                  <p className="text-sm text-gray-500">استمر في جمع النقاط للوصول إلى مستويات جديدة والحصول على شهادات!</p>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* CSS for shimmer animation */}
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
