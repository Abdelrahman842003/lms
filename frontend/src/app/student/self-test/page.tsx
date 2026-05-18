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
           <div className="p-10 text-center bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Icon name="exclamation-triangle" className="text-warning" size="lg" />
              </div>
              <h2 className="text-white text-xl font-bold mb-2">لم يتم اختيار مدرس</h2>
              <p className="text-gray-500 mb-6">يرجى اختيار المدرس من القائمة العلوية أولاً لتتمكن من إجراء الاختبار.</p>
              <Button onClick={() => router.push('/student/teachers')}>ذهاب لصفحة المدرسين</Button>
           </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={user || undefined}>
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        
        {/* Header */}
        <div className="relative mb-8 p-6 sm:p-10 rounded-[2rem] bg-[#101426]/60 border border-white/10 overflow-hidden backdrop-blur-xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] -z-10"></div>
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary-light">
                 <Icon name="vial" size="lg" />
              </div>
              <div>
                 <h1 className="text-2xl sm:text-3xl font-black text-white">اختبر نفسك (الاختبارات الموديل)</h1>
                 <p className="text-gray-400 font-medium">مع الأستاذ: {authSelectedTeacher.teacher_name}</p>
              </div>
           </div>
        </div>

        {counts && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Setup Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white pr-2">إنشاء اختبار جديد:</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { key: 'easy', label: 'مستوى سهل', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', available: counts.easy },
                  { key: 'medium', label: 'مستوى متوسط', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', available: counts.medium },
                  { key: 'hard', label: 'مستوى صعب', color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/20', available: counts.hard },
                ].map((item) => (
                  <div key={item.key} className={`p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex flex-col items-center gap-6 group hover:border-white/20 transition-all`}>
                    <div className={`w-12 h-12 rounded-xl ${item.bg} ${item.color} flex items-center justify-center font-black`}>
                      <Icon name={item.key === 'easy' ? 'smile' : item.key === 'medium' ? 'meh' : 'frown'} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-white font-bold mb-1">{item.label}</h3>
                      <p className="text-gray-500 text-xs">المتاح: {item.available} سؤال</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => setConfig(prev => ({ ...prev, [item.key]: Math.max(0, prev[item.key as keyof typeof config] - 1) }))}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                      >
                        <Icon name="minus" size="xs" />
                      </button>
                      <span className="w-12 text-center text-xl font-black text-white">{config[item.key as keyof typeof config]}</span>
                      <button 
                        onClick={() => {
                          const current = config[item.key as keyof typeof config];
                          if (current < item.available) {
                             setConfig(prev => ({ ...prev, [item.key]: current + 1 }));
                          } else {
                             toast.error('وصلت للحد الأقصى المتاح');
                          }
                        }}
                        className="w-10 h-10 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary-light flex items-center justify-center transition-colors"
                      >
                        <Icon name="plus" size="xs" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-[3rem] bg-gradient-to-br from-primary/20 to-secondary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-right">
                    <p className="text-primary-light font-black text-sm uppercase tracking-widest mb-1">إجمالي الأسئلة</p>
                    <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                      <span className="text-5xl font-black text-white">{config.easy + config.medium + config.hard}</span>
                      <span className="text-gray-400 font-bold">/ 50</span>
                    </div>
                </div>
                
                <Button
                  variant="primary"
                  onClick={handleStart}
                  loading={starting}
                  className="w-full sm:w-64 h-16 rounded-[2rem] text-lg font-black shadow-xl shadow-primary/20"
                >
                  ابدأ الاختبار الآن
                </Button>
              </div>
            </section>

            {/* History Section */}
            <section className="space-y-6">
               <div className="flex items-center gap-3 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                     <Icon name="history" />
                  </div>
                  <h2 className="text-xl font-bold text-white">نتائج الاختبارات السابقة:</h2>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {history.length > 0 ? (
                    history.map((item) => (
                      <div key={item.id} className="group p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-5 w-full sm:w-auto">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                            (item.percentage || 0) >= 60 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
                          }`}>
                            <Icon name={item.status === 'completed' ? 'check-circle' : 'exclamation-circle'} />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{item.exam_title}</h3>
                            <div className="flex items-center gap-3 text-gray-500 text-xs mt-1">
                              <span>{item.subject}</span>
                              <span className="w-1 h-1 rounded-full bg-white/10" />
                              <span>{formatDate(item.started_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                           <div className="text-right">
                              <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">الدرجة</span>
                              <div className="flex items-baseline gap-1">
                                 <span className={`text-2xl font-black ${(item.percentage || 0) >= 60 ? 'text-success' : 'text-danger'}`}>
                                    {item.percentage ?? 0}%
                                 </span>
                                 <span className="text-gray-600 text-xs">({item.score ?? 0} نقطة)</span>
                              </div>
                           </div>
                           
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="rounded-xl border-white/5 hover:bg-white/10"
                             onClick={() => router.push(`/student/exams/${item.exam_id}/results?attempt_id=${item.id}`)}
                           >
                             التفاصيل
                           </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5">
                       <p className="text-gray-600">لا يوجد سجل اختبارات مسبقة.</p>
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
