'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import Link from 'next/link';
import { Button, Icon } from '@/components/ui/index';

interface Mistake {
  id: string;
  question: {
    id: string;
    text: string;
    options: string[];
    correct_answer: string;
  };
  exam: {
    id: string;
    title: string;
    subject: string;
  };
  student_answer: string;
  times_failed: number;
  is_mastered: boolean;
}

interface Stats {
  total_mistakes: number;
  mastered: number;
  pending: number;
  mastery_rate: number;
  by_exam: Array<{
    exam: { id: string; title: string };
    count: number;
  }>;
}

interface MistakesApiResponse {
  mistakes?: Mistake[];
  stats?: Stats | null;
}

export default function MistakesPage() {
  const { user, selectedTeacher } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMistakes();
  }, [selectedTeacher]);

  const loadMistakes = async () => {
    if (!selectedTeacher) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching mistakes for teacher:', selectedTeacher.teacher_id);
      
      const response = await fetchApi<MistakesApiResponse>(
        `/student/mistakes?teacher_id=${selectedTeacher.teacher_id}`
      );
      
      console.log('Mistakes response:', response);

      // fetchApi returns res.data, so response IS the data object
      if (response && (response.mistakes || Array.isArray(response.mistakes))) {
        setMistakes(response.mistakes || []);
        setStats(response.stats || null);
      } else {
        console.error('Invalid response format:', response);
        
     if (!response || Object.keys(response).length === 0) {
             console.error('Empty or null response received');
             setError('لم يتم استلام بيانات من الخادم');
        } else {
             setError('تنسيق بيانات غير صالح');
        }
      }
    } catch (error: any) {
      console.error('Failed to load mistakes:', error);
      setError(error.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const markAsMastered = async (id: string) => {
    // Optimistic update
    const previousMistakes = [...mistakes];
    const previousStats = stats ? { ...stats } : null;

    // Remove from list (or mark as mastered if we want to keep it)
    // Based on previous code, it was removing it. Let's stick to that for now, 
    // or maybe just mark it as mastered so user sees the change?
    // The UI supports is_mastered styling. Let's try marking it first, it feels more "real-time" to see it turn green than disappear.
    // BUT, the previous code was `filter`. If I change to `map`, it changes behavior.
    // Let's stick to `filter` as it implies "Done with this".
    
    setMistakes(prev => prev.filter(m => m.id !== id));
    
    if (stats) {
      setStats({
        ...stats,
        mastered: stats.mastered + 1,
        pending: stats.pending - 1,
      });
    }

    try {
      await fetchApi(`/student/mistakes/${id}/mastered`, {
        method: 'POST',
      });

      // Success (no exception thrown) - state already updated optimistically
    } catch (error) {
      // Revert on error
      setMistakes(previousMistakes);
      setStats(previousStats);
      console.error('Failed to mark as mastered:', error);
    }
  };

  const mockUser = {
    name: user?.name || 'الطالب',
    avatar: user?.avatar || '',
  };

  return (
    <DashboardLayout role="student" user={mockUser}>
      {/* Page Header */}
      <div className="relative mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/20 blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 blur-[120px] translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-rose-500 text-4xl shadow-2xl premium-border">
              <Icon name="book-open" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">أخطائي العلمية</h2>
              <p className="text-gray-light/60 text-lg font-medium">راجع أخطاءك في الامتحانات السابقة وقم بتقويتها 💪</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">المعلم الحالي</span>
                <span className="text-xl font-black text-white">{selectedTeacher?.teacher_name || 'اختر مدرساً'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-10">
          <StatCard
            title="أخطاء للمراجعة"
            value={stats.pending}
            icon="fas fa-exclamation-circle"
            color="danger"
            variant="centered"
          />
          <StatCard
            title="تم إتقانها"
            value={stats.mastered}
            icon="fas fa-check-circle"
            color="success"
            variant="centered"
          />
          <StatCard
            title="نسبة الإتقان"
            value={stats.mastery_rate}
            suffix="%"
            icon="fas fa-graduation-cap"
            color="warning"
            variant="centered"
          />
          <StatCard
            title="إجمالي الأخطاء"
            value={stats.total_mistakes}
            icon="fas fa-history"
            color="info"
            variant="centered"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {!selectedTeacher ? (
          <div className="premium-glass py-24 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center text-gray-light/20">
              <Icon name="user-graduate" size="3x" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">اختر مدرساً للمتابعة</h3>
              <p className="text-sm text-gray-light/30 font-medium max-w-xs">يرجى اختيار المدرس من القائمة الجانبية لعرض قائمة أخطائك العلمية</p>
            </div>
          </div>
        ) : error ? (
          <div className="premium-glass py-20 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Icon name="exclamation-triangle" size="2x" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">عفواً، حدث خطأ ما</h3>
              <p className="text-sm text-rose-500/60 font-medium">{error}</p>
            </div>
            <Button variant="primary" onClick={loadMistakes} className="h-12 px-8 rounded-2xl font-black">إعادة المحاولة</Button>
          </div>
        ) : loading ? (
           <div className="space-y-4">
              {[1, 2, 3].map(i => (
                 <div key={i} className="h-24 rounded-3xl bg-white/5 border border-white/5 animate-pulse" />
              ))}
           </div>
        ) : mistakes.length === 0 ? (
          <div className="premium-glass py-24 rounded-[3rem] border-emerald-500/10 bg-emerald-500/[0.02] flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05)_0%,transparent_70%)]" />
            <div className="relative z-10 w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
              <Icon name="award" size="3x" />
            </div>
            <div className="relative z-10 space-y-2">
              <h3 className="text-2xl font-black text-white">أنت بطل! لا توجد أخطاء</h3>
              <p className="text-sm text-emerald-500/60 font-medium max-w-xs">لقد قمت بإتقان جميع المواد العلمية، استمر في هذا التفوق الرائع 🚀</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-6 mb-4">
               <Icon name="list-ul" className="text-primary" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">قائمة الأخطاء قيد المراجعة</h3>
            </div>

            <div className="space-y-4">
              {mistakes.map((mistake) => (
                <div
                  key={mistake.id}
                  className={`premium-glass rounded-[2rem] border transition-all duration-300
                    ${expandedId === mistake.id ? 'border-primary/30 ring-1 ring-primary/20' : 'border-white/5 hover:border-white/10'}`}
                >
                  <div
                    className="p-6 cursor-pointer flex items-center justify-between gap-6"
                    onClick={() => setExpandedId(expandedId === mistake.id ? null : mistake.id)}
                  >
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 premium-border transition-all
                        ${mistake.is_mastered ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {mistake.is_mastered ? <Icon name="check-double" size="xl" /> : <span className="text-xl font-black">{mistake.times_failed}x</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">{mistake.question?.text || 'سؤال غير متاح'}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">{mistake.exam?.title}</span>
                           <div className="w-1 h-1 rounded-full bg-white/5" />
                           <span className="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">تكرار الخطأ: {mistake.times_failed} مرّات</span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-light/30 transition-all
                      ${expandedId === mistake.id ? 'rotate-180 bg-primary/10 text-primary' : ''}`}>
                       <Icon name="chevron-down" size="sm" />
                    </div>
                  </div>

                  {expandedId === mistake.id && (
                    <div className="px-8 pb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="pt-6 border-t border-white/5 space-y-6">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">مراجعة الخيارات والحل الصحيح</label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Array.isArray(mistake.question?.options) && mistake.question.options.map((option, idx) => {
                              const isCorrect = option === mistake.question?.correct_answer;
                              const isStudentAnswer = option === mistake.student_answer;
                              return (
                                <div
                                  key={idx}
                                  className={`p-4 rounded-2xl border flex items-center gap-4 transition-all
                                    ${isCorrect
                                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                      : isStudentAnswer
                                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                      : 'bg-white/5 border-white/5 text-gray-light/40 opacity-60'
                                    }`}
                                >
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border
                                    ${isCorrect ? 'bg-emerald-500 text-white border-emerald-500' : isStudentAnswer ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/5 border-white/10'}`}>
                                    {isCorrect ? <Icon name="check" size="xs" /> : isStudentAnswer ? <Icon name="times" size="xs" /> : <span className="text-[10px] font-black">{String.fromCharCode(65 + idx)}</span>}
                                  </div>
                                  <span className="text-sm font-bold">{option}</span>
                                  {isCorrect && <span className="mr-auto text-[8px] font-black uppercase bg-emerald-500/20 px-2 py-1 rounded-full">الحل الصحيح</span>}
                                  {isStudentAnswer && !isCorrect && <span className="mr-auto text-[8px] font-black uppercase bg-rose-500/20 px-2 py-1 rounded-full">إجابتك</span>}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {!mistake.is_mastered && (
                          <div className="flex justify-end pt-4">
                            <Button
                              variant="primary"
                              onClick={() => markAsMastered(mistake.id)}
                              className="h-12 px-10 rounded-2xl font-black gap-3 shadow-xl shadow-primary/20"
                            >
                              <Icon name="check-circle" />
                              <span>فهمت الخطأ وأتقنته ✓</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
