'use client';

/**
 * VideoQuizManager — modern, high-end UI for managing video quizzes.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Icon } from '@/components/ui/Icon';
import { Button, LoadingSpinner, Input } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
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
import { cn } from '@/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  videoId: string;
  role: 'teacher' | 'academy';
  initialQuiz?: VideoQuiz | null;
  onQuizChange?: (quiz: VideoQuiz | null) => void;
}

type ViewMode = 'view' | 'edit' | 'results';

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
    title: 'اختبار قياس الاستيعاب',
    passing_score: 60,
    is_required: true,
    is_active: true,
    questions: [emptyQuestion(0)],
  };
}

// ─── Toggle Component ────────────────────────────────────────────────────────

function ModernToggle({ label, enabled, onChange, color = 'primary' }: { label: string; enabled: boolean; onChange: () => void; color?: 'primary' | 'success' }) {
  return (
    <label className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
      <span className="text-xs font-black text-gray-light/40 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
      <div
        onClick={(e) => { e.preventDefault(); onChange(); }}
        className={cn(
          "w-12 h-6 rounded-full relative transition-all duration-500",
          enabled 
            ? (color === 'primary' ? 'bg-primary shadow-[0_0_15px_rgba(66,99,235,0.4)]' : 'bg-success shadow-[0_0_15px_rgba(52,211,153,0.4)]') 
            : 'bg-white/10'
        )}
      >
        <div className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500",
          enabled ? "right-1" : "left-1"
        )} />
      </div>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VideoQuizManager({ videoId, role, initialQuiz, onQuizChange }: Props) {
  const [quiz, setQuiz] = useState<VideoQuiz | null>(initialQuiz ?? null);
  const [mode, setMode] = useState<ViewMode>('view');
  const [form, setForm] = useState<VideoQuizForm>(emptyForm());
  const [results, setResults] = useState<VideoQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);

  const api = {
    getQuiz: role === 'teacher' ? getTeacherVideoQuiz : getAcademyVideoQuiz,
    saveQuiz: role === 'teacher' ? saveTeacherVideoQuiz : saveAcademyVideoQuiz,
    updateQuiz: role === 'teacher' ? updateTeacherVideoQuiz : updateAcademyVideoQuiz,
    deleteQuiz: role === 'teacher' ? deleteTeacherVideoQuiz : deleteAcademyVideoQuiz,
    getResults: role === 'teacher' ? getTeacherVideoQuizResults : getAcademyVideoQuizResults,
  };

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const q = await api.getQuiz(videoId);
      setQuiz(q);
      onQuizChange?.(q);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [videoId, role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

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

  const openResults = async () => {
    setLoadingResults(true);
    setMode('results');
    try {
      const r = await api.getResults(videoId);
      setResults(r);
    } catch {
      toast.error('فشل تحميل نتائج الطلاب');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('يرجى إدخال عنوان للاختبار'); return; }
    if (form.questions.length === 0) { toast.error('يرجى إضافة سؤال واحد على الأقل'); return; }

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.text.trim()) { toast.error(`نص السؤال رقم ${i + 1} فارغ`); return; }
      const filledOptions = q.options.filter((o) => o.trim());
      if (filledOptions.length < 2) { toast.error(`السؤال رقم ${i + 1} يحتاج لخيارين على الأقل`); return; }
      if (!q.correct_answer) { toast.error(`يرجى تحديد الإجابة الصحيحة للسؤال رقم ${i + 1}`); return; }
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
      toast.success(quiz ? 'تم تحديث الاختبار بنجاح' : 'تم إنشاء الاختبار بنجاح');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل في حفظ الاختبار');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteQuiz(videoId);
      setQuiz(null);
      onQuizChange?.(null);
      setConfirmDelete(false);
      setMode('view');
      toast.success('تم حذف الاختبار نهائياً');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل في حذف الاختبار');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4 text-gray-light/20">
        <LoadingSpinner size="md" color="primary" />
        <span className="text-[10px] font-black uppercase tracking-widest">جاري تحميل البيانات...</span>
      </div>
    );
  }

  // ══ RESULTS VIEW ═══════════════════════════════════════════════════════════

  if (mode === 'results') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-white flex items-center gap-3">
            <Icon name="chart-bar" className="text-secondary" />
            <span>سجل نتائج الطلاب</span>
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setMode('view')} className="text-gray-light/40 hover:text-white">
            <Icon name="arrow-right" /> رجوع
          </Button>
        </div>

        {loadingResults ? (
          <div className="py-12 flex justify-center"><LoadingSpinner size="md" /></div>
        ) : results.length === 0 ? (
          <div className="rounded-[2rem] premium-glass premium-border p-12 text-center opacity-40">
            <Icon name="poll-h" className="text-4xl mb-4" />
            <p className="text-sm font-bold">لا توجد محاولات مسجلة بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-premium">
            {results.map((attempt) => (
              <div key={attempt.id} className="rounded-2xl premium-glass premium-border p-5 flex items-center gap-4 group hover:border-primary/30 transition-all">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-lg",
                  attempt.status === 'passed' ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                )}>
                  <Icon name={attempt.status === 'passed' ? 'check-circle' : 'times-circle'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-black text-white">{attempt.correct_count}/{attempt.total_count} إجابة</span>
                    <span className={cn("text-lg font-black", attempt.status === 'passed' ? "text-success" : "text-danger")}>{attempt.percentage}%</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-light/20 tracking-widest uppercase">
                    {new Date(attempt.completed_at).toLocaleString('ar-EG')}
                  </p>
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
      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl">
              <Icon name={quiz ? 'edit' : 'plus'} />
            </div>
            <h3 className="text-xl font-black text-white">{quiz ? 'تعديل الاختبار الحالي' : 'تصميم اختبار جديد'}</h3>
          </div>
          <Button variant="ghost" onClick={() => setMode('view')} className="text-red-400 hover:bg-red-500/10">
            <Icon name="times" /> إلغاء
          </Button>
        </div>

        {/* Basic Settings Card */}
        <div className="p-6 md:p-8 rounded-[2rem] premium-glass premium-border space-y-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-light/40 uppercase tracking-[0.2em] px-1">عنوان الاختبار الرئيسي</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: مراجعة الوحدة الأولى"
              className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-light/40 uppercase tracking-[0.2em] px-1">درجة النجاح (%)</label>
              <Input
                type="number"
                value={form.passing_score}
                onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
                className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold text-center"
              />
            </div>
            <div className="md:pt-6">
              <ModernToggle label="إلزامي للمشاهدة" enabled={form.is_required} onChange={() => setForm({ ...form, is_required: !form.is_required })} />
            </div>
            <div className="md:pt-6">
              <ModernToggle label="تفعيل الآن" enabled={form.is_active} onChange={() => setForm({ ...form, is_active: !form.is_active })} color="success" />
            </div>
          </div>
        </div>

        {/* Questions Studio */}
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-gray-light/40 uppercase tracking-[0.2em] px-1">استوديو الأسئلة ({form.questions.length})</h4>
          
          {form.questions.map((q, qi) => (
            <article key={qi} className="p-6 md:p-8 rounded-[2.5rem] premium-glass premium-border relative group">
              <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-primary/20 border border-primary/40 backdrop-blur-xl flex items-center justify-center text-primary font-black shadow-2xl">
                {qi + 1}
              </div>
              
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">نص السؤال</label>
                  <Input
                    value={q.text}
                    onChange={(e) => {
                      const qs = [...form.questions];
                      qs[qi] = { ...qs[qi], text: e.target.value };
                      setForm({ ...form, questions: qs });
                    }}
                    placeholder="اكتب سؤالك هنا..."
                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold"
                  />
                </div>
                {form.questions.length > 1 && (
                  <button
                    onClick={() => {
                      const qs = form.questions.filter((_, i) => i !== qi);
                      setForm({ ...form, questions: qs });
                    }}
                    className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center mt-6"
                  >
                    <Icon name="trash" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">الخيارات المتاحة (حدد الصحيح بالنقر على الدائرة)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-3 group/opt">
                      <button
                        onClick={() => {
                          if (!opt.trim()) return;
                          const qs = [...form.questions];
                          qs[qi] = { ...qs[qi], correct_answer: opt };
                          setForm({ ...form, questions: qs });
                        }}
                        className={cn(
                          "w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all",
                          q.correct_answer === opt && opt.trim()
                            ? "bg-success border-success text-white shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                            : "bg-white/5 border-white/10 text-gray-light/20 hover:border-primary/50"
                        )}
                      >
                        <Icon name={q.correct_answer === opt && opt.trim() ? 'check' : 'circle'} size="sm" />
                      </button>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const qs = [...form.questions];
                          const newOpts = [...qs[qi].options];
                          const oldVal = newOpts[oi];
                          newOpts[oi] = e.target.value;
                          const wasCorrect = qs[qi].correct_answer === oldVal;
                          qs[qi] = { ...qs[qi], options: newOpts, correct_answer: wasCorrect ? e.target.value : qs[qi].correct_answer };
                          setForm({ ...form, questions: qs });
                        }}
                        placeholder={`الخيار ${oi + 1}`}
                        className={cn(
                          "h-12 bg-white/2 border-white/5 rounded-xl text-xs font-bold transition-all",
                          q.correct_answer === opt && opt.trim() ? "border-success/40 text-success" : "focus:border-primary"
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}

          <Button
            variant="outline"
            onClick={() => setForm({ ...form, questions: [...form.questions, emptyQuestion(form.questions.length)] })}
            className="w-full h-16 rounded-[2rem] border-dashed border-primary/40 text-primary hover:bg-primary/5 font-black text-sm uppercase tracking-[0.2em]"
          >
            <Icon name="plus" /> إضافة سؤال جديد
          </Button>
        </div>

        {/* Actions Bar */}
        <div className="flex gap-4 pt-8 border-t border-white/5">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-16 rounded-[1.5rem] bg-primary text-white font-black uppercase tracking-widest shadow-2xl"
          >
            {saving ? <LoadingSpinner /> : <><Icon name="save" /> <span>حفظ الاختبار والتفعيل</span></>}
          </Button>
          <Button
            onClick={() => setMode('view')}
            variant="ghost"
            className="px-8 h-16 rounded-[1.5rem] text-gray-light/40 font-bold"
          >
            إلغاء
          </Button>
        </div>
      </div>
    );
  }

  // ══ VIEW MODE (default) ══════════════════════════════════════════════════════

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {!quiz ? (
        <div className="rounded-[3rem] premium-glass premium-border p-12 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl mb-6 shadow-2xl">
              <Icon name="graduation-cap" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">لا يوجد اختبار مرتبط</h3>
            <p className="text-gray-light/40 font-medium mb-8 max-w-sm">أضف اختباراً تقييمياً لقياس مدى استيعاب الطلاب للمحتوى التعليمي بشكل فوري.</p>
            <Button onClick={openEdit} className="h-14 px-10 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl">
              <Icon name="plus" /> إنشاء أول اختبار
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Quiz Card */}
          <div className="rounded-[2.5rem] premium-glass premium-border p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-success/10 blur-[80px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl shadow-xl">
                  <Icon name="graduation-cap" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-white leading-tight">{quiz.title}</h3>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <Badge variant="info" size="sm" className="font-black uppercase">{quiz.questions_count} أسئلة</Badge>
                    <Badge variant="success" size="sm" className="font-black uppercase">درجة النجاح: {quiz.passing_score}%</Badge>
                    {quiz.is_required && <Badge variant="warning" size="sm" className="font-black uppercase tracking-tighter">إلزامي</Badge>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                <Button onClick={openResults} variant="ghost" className="flex-1 md:flex-none h-12 px-5 rounded-xl bg-white/5 text-gray-light border border-white/5">
                  <Icon name="chart-bar" /> <span>النتائج</span>
                </Button>
                <Button onClick={openEdit} variant="ghost" className="flex-1 md:flex-none h-12 px-5 rounded-xl bg-primary/10 text-primary border border-primary/10">
                  <Icon name="edit" /> <span>تعديل</span>
                </Button>
                <Button onClick={() => setConfirmDelete(true)} variant="ghost" className="flex-1 md:flex-none h-12 px-5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/10">
                  <Icon name="trash" />
                </Button>
              </div>
            </div>

            {/* Questions Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
              {quiz.questions?.map((q, i) => (
                <div key={q.id} className="p-5 rounded-2xl bg-white/3 border border-white/5 hover:border-primary/20 transition-all group">
                  <p className="text-xs font-black text-white flex gap-3 mb-4">
                    <span className="text-primary opacity-40 font-mono tracking-tighter">#{i+1}</span>
                    <span className="line-clamp-2 leading-relaxed">{q.text}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {q.options.slice(0, 4).map((opt, oi) => (
                      <div key={oi} className={cn(
                        "px-3 py-2 rounded-lg text-[10px] font-bold truncate border transition-all",
                        opt === q.correct_answer 
                          ? "bg-success/10 border-success/30 text-success" 
                          : "bg-white/2 border-white/5 text-gray-light/20"
                      )}>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full rounded-[2.5rem] premium-glass premium-border p-8 md:p-10 space-y-8 shadow-[0_0_100px_rgba(239,68,68,0.15)] text-center">
            <div className="w-20 h-20 rounded-[1.5rem] bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 text-4xl mx-auto shadow-2xl">
              <Icon name="exclamation-triangle" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">حذف الاختبار التعليمي؟</h3>
              <p className="text-gray-light/40 font-medium">سيتم مسح الاختبار وجميع نتائج محاولات الطلاب المرتبطة به نهائياً من قاعدة البيانات.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Button onClick={handleDelete} disabled={deleting} className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest shadow-xl">
                {deleting ? <LoadingSpinner /> : 'نعم، حذف نهائي'}
              </Button>
              <Button onClick={() => setConfirmDelete(false)} disabled={deleting} variant="ghost" className="flex-1 h-14 rounded-2xl text-gray-light font-bold">إلغاء</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
