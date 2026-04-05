'use client';

import React from 'react';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import type { VideoItem, VideoStudentActivityDetail } from '@/types/video.types';

interface VideoStudentActivityDetailsProps {
  video: VideoItem;
  defaultCollapsed?: boolean;
}

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0%';
  return `${Math.round(value)}%`;
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `${m}:${String(s).padStart(2, '0')}`;
}

function watchStatusLabel(status?: string): string {
  switch (status) {
    case 'completed':
      return 'مكتمل';
    case 'in_progress':
      return 'قيد المشاهدة';
    case 'started':
      return 'بدأ المشاهدة';
    case 'watched_pending_quiz':
      return 'أنهى المشاهدة وينتظر الاختبار';
    default:
      return 'لم يبدأ';
  }
}

function quizStatusLabel(detail: VideoStudentActivityDetail): string {
  if (!detail.quiz?.attempted) return 'لم يحل الاختبار بعد';
  return detail.quiz?.best_status === 'passed' ? 'ناجح' : 'لم ينجح بعد';
}

function watchStatusVariant(status?: string): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25';
    case 'in_progress':
    case 'started':
      return 'bg-primary/10 text-primary border-primary/25';
    case 'watched_pending_quiz':
      return 'bg-amber-400/10 text-amber-300 border-amber-400/25';
    default:
      return 'bg-white/5 text-gray-300 border-white/10';
  }
}

function quizStatusVariant(detail: VideoStudentActivityDetail): string {
  if (!detail.quiz?.attempted) {
    return 'bg-white/5 text-gray-300 border-white/10';
  }

  return detail.quiz?.best_status === 'passed'
    ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25'
    : 'bg-rose-400/10 text-rose-300 border-rose-400/25';
}

export function VideoStudentActivityDetails({ video, defaultCollapsed = true }: VideoStudentActivityDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const details = video.student_activity_details ?? [];
  const summary = video.student_activity_summary;
  const totalInReport = summary?.target_students_count ?? details.length;

  const attendedCount = summary?.attended_students_count
    ?? details.filter((row) => (row.watch?.watched_percentage ?? 0) > 0).length;

  const attemptedCount = summary?.quiz_attempted_students_count
    ?? details.filter((row) => row.quiz?.attempted).length;

  const attemptsCount = summary?.quiz_attempts_count
    ?? details.reduce((acc, row) => acc + (row.quiz?.attempts_count ?? 0), 0);

  const passedCount = summary?.quiz_passed_students_count
    ?? details.filter((row) => row.quiz?.best_status === 'passed').length;

  const averageWatch = details.length > 0
    ? details.reduce((acc, row) => acc + (row.watch?.watched_percentage ?? 0), 0) / details.length
    : 0;

  const completionRate = totalInReport > 0
    ? Math.round((passedCount / totalInReport) * 100)
    : 0;

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0f162d]/55 p-4 sm:p-5 space-y-4">
      <div className="rounded-xl border border-white/10 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-white font-bold flex items-center gap-2 text-base sm:text-lg">
              <Icon name="users" className="text-primary" />
              تفاصيل حضور وتفاعل الطلاب
            </h3>
            <p className="text-xs sm:text-sm text-gray-300">
              إجمالي الطلاب في التقرير: <span className="text-white font-semibold">{totalInReport}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="px-3 py-1.5 rounded-lg border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-all flex items-center gap-1.5"
          >
            <Icon name={isExpanded ? 'eye-slash' : 'eye'} size="sm" />
            {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
            <MetricBox title="حضروا المحاضرة" value={String(attendedCount)} />
            <MetricBox title="حلّوا الاختبار" value={String(attemptedCount)} />
            <MetricBox title="إجمالي المحاولات" value={String(attemptsCount)} />
            <MetricBox title="الناجحين" value={String(passedCount)} />
            <MetricBox title="متوسط الحضور" value={formatPercent(averageWatch)} />
            <MetricBox title="معدل الإنجاز" value={formatPercent(completionRate)} />
          </div>

          {details.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-gray-300 text-center">
              لا توجد بيانات حضور/اختبار مسجلة للطلاب في هذا الفيديو حتى الآن.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
              {details.map((student, index) => {
                const watchedPct = student.watch?.watched_percentage ?? 0;
                const bestPct = student.quiz?.best_percentage ?? 0;
                const latestPct = student.quiz?.latest_percentage ?? 0;
                const attempts = student.quiz?.attempts_count ?? 0;

                return (
                  <article
                    key={student.student_id}
                    className="rounded-xl border border-white/10 bg-[#0b1227]/70 p-3.5 space-y-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-primary/20 text-primary text-[11px] flex items-center justify-center font-semibold shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{student.student_name}</h4>
                          <p className="text-[11px] text-gray-500">#{student.student_id.slice(0, 8)}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          حضور {formatPercent(watchedPct)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border ${watchStatusVariant(student.watch?.status)}`}>
                          {watchStatusLabel(student.watch?.status)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border ${quizStatusVariant(student)}`}>
                          {quizStatusLabel(student)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>التقدم في المشاهدة</span>
                        <span>زمن المشاهدة: {formatDuration(student.watch?.watched_seconds ?? 0)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-emerald-400/70"
                          style={{ width: `${Math.min(100, Math.max(0, watchedPct))}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                      <DataPill label="عدد المحاولات" value={String(attempts)} />
                      <DataPill label="أفضل نتيجة" value={student.quiz?.attempted ? formatPercent(bestPct) : '—'} />
                      <DataPill label="آخر نتيجة" value={student.quiz?.attempted ? formatPercent(latestPct) : '—'} />
                      <DataPill
                        label="آخر محاولة"
                        value={student.quiz?.last_attempt_at ? new Date(student.quiz.last_attempt_at).toLocaleDateString('ar-EG') : '—'}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MetricBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2.5 text-center">
      <div className="text-[11px] text-gray-400">{title}</div>
      <div className="text-base font-bold text-white mt-0.5">{value}</div>
    </div>
  );
}

function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
      <div className="text-gray-500">{label}</div>
      <div className="text-gray-200 font-medium mt-0.5">{value}</div>
    </div>
  );
}
