'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, Suspense } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, LoadingSpinner, Icon } from '@/components/ui/index';

interface QuizQuestion {
  failed_question_id: string;
  question_id: string;
  text: string;
  options: string[];
  times_failed: number;
}

function QuizContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const teacherId = searchParams.get('teacher_id');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<{ is_correct: boolean; correct_answer: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    loadQuiz();
  }, [teacherId]);

  const loadQuiz = async () => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetchApi(`/student/mistakes/quiz?teacher_id=${teacherId}&limit=10`) as any;
      if (response.success) {
        setQuestions(response.data.questions || []);
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!selectedAnswer || !questions[currentIndex]) return;

    try {
      setSubmitting(true);
      const response = await fetchApi(
        `/student/mistakes/quiz/${questions[currentIndex].failed_question_id}/answer`,
        {
          method: 'POST',
          body: JSON.stringify({ answer: selectedAnswer }),
        }
      ) as any;

      if (response.success) {
        setResult(response.data);
        setScore(prev => ({
          correct: prev.correct + (response.data.is_correct ? 1 : 0),
          total: prev.total + 1,
        }));
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setResult(null);
    } else {
      setIsComplete(true);
    }
  };

  const mockUser = {
    name: user?.name || 'الطالب',
    avatar: user?.avatar || '',
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  return (
    <DashboardLayout role="student" user={mockUser}>
      <div className="max-w-[700px] mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <LoadingSpinner size="lg" className="mx-auto" />
            <p className="text-gray-400 mt-4">جاري تحميل الكويز...</p>
          </div>
        ) : !teacherId ? (
          <div className="text-center py-16">
            <p className="text-gray-400">اختر مدرس للمراجعة</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-success/10 to-success/5 rounded-2xl border border-success/30">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">ما عندكش أخطاء للمراجعة!</h3>
            <p className="text-gray-400 mb-6">استمر في التفوق</p>
            <Link href="/student/mistakes" className="inline-flex">
              <Button variant="primary">
                العودة لصفحة الأخطاء
              </Button>
            </Link>
          </div>
        ) : isComplete ? (
          /* Quiz Complete */
          <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-6xl mb-4">
              {score.correct / score.total >= 0.7 ? '🏆' : score.correct / score.total >= 0.5 ? '👍' : '💪'}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">انتهى الكويز!</h3>
            <div className="text-5xl font-bold text-primary mb-2">
              {score.correct}/{score.total}
            </div>
            <p className="text-gray-400 mb-6">
              {score.correct === score.total
                ? 'ممتاز! أتقنت كل الأسئلة 🎉'
                : 'حاول مرة تانية للأسئلة اللي غلطت فيها'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => {
                setCurrentIndex(0);
                setScore({ correct: 0, total: 0 });
                setIsComplete(false);
                setSelectedAnswer(null);
                setResult(null);
                loadQuiz();
              }} variant="primary">
                <Icon name="sync" className="ml-2" />
                كويز جديد
              </Button>
              <Link href="/student/mistakes" className="inline-flex">
                <Button variant="ghost">
                  العودة للأخطاء
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* Quiz Question */
          <div>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>السؤال {currentIndex + 1} من {questions.length}</span>
                <span>غلطت فيه {currentQuestion?.times_failed} مرة</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-6">{currentQuestion?.text}</h2>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion?.options.map((option, idx) => {
                  const isSelected = selectedAnswer === option;
                  const showResult = result !== null;
                  const isCorrect = option === result?.correct_answer;
                  const isWrong = showResult && isSelected && !result?.is_correct;

                  return (
                    <Button
                      key={idx}
                      variant={isSelected ? 'primary' : 'ghost'}
                      onClick={() => !result && setSelectedAnswer(option)}
                      disabled={!!result}
                      className={`w-full justify-start text-right mb-2 ${
                        showResult
                          ? isCorrect
                            ? 'bg-success/20 border-success text-success'
                            : isWrong
                            ? 'bg-danger/20 border-danger text-danger'
                            : 'bg-white/5 border-white/10 text-gray-400'
                          : isSelected
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-white/5 border-white/10 text-white hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                          showResult && isCorrect
                            ? 'border-success bg-success/20'
                            : isWrong
                            ? 'border-danger bg-danger/20'
                            : isSelected
                            ? 'border-primary bg-primary/20'
                            : 'border-white/30'
                        }`}>
                          {showResult && isCorrect && <Icon name="check" className="text-success" />}
                          {isWrong && <Icon name="times" className="text-danger" />}
                          {!showResult && String.fromCharCode(65 + idx)}
                        </div>
                        <span>{option}</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              {!result ? (
                <Button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || submitting}
                  loading={submitting}
                  variant="primary"
                  className="flex-1"
                >
                  <Icon name="check" className="ml-2" />
                  تأكيد الإجابة
                </Button>
              ) : (
                <Button onClick={nextQuestion} variant="primary" className="flex-1">
                  {currentIndex < questions.length - 1 ? (
                    <>
                      السؤال التالي
                      <Icon name="arrow-left" className="mr-2" />
                    </>
                  ) : (
                    <>
                      عرض النتيجة
                      <Icon name="flag-checkered" className="mr-2" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Result Feedback */}
            {result && (
              <div className={`mt-4 p-4 rounded-xl ${
                result.is_correct
                  ? 'bg-success/10 border border-success/30'
                  : 'bg-danger/10 border border-danger/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`text-2xl ${result.is_correct ? 'text-success' : 'text-danger'}`}>
                    {result.is_correct ? '✅' : '❌'}
                  </div>
                  <div>
                    <p className={`font-semibold ${result.is_correct ? 'text-success' : 'text-danger'}`}>
                      {result.is_correct ? 'إجابة صحيحة! تم إتقان السؤال 🎉' : 'إجابة خاطئة'}
                    </p>
                    {!result.is_correct && (
                      <p className="text-sm text-gray-400">
                        الإجابة الصحيحة: <span className="text-success">{result.correct_answer}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function MistakesQuizPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-16">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-400 mt-4">جاري تحميل الكويز...</p>
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
