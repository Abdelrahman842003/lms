'use client';

/**
 * VideoQuizStudent
 * ─────────────────────────────────────────────────────────────────────────────
 * Student-facing quiz component shown after the video is fully watched.
 *
 * States:
 *  loading      — fetching quiz from API
 *  no-quiz      — no quiz attached to this video (renders nothing)
 *  already-passed — quiz already passed (renders celebration card)
 *  take-quiz    — question-by-question form
 *  result       — shows score, pass/fail, points earned, retry option
 *
 * Props:
 *  videoId          — the video UUID
 *  watchStatus      — current VideoWatchProgress status
 *  alreadyPassed    — whether the student already passed (from progress.quiz_passed_at)
 *  onQuizPassed     — callback after student passes (so parent can refresh progress)
 */

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Icon } from '@/components/ui/Icon';
import {
  getStudentVideoQuiz,
  submitStudentVideoQuiz,
} from '@/services/videoService';
import type { VideoQuiz, VideoQuizQuestion, SubmitQuizResult } from '@/types/video.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  videoId: string;
  watchStatus: string;
  alreadyPassed?: boolean;
  onQuizPassed?: () => void | Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VideoQuizStudent({ videoId, watchStatus, alreadyPassed, onQuizPassed }: Props) {
  const [quiz, setQuiz]                   = useState<VideoQuiz | null | undefined>(undefined);
  const [currentIndex, setCurrentIndex]   = useState(0);
  const [answers, setAnswers]             = useState<Record<string, string>>({});
  const [result, setResult]               = useState<SubmitQuizResult | null>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [phase, setPhase]                 = useState<'loading' | 'take' | 'result' | 'passed'>('loading');

  // ── Load quiz ─────────────────────────────────────────────────────────────

  const loadQuiz = useCallback(async () => {
    try {
      const q = await getStudentVideoQuiz(videoId);
      setQuiz(q);

      if (!q || !q.is_active) {
        // No quiz or disabled — show "no quiz" state
        setPhase('take'); // will hit the "no questions" empty state
        return;
      }

      if (alreadyPassed || q.my_status?.passed) {
        setPhase('passed');
      } else {
        setPhase('take');
      }
    } catch {
      setQuiz(null);
      setPhase('take'); // will hit the "no questions" empty state
    }
  }, [videoId, alreadyPassed]);

  useEffect(() => {
    // Only load quiz if video is sufficiently watched
    const eligible =
      watchStatus === 'watched_pending_quiz' ||
      watchStatus === 'completed';

    if (eligible) {
      void loadQuiz();
    }
  }, [watchStatus, loadQuiz]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!quiz) return;
    const questions = quiz.questions ?? [];

    // Check all answered
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`أجب على ${unanswered.length} سؤال متبقي`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitStudentVideoQuiz(videoId, answers);
      setResult(res);

      if (res.passed) {
        await onQuizPassed?.();
        setPhase('passed');
      } else {
        setPhase('result');
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل تسليم الاختبار');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Retry ─────────────────────────────────────────────────────────────────

  const handleRetry = () => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setPhase('take');
  };

  // ── Nothing to show ───────────────────────────────────────────────────────

  const shouldShow =
    watchStatus === 'watched_pending_quiz' ||
    watchStatus === 'completed';

  if (!shouldShow) return null;
  if (phase === 'loading' || quiz === undefined) {
    return (
      <div className="rounded-2xl border border-border-theme-primary bg-surface-primary dark:bg-[#101426]/40 p-6 flex items-center justify-center gap-3 text-text-secondary">
        <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <span className="text-sm">جاري تحميل الاختبار…</span>
      </div>
    );
  }

  // No quiz or inactive — show a friendly card instead of nothing
  if (!quiz || !quiz.is_active) {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-500/10 to-emerald-400/5 p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center mx-auto">
          <Icon name="check-circle" className="text-emerald-400 text-2xl" />
        </div>
        <p className="text-white font-bold">أتممت مشاهدة الفيديو 🎉</p>
        <p className="text-gray-400 text-sm">لا يوجد تدريب مرتبط بهذا الفيديو حالياً</p>
      </div>
    );
  }

  const questions: VideoQuizQuestion[] = quiz.questions ?? [];

  // ══ ALREADY PASSED ════════════════════════════════════════════════════════

  if (phase === 'passed') {
    return (
      <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-b from-emerald-500/10 to-emerald-400/5 p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center mx-auto">
          <Icon name="check-circle" className="text-emerald-400 text-2xl" />
        </div>
        <div>
          <p className="text-white font-bold text-lg">أتممت اختبار الفيديو! 🎉</p>
          <p className="text-emerald-400/80 text-sm mt-1">لقد اجتزت الاختبار بنجاح</p>
        </div>
      </div>
    );
  }

  // ══ RESULT ════════════════════════════════════════════════════════════════

  if (phase === 'result' && result) {
    const passed = result.passed;
    return (
      <div className={`rounded-2xl border p-6 space-y-5 ${
        passed
          ? 'border-emerald-400/30 bg-gradient-to-b from-emerald-500/10 to-emerald-400/5'
          : 'border-red-400/30 bg-gradient-to-b from-red-500/10 to-red-400/5'
      }`}>

        {/* Icon + headline */}
        <div className="text-center space-y-3">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
            passed
              ? 'bg-emerald-400/20 border-emerald-400/30'
              : 'bg-red-400/20 border-red-400/30'
          }`}>
            <Icon
              name={passed ? 'trophy' : 'times-circle'}
              className={`text-3xl ${passed ? 'text-emerald-400' : 'text-red-400'}`}
            />
          </div>
          <div>
            <p className={`text-xl font-bold ${passed ? 'text-emerald-400' : 'text-red-300'}`}>
              {passed ? 'نجحت! 🎉' : 'لم تنجح هذه المرة'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {passed
                ? 'أحسنت! لقد اجتزت اختبار هذا الفيديو بنجاح'
                : `تحتاج ${quiz.passing_score}% للنجاح — حاول مجدداً`}
            </p>
          </div>
        </div>

        {/* Score stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className={`text-2xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
              {result.percentage}%
            </p>
            <p className="text-gray-500 text-xs mt-0.5">النتيجة</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-white">{result.correct}/{result.total}</p>
            <p className="text-gray-500 text-xs mt-0.5">إجابة صحيحة</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
            <p className="text-2xl font-bold text-amber-400">{result.points_earned}</p>
            <p className="text-gray-500 text-xs mt-0.5">نقطة مكتسبة</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!passed && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Icon name="redo" size="sm" />
              إعادة الاختبار
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══ TAKE QUIZ ═════════════════════════════════════════════════════════════

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-border-theme-primary bg-surface-primary dark:bg-[#101426]/40 p-6 text-center text-text-secondary text-sm">
        الاختبار لا يحتوي أسئلة بعد
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);
  const selectedAnswer = answers[currentQuestion.id] ?? '';
  const allAnswered = questions.every((q) => !!answers[q.id]);

  return (
    <div className="rounded-2xl border border-primary/20 bg-surface-primary dark:bg-gradient-to-b dark:from-[#101426]/80 dark:to-[#0a0f1e]/60 backdrop-blur-sm overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4 border-b border-border-theme-primary space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Icon name="graduation-cap" className="text-primary" size="sm" />
            </div>
            <div>
              <p className="text-text-primary font-bold text-sm">{quiz.title}</p>
              <p className="text-text-secondary text-xs">درجة النجاح: {quiz.passing_score}%</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* ── Question ── */}
      <div className="p-5 space-y-4">
        <p className="text-white font-semibold leading-relaxed text-sm">
          {currentIndex + 1}. {currentQuestion.text}
        </p>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options.map((opt, oi) => {
            const isSelected = selectedAnswer === opt;
            return (
              <button
                key={oi}
                type="button"
                onClick={() =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: opt }))
                }
                className={`w-full text-right rounded-xl border px-4 py-3 text-sm transition-all ${
                  isSelected
                    ? 'border-primary/60 bg-primary/15 text-white shadow-[0_0_12px_rgba(66,99,235,0.2)]'
                    : 'border-white/10 bg-white/3 text-gray-300 hover:border-white/25 hover:bg-white/5'
                }`}
              >
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-xs ml-2 ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-white/20 text-gray-500'
                }`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-1">
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-all"
            >
              <Icon name="arrow-right" size="sm" /> السابق
            </button>
          )}

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => i + 1)}
              disabled={!selectedAnswer}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              التالي <Icon name="arrow-left" size="sm" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !allAnswered}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all shadow-[0_0_20px_rgba(66,99,235,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  جاري التسليم…
                </>
              ) : (
                <>
                  <Icon name="check-circle" size="sm" />
                  تسليم الاختبار
                </>
              )}
            </button>
          )}
        </div>

        {/* Quick-nav dots */}
        {questions.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-primary scale-125'
                    : answers[q.id]
                    ? 'bg-emerald-400/60'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Answer-all reminder */}
        {currentIndex === questions.length - 1 && !allAnswered && (
          <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
            <Icon name="exclamation-circle" size="sm" />
            {questions.filter((q) => !answers[q.id]).length} سؤال لم تجب عنه بعد
          </p>
        )}
      </div>
    </div>
  );
}
