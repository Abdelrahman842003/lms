'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
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
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Icon name="book-open" className="text-danger" />
              أخطائي
            </h1>
            <p className="text-gray-400">راجع أخطاءك وقواها قبل الامتحان 💪</p>
          </div>
          <div className="flex gap-3">

            <Link href="/student/dashboard" className="inline-flex">
              <Button variant="outline">
                <Icon name="arrow-right" className="ml-2" />
                العودة
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-danger">{stats.pending}</div>
              <div className="text-sm text-gray-400">أخطاء للمراجعة</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-success">{stats.mastered}</div>
              <div className="text-sm text-gray-400">تم إتقانها</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-white">{stats.total_mistakes}</div>
              <div className="text-sm text-gray-400">إجمالي الأخطاء</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-3xl font-bold text-primary">{stats.mastery_rate}%</div>
              <div className="text-sm text-gray-400">نسبة الإتقان</div>
            </div>
          </div>
        )}
        {!selectedTeacher ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <Icon name="user-graduate" size="2x" className="text-gray-500 mb-4" />
            <p className="text-gray-400">اختر مدرس لعرض أخطاءك</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-red-500/10 rounded-2xl border border-red-500/30">
            <Icon name="exclamation-circle" size="2x" className="text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">عفواً</h3>
            <p className="text-gray-400">{error}</p>
            <Button
              variant="primary"
              onClick={loadMistakes}
              className="mt-4"
            >
              إعادة المحاولة
            </Button>
          </div>
        ) : loading ? null : mistakes.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-success/10 to-success/5 rounded-2xl border border-success/30">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">
              أحسنت! ما عندكش أخطاء للمراجعة
            </h3>
            <p className="text-gray-400">استمر في التفوق!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mistakes.map((mistake) => (
              <div
                key={mistake.id}
                className={`bg-white/5 rounded-xl border transition-all ${
                  mistake.is_mastered
                    ? 'border-success/30 opacity-60'
                    : 'border-white/10 hover:border-primary/30'
                }`}
              >
                {/* Question Header */}
                <div
                  className="p-4 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedId(expandedId === mistake.id ? null : mistake.id)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mistake.is_mastered ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                    }`}>
                      {mistake.is_mastered ? (
                        <Icon name="check" />
                      ) : (
                        <span className="font-bold">{mistake.times_failed}x</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium line-clamp-1">{mistake.question?.text || 'سؤال غير متاح'}</p>
                      <p className="text-sm text-gray-500">{mistake.exam?.title}</p>
                    </div>
                  </div>
                  <Icon name="chevron-down" className={`text-gray-400 transition-transform ${
                    expandedId === mistake.id ? 'rotate-180' : ''
                  }`} />
                </div>

                {/* Expanded Content */}
                {expandedId === mistake.id && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="pt-4 space-y-3">
                      {/* Options */}
                      <div className="space-y-2">
                        {Array.isArray(mistake.question?.options) && mistake.question.options.length > 0 ? (
                          mistake.question.options.map((option, idx) => {
                            const isCorrect = option === mistake.question?.correct_answer;
                            const isStudentAnswer = option === mistake.student_answer;
                            return (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border ${
                                  isCorrect
                                    ? 'bg-success/10 border-success/30 text-success'
                                    : isStudentAnswer
                                    ? 'bg-danger/10 border-danger/30 text-danger'
                                    : 'bg-white/5 border-white/10 text-gray-400'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrect && <Icon name="check-circle" />}
                                  {isStudentAnswer && !isCorrect && <Icon name="times-circle" />}
                                  <span>{option}</span>
                                  {isCorrect && <span className="text-xs mr-auto">(الإجابة الصحيحة)</span>}
                                  {isStudentAnswer && !isCorrect && <span className="text-xs mr-auto">(إجابتك)</span>}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            لا توجد خيارات متاحة لهذا السؤال
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {!mistake.is_mastered && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => markAsMastered(mistake.id)}
                          className="w-full mt-4"
                        >
                          <Icon name="check" className="ml-2" />
                          فهمتها ✓
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
