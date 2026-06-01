'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { Button, Icon } from '@/components/ui/index';
import { InteractiveMatching } from '@/components/exam/InteractiveMatching';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  type?: 'mcq' | 'true_false' | 'ordering' | 'matching';
  options: any[];
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

// ─── Components ───────────────────────────────────────────────────────────────

function SortableItem({ id, text, index, onMoveUp, onMoveDown, isFirst, isLast }: { 
  id: string; 
  text: string; 
  index: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group p-3.5 sm:p-4 mb-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 sm:gap-4 ${
        isDragging 
          ? 'bg-primary/10 border-primary shadow-[0_12px_30px_rgba(66,99,235,0.15)] scale-[1.02] z-50' 
          : 'bg-surface-secondary/80 dark:bg-[#101426]/30 backdrop-blur-md border-border-theme-secondary hover:border-border-theme-primary hover:bg-surface-hover/80 shadow-sm'
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-surface-tertiary/80 border border-border-theme-secondary flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-surface-hover hover:border-primary-light/30 transition-all group/handle shrink-0 animate-pulse-slow"
      >
        <Icon name="grip-vertical" className="text-text-theme-muted group-hover/handle:text-primary-light transition-colors" size="sm" />
      </div>

      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-xs sm:text-sm font-black text-primary-light shrink-0">
        {index + 1}
      </div>
      
      <span className="flex-1 text-text-theme-primary font-bold text-sm sm:text-lg pr-2 min-w-0 line-clamp-2 text-right break-words overflow-hidden whitespace-normal">{text}</span>

      <div className="flex flex-col gap-1 shrink-0 bg-surface-tertiary/50 dark:bg-black/20 p-1 rounded-xl border border-border-theme-secondary/40">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          disabled={isFirst}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
            isFirst ? 'opacity-25 cursor-not-allowed text-text-theme-muted' : 'hover:bg-primary/25 hover:text-primary-light text-text-theme-secondary'
          }`}
        >
          <Icon name="chevron-up" size="xs" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          disabled={isLast}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
            isLast ? 'opacity-25 cursor-not-allowed text-text-theme-muted' : 'hover:bg-primary/25 hover:text-primary-light text-text-theme-secondary'
          }`}
        >
          <Icon name="chevron-down" size="xs" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────────────────

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

  // States for question types
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);
  const [matchingAnswers, setMatchingAnswers] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (attemptData?.question) {
      const q = attemptData.question;
      if (q.type === 'ordering') {
        const shuffled = [...q.options].sort(() => Math.random() - 0.5);
        setShuffledOptions(shuffled);
        setSelectedAnswer(shuffled.join('|||'));
      } else if (q.type === 'matching') {
        const colB = q.options.map((p: any) => p.b).sort(() => Math.random() - 0.5);
        setShuffledOptions(colB);
        setMatchingAnswers({});
        setSelectedAnswer(null);
      } else {
        setShuffledOptions([]);
        setSelectedAnswer(null);
      }
    }
  }, [attemptData?.question]);

  const handleOrderingDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setShuffledOptions((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        setSelectedAnswer(newItems.join('|||'));
        return newItems;
      });
    }
  };

  const moveOrderingItem = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= shuffledOptions.length) return;
    
    const newItems = arrayMove(shuffledOptions, index, newIndex);
    setShuffledOptions(newItems);
    setSelectedAnswer(newItems.join('|||'));
  };

  const handleMatchingSelect = (questionVal: string, selectedAnswerVal: string) => {
    const newAnswers = { ...matchingAnswers, [questionVal]: selectedAnswerVal };
    setMatchingAnswers(newAnswers);
    
    const currentQ = attemptData?.question;
    if (currentQ?.type === 'matching') {
      const answerStr = currentQ.options
        .map((p: any) => `${p.a}===${newAnswers[p.a] || ''}`)
        .join('|||');
      
      const allMatched = currentQ.options.every((p: any) => newAnswers[p.a] && newAnswers[p.a] !== '');
      setSelectedAnswer(allMatched ? answerStr : null);
    }
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const attemptIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startExam = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchApi(`/student/exams/${examId}/start`, {
        method: 'POST',
      }) as any;
      
      if (response) {
        if (response.status === 'waiting') {
          setWaiting(true);
          setQueuePosition(response.position || 0);
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

  // WebSocket / Polling logic (Preserved)
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
        if (data.exam?.time_per_question) setTimeLeft(data.exam.time_per_question);
        setWaiting(false);
        setLoading(false);
        toast.success('تم دخولك للامتحان بنجاح!');
      }
    };

    if (echo) {
      echoChannel = echo.private(`notifications.student.${user.id}`);
      echoChannel.listen('.ExamAttemptReady', (data: any) => {
        if (data.attemptData && data.attemptData.exam?.id === examId) handleAdmission(data.attemptData);
      });
    }

    pollInterval = setInterval(async () => {
      try {
        const response = await fetchApi(`/student/exams/${examId}/start`, { method: 'POST' }) as any;
        if (response && response.status !== 'waiting') {
          handleAdmission(response);
          if (pollInterval) clearInterval(pollInterval);
        } else if (response) setQueuePosition(response.position || 0);
      } catch (e) { console.error('Polling error:', e); }
    }, 4000);

    return () => {
      if (echoChannel) echoChannel.stopListening('.ExamAttemptReady');
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [waiting, user?.id, examId]);

  const submitAnswer = useCallback(async (answer: string | null) => {
    if (!attemptIdRef.current || submitting) return;
    setSubmitting(true);
    try {
      let response;
      if (answer) {
        response = await fetchApi(`/student/exams/attempts/${attemptIdRef.current}/answer`, {
          method: 'POST',
          body: JSON.stringify({ answer }),
        }) as any;
      } else {
        response = await fetchApi(`/student/exams/attempts/${attemptIdRef.current}/skip`, { method: 'POST' }) as any;
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

  const terminateExam = useCallback(async (reason: string) => {
    if (!attemptIdRef.current) return;
    try {
      const response = await fetchApi(`/student/exams/attempts/${attemptIdRef.current}/terminate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }) as any;
      if (response) {
        setAttemptData(response);
        toast.error('تم إنهاء الامتحان بسبب مخالفة');
      }
    } catch (error: any) { console.error('Failed to terminate exam:', error); }
  }, []);

  useEffect(() => {
    if (attemptData?.status !== 'in_progress' || showWarning) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          submitAnswer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [attemptData?.status, attemptData?.progress?.current, showWarning, submitAnswer]);

  // Anti-cheating (Preserved)
  useEffect(() => {
    if (attemptData?.status !== 'in_progress' || showWarning) return;
    const enterFullScreen = async () => {
      try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen(); }
      catch (err) { console.error('Error attempting to enable full-screen mode:', err); }
    };
    enterFullScreen();
    const handleVisibilityChange = () => { if (document.hidden) terminateExam('visibility_change'); };
    const handleFullScreenChange = () => { if (!document.fullscreenElement) terminateExam('screen_resize'); };
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

  useEffect(() => {
    if (attemptData?.status === 'completed' || attemptData?.status === 'terminated') {
      if (document.fullscreenElement) document.exitFullscreen().catch(e => console.error(e));
    }
  }, [attemptData?.status]);

  // Format & Styles
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColorClass = () => {
    if (timeLeft <= 10) return 'text-danger shadow-[0_0_15px_rgba(255,91,91,0.4)] border-danger/40 bg-danger/10';
    if (timeLeft <= 30) return 'text-warning border-warning/40 bg-warning/10';
    return 'text-success border-success/40 bg-success/10';
  };

  const getProgressPercentage = () => {
    if (!attemptData?.progress) return 0;
    return (attemptData.progress.current / attemptData.progress.total) * 100;
  };

  // ── Views ───────────────────────────────────────────────────────────────────

  // 1. Warning View
  if (showWarning) {
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="fixed inset-0 bg-surface-secondary/95 dark:bg-[#050811]/95 backdrop-blur-2xl flex items-center justify-center z-[1000] p-4 sm:p-5 overflow-y-auto">
          <div className="bg-surface-primary dark:bg-[#101426]/80 rounded-3xl sm:rounded-[48px] p-5 sm:p-10 md:p-14 max-w-[650px] w-full text-center border border-border-theme-primary shadow-2xl relative overflow-hidden my-auto">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-danger via-warning to-danger"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-danger/10 blur-[80px] rounded-full"></div>
            
            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-danger/10 border-2 border-danger/20 flex items-center justify-center mx-auto mb-6 sm:mb-10 rotate-3 shadow-[0_0_30px_rgba(255,91,91,0.2)]">
              <Icon name="exclamation-triangle" size="xl" className="text-danger" />
            </div>
            
            <h2 className="text-text-theme-primary text-2xl sm:text-4xl mb-6 sm:mb-8 font-black tracking-tight drop-shadow-lg">
              تنبيهات هامة قبل البدء
            </h2>
            
            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-12 text-right">
              {[
                { text: 'بمجرد الإجابة، لا يمكنك العودة للسؤال السابق', icon: 'undo-alt', color: 'text-danger' },
                { text: 'سيتم قفل المتصفح على وضع ملء الشاشة تلقائياً', icon: 'expand', color: 'text-primary-light' },
                { text: 'الخروج من الصفحة أو تصغيرها ينهي محاولتك فوراً', icon: 'times-circle', color: 'text-warning' },
                { text: 'تم تعطيل كافة اختصارات النسخ واللصق والبحث', icon: 'lock', color: 'text-success' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 sm:gap-5 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-surface-secondary/50 dark:bg-white/[0.03] border border-border-theme-secondary hover:border-border-theme-primary transition-all group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-surface-tertiary dark:bg-white/5 border border-border-theme-secondary flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Icon name={item.icon} className={item.color} size="sm" />
                  </div>
                  <p className="text-text-theme-secondary font-bold text-sm sm:text-base leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
              <Button
                variant="ghost"
                onClick={() => router.push('/student/exams')}
                className="flex-1 rounded-2xl sm:rounded-3xl border border-border-theme-primary hover:bg-surface-secondary text-text-theme-secondary h-12 sm:h-16 text-base sm:text-lg font-bold justify-center"
              >
                رجوع
              </Button>
              <Button
                variant="primary"
                onClick={() => { setShowWarning(false); startExam(); }}
                className="flex-1 rounded-2xl sm:rounded-3xl h-12 sm:h-16 text-base sm:text-lg font-black shadow-[0_12px_30px_rgba(66,99,235,0.4)] hover:scale-[1.02] transition-transform justify-center"
              >
                فهمت، ابدأ الآن
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 2. Loading / Waiting View
  if (loading) {
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-5 text-center">
          {waiting ? (
            <div className="max-w-xl w-full p-8 sm:p-12 rounded-3xl sm:rounded-[56px] bg-surface-primary dark:bg-[#101426]/60 border border-border-theme-primary backdrop-blur-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary animate-pulse"></div>
              <div className="relative w-28 h-28 sm:w-40 sm:h-40 mx-auto mb-6 sm:mb-10">
                <div className="absolute inset-0 rounded-full border-4 border-primary/10 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-primary font-black text-3xl sm:text-5xl drop-shadow-[0_0_15px_rgba(66,99,235,0.5)]">
                  {queuePosition}
                </div>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-text-theme-primary mb-4 sm:mb-6 tracking-tight">قائمة الانتظار</h2>
              <p className="text-text-theme-secondary leading-relaxed text-base sm:text-xl font-medium">
                هناك ضغط حالي، ترتيبك في الدخول هو <span className="text-primary-light font-black underline underline-offset-8">#{queuePosition}</span>.
                <br />
                <span className="text-text-theme-muted text-sm sm:text-base block mt-4">لا تغلق الصفحة، سيتم توجيهك تلقائياً...</span>
              </p>
            </div>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="text-lg sm:text-2xl text-text-theme-secondary font-black tracking-widest animate-pulse uppercase font-mono">جاري تجهيز الأسئلة...</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // 3. Results / Completed View
  if (attemptData?.status === 'completed' || attemptData?.status === 'terminated') {
    const result = attemptData.result;
    const progress = attemptData.progress_comparison;
    const isPassed = (result?.percentage || 0) >= 60;
    
    return (
      <DashboardLayout role="student" user={user || undefined}>
        <div className="max-w-3xl mx-auto py-8 sm:py-16 px-4 sm:px-6">
          <div className="bg-surface-primary dark:bg-[#101426]/60 backdrop-blur-3xl rounded-3xl sm:rounded-[56px] border border-border-theme-primary p-6 sm:p-10 md:p-16 text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${result?.terminated ? 'bg-danger' : isPassed ? 'bg-success shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-warning shadow-[0_0_20px_rgba(245,158,11,0.5)]'}`}></div>
            
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-[30px] sm:rounded-[40px] flex items-center justify-center mx-auto mb-6 sm:mb-10 rotate-6 transition-transform hover:rotate-0 duration-500 shadow-2xl border-2 ${
              result?.terminated ? 'bg-danger/10 text-danger border-danger/20' : 
              isPassed ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
            }`}>
              <Icon name={result?.terminated ? 'ban' : isPassed ? 'trophy' : 'medal'} size="3x" className="drop-shadow-lg" />
            </div>

            <h2 className="text-text-theme-primary text-2xl sm:text-4xl font-black mb-2 sm:mb-4 tracking-tight drop-shadow-md">
              {result?.terminated ? 'توقف الامتحان!' : isPassed ? 'أحسنت! لقد نجحت' : 'نتيجة الامتحان'}
            </h2>
            
            {result?.terminated && (
              <div className="px-4 py-2 rounded-xl bg-danger/10 text-danger text-xs sm:text-sm font-black inline-block mb-6 sm:mb-10 border border-danger/20 animate-bounce">
                السبب: {result.terminated_reason === 'visibility_change' ? 'محاولة تبديل التبويب' : 'الخروج من وضع ملء الشاشة'}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8 sm:mb-12">
              <div className="p-6 sm:p-10 rounded-2xl sm:rounded-[40px] bg-surface-secondary dark:bg-white/[0.03] border border-border-theme-primary backdrop-blur-sm group hover:border-primary/30 transition-all hover:bg-surface-hover dark:hover:bg-white/[0.05]">
                <p className="text-text-theme-muted text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-4">النسبة المئوية</p>
                <div className={`text-4xl sm:text-6xl font-black mb-1 sm:mb-2 transition-transform group-hover:scale-110 ${isPassed ? 'text-success' : 'text-danger'} drop-shadow-glow`}>
                  {result?.percentage}%
                </div>
                <div className="text-text-theme-secondary font-bold text-sm sm:text-xl">
                  {result?.score} / {result?.max_score} نقطة
                </div>
              </div>
              
              <div className="p-6 sm:p-10 rounded-2xl sm:rounded-[40px] bg-surface-secondary dark:bg-white/[0.03] border border-border-theme-primary backdrop-blur-sm">
                <p className="text-text-theme-muted text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6">تحليل الإجابات</p>
                <div className="flex items-center justify-around">
                  <div className="text-center group">
                    <div className="text-2xl sm:text-4xl font-black text-success group-hover:scale-125 transition-transform">{result?.correct_answers}</div>
                    <p className="text-text-theme-muted text-[9px] sm:text-[10px] font-black mt-1 sm:mt-2">صحيحة</p>
                  </div>
                  <div className="w-px h-8 sm:h-12 bg-border-theme-primary"></div>
                  <div className="text-center group">
                    <div className="text-2xl sm:text-4xl font-black text-danger group-hover:scale-125 transition-transform">{(result?.total_questions || 0) - (result?.correct_answers || 0)}</div>
                    <p className="text-text-theme-muted text-[9px] sm:text-[10px] font-black mt-1 sm:mt-2">خاطئة</p>
                  </div>
                </div>
              </div>
            </div>

            {progress?.has_previous && (
              <div className="mb-8 sm:mb-12 p-4 sm:p-6 rounded-2xl sm:rounded-[32px] bg-primary/5 border border-primary/10 flex items-center justify-center gap-4 sm:gap-6 group hover:bg-primary/10 transition-colors">
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12 ${
                   progress.trend === 'up' ? 'bg-success/20 text-success' : progress.trend === 'down' ? 'bg-danger/20 text-danger' : 'bg-warning/20 text-warning'
                }`}>
                  <Icon name={progress.trend === 'up' ? 'trending-up' : progress.trend === 'down' ? 'trending-down' : 'minus'} size="lg" />
                </div>
                <p className="text-text-theme-primary font-bold text-sm sm:text-xl leading-snug text-right">{progress.message}</p>
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => router.push('/student/exams')}
              className="w-full h-14 sm:h-20 rounded-2xl sm:rounded-[32px] text-base sm:text-xl font-black shadow-2xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all relative overflow-hidden group/btn justify-center"
            >
              <span className="relative z-10">العودة للرئيسية</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 4. Active Exam View
  const currentQuestion = attemptData?.question;
  const isQuestionType = (type: string) => currentQuestion?.type === type;

  return (
    <DashboardLayout role="student" user={user || undefined} hideNav>
      <div ref={containerRef} className="max-w-4xl mx-auto pt-3 px-3 pb-36 sm:pt-6 sm:px-6 sm:pb-10 md:p-10 select-none min-h-screen">
        {/* Watermark (Preserved) */}
        <div className="fixed inset-0 pointer-events-none z-[9999] flex flex-wrap justify-around content-around opacity-[0.03] overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="rotate-[-45deg] text-[2rem] font-bold text-white whitespace-nowrap m-[60px]">
              {user?.name} - {user?.phone}
            </div>
          ))}
        </div>

        {/* Mobile Sticky Header */}
        <div className="sticky top-0 z-40 -mx-3 px-4 py-3 bg-surface-primary/95 dark:bg-[#101426]/95 backdrop-blur-md border-b border-border-theme-secondary sm:hidden flex flex-col gap-2 shadow-sm">
          {/* Row 1: Title & Timer */}
          <div className="flex items-center justify-between gap-3 w-full">
            <span className="text-text-theme-primary text-xs sm:text-sm font-black truncate max-w-[70%] text-right">
              {attemptData?.exam?.title}
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-500 font-mono text-[11px] font-black shrink-0 ${
              timeLeft <= 10 ? 'text-danger border-danger/30 bg-danger/10 shadow-[0_0_10px_rgba(255,91,91,0.2)]' :
              timeLeft <= 30 ? 'text-warning border-warning/30 bg-warning/10' :
              'text-success border-success/30 bg-success/10'
            }`}>
              <Icon name="clock" className={timeLeft <= 10 ? 'animate-bounce text-danger' : 'animate-pulse'} size="xs" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          {/* Row 2: Progress & Badges */}
          <div className="flex items-center justify-between gap-2 w-full">
            <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary-light text-[10px] font-black tracking-wider">
              سؤال {attemptData?.progress?.current} من {attemptData?.progress?.total}
            </span>
            
            <span className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border-theme-secondary text-text-theme-muted text-[10px] font-black">
              {isQuestionType('mcq') && 'اختيار من متعدد'}
              {isQuestionType('true_false') && 'صح أو خطأ'}
              {isQuestionType('ordering') && 'ترتيب العناصر'}
              {isQuestionType('matching') && 'توصيل العناصر'}
              {!currentQuestion?.type && 'اختيار من متعدد'}
            </span>
          </div>
          
          {/* Progress line indicator */}
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-surface-secondary overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary via-primary-light to-secondary rounded-full transition-all duration-700 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Header Section */}
        <div className="hidden sm:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="space-y-1.5 sm:space-y-2">
            <h1 className="text-text-theme-primary text-xl sm:text-3xl font-black tracking-tight drop-shadow-lg">{attemptData?.exam?.title}</h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-primary/10 border border-primary/20 text-primary-light text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-sm">
                سؤال {attemptData?.progress?.current} من {attemptData?.progress?.total}
              </span>
              <span className="text-text-theme-secondary text-[10px] sm:text-xs font-bold bg-surface-secondary px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-border-theme-secondary">{attemptData?.exam?.subject}</span>
              <span className="text-text-theme-secondary text-[10px] sm:text-xs font-bold bg-surface-secondary px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl border border-border-theme-secondary">
                {isQuestionType('mcq') && 'سؤال اختياري'}
                {isQuestionType('true_false') && 'سؤال صح أو خطأ'}
                {isQuestionType('ordering') && 'سؤال ترتيب'}
                {isQuestionType('matching') && 'سؤال توصيل'}
                {!currentQuestion?.type && 'سؤال اختياري'}
              </span>
            </div>
          </div>
          
          <div className={`relative flex items-center justify-center px-4 py-2 sm:px-6 sm:py-4 rounded-xl sm:rounded-[28px] border-2 transition-all duration-500 min-w-0 w-full sm:w-auto shadow-2xl backdrop-blur-md justify-between sm:justify-start ${getTimerColorClass()}`}>
            <div className="flex items-center">
              <Icon name="clock" className={`mr-2 sm:mr-3 ${timeLeft <= 10 ? 'animate-bounce text-danger' : 'animate-pulse'}`} size="sm" />
              <span className="text-xs sm:text-sm font-bold text-white/50 block sm:hidden">الوقت المتبقي</span>
            </div>
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Elegant Progress Bar */}
        <div className="hidden sm:block relative h-2.5 sm:h-3 bg-surface-secondary rounded-full mb-6 sm:mb-10 overflow-hidden border border-border-theme-secondary p-[1px] shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary-light to-secondary rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(66,99,235,0.4)] relative"
            style={{ width: `${getProgressPercentage()}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative mt-3 sm:mt-0">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10 animate-pulse-slow"></div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full -z-10 animate-pulse-slow"></div>
          
          <div 
            key={attemptData?.progress?.current}
            className="bg-surface-primary dark:bg-[#101426]/60 backdrop-blur-3xl rounded-3xl sm:rounded-[48px] border border-border-theme-primary p-4 sm:p-8 md:p-14 shadow-[0_32px_80px_rgba(0,0,0,0.5)] relative overflow-hidden animate-slide-in-right"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="mb-6 sm:mb-12 relative">
              <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-1 w-8 sm:w-12 bg-primary rounded-full"></div>
                  <span className="text-primary-light font-black text-[10px] sm:text-xs tracking-[0.2em] uppercase">السؤال {attemptData?.progress?.current}</span>
                </div>
                
                <span className="px-2.5 py-1 rounded-lg bg-surface-secondary border border-border-theme-secondary text-text-theme-muted text-[10px] sm:text-xs font-black">
                  {isQuestionType('mcq') && 'اختيار من متعدد'}
                  {isQuestionType('true_false') && 'صح أو خطأ'}
                  {isQuestionType('ordering') && 'ترتيب العناصر'}
                  {isQuestionType('matching') && 'توصيل العناصر'}
                  {!currentQuestion?.type && 'اختيار من متعدد'}
                </span>
              </div>
              <h3 className="text-text-theme-primary text-xl sm:text-2xl md:text-4xl font-black leading-[1.5] text-right drop-shadow-md">
                {currentQuestion?.text}
              </h3>
            </div>

            {/* Specialized Question Renderers */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* MCQ & True/False */}
              {(!currentQuestion?.type || isQuestionType('mcq') || isQuestionType('true_false')) && (
                <div className={`grid gap-3 sm:gap-4 ${isQuestionType('true_false') ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {currentQuestion?.options.map((option: any, index: number) => {
                    const isSelected = selectedAnswer === option;
                    const letter = String.fromCharCode(65 + index);
                    
                    return (
                      <button
                        key={index}
                        disabled={submitting}
                        onClick={() => setSelectedAnswer(option)}
                        className={`group relative flex items-center gap-3 sm:gap-5 p-3.5 sm:p-5 md:p-6 min-h-[56px] sm:min-h-[72px] rounded-2xl sm:rounded-[32px] border-2 transition-all duration-300 text-right overflow-hidden ${
                          isSelected 
                            ? 'bg-primary/10 border-primary shadow-[0_8px_30px_rgba(66,99,235,0.12)] scale-[1.01]' 
                            : 'bg-surface-secondary/60 hover:bg-surface-hover border-border-theme-secondary hover:border-border-theme-primary'
                        }`}
                      >
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl border-2 flex items-center justify-center font-black text-sm sm:text-xl transition-all duration-300 shrink-0 ${
                          isSelected ? 'bg-primary border-primary text-white shadow-[0_4px_12px_rgba(66,99,235,0.3)]' : 'bg-surface-tertiary border border-border-theme-secondary text-text-theme-muted group-hover:text-text-theme-primary'
                        }`}>
                          {isQuestionType('true_false') ? (
                            <Icon name={option === 'صح' || option === 'True' || index === 0 ? 'check' : 'times'} size="sm" />
                          ) : letter}
                        </div>
                        <span className={`text-base sm:text-xl font-bold transition-all pr-2 sm:pr-0 ${isSelected ? 'text-text-theme-primary font-black' : 'text-text-theme-secondary group-hover:text-text-theme-primary'}`}>
                          {option}
                        </span>
                        
                        <div className={`absolute left-4 sm:left-8 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0 ${
                          isSelected ? 'bg-primary border-primary scale-110 shadow-md' : 'border-border-theme-secondary opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-90'
                        }`}>
                          {isSelected && <Icon name="check" size="xs" className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Ordering */}
              {isQuestionType('ordering') && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOrderingDragEnd}>
                  <SortableContext items={shuffledOptions} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {shuffledOptions.map((option, idx) => (
                        <SortableItem 
                          key={option} 
                          id={option} 
                          text={option} 
                          index={idx}
                          onMoveUp={() => moveOrderingItem(idx, 'up')}
                          onMoveDown={() => moveOrderingItem(idx, 'down')}
                          isFirst={idx === 0}
                          isLast={idx === shuffledOptions.length - 1}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Matching */}
              {isQuestionType('matching') && (
                <InteractiveMatching
                  keys={currentQuestion?.options.map((p: any) => p.a) || []}
                  values={shuffledOptions}
                  matches={matchingAnswers}
                  onMatch={handleMatchingSelect}
                  disabled={submitting}
                />
              )}
            </div>

            {/* Navigation / Submit (Desktop View) */}
            <div className="hidden sm:block mt-8 sm:mt-16">
              <div className="flex flex-col sm:flex-row-reverse gap-3 sm:gap-4">
                <Button
                  variant="primary"
                  onClick={() => submitAnswer(selectedAnswer)}
                  disabled={!selectedAnswer || submitting}
                  loading={submitting}
                  className={`flex-1 h-14 sm:h-20 rounded-2xl sm:rounded-[32px] text-base sm:text-xl font-black transition-all duration-300 relative overflow-hidden group/btn justify-center border-2 ${
                    !selectedAnswer 
                      ? 'bg-surface-secondary/50 dark:bg-white/[0.02] border-border-theme-secondary/45 text-text-theme-muted/40 cursor-not-allowed pointer-events-none' 
                      : 'bg-primary border-primary text-white shadow-[0_20px_50px_rgba(66,99,235,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  <span className="relative z-10">
                    {submitting ? 'جاري الحفظ...' : (attemptData?.progress?.current === attemptData?.progress?.total ? 'إنهاء وتسليم الامتحان' : 'تأكيد الإجابة والانتقال التالي')}
                  </span>
                  {selectedAnswer && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-light to-primary opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => submitAnswer(null)}
                  disabled={submitting}
                  className="rounded-2xl sm:rounded-[32px] text-sm sm:text-lg font-bold border-2 border-border-theme-secondary hover:border-border-theme-primary text-text-theme-secondary hover:bg-surface-hover h-14 sm:h-20 px-6 sm:px-10 justify-center transition-all"
                >
                  تخطي السؤال
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6 text-gray-500">
                <Icon name="info-circle" size="xs" />
                <p className="text-center text-[10px] sm:text-xs font-bold tracking-wide uppercase">يرجى التأكد من الإجابة، لا يمكن العودة للأسئلة السابقة</p>
              </div>
            </div>

          </div> {/* Closing Card */}
        </div> {/* Closing relative wrapper */}

        {/* Sticky Mobile Footer Panel (Mobile View) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-45 bg-surface-primary/95 dark:bg-[#101426]/95 backdrop-blur-md border-t border-border-theme-secondary p-3 flex gap-2 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] animate-fade-in">
          <Button
            variant="primary"
            onClick={() => submitAnswer(selectedAnswer)}
            disabled={!selectedAnswer || submitting}
            loading={submitting}
            className={`flex-[2] h-12 rounded-xl text-sm font-black transition-all border ${
              !selectedAnswer 
                ? 'bg-surface-secondary/50 dark:bg-white/[0.02] border-border-theme-secondary/40 text-text-theme-muted/40 cursor-not-allowed pointer-events-none' 
                : 'bg-primary border-primary text-white shadow-md'
            }`}
          >
            {attemptData?.progress?.current === attemptData?.progress?.total ? 'إنهاء وتسليم' : 'تأكيد وتالي'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => submitAnswer(null)}
            disabled={submitting}
            className="flex-1 h-12 rounded-xl text-xs font-bold border border-border-theme-secondary text-text-theme-secondary hover:bg-surface-hover"
          >
            تخطي
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
