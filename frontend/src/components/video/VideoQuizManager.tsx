'use client';

/**
 * VideoQuizManager
 * ─────────────────────────────────────────────────────────────────────────────
 * Teacher / Academy component for managing a video's quiz.
 *
 * Features:
 *  • View existing quiz (title, questions, passing score, active/required flags)
 *  • Create / Edit quiz inline (add/remove questions, 4 options each, mark correct)
 *  • Delete quiz with confirmation
 *  • View student attempt results
 *
 * Props:
 *  videoId    — the video UUID
 *  role       — 'teacher' | 'academy'  (selects the correct API set)
 *  initialQuiz — quiz data already loaded by the parent (or null)
 *  onQuizChange — callback so the parent can refresh its VideoItem state
 */

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Icon } from '@/components/ui/Icon';
import {
  getTeacherVideoQuiz,
  saveTeacherVideoQuiz,
  updateTeacherVideoQuiz,
  deleteTeacherVideoQuiz,
  getTeacherVideoQuizResults,
  getAcademyVideoQuiz,
  saveAcademyVideoQuiz,
  updateAcademyVideoQuiz,
  deleteAcademyVideoQuiz,
  getAcademyVideoQuizResults,
} from '@/services/videoService';
import type {
  VideoQuiz,
  VideoQuizAttempt,
  VideoQuizForm,
  VideoQuizQuestionForm,
} from '@/types/video.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  videoId: string;
  role: 'teacher' | 'academy';
  initialQuiz?: VideoQuiz | null;
  onQuizChange?: (quiz: VideoQuiz | null) => void;
}

type ViewMode = 'view' | 'edit' | 'results';

// ─── Empty builders ───────────────────────────────────────────────────────────

function emptyQuestion(index: number): VideoQuizQuestionForm {
  return {
    text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    sort_order: index + 1,
  };
}

