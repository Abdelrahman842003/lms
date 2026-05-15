'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { fetchApi } from '@/services/authService';
import { toast } from 'react-hot-toast';
import { Button, LoadingSpinner, Icon } from '@/components/ui/index';

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

function SortableItem({ id, text, index }: { id: string; text: string; index: number }) {
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
      {...attributes}
      {...listeners}
      className={`relative group p-4 mb-3 rounded-2xl border transition-all duration-200 cursor-move touch-none flex items-center gap-4 ${
        isDragging 
          ? 'bg-primary/20 border-primary shadow-2xl scale-[1.02]' 
          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
      }`}
    >
      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-primary-light transition-colors">
        {index + 1}
      </div>
      <span className="flex-1 text-white font-medium">{text}</span>
      <Icon name="grip-vertical" className="text-gray-500 group-hover:text-gray-300 transition-colors" />
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
  const [activeMatchingSide, setActiveMatchingSide] = useState<{ id: string; val: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
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
        setActiveMatchingSide(null);
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

  const handleMatchingClick = (val: string, side: 'left' | 'right') => {
    if (side === 'left') {
      setActiveMatchingSide({ id: val, val });
    } else {
      if (!activeMatchingSide) {
        toast.error('اختر عنصراً من القائمة اليمنى أولاً');
        return;
      }
      
      const newAnswers = { ...matchingAnswers, [activeMatchingSide.id]: val };
      setMatchingAnswers(newAnswers);
      setActiveMatchingSide(null);
      
      const currentQ = attemptData?.question;
      if (currentQ?.type === 'matching') {
        const answerStr = currentQ.options
          .map((p: any) => `${p.a}===${newAnswers[p.a] || ''}`)
          .join('|||');
        
        const allMatched = currentQ.options.every((p: any) => newAnswers[p.a]);
        setSelectedAnswer(allMatched ? answerStr : null);
      }
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
      });
      
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
        const response = await fetchApi(`/student/exams/${examId}/start`, { method: 'POST' });
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
        });
      } else {
        response = await fetchApi(`/student/exams/attempts/${attemptIdRef.current}/skip`, { method: 'POST' });
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
      });
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
        <div className="fixed inset-0 bg-[#050811]/90 backdrop-blur-xl flex items-center justify-center z-[1000] p-5">
          <div className="bg-[#101426] rounded-[32px] p-8 md:p-12 max-w-[550px] w-full text-center border border-white/10 shadow-[0_32px_80px_rgba(0,0,0,0.6)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger via-warning to-danger"></div>
            
            <div className="w-20 h-20 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-8 rotate-3 transition-transform hover:rotate-0 duration-300">
              <Icon name="exclamation-triangle" size="2x" className="text-danger" />
            </div>
            
            <h2 className="text-white text-3xl mb-6 font-black tracking-tight">
              تحذير هام قبل البدء
            </h2>
            
            <div className="space-y-4 mb-10 text-right">
              {[
                { text: 'لا يمكنك العودة للأسئلة السابقة بعد الإجابة', icon: 'undo-alt' },
                { text: 'سيتم تفعيل وضع ملء الشاشة تلقائياً لمنع التشتت', icon: 'expand' },
                { text: 'الخروج من الصفحة أو تغيير حجمها ينهي الامتحان فوراً', icon: 'times-circle' },
                { text: 'تم تعطيل النسخ واللصق والقوائم الجانبية', icon: 'lock' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={item.icon} className="text-danger" />
                  </div>
                  <p className="text-gray-300 font-medium text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/student/exams')}
                className="flex-1 rounded-2xl border-white/10 hover:bg-white/5 text-gray-400 h-14"
              >
                إلغاء الأمر
              </Button>
              <Button
                variant="primary"
                onClick={() => { setShowWarning(false); startExam(); }}
                className="flex-1 rounded-2xl h-14 font-bold shadow-[0_8px_25px_rgba(66,99,235,0.4)]"
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
            <div className="max-w-lg w-full p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="relative w-32 h-32 mx-auto mb-10">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-primary font-black text-3xl">
                  {queuePosition}
                </div>
              </div>
              <h2 className="text-3xl font-black text-white mb-6">أنت في قائمة الانتظار</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                هناك ضغط كبير على السيرفر حالياً. ترتيبك هو <span className="text-primary font-bold">#{queuePosition}</span>.
                <br />
                لا تغلق الصفحة، سيتم دخولك تلقائياً فور جاهزية دورك.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p className="text-xl text-gray-400 font-medium animate-pulse">جاري تحضير أسئلة الامتحان...</p>
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
        <div className="max-w-2xl mx-auto py-12 px-6">
          <div className="bg-[#101426] rounded-[40px] border border-white/10 p-10 text-center shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${result?.terminated ? 'bg-danger' : isPassed ? 'bg-success' : 'bg-warning'}`}></div>
            
            <div className={`w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-6 ${
              result?.terminated ? 'bg-danger/10 text-danger border-danger/20' : 
              isPassed ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
            } border shadow-xl`}>
              <Icon name={result?.terminated ? 'ban' : isPassed ? 'trophy' : 'medal'} size="3x" />
            </div>

            <h2 className="text-white text-3xl font-black mb-3">
              {result?.terminated ? 'تم إنهاء الامتحان' : isPassed ? 'تهانينا! لقد اجتزت' : 'حظاً أوفر في المرة القادمة'}
            </h2>
            
            {result?.terminated && (
              <div className="px-4 py-2 rounded-full bg-danger/10 text-danger text-sm font-bold inline-block mb-8">
                السبب: {result.terminated_reason === 'visibility_change' ? 'محاولة الخروج من الصفحة' : 'تغيير حجم الشاشة'}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm group hover:border-primary/30 transition-all">
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">النتيجة النهائية</p>
                <div className="text-5xl font-black text-white mb-2 group-hover:scale-110 transition-transform">
                  {result?.score}<span className="text-gray-600 text-2xl font-medium"> / {result?.max_score}</span>
                </div>
                <div className={`text-2xl font-bold ${isPassed ? 'text-success' : 'text-danger'}`}>
                  {result?.percentage}%
                </div>
              </div>
              
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-4">تفاصيل الإجابات</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-black text-success">{result?.correct_answers}</div>
                    <p className="text-gray-500 text-xs">صحيحة</p>
                  </div>
                  <div className="w-px h-10 bg-white/10"></div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-danger">{(result?.total_questions || 0) - (result?.correct_answers || 0)}</div>
                    <p className="text-gray-500 text-xs">خاطئة</p>
                  </div>
                </div>
              </div>
            </div>

            {progress?.has_previous && (
              <div className="mb-10 p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center gap-4 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                   progress.trend === 'up' ? 'bg-success/10 text-success' : progress.trend === 'down' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                }`}>
                  <Icon name={progress.trend === 'up' ? 'arrow-up' : progress.trend === 'down' ? 'arrow-down' : 'minus'} size="lg" />
                </div>
                <p className="text-gray-300 font-medium text-lg leading-tight text-right">{progress.message}</p>
              </div>
            )}

            <Button
              variant="primary"
              onClick={() => router.push('/student/exams')}
              className="w-full h-16 rounded-[24px] text-lg font-black shadow-2xl hover:translate-y-[-2px] active:translate-y-[1px] transition-all"
            >
              العودة للرئيسية
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
    <DashboardLayout role="student" user={user || undefined}>
      <div ref={containerRef} className="max-w-4xl mx-auto p-6 md:p-10 select-none min-h-screen">
        {/* Watermark (Preserved) */}
        <div className="fixed inset-0 pointer-events-none z-[9999] flex flex-wrap justify-around content-around opacity-[0.03] overflow-hidden">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="rotate-[-45deg] text-[2rem] font-bold text-white whitespace-nowrap m-[60px]">
              {user?.name} - {user?.phone}
            </div>
          ))}
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-white text-3xl font-black tracking-tight">{attemptData?.exam?.title}</h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary-light text-xs font-bold uppercase tracking-wider">
                سؤال {attemptData?.progress?.current} / {attemptData?.progress?.total}
              </span>
              <span className="text-gray-500 text-sm font-medium">القسم الحالي: {attemptData?.exam?.subject}</span>
            </div>
          </div>
          
          {/* Circular Timer Inspired Component */}
          <div className={`relative flex items-center justify-center p-4 rounded-[24px] border-2 transition-all duration-500 min-w-[140px] ${getTimerColorClass()}`}>
            <Icon name="clock" className="mr-3 animate-pulse" />
            <span className="text-3xl font-black font-mono tracking-tighter">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Elegant Progress Bar */}
        <div className="relative h-2.5 bg-white/5 rounded-full mb-12 overflow-hidden border border-white/5 p-[1px]">
          <div 
            className="h-full bg-gradient-to-r from-primary via-primary-light to-secondary rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(66,99,235,0.3)]"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>

        {/* Main Content Area */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full -z-10 group-hover:bg-primary/10 transition-all duration-500"></div>
          
          <div className="bg-[#101426]/80 backdrop-blur-2xl rounded-[40px] border border-white/10 p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="mb-10">
              <span className="text-primary-light font-bold text-sm tracking-widest uppercase mb-4 block">السؤال {attemptData?.progress?.current}</span>
              <h3 className="text-white text-2xl md:text-3xl font-bold leading-[1.6] text-right">
                {currentQuestion?.text}
              </h3>
            </div>

            {/* Specialized Question Renderers */}
            <div className="space-y-4">
              
              {/* MCQ & True/False */}
              {(!currentQuestion?.type || isQuestionType('mcq') || isQuestionType('true_false')) && (
                <div className={`grid gap-4 ${isQuestionType('true_false') ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                  {currentQuestion?.options.map((option: any, index: number) => {
                    const isSelected = selectedAnswer === option;
                    const letter = String.fromCharCode(65 + index);
                    
                    return (
                      <button
                        key={index}
                        disabled={submitting}
                        onClick={() => setSelectedAnswer(option)}
                        className={`group relative flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 text-right ${
                          isSelected 
                            ? 'bg-primary/20 border-primary shadow-[0_0_25px_rgba(66,99,235,0.25)]' 
                            : 'bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg transition-all duration-300 ${
                          isSelected ? 'bg-primary border-primary text-white scale-110' : 'bg-white/5 border-white/10 text-gray-400 group-hover:text-white'
                        }`}>
                          {isQuestionType('true_false') ? (
                            <Icon name={option === 'صح' || option === 'True' || index === 0 ? 'check' : 'times'} />
                          ) : letter}
                        </div>
                        <span className={`text-lg font-bold transition-all ${isSelected ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                          {option}
                        </span>
                        {isSelected && (
                          <div className="mr-auto w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-bounce-in">
                            <Icon name="check" size="xs" className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Ordering */}
              {isQuestionType('ordering') && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOrderingDragEnd}>
                  <SortableContext items={shuffledOptions} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {shuffledOptions.map((option, idx) => (
                        <SortableItem key={option} id={option} text={option} index={idx} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Matching */}
              {isQuestionType('matching') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6 relative">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/5 hidden md:block"></div>
                  
                  {/* Right Side (Questions) */}
                  <div className="space-y-3">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4 pr-2">القائمة اليمنى</p>
                    {currentQuestion?.options.map((pair: any, index: number) => {
                      const hasMatch = !!matchingAnswers[pair.a];
                      const isActive = activeMatchingSide?.id === pair.a;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleMatchingClick(pair.a, 'left')}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            isActive ? 'bg-primary border-primary shadow-lg ring-2 ring-primary/20 scale-[1.02]' : 
                            hasMatch ? 'bg-success/10 border-success/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className={`font-bold ${isActive ? 'text-white' : hasMatch ? 'text-success' : 'text-gray-300'}`}>{pair.a}</span>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isActive ? 'bg-white/20 text-white' : hasMatch ? 'bg-success text-white' : 'bg-white/5 text-gray-500'}`}>
                            <Icon name={hasMatch ? 'check' : 'link'} size="sm" />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Left Side (Answers) */}
                  <div className="space-y-3">
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4 pr-2">القائمة اليسرى</p>
                    {shuffledOptions.map((opt, i) => {
                      const matchedWith = Object.keys(matchingAnswers).find(k => matchingAnswers[k] === opt);
                      
                      return (
                        <button
                          key={i}
                          onClick={() => handleMatchingClick(opt, 'right')}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            matchedWith ? 'bg-success/20 border-success shadow-lg' : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${matchedWith ? 'bg-success text-white' : 'bg-white/5 text-gray-500'}`}>
                            <Icon name={matchedWith ? 'link' : 'circle'} size="xs" />
                          </div>
                          <div className="text-right">
                            <span className={`font-bold block ${matchedWith ? 'text-white' : 'text-gray-300'}`}>{opt}</span>
                            {matchedWith && <span className="text-[10px] text-success font-black uppercase tracking-tighter">متصل بـ: {matchedWith}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation / Submit */}
            <div className="mt-12">
              <Button
                variant="primary"
                onClick={() => submitAnswer(selectedAnswer)}
                disabled={!selectedAnswer || submitting}
                loading={submitting}
                className={`w-full h-16 rounded-[24px] text-lg font-black transition-all duration-500 ${
                  !selectedAnswer ? 'opacity-40 grayscale pointer-events-none' : 'shadow-[0_12px_40px_rgba(66,99,235,0.4)]'
                }`}
              >
                {submitting ? 'جاري الحفظ...' : (attemptData?.progress?.current === attemptData?.progress?.total ? 'إنهاء وتسليم' : 'تأكيد الانتقال للسؤال التالي')}
              </Button>
              <p className="text-center text-gray-500 text-xs mt-4 font-medium">يرجى التأكد من الإجابة قبل الضغط على الزر، لا يمكن التراجع</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
