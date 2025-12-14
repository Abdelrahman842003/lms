'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface ExamData {
  id: string;
  title: string;
  subject: string;
  time_per_question: number;
}

interface AttemptData {
  status: 'in_progress' | 'completed' | 'terminated';
  attempt_id: string;
  exam: ExamData;
  progress: {
    current: number;
    total: number;
  };
  question?: Question;
  result?: {
    score: number;
    max_score: number;
    percentage: number;
    correct_answers: number;
    total_questions: number;
    terminated: boolean;
    terminated_reason: string | null;
  };
  progress_comparison?: {
    has_previous: boolean;
    current_percentage?: number;
    previous_average?: number;
    difference?: number;
    trend?: 'up' | 'down' | 'neutral';
    message?: string;
  };
}

export default function TakeExamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(true);
  const [attemptData, setAttemptData] = useState<AttemptData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Start the exam
  const startExam = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchApi(`/student/exams/${examId}/start`, {
        method: 'POST',
      });
      
      if (response) {
        setAttemptData(response);
        attemptIdRef.current = response.attempt_id;
        if (response.exam?.time_per_question) {
          setTimeLeft(response.exam.time_per_question);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء بدء الامتحان');
      router.push('/student/exams');
    } finally {
      setLoading(false);
    }
  }, [examId, router]);

  // Submit answer
  const submitAnswer = useCallback(async (answer: string | null) => {
    if (!attemptIdRef.current || submitting) return;
    
    setSubmitting(true);
    try {
      let response;
      
      if (answer) {
        response = await fetchApi(`/student/exams/attempts/${attemptIdRef.current}/answer`, {
          method: 'POST',
          body: JSON.stringify({ answer }),
        });
      } else {
        // Skip question (time expired)
        response = await fetchApi(`/student/exams/attempts/${attemptIdRef.current}/skip`, {
          method: 'POST',
        });
      }
      
      if (response) {
        setAttemptData(response);
        setSelectedAnswer(null);
        
        if (response.status === 'in_progress' && response.exam?.time_per_question) {
          setTimeLeft(response.exam.time_per_question);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  }, [submitting]);

  // Terminate exam (violation)
  const terminateExam = useCallback(async (reason: string) => {
    if (!attemptIdRef.current) return;
    
    try {
      const response = await fetchApi(`/student/exams/attempts/${attemptIdRef.current}/terminate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      
      if (response) {
        setAttemptData(response);
        toast.error('تم إنهاء الامتحان بسبب مخالفة');
      }
    } catch (error: any) {
      console.error('Failed to terminate exam:', error);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (attemptData?.status !== 'in_progress' || showWarning) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time expired, skip question
          submitAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [attemptData?.status, attemptData?.progress?.current, showWarning, submitAnswer]);

  // Anti-cheating: Strict Full Screen & Visibility
  useEffect(() => {
    if (attemptData?.status !== 'in_progress' || showWarning) return;

    // Force full screen
    const enterFullScreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.error('Error attempting to enable full-screen mode:', err);
      }
    };

    enterFullScreen();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        terminateExam('visibility_change');
      }
    };

    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) {
        terminateExam('screen_resize'); // Using screen_resize as generic "left exam environment" reason
      }
    };

    // Disable context menu and copy/paste
    const preventDefault = (e: Event) => e.preventDefault();
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('selectstart', preventDefault);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('selectstart', preventDefault);
    };
  }, [attemptData?.status, showWarning, terminateExam]);

  // Exit full screen on completion
  useEffect(() => {
    if (attemptData?.status === 'completed' || attemptData?.status === 'terminated') {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error('Error exiting full screen:', err));
      }
    }
  }, [attemptData?.status]);

  // Anti-cheating: Window resize detection (Backup for full screen exit)
  useEffect(() => {
    if (attemptData?.status !== 'in_progress' || showWarning) return;

    const handleResize = () => {
      // If we are in full screen, resize events might happen legitimately (e.g. browser UI hiding)
      // But if we are NOT in full screen, we should terminate
      if (!document.fullscreenElement) {
         terminateExam('screen_resize');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [attemptData?.status, showWarning, terminateExam]);

  // Prevent back navigation
  useEffect(() => {
    if (attemptData?.status !== 'in_progress') return;

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      toast.error('لا يمكنك الرجوع أثناء الامتحان');
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [attemptData?.status]);

  // Handle warning acceptance
  const handleAcceptWarning = () => {
    setShowWarning(false);
    startExam();
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color
  const getTimerColor = () => {
    if (timeLeft <= 10) return '#FF5B5B';
    if (timeLeft <= 30) return '#FFAA00';
    return '#00D68F';
  };

  // Progress indicator
  const getProgressPercentage = () => {
    if (!attemptData?.progress) return 0;
    return (attemptData.progress.current / attemptData.progress.total) * 100;
  };

  // Warning Modal
  if (showWarning) {
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1000] p-5">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-[20px] p-10 max-w-[500px] w-full text-center border-2 border-danger/30 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF5B5B] to-[#E74C3C] flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-[2.5rem] text-white"></i>
            </div>
            
            <h2 className="text-white text-2xl mb-4 font-bold">
              تحذير هام قبل بدء الامتحان
            </h2>
            
            <div className="bg-danger/10 rounded-xl p-5 mb-6 text-right">
              <ul className="text-gray-light text-[0.95rem] leading-8 list-none p-0">
                <li className="mb-2">
                  <i className="fas fa-times-circle text-[#FF5B5B] ml-2"></i>
                  لا يمكنك الرجوع للأسئلة السابقة بعد الإجابة عليها
                </li>
                <li className="mb-2">
                  <i className="fas fa-times-circle text-[#FF5B5B] ml-2"></i>
                  سيتم تفعيل وضع ملء الشاشة تلقائياً
                </li>
                <li className="mb-2">
                  <i className="fas fa-times-circle text-[#FF5B5B] ml-2"></i>
                  الخروج من ملء الشاشة أو تغيير التبويب سينهي الامتحان فوراً
                </li>
                <li>
                  <i className="fas fa-times-circle text-[#FF5B5B] ml-2"></i>
                  تم تعطيل النسخ واللصق والقائمة المختصرة
                </li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/student/exams')}
                className="flex-1 py-3.5 px-6 rounded-xl bg-white/10 border border-white/20 text-white font-semibold cursor-pointer transition-all duration-300 hover:bg-white/20"
              >
                إلغاء
              </button>
              <button
                onClick={handleAcceptWarning}
                className="flex-1 py-3.5 px-6 rounded-xl bg-gradient-to-br from-[#00D68F] to-[#00B074] border-none text-white font-semibold cursor-pointer transition-all duration-300 hover:opacity-90"
              >
                فهمت، ابدأ الامتحان
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
          <i className="fas fa-spinner fa-spin text-5xl mb-4"></i>
          <p className="text-xl">جاري تحميل الامتحان...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Results screen
  if (attemptData?.status === 'completed' || attemptData?.status === 'terminated') {
    const result = attemptData.result;
    const progress = attemptData.progress_comparison;
    
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="max-w-[600px] mx-auto py-10 px-5">
          <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5 text-center p-10">
            {/* Status Icon */}
            <div 
              className="w-[100px] h-[100px] rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: result?.terminated 
                  ? 'linear-gradient(135deg, #FF5B5B, #E74C3C)'
                  : (result?.percentage || 0) >= 60 
                    ? 'linear-gradient(135deg, #00D68F, #00B074)'
                    : 'linear-gradient(135deg, #FFAA00, #FF8C00)',
              }}
            >
              <i className={`fas ${result?.terminated ? 'fa-ban' : 'fa-trophy'} text-[2.5rem] text-white`}></i>
            </div>

            <h2 className="text-white text-2xl mb-2">
              {result?.terminated ? 'تم إنهاء الامتحان' : 'نتيجة الامتحان'}
            </h2>
            
            {result?.terminated && (
              <p className="text-[#FF5B5B] mb-6 text-sm">
                السبب: {result.terminated_reason === 'visibility_change' ? 'الخروج من الصفحة' : 'تغيير حجم الشاشة'}
              </p>
            )}

            {/* Score Display */}
            <div className="bg-white/5 rounded-2xl p-6 mb-6">
              <div className="text-5xl font-bold text-white mb-2">
                {result?.score} / {result?.max_score}
              </div>
              <div 
                className="text-2xl font-semibold"
                style={{ 
                  color: (result?.percentage || 0) >= 60 ? '#00D68F' : '#FF5B5B',
                }}
              >
                {result?.percentage}%
              </div>
              <div className="text-gray-light mt-2">
                {result?.correct_answers} إجابة صحيحة من {result?.total_questions} سؤال
              </div>
            </div>

            {/* Progress Comparison */}
            {progress?.has_previous && (
              <div className="bg-white/5 rounded-xl p-4 mb-6 flex items-center justify-center gap-3">
                <i className={`fas fa-arrow-${progress.trend === 'up' ? 'up' : progress.trend === 'down' ? 'down' : 'minus'} text-xl`}
                  style={{ 
                    color: progress.trend === 'up' ? '#00D68F' : progress.trend === 'down' ? '#FF5B5B' : '#FFAA00',
                  }}></i>
                <span className="text-gray-light">{progress.message}</span>
              </div>
            )}

            <button
              onClick={() => router.push('/student/exams')}
              className="btn btn-primary w-full p-3.5"
            >
              العودة للامتحانات
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Exam in progress
  return (
    <DashboardLayout role="student" user={user || undefined}>
      <div 
        ref={containerRef}
        className="max-w-[800px] mx-auto p-5 select-none"
      >
        {/* Watermark */}
        <div className="fixed inset-0 pointer-events-none z-[9999] flex flex-wrap justify-around content-around opacity-[0.03] overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rotate-[-45deg] text-[2rem] font-bold text-white whitespace-nowrap m-[50px]">
              {user?.name} - {user?.phone}
            </div>
          ))}
        </div>

        {/* Header with timer and progress */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h2 className="text-white text-xl mb-1">
              {attemptData?.exam?.title}
            </h2>
            <p className="text-gray-light text-sm">
              سؤال {attemptData?.progress?.current} من {attemptData?.progress?.total}
            </p>
          </div>
          
          {/* Timer */}
          <div 
            className="py-3 px-6 rounded-xl border-2"
            style={{
              background: `rgba(${getTimerColor() === '#FF5B5B' ? '255, 91, 91' : getTimerColor() === '#FFAA00' ? '255, 170, 0' : '0, 214, 143'}, 0.2)`,
              borderColor: getTimerColor(),
            }}
          >
            <div 
              className="text-2xl font-bold font-mono"
              style={{ color: getTimerColor() }}
            >
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/10 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#4263EB] to-[#00D68F] rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        {/* Question Card */}
        <div className="bg-[#1e1e2d] rounded-xl shadow-lg border border-white/5 p-8">
          <h3 className="text-white text-xl mb-6 leading-relaxed">
            {attemptData?.question?.text}
          </h3>

          {/* Options */}
          <div className="flex flex-col gap-3">
            {attemptData?.question?.options.map((option, index) => (
              <button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                disabled={submitting}
                className={`p-4 px-5 rounded-xl border-2 text-white text-right cursor-pointer transition-all duration-300 text-base flex items-center gap-3 ${
                  selectedAnswer === option 
                    ? 'border-[#4263EB] bg-[#4263EB]/20' 
                    : 'border-white/10 bg-white/5'
                } ${submitting ? 'cursor-not-allowed' : ''}`}
              >
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedAnswer === option 
                    ? 'border-[#4263EB] bg-[#4263EB]' 
                    : 'border-white/30 bg-transparent'
                }`}>
                  {selectedAnswer === option && (
                    <i className="fas fa-check text-[0.7rem] text-white"></i>
                  )}
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={() => submitAnswer(selectedAnswer)}
            disabled={!selectedAnswer || submitting}
            className={`mt-8 w-full p-4 rounded-xl border-none text-white text-lg font-semibold transition-all duration-300 ${
              selectedAnswer 
                ? 'bg-gradient-to-br from-[#4263EB] to-[#3730A3] cursor-pointer opacity-100' 
                : 'bg-white/10 cursor-not-allowed opacity-50'
            }`}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin ml-2"></i>
                جاري الإرسال...
              </>
            ) : (
              'التالي'
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