function emptyForm(): VideoQuizForm {
  return {
    title: 'اختبار الفيديو',
    passing_score: 60,
    is_required: true,
    is_active: true,
    questions: [emptyQuestion(0)],
  };
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function QuestionBadge({ status }: { status: 'passed' | 'failed' }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        status === 'passed'
          ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/25'
          : 'bg-red-400/15 text-red-400 border border-red-400/25'
      }`}
    >
      {status === 'passed' ? 'نجح' : 'رسب'}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VideoQuizManager({ videoId, role, initialQuiz, onQuizChange }: Props) {
  const [quiz, setQuiz] = useState<VideoQuiz | null>(initialQuiz ?? null);
  const [mode, setMode] = useState<ViewMode>('view');
  const [form, setForm] = useState<VideoQuizForm>(emptyForm());
  const [results, setResults] = useState<VideoQuizAttempt[]>([]);
  // Always fetch on mount so we get questions too (initialQuiz from VideoItem may lack questions)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  // ── API helpers ─────────────────────────────────────────────────────────────

  const api = {
    getQuiz: role === 'teacher' ? getTeacherVideoQuiz : getAcademyVideoQuiz,
    saveQuiz: role === 'teacher' ? saveTeacherVideoQuiz : saveAcademyVideoQuiz,
    updateQuiz: role === 'teacher' ? updateTeacherVideoQuiz : updateAcademyVideoQuiz,
    deleteQuiz: role === 'teacher' ? deleteTeacherVideoQuiz : deleteAcademyVideoQuiz,
    getResults: role === 'teacher' ? getTeacherVideoQuizResults : getAcademyVideoQuizResults,
  };

  // ── Load quiz if not passed as prop ─────────────────────────────────────────

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const q = await api.getQuiz(videoId);
      setQuiz(q);
      onQuizChange?.(q);
    } catch {
      // silently ignore — quiz may not exist yet
    } finally {
      setLoading(false);
    }
  }, [videoId, role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  // ── Open edit mode (pre-fill form from existing quiz) ────────────────────────

  const openEdit = () => {
    if (quiz) {
      setForm({
        title: quiz.title,
        passing_score: quiz.passing_score,
        is_required: quiz.is_required,
        is_active: quiz.is_active,
        questions: (quiz.questions ?? []).map((q, i) => ({
          text: q.text,
          options: q.options.length === 4 ? q.options : [...q.options, ...Array(4 - q.options.length).fill('')],
          correct_answer: q.correct_answer ?? '',
          sort_order: q.sort_order ?? i + 1,
        })),
      });
    } else {
      setForm(emptyForm());
    }
    setMode('edit');
  };

  // ── Load results ─────────────────────────────────────────────────────────────

  const openResults = async () => {
    setLoadingResults(true);
    setMode('results');
    try {
      const r = await api.getResults(videoId);
      setResults(r);
    } catch {
      toast.error('فشل تحميل النتائج');
    } finally {
      setLoadingResults(false);
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    // Basic validation
    if (!form.title.trim()) { toast.error('يرجى إدخال عنوان الاختبار'); return; }
    if (form.questions.length === 0) { toast.error('أضف سؤالاً واحداً على الأقل'); return; }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) { toast.error(`نص السؤال ${i + 1} فارغ`); return; }
      const filledOptions = q.options.filter((o) => o.trim());
      if (filledOptions.length < 2) { toast.error(`السؤال ${i + 1} يحتاج خيارين على الأقل`); return; }
      if (!q.correct_answer) { toast.error(`حدد الإجابة الصحيحة للسؤال ${i + 1}`); return; }
      if (!q.options.includes(q.correct_answer)) { toast.error(`الإجابة الصحيحة للسؤال ${i + 1} يجب أن تكون أحد الخيارات`); return; }
    }

    setSaving(true);
    try {
      const payload: VideoQuizForm = {
        ...form,
        questions: form.questions.map((q, i) => ({
          ...q,
          options: q.options.filter((o) => o.trim()),
          sort_order: i + 1,
        })),
      };

      const saved = quiz
        ? await api.updateQuiz(videoId, payload)
        : await api.saveQuiz(videoId, payload);

      setQuiz(saved);
      onQuizChange?.(saved);
      setMode('view');
      toast.success(quiz ? 'تم تحديث الاختبار' : 'تم إنشاء الاختبار');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل حفظ الاختبار');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteQuiz(videoId);
      setQuiz(null);
      onQuizChange?.(null);
      setConfirmDelete(false);
      setMode('view');
      toast.success('تم حذف الاختبار');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل حذف الاختبار');
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-8 flex items-center justify-center gap-3 text-gray-400">
        <div className="w-5 h-5 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <span className="text-sm">جاري التحميل…</span>
      </div>
    );
  }

  // ══ RESULTS VIEW ═══════════════════════════════════════════════════════════

  if (mode === 'results') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2 text-sm">
            <Icon name="chart-bar" className="text-primary" size="sm" />
            نتائج الطلاب
          </h3>
          <button
            type="button"
            onClick={() => setMode('view')}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Icon name="arrow-right" size="sm" /> رجوع
          </button>
        </div>

        {loadingResults ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-8 text-center text-gray-500 text-sm">
            <Icon name="chart-bar" className="text-3xl opacity-30 mb-2" />
            <p>لا توجد محاولات حتى الآن</p>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-4"
              >
                <QuestionBadge status={attempt.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-medium">{attempt.correct_count}/{attempt.total_count}</span>
                    <span className="text-gray-500">إجابة صحيحة</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {new Date(attempt.completed_at).toLocaleDateString('ar-EG', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
                <div className={`text-lg font-bold ${attempt.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {attempt.percentage}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ══ EDIT VIEW ═══════════════════════════════════════════════════════════════

  if (mode === 'edit') {
    return (
      <div className="space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2 text-sm">
            <Icon name={quiz ? 'edit' : 'plus-circle'} className="text-primary" size="sm" />
            {quiz ? 'تعديل الاختبار' : 'إنشاء اختبار جديد'}
          </h3>
          <button
            type="button"
            onClick={() => setMode('view')}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Icon name="times" size="sm" /> إلغاء
          </button>
        </div>

        {/* ── Basic settings ── */}
        <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">عنوان الاختبار</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="اختبار الفيديو"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Passing score */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">درجة النجاح (%)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.passing_score}
                onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Is required */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    form.is_required ? 'bg-primary' : 'bg-white/10'
                  }`}
                  onClick={() => setForm({ ...form, is_required: !form.is_required })}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      form.is_required ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-300 group-hover:text-white">إلزامي للإتمام</span>
              </label>
            </div>

            {/* Is active */}
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    form.is_active ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                      form.is_active ? 'right-0.5' : 'left-0.5'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-300 group-hover:text-white">مفعّل</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Questions ── */}
        <div className="space-y-4">
          {form.questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-2xl border border-white/10 bg-[#101426]/40 p-5 space-y-4"
            >
              {/* Question header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">السؤال {qi + 1}</span>
                {form.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const qs = form.questions.filter((_, i) => i !== qi);
                      setForm({ ...form, questions: qs });
                    }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <Icon name="trash" size="sm" /> حذف
                  </button>
                )}
              </div>

              {/* Question text */}
              <input
                type="text"
                value={q.text}
                onChange={(e) => {
                  const qs = [...form.questions];
                  qs[qi] = { ...qs[qi], text: e.target.value };
                  setForm({ ...form, questions: qs });
                }}
                placeholder="نص السؤال"
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-gray-600"
              />

              {/* Options */}
              <div className="space-y-2">
                <p className="text-xs text-gray-500">الخيارات (اختر الإجابة الصحيحة بالنقر على ✓)</p>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    {/* Correct answer radio */}
                    <button
                      type="button"
                      title="تعيين كإجابة صحيحة"
                      onClick={() => {
                        if (!opt.trim()) return;
                        const qs = [...form.questions];
                        qs[qi] = { ...qs[qi], correct_answer: opt };
                        setForm({ ...form, questions: qs });
                      }}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        q.correct_answer === opt && opt.trim()
                          ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400'
                          : 'border-white/20 text-gray-600 hover:border-white/40'
                      }`}
                    >
                      <Icon name={q.correct_answer === opt && opt.trim() ? 'check' : 'circle'} size="sm" />
                    </button>

                    {/* Option text input */}
                    <input
                      type="text"
                      value={opt}
                      placeholder={`الخيار ${oi + 1}`}
                      onChange={(e) => {
                        const qs = [...form.questions];
                        const newOptions = [...qs[qi].options];
                        const oldOpt = newOptions[oi];
                        newOptions[oi] = e.target.value;
                        // if this was the correct answer, update it
                        const wasCorrect = qs[qi].correct_answer === oldOpt;
                        qs[qi] = {
                          ...qs[qi],
                          options: newOptions,
                          correct_answer: wasCorrect ? e.target.value : qs[qi].correct_answer,
                        };
                        setForm({ ...form, questions: qs });
                      }}
                      className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-gray-600"
                    />
                  </div>
                ))}
              </div>

              {/* Show correct answer hint */}
              {q.correct_answer && (
                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/8 border border-emerald-400/15 rounded-lg px-3 py-2">
                  <Icon name="check-circle" size="sm" />
                  الإجابة الصحيحة: {q.correct_answer}
                </div>
              )}
            </div>
          ))}

          {/* Add question button */}
          <button
            type="button"
            onClick={() => setForm({ ...form, questions: [...form.questions, emptyQuestion(form.questions.length)] })}
            className="w-full rounded-2xl border border-dashed border-white/20 hover:border-primary/40 bg-white/3 hover:bg-primary/5 text-gray-400 hover:text-primary py-3 text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Icon name="plus" size="sm" />
            إضافة سؤال
          </button>
        </div>

        {/* ── Save / Cancel ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                جاري الحفظ…
              </>
            ) : (
              <>
                <Icon name="save" size="sm" />
                حفظ الاختبار
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMode('view')}
            disabled={saving}
            className="px-5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm transition-all disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  // ══ VIEW MODE (default) ══════════════════════════════════════════════════════

  return (
    <div className="space-y-4">

      {/* ── No quiz yet ── */}
      {!quiz && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#101426]/30 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <Icon name="question-circle" className="text-primary text-2xl" />
          </div>
          <div>
            <p className="text-white font-semibold">لا يوجد اختبار لهذا الفيديو</p>
            <p className="text-gray-500 text-sm mt-1">أضف اختباراً لتشجيع الطلاب على المتابعة وكسب النقاط</p>
          </div>
          <button
            type="button"
            onClick={openEdit}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(66,99,235,0.3)]"
          >
            <Icon name="plus-circle" size="sm" />
            إنشاء اختبار
          </button>
        </div>
      )}

      {/* ── Quiz exists ── */}
      {quiz && (
        <>
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold flex items-center gap-2 text-sm">
              <Icon name="graduation-cap" className="text-primary" size="sm" />
              {quiz.title}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void openResults()}
                className="text-xs text-gray-400 hover:text-primary flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
              >
                <Icon name="chart-bar" size="sm" /> النتائج
              </button>
              <button
                type="button"
                onClick={openEdit}
                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              >
                <Icon name="edit" size="sm" /> تعديل
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-red-400/10"
              >
                <Icon name="trash" size="sm" /> حذف
              </button>
            </div>
          </div>

          {/* Quiz summary */}
          <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-5 space-y-4">
            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                درجة النجاح: {quiz.passing_score}%
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                {quiz.questions_count} سؤال
              </span>
              {quiz.is_required && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                  إلزامي
                </span>
              )}
              {quiz.is_active ? (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  مفعّل
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">
                  معطّل
                </span>
              )}
            </div>

            {/* Question list */}
            {quiz.questions && quiz.questions.length > 0 && (
              <div className="space-y-3">
                {quiz.questions.map((q, i) => (
                  <div key={q.id} className="rounded-xl bg-white/3 border border-white/8 p-4 space-y-2">
                    <p className="text-white text-sm font-medium">{i + 1}. {q.text}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`text-xs px-3 py-1.5 rounded-lg border ${
                            opt === q.correct_answer
                              ? 'bg-emerald-400/10 border-emerald-400/25 text-emerald-400'
                              : 'bg-white/3 border-white/8 text-gray-400'
                          }`}
                        >
                          {opt === q.correct_answer && <Icon name="check" size="sm" className="inline ml-1" />}
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="rounded-2xl border border-red-500/30 bg-[#0f1320] p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Icon name="exclamation-triangle" className="text-red-400" />
              </div>
              <div>
                <p className="text-white font-bold">حذف الاختبار</p>
                <p className="text-gray-400 text-sm mt-0.5">سيتم حذف الاختبار وجميع نتائج الطلاب. لا يمكن التراجع.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold py-2.5 text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Icon name="trash" size="sm" /> نعم، احذف
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-white/10 text-gray-400 hover:text-white py-2.5 text-sm transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
