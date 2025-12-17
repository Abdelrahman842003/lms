'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/services/authService';
import Link from 'next/link';

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

export default function MistakesPage() {
  const { user, selectedTeacher } = useAuth();
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMastered, setShowMastered] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMistakes();
  }, [selectedTeacher, showMastered]);

  const loadMistakes = async () => {
    if (!selectedTeacher) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetchApi(
        `/student/mistakes?teacher_id=${selectedTeacher.teacher_id}&include_mastered=${showMastered}`
      );
      if (response.success) {
        setMistakes(response.data.mistakes || []);
        setStats(response.data.stats || null);
      }
    } catch (error) {
      console.error('Failed to load mistakes:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsMastered = async (id: string) => {
    try {
      const response = await fetchApi(`/student/mistakes/${id}/mastered`, {
        method: 'POST',
      });
      if (response.success) {
        setMistakes(prev => prev.filter(m => m.id !== id));
        if (stats) {
          setStats({
            ...stats,
            mastered: stats.mastered + 1,
            pending: stats.pending - 1,
          });
        }
      }
    } catch (error) {
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
              <i className="fas fa-book-open text-danger"></i>
              أخطائي
            </h1>
            <p className="text-gray-400">راجع أخطاءك وقواها قبل الامتحان 💪</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/student/mistakes/quiz?teacher_id=${selectedTeacher?.teacher_id}`}
              className="btn btn-primary flex items-center gap-2"
            >
              <i className="fas fa-play-circle"></i>
              كويز مراجعة
            </Link>
            <Link href="/student/dashboard" className="btn btn-outline">
              <i className="fas fa-arrow-right ml-2"></i>
              العودة
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

        {/* Filter Toggle */}
        <div className="flex items-center gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMastered}
              onChange={(e) => setShowMastered(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-gray-400">عرض الأخطاء المُتقَنة</span>
          </label>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
            <p className="text-gray-400 mt-4">جاري التحميل...</p>
          </div>
        ) : !selectedTeacher ? (
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <i className="fas fa-user-graduate text-4xl text-gray-500 mb-4"></i>
            <p className="text-gray-400">اختر مدرس لعرض أخطاءك</p>
          </div>
        ) : mistakes.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-success/10 to-success/5 rounded-2xl border border-success/30">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">
              {showMastered ? 'لا توجد أخطاء' : 'أحسنت! ما عندكش أخطاء للمراجعة'}
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
                        <i className="fas fa-check"></i>
                      ) : (
                        <span className="font-bold">{mistake.times_failed}x</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium line-clamp-1">{mistake.question.text}</p>
                      <p className="text-sm text-gray-500">{mistake.exam.title}</p>
                    </div>
                  </div>
                  <i className={`fas fa-chevron-down text-gray-400 transition-transform ${
                    expandedId === mistake.id ? 'rotate-180' : ''
                  }`}></i>
                </div>

                {/* Expanded Content */}
                {expandedId === mistake.id && (
                  <div className="px-4 pb-4 border-t border-white/10">
                    <div className="pt-4 space-y-3">
                      {/* Options */}
                      <div className="space-y-2">
                        {mistake.question.options.map((option, idx) => {
                          const isCorrect = option === mistake.question.correct_answer;
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
                                {isCorrect && <i className="fas fa-check-circle"></i>}
                                {isStudentAnswer && !isCorrect && <i className="fas fa-times-circle"></i>}
                                <span>{option}</span>
                                {isCorrect && <span className="text-xs mr-auto">(الإجابة الصحيحة)</span>}
                                {isStudentAnswer && !isCorrect && <span className="text-xs mr-auto">(إجابتك)</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      {!mistake.is_mastered && (
                        <button
                          onClick={() => markAsMastered(mistake.id)}
                          className="btn btn-success btn-sm w-full mt-4"
                        >
                          <i className="fas fa-check ml-2"></i>
                          فهمتها ✓
                        </button>
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
