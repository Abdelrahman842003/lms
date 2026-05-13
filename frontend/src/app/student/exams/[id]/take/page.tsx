'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { Button, LoadingSpinner, Icon } from '@/components/ui/index';

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
  const [waiting, setWaiting] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);

  
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
        if (response.status === 'waiting') {
          setWaiting(true);
          setQueuePosition(response.position || 0);
          // Don't set loading to false yet, we want to show the waiting room
        } else {
          setAttemptData(response);
          attemptIdRef.current = response.attempt_id;
          if (response.exam?.time_per_question) {
            setTimeLeft(response.exam.time_per_question);
          }
          setLoading(false);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء بدء الامتحان');
      router.push('/student/exams');
      setLoading(false);
    }
  }, [examId, router]);

  // WebSocket Listener for Queue Admission
  useEffect(() => {
    if (!waiting || !user?.id) return;

    let echoChannel: any = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const { getEcho } = require('@/lib/echo');
    const echo = getEcho();

    const handleAdmission = (data: any) => {
      if (data && data.attempt_id) {
        setAttemptData(data);
        attemptIdRef.current = data.attempt_id;
        if (data.exam?.time_per_question) {
          setTimeLeft(data.exam.time_per_question);
        }
        setWaiting(false);
        setLoading(false);
        toast.success('تم دخولك للامتحان بنجاح!');
      }
    };

    // 1. Setup WebSocket listener
    if (echo) {
      echoChannel = echo.private(`notifications.student.${user.id}`);
      echoChannel.listen('.ExamAttemptReady', (data: any) => {
        if (data.attemptData && data.attemptData.exam?.id === examId) {
          handleAdmission(data.attemptData);
        }
      });
    }

    // 2. Always setup Polling as a robust fallback
    pollInterval = setInterval(async () => {
      try {
        const response = await fetchApi(`/student/exams/${examId}/start`, {
          method: 'POST',
        });
        
        // If the response status is no longer 'waiting', it means the attempt is ready
        if (response && response.status !== 'waiting') {
          handleAdmission(response);
          if (pollInterval) clearInterval(pollInterval);
        } else if (response) {
          setQueuePosition(response.position || 0);
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 4000); // Poll every 4 seconds for a fast fallback

    return () => {
      if (echoChannel) {
        echoChannel.stopListening('.ExamAttemptReady');
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [waiting, user?.id, examId]);

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
              <Icon name="exclamation-triangle" size="2x" className="text-white" />
            </div>
            
            <h2 className="text-white text-2xl mb-4 font-bold">
              تحذير هام قبل بدء الامتحان
            </h2>
            
            <div className="bg-danger/10 rounded-xl p-5 mb-6 text-right">
              <ul className="text-gray-light text-[0.95rem] leading-8 list-none p-0">
                <li className="mb-2">
                  <Icon name="times-circle" className="text-[#FF5B5B] ml-2" />
                  لا يمكنك الرجوع للأسئلة السابقة بعد الإجابة عليها
                </li>
                <li className="mb-2">
                  <Icon name="times-circle" className="text-[#FF5B5B] ml-2" />
                  سيتم تفعيل وضع ملء الشاشة تلقائياً
                </li>
                <li className="mb-2">
                  <Icon name="times-circle" className="text-[#FF5B5B] ml-2" />
                  الخروج من ملء الشاشة أو تغيير التبويب سينهي الامتحان فوراً
                </li>
                <li>
                  <Icon name="times-circle" className="text-[#FF5B5B] ml-2" />
                  تم تعطيل النسخ واللصق والقائمة المختصرة
                </li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/student/exams')}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                onClick={handleAcceptWarning}
                className="flex-1"
              >
                فهمت، ابدأ الامتحان
              </Button>
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
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white text-center p-5">
          {waiting ? (
            <>
              <div className="w-24 h-24 mb-8 relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-primary font-bold text-2xl">
                  {queuePosition}
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-4">أنت في غرفة الانتظار</h2>
              <p className="text-gray-light max-w-md mx-auto leading-relaxed">
                هناك ضغط كبير على السيرفر حالياً. ترتيبك في الطابور هو <span className="text-primary font-bold">#{queuePosition}</span>.
                <br />
                سيتم دخولك للامتحان تلقائياً فور جاهزية دورك، لا تغلق هذه الصفحة.
              </p>
            </>
          ) : (
            <>
              <LoadingSpinner size="lg" className="mb-4" />
              <p className="text-xl">جاري تحميل الامتحان...</p>
            </>
          )}
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
              <Icon name={result?.terminated ? 'ban' : 'trophy'} size="2x" className="text-white" />
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
                <span
                  className="text-xl"
                  style={{
                    color: progress.trend === 'up' ? '#00D68F' : progress.trend === 'down' ? '#FF5B5B' : '#FFAA00',
                  }}
                >
                  <Icon name={progress.trend === 'up' ? 'arrow-up' : progress.trend === 'down' ? 'arrow-down' : 'minus'} size="lg" />
                </span>
                <span className="text-gray-light">{progress.message}</span>
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => router.push('/student/exams')}
              className="w-full"
            >
              العودة للامتحانات
            </Button>
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
            <Button
              key={index}
              variant={selectedAnswer === option ? 'primary' : 'outline'}
              onClick={() => setSelectedAnswer(option)}
              disabled={submitting}
              className={`w-full justify-start text-right mb-2 ${
                selectedAnswer === option
                  ? 'border-[#4263EB] bg-[#4263EB]/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 ${
                selectedAnswer === option
                  ? 'border-[#4263EB] bg-[#4263EB]'
                  : 'border-white/30 bg-transparent'
              }`}>
                {selectedAnswer === option && (
                  <Icon name="check" size="xs" className="text-white" />
                )}
              </span>
              {option}
            </Button>
          ))}
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            onClick={() => submitAnswer(selectedAnswer)}
            disabled={!selectedAnswer || submitting}
            loading={submitting}
            className="mt-8 w-full"
            size="lg"
          >
            {submitting ? 'جاري الإرسال...' : 'التالي'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

