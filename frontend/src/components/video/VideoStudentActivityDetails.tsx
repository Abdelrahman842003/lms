'use client';

import React from 'react';
import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import type { VideoItem, VideoStudentActivityDetail } from '@/types/video.types';
import { cn } from '@/utils';

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
      return 'أنهى المشاهدة';
    default:
      return 'لم يبدأ';
  }
}

function quizStatusLabel(detail: VideoStudentActivityDetail): string {
  if (!detail.quiz?.attempted) return 'لم يحل الاختبار';
  return detail.quiz?.best_status === 'passed' ? 'ناجح' : 'لم ينجح';
}

function watchStatusVariant(status?: string): string {
  switch (status) {
    case 'completed':
      return 'bg-success/10 text-success border-success/20';
    case 'in_progress':
    case 'started':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'watched_pending_quiz':
      return 'bg-info/10 text-info border-info/20';
    default:
      return 'bg-white/5 text-gray-light/40 border-white/5';
  }
}

function quizStatusVariant(detail: VideoStudentActivityDetail): string {
  if (!detail.quiz?.attempted) {
    return 'bg-white/5 text-gray-light/40 border-white/5';
  }

  return detail.quiz?.best_status === 'passed'
    ? 'bg-success/10 text-success border-success/20'
    : 'bg-danger/10 text-danger border-danger/20';
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
    <section className="space-y-6 animate-in fade-in duration-700">
      
      {/* Summary Header Card */}
      <div className="rounded-[2rem] premium-glass premium-border p-6 md:p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl shadow-xl">
              <Icon name="users" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">تحليلات الحضور والتفاعل</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-light/40 uppercase tracking-widest">إجمالي الطلاب:</span>
                <Badge variant="info" size="sm" className="font-black">{totalInReport}</Badge>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "h-12 px-6 rounded-xl border font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2",
              isExpanded 
                ? "bg-white/5 border-white/10 text-white hover:bg-white/10" 
                : "bg-primary border-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40"
            )}
          >
            <Icon name={isExpanded ? 'eye-slash' : 'eye'} size="sm" />
            <span>{isExpanded ? 'إخفاء التقارير' : 'تحليل البيانات'}</span>
          </button>
        </div>

        {/* Global Metrics Row (Inside Header when collapsed, or always visible?) */}
        {isExpanded && (
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mt-8 animate-in slide-in-from-top-4 duration-500">
            <MetricBox title="حضروا" value={String(attendedCount)} icon="play" color="primary" />
            <MetricBox title="حلوا الاختبار" value={String(attemptedCount)} icon="edit" color="secondary" />
            <MetricBox title="المحاولات" value={String(attemptsCount)} icon="sync" color="info" />
            <MetricBox title="الناجحين" value={String(passedCount)} icon="check-circle" color="success" />
            <MetricBox title="متوسط المشاهدة" value={formatPercent(averageWatch)} icon="clock" color="warning" />
            <MetricBox title="معدل الإنجاز" value={formatPercent(completionRate)} icon="chart-bar" color="primary" />
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {details.length === 0 ? (
            <div className="rounded-[2rem] premium-glass premium-border p-12 text-center text-gray-light/20 italic">
              <Icon name="search" className="text-4xl mb-4 opacity-10" />
              <p>لا توجد بيانات مسجلة للطلاب حتى اللحظة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-premium">
              {details.map((student, index) => {
                const watchedPct = student.watch?.watched_percentage ?? 0;
                const bestPct = student.quiz?.best_percentage ?? 0;
                const latestPct = student.quiz?.latest_percentage ?? 0;
                const attempts = student.quiz?.attempts_count ?? 0;

                return (
                  <article
                    key={student.student_id}
                    className="rounded-[1.5rem] premium-glass premium-border p-5 space-y-4 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Student Info & Status Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-gray-light/60">
                          {index + 1}
                        </div>
                        <div className="flex flex-col">
                          <h4 className="text-sm font-black text-white truncate max-w-[150px]">{student.student_name}</h4>
                          <span className="text-[10px] font-bold text-gray-light/20 tracking-widest uppercase">ID: {student.student_id.slice(0, 8)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <Badge variant={watchedPct >= 80 ? 'success' : 'info'} size="xs" className="font-black text-[9px]">{formatPercent(watchedPct)}</Badge>
                        <span className={cn("px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", watchStatusVariant(student.watch?.status))}>
                          {watchStatusLabel(student.watch?.status)}
                        </span>
                        <span className={cn("px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest", quizStatusVariant(student))}>
                          {quizStatusLabel(student)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Visualizer */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-light/40">
                        <span>التقدم الفعلي</span>
                        <span className="text-white">{formatDuration(student.watch?.watched_seconds ?? 0)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-success shadow-[0_0_10px_rgba(66,99,235,0.4)] transition-all duration-1000"
                          style={{ width: `${Math.min(100, Math.max(0, watchedPct))}%` }}
                        />
                      </div>
                    </div>

                    {/* Quiz Data Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      <DataPill label="المحاولات" value={String(attempts)} icon="sync" />
                      <DataPill label="أفضل نتيجة" value={student.quiz?.attempted ? formatPercent(bestPct) : '—'} icon="star" />
                      <DataPill label="آخر نتيجة" value={student.quiz?.attempted ? formatPercent(latestPct) : '—'} icon="clock" />
                      <DataPill label="آخر محاولة" value={student.quiz?.last_attempt_at ? new Date(student.quiz.last_attempt_at).toLocaleDateString('ar-EG') : '—'} icon="calendar" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MetricBox({ title, value, icon, color = 'primary' }: { title: string; value: string; icon: string; color?: string }) {
  const colors: Record<string, string> = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    secondary: 'text-secondary bg-secondary/10 border-secondary/20',
    info: 'text-info bg-info/10 border-info/20',
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col items-center justify-center gap-2 transition-all hover:bg-white/10 group">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-lg transition-transform group-hover:scale-110", colors[color])}>
        <Icon name={icon} />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-light/40">{title}</span>
        <span className="text-lg font-black text-white mt-1">{value}</span>
      </div>
    </div>
  );
}

function DataPill({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/2 p-2.5 flex items-center gap-2 hover:bg-white/5 transition-all">
      <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-primary/40 text-[10px]">
        <Icon name={icon} />
      </div>
      <div className="flex flex-col overflow-hidden">
        <span className="text-[8px] font-black uppercase tracking-widest text-gray-light/20 truncate">{label}</span>
        <span className="text-[11px] font-black text-white/90 truncate">{value}</span>
      </div>
    </div>
  );
}
