'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { Button, Icon, LoadingSpinner } from '@/components/ui/index';

interface AvailableCounts {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

interface HistoryItem {
  id: string;
  exam_id: string;
  status: string;
  started_at: string;
  completed_at: string;
  total_questions: number;
  score: number | null;
  percentage: number | null;
  exam_title: string;
  subject: string;
}

export default function SelfTestPage() {
  const { user, selectedTeacher: authSelectedTeacher, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [counts, setCounts] = useState<AvailableCounts | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Configuration state
  const [config, setConfig] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    if (authSelectedTeacher) {
      handleTeacherLoad(authSelectedTeacher.teacher_id);
    } else {
      setLoading(false);
    }
  }, [user, authLoading, authSelectedTeacher]);

  const handleTeacherLoad = async (teacherId: string) => {
    setLoading(true);
    try {
      const [countsRes, historyRes] = await Promise.all([
        fetchApi(`/student/self-test/available-counts?teacher_id=${teacherId}`),
        fetchApi(`/student/self-test/history?teacher_id=${teacherId}`)
      ]);
      setCounts(countsRes as AvailableCounts);
      setHistory((historyRes as any).data || []);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!authSelectedTeacher) {
      toast.error('يرجى اختيار مدرس أولاً');
      return;
    }
    const total = config.easy + config.medium + config.hard;
    if (total <= 0) {
      toast.error('يرجى اختيار سؤال واحد على الأقل');
      return;
    }
    if (total > 50) {
      toast.error('الحد الأقصى هو 50 سؤالاً');
      return;
    }

    setStarting(true);
    try {
      const response = await fetchApi('/student/self-test/start', {
        method: 'POST',
        body: JSON.stringify({
          teacher_id: authSelectedTeacher.teacher_id,
          easy_count: config.easy,
          medium_count: config.medium,
          hard_count: config.hard,
        }),
      }) as any;

      if (response && response.attempt_id) {
        toast.success('تم إنشاء الاختبار بنجاح');
        router.push(`/student/self-test/${response.attempt_id}/take`);
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء بدء الاختبار');
    } finally {
      setStarting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateString));
    } catch (e) {
      return dateString;
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 font-bold">جاري التحميل...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!authSelectedTeacher) {
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="max-w-5xl mx-auto p-4 sm:p-8">
           <div className="p-10 text-center premium-glass rounded-3xl border border-dashed border-border-theme-secondary shadow-lg">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Icon name="exclamation-triangle" className="text-warning" size="lg" />
              </div>
              <h2 className="text-text-theme-primary text-xl font-bold mb-2">لم يتم اختيار مدرس</h2>
              <p className="text-text-theme-secondary mb-6">يرجى اختيار المدرس من القائمة العلوية أولاً لتتمكن من إجراء الاختبار.</p>
              <Button onClick={() => router.push('/student/teachers')}>ذهاب لصفحة المدرسين</Button>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalSelected = config.easy + config.medium + config.hard;

  return (
    <DashboardLayout role="student" user={user || undefined}>
      <div className="max-w-5xl mx-auto p-4 sm:p-8 pb-32 sm:pb-8">
        
        {/* Header - Compact on mobile */}
        <div className="relative mb-6 sm:mb-10 p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] premium-glass border border-border-theme-secondary overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] -z-10"></div>
           <div className="flex items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light shrink-0">
                 <Icon name="vial" className="text-xl sm:text-2xl" />
              </div>
              <div className="min-w-0">
                 <h1 className="text-xl sm:text-3xl font-black text-text-theme-primary truncate">اختبر نفسك (الاختبارات الموديل)</h1>
                 <p className="text-text-theme-secondary font-medium text-xs sm:text-sm truncate opacity-70">المدرس: {authSelectedTeacher.teacher_name}</p>
              </div>
           </div>
        </div>

        {counts && (
          <div className="space-y-10 sm:space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Setup Section */}
            <section className="space-y-6 sm:space-y-8">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-lg sm:text-xl font-bold text-text-theme-primary pr-2 border-r-4 border-primary">إنشاء اختبار جديد:</h2>
                <div className="hidden sm:flex items-center gap-2 text-text-theme-secondary text-xs">
                    <Icon name="info-circle" size="xs" />
                    <p>سيتم توليد الاختبار عشوائياً</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                  { key: 'easy', label: 'مستوى سهل', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: 'smile', available: counts.easy },
                  { key: 'medium', label: 'مستوى متوسط', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: 'meh', available: counts.medium },
                  { key: 'hard', label: 'مستوى صعب', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', icon: 'frown', available: counts.hard },
                ].map((item) => (
                  <div key={item.key} className={`relative p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] premium-glass border border-border-theme-secondary flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 group hover:border-card-border-hover transition-all overflow-hidden shadow-lg`}>
                    {/* Background Icon Decor */}
                    <div className={`absolute -right-4 -bottom-4 opacity-[0.03] text-6xl group-hover:scale-110 transition-transform sm:hidden`}>
                       <Icon name={item.icon as any} />
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:gap-4">
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${item.bg} ${item.color} flex items-center justify-center text-lg sm:text-2xl font-black`}>
                        <Icon name={item.icon as any} />
                        </div>
                        <div className="text-right sm:text-center">
                        <h3 className="text-text-theme-primary font-bold text-sm sm:text-base mb-0.5">{item.label}</h3>
                        <p className="text-text-theme-secondary text-[10px] sm:text-xs">المتاح: {item.available} سؤال</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 sm:gap-4 bg-surface-secondary p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-border-theme-secondary relative z-10 shrink-0">
                      <button 
                        onClick={() => setConfig(prev => ({ ...prev, [item.key]: Math.max(0, prev[item.key as keyof typeof config] - 1) }))}
                        disabled={config[item.key as keyof typeof config] <= 0}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            config[item.key as keyof typeof config] <= 0 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed opacity-50' 
                            : 'bg-primary/20 hover:bg-primary/30 text-primary-light'
                        }`}
                      >
                        <Icon name="minus" className="text-[10px] sm:text-xs" />
                      </button>
                      <span className="w-8 sm:w-12 text-center text-lg sm:text-xl font-black text-text-theme-primary">{config[item.key as keyof typeof config]}</span>
                      <button 
                        onClick={() => {
                          const current = config[item.key as keyof typeof config];
                          if (current < item.available) {
                             setConfig(prev => ({ ...prev, [item.key]: current + 1 }));
                          } else {
                             toast.error('وصلت للحد الأقصى المتاح');
                          }
                        }}
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                            config[item.key as keyof typeof config] >= item.available 
                            ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed opacity-50' 
                            : 'bg-primary/20 hover:bg-primary/30 text-primary-light'
                        }`}
                      >
                        <Icon name="plus" className="text-[10px] sm:text-xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary & Start Bar - Sticky on mobile */}
              <div className="fixed bottom-24 left-0 right-0 px-4 py-3 bg-surface-primary/95 backdrop-blur-xl border-t border-border-theme-primary sm:relative sm:bottom-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="max-w-5xl mx-auto p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] bg-gradient-to-br from-primary/10 to-secondary/5 border border-border-theme-primary flex items-center justify-between gap-4 sm:gap-6 shadow-xl sm:shadow-none">
                    <div className="text-right">
                        <p className="text-primary-light font-black text-[10px] sm:text-sm uppercase tracking-widest mb-0.5 sm:mb-1">إجمالي الأسئلة</p>
                        <div className="flex items-baseline gap-1.5 sm:gap-2">
                        <span className={`text-2xl sm:text-5xl font-black text-text-theme-primary transition-all ${totalSelected > 0 ? 'scale-110 text-primary-light' : ''}`}>{totalSelected}</span>
                        <span className="text-text-theme-secondary font-bold text-xs sm:text-lg">/ 50</span>
                        </div>
                    </div>
                    
                    <Button
                        variant="primary"
                        onClick={handleStart}
                        loading={starting}
                        className={`h-12 sm:h-16 px-6 sm:px-12 rounded-xl sm:rounded-[2rem] text-sm sm:text-lg font-black shadow-xl transition-all ${
                            totalSelected > 0 ? 'shadow-primary/40' : 'opacity-50 grayscale pointer-events-none'
                        }`}
                    >
                        ابدأ الاختبار
                        <Icon name="bolt" className="mr-2 hidden sm:inline" />
                    </Button>
                </div>
              </div>
            </section>

            {/* History Section */}
            <section className="space-y-6">
               <div className="flex items-center gap-3 px-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                     <Icon name="history" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-text-theme-primary leading-tight">سجل الإنجازات:</h2>
                    <p className="text-text-theme-secondary text-[10px] sm:text-xs font-medium">نتائج اختباراتك السابقة وتطور مستواك</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <div key={item.id} className="group relative p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] premium-glass border border-border-theme-secondary hover:bg-surface-hover hover:border-card-border-hover transition-all flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 overflow-hidden shadow-md">
                        
                        {/* Status bar */}
                        <div className={`absolute top-0 right-0 bottom-0 w-1 sm:w-1.5 ${
                             (item.percentage || 0) >= 60 ? 'bg-success/40' : 'bg-danger/40'
                        }`} />

                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto relative z-10">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center text-xl sm:text-2xl shadow-2xl transition-transform group-hover:scale-110 ${
                            (item.percentage || 0) >= 60 
                            ? 'bg-success/10 text-success border border-success/20' 
                            : 'bg-danger/10 text-danger border border-danger/20'
                          }`}>
                            <Icon name={item.status === 'completed' ? 'check-circle' : 'exclamation-circle'} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-text-theme-primary font-bold text-sm sm:text-lg truncate">{item.exam_title}</h3>
                            <div className="flex items-center gap-2 sm:gap-4 text-text-theme-secondary text-[10px] sm:text-xs mt-1 font-medium">
                              <span className="truncate">{item.subject}</span>
                              <span className="w-1 h-1 rounded-full bg-border-theme-secondary shrink-0" />
                              <span className="shrink-0">{formatDate(item.started_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 sm:gap-10 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border-theme-secondary pt-4 sm:pt-0 relative z-10">
                           <div className="text-right">
                              <span className="block text-[8px] sm:text-[9px] font-black text-text-theme-muted uppercase tracking-widest mb-1 sm:mb-2 opacity-50">النتيجة النهائية</span>
                              <div className="flex items-baseline gap-1.5">
                                 <span className={`text-2xl sm:text-3xl font-black ${(item.percentage || 0) >= 60 ? 'text-success' : 'text-danger'} drop-shadow-glow`}>
                                    {item.percentage ?? 0}%
                                 </span>
                                 <span className="text-text-theme-secondary text-[10px] sm:text-xs font-bold">({item.score ?? 0} نقطة)</span>
                              </div>
                           </div>
                           
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="rounded-xl sm:rounded-2xl border-border-theme-primary hover:border-primary hover:bg-primary/10 transition-all text-[10px] sm:text-xs h-9 sm:h-12 px-5 sm:px-8 font-black text-text-theme-secondary hover:text-primary-light"
                             onClick={() => router.push(`/student/exams/${item.exam_id}/results?attempt_id=${item.id}`)}
                           >
                             التفاصيل
                             <Icon name="chevron-left" className="mr-2 text-[10px] group-hover:-translate-x-1 transition-transform" />
                           </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 sm:py-24 text-center premium-glass rounded-[2.5rem] border border-dashed border-border-theme-secondary flex flex-col items-center justify-center gap-4 shadow-sm">
                       <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center text-text-theme-secondary">
                          <Icon name="history" size="lg" />
                       </div>
                       <p className="text-text-theme-primary font-bold text-sm sm:text-base">لا يوجد سجل اختبارات مسبقة لهذا المدرس.</p>
                       <p className="text-text-theme-secondary text-xs">ابدأ أول اختبار لك الآن!</p>
                    </div>
                  )}
               </div>
            </section>
            
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
