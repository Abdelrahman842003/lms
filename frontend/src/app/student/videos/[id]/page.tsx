'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  getStudentVideo,
  getVideoComments,
  toggleVideoLike,
} from '@/services/videoService';
import type { VideoAttachment, VideoComment, VideoItem, VideoWatchProgress } from '@/types/video.types';
import { SecureVideoPlayer } from '@/components/video/SecureVideoPlayer';
import { VideoCommentsSection } from '@/components/video/VideoCommentsSection';
import { VideoQuizStudent } from '@/components/video/VideoQuizStudent';
import { PdfViewerModal } from '@/components/shared/PdfViewerModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fileIcon(mime: string): string {
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'file-pdf';
  if (mime.includes('word')) return 'file-word';
  if (mime.includes('sheet') || mime.includes('excel')) return 'file-excel';
  if (mime.includes('zip') || mime.includes('rar')) return 'file-archive';
  return 'file-alt';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Stat chip ────────────────────────────────────────────────────────────────
function Stat({ icon, value, label, glow }: { icon: string; value: string | number; label: string; glow?: string }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border bg-white/5 border-white/10 ${glow ?? ''}`}>
      <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
        <Icon name={icon} className="text-primary" size="xs" />
      </div>
      <span className="text-white font-bold text-lg leading-none">{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentVideoDetailsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  const [video, setVideo]           = useState<VideoItem | null>(null);
  const [progress, setProgress]     = useState<VideoWatchProgress | null>(null);
  const [comments, setComments]     = useState<VideoComment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<'details' | 'comments' | 'files' | 'quiz'>('details');
  const [liked, setLiked]           = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liking, setLiking]         = useState(false);

  // ── PDF viewer state ──────────────────────────────────────────────────────
  const [pdfModal, setPdfModal] = useState<{ open: boolean; url: string; fileName: string; mimeType: string }>({
    open: false, url: '', fileName: '', mimeType: '',
  });

  const openAttachment = useCallback((att: VideoAttachment, videoId: string) => {
    const inlineUrl = `/api/v1/student/videos/${videoId}/attachments/${att.id}?disposition=inline`;
    setPdfModal({ open: true, url: inlineUrl, fileName: att.file_name, mimeType: att.mime_type });
  }, []);

  const loadVideo = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const res = await getStudentVideo(params.id);
      setVideo(res.video);
      setProgress(res.progress);
      setComments(res.comments || []);
      setLiked(!!res.video.liked_by_me);
      setLikesCount(res.video.likes_count ?? 0);
    } catch { /* handled by fetchApi */ }
    finally { setLoading(false); }
  }, [params.id]);

  const reloadComments = useCallback(async () => {
    if (!params.id) return;
    setComments(await getVideoComments(params.id));
  }, [params.id]);

  const handleProgressUpdate = useCallback((updated: VideoWatchProgress) => {
    setProgress(updated);
    // Auto-switch to quiz tab when the video triggers watched_pending_quiz
    if (updated.status === 'watched_pending_quiz') {
      setActiveTab('quiz');
    }
  }, []);

  // Reload just the progress (after quiz pass) without re-fetching everything
  const reloadProgress = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await getStudentVideo(params.id);
      setProgress(res.progress);
      setVideo(res.video);
      // بعد اجتياز الاختبار، انتقل لتاب التفاصيل
      if (res.progress?.quiz_passed_at) {
        setActiveTab('details');
      }
    } catch { /* ignore */ }
  }, [params.id]);

  useEffect(() => { void loadVideo(); }, [loadVideo]);

  const handleLike = async () => {
    if (!video || liking) return;
    setLiking(true);
    try {
      const r = await toggleVideoLike(video.id);
      setLiked(r.liked);
      setLikesCount(r.likes_count);
    } catch { toast.error('تعذر تسجيل الإعجاب'); }
    finally { setLiking(false); }
  };

  const watchedPct = progress?.watched_percentage ?? 0;
  const attachments = video?.attachments ?? [];
  const sortedAttachments = useMemo(() => {
    const priority = (mime: string) => {
      if (mime.startsWith('image/')) return 0;
      if (mime === 'application/pdf') return 1;
      return 2;
    };

    return [...attachments].sort((a, b) => {
      const byType = priority(a.mime_type) - priority(b.mime_type);
      if (byType !== 0) return byType;
      return a.file_name.localeCompare(b.file_name, 'ar');
    });
  }, [attachments]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout role="student" user={user || undefined} title="الفيديو التعليمي">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-gray-400 text-sm">جاري تحميل الفيديو…</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout role="student" user={user || undefined} title="الفيديو التعليمي">
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Icon name="exclamation-triangle" className="text-red-400 text-2xl" />
          </div>
          <p className="text-red-300 font-medium">الفيديو غير متاح حالياً</p>
          <Link href="/student/videos" className="text-sm text-primary hover:underline flex items-center gap-1">
            <Icon name="arrow-right" size="sm" /> العودة للقائمة
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const groups              = video.groups ?? [];
  const hasFiles            = attachments.length > 0;
  const isPendingQuiz       = progress?.status === 'watched_pending_quiz' && !progress?.quiz_passed_at;
  const isCompleted         = progress?.status === 'completed' || !!progress?.quiz_passed_at;
  const hasQuiz             = !!video.quiz;
  const quizAlreadyPassed   = !!progress?.quiz_passed_at;

  // Show quiz tab only when video is fully watched, has an active quiz, and not yet passed
  const showQuizTab = (isPendingQuiz || isCompleted) && hasQuiz && !quizAlreadyPassed;

  const tabs = [
    { id: 'details' as const,  icon: 'info-circle', label: 'التفاصيل' },
    { id: 'comments' as const, icon: 'comments',    label: 'التعليقات', badge: comments.length },
    ...(hasFiles ? [{ id: 'files' as const, icon: 'paperclip', label: 'المرفقات', badge: attachments.length }] : []),
    ...(showQuizTab ? [{
      id: 'quiz' as const,
      icon: 'graduation-cap',
      label: 'التدريب',
      badge: quizAlreadyPassed ? 0 : 1,
      highlight: isPendingQuiz && !quizAlreadyPassed,
    }] : []),
  ];

  return (
    <DashboardLayout role="student" user={user || undefined} title={video.title}>

      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/student/videos" className="hover:text-primary flex items-center gap-1 transition-colors">
          <Icon name="film" size="sm" /> الفيديوهات
        </Link>
        <Icon name="chevron-left" size="sm" className="text-gray-700" />
        <span className="text-gray-300 truncate max-w-[200px]">{video.title}</span>
      </nav>

      {/* ── Main two-column grid (ltr so player stays left in RTL) ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_320px]" dir="ltr">

        {/* ════ LEFT COLUMN ════ */}
        <div dir="rtl" className="space-y-5 min-w-0">

          {/* Player */}
          <SecureVideoPlayer
            videoId={video.id}
            studentName={user?.name || ''}
            studentPhone={user?.phone || ''}
            watermarkEnabled
            watermarkRotationIntervalSeconds={8}
            initialWatchedSeconds={progress?.watched_seconds ?? 0}
            onProgressUpdate={handleProgressUpdate}
          />

          {/* ── Action bar under player ── */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Like button */}
            <button
              type="button"
              disabled={liking}
              onClick={() => void handleLike()}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all
                ${liked
                  ? 'bg-primary/20 border-primary/50 text-primary shadow-[0_0_16px_rgba(66,99,235,0.2)]'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:border-primary/30 hover:text-primary'}`}
            >
              <Icon name="thumbs-up" size="sm" className={liking ? 'animate-pulse' : ''} />
              {liked ? 'أعجبني' : 'إعجاب'}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${liked ? 'bg-primary/20' : 'bg-white/10'}`}>
                {likesCount}
              </span>
            </button>

            {/* Stats chips */}
            <span className="flex items-center gap-1.5 text-gray-500 text-sm">
              <Icon name="comments" size="sm" className="text-primary/60" />
              {video.comments_count ?? comments.length} تعليق
            </span>

            {watchedPct > 0 && (
              <span className={`flex items-center gap-1.5 text-sm font-medium ${
                isCompleted ? 'text-emerald-400'
                : isPendingQuiz ? 'text-amber-400'
                : 'text-primary'
              }`}>
                <Icon name={
                  isCompleted ? 'check-circle'
                  : isPendingQuiz ? 'graduation-cap'
                  : 'play-circle'
                } size="sm" />
                {isCompleted ? 'مكتمل' : isPendingQuiz ? 'يحتاج تدريب' : `${watchedPct}% شاهدت`}
              </span>
            )}

            {/* Grade + Teacher chips */}
            {video.grade && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Icon name="graduation-cap" size="sm" /> {video.grade.name}
              </span>
            )}
            {video.teacher_reference?.name && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10">
                <Icon name="chalkboard-teacher" size="sm" /> {video.teacher_reference.name}
              </span>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="w-full overflow-x-auto scrollbar-none -mx-1 px-1">
            <div className="flex gap-0.5 p-1 rounded-2xl bg-white/5 border border-white/10 w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  title={tab.label}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-1 px-3 sm:px-4 py-2 rounded-xl transition-all flex-1 ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-[0_0_20px_rgba(66,99,235,0.4)]'
                      : 'highlight' in tab && tab.highlight
                      ? 'text-amber-400 hover:text-white bg-amber-400/10 hover:bg-primary/20 border border-amber-400/30 animate-pulse'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon name={tab.icon} size="sm" />
                  <span className="hidden sm:inline text-sm font-medium">{tab.label}</span>
                  {'badge' in tab && tab.badge != null && tab.badge > 0 && (
                    <span className={`text-xs rounded-full px-1 sm:px-1.5 ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab: Details ── */}
          {activeTab === 'details' && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#101426]/80 to-[#0a0f1e]/60 backdrop-blur-sm p-6 space-y-6">
              <div>
                <h1 className="text-xl font-bold text-white leading-snug">{video.title}</h1>
                {video.description
                  ? <p className="text-gray-400 mt-2 leading-relaxed text-sm">{video.description}</p>
                  : <p className="text-gray-600 mt-2 italic text-xs">بدون وصف</p>
                }
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                <Stat icon="clock"     value={formatDuration(video.duration_seconds)} label="المدة" />
                <Stat icon="thumbs-up" value={likesCount}                             label="إعجاب" />
                <Stat icon="comments"  value={video.comments_count ?? 0}              label="تعليق" />
                <Stat icon="paperclip" value={video.attachments_count ?? 0}           label="مرفق" />
                <Stat icon="eye"       value={`${watchedPct}%`}                       label="مشاهدة"
                  glow={watchedPct >= 80 ? 'border-emerald-400/30 shadow-[0_0_12px_rgba(52,211,153,0.15)]' : ''} />
              </div>

              {/* Progress bar */}
              {watchedPct > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">تقدم المشاهدة</span>
                    <span className={watchedPct >= 80 ? 'text-emerald-400 font-semibold' : 'text-primary font-semibold'}>
                      {watchedPct}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        watchedPct >= 80
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                          : 'bg-gradient-to-r from-primary to-blue-400 shadow-[0_0_8px_rgba(66,99,235,0.5)]'
                      }`}
                      style={{ width: `${watchedPct}%` }}
                    />
                  </div>
                  {watchedPct >= 80 && !isPendingQuiz && (
                    <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-400/8 border border-emerald-400/20 rounded-xl p-3">
                      <Icon name="check-circle" size="sm" />
                      أتممت مشاهدة الفيديو — عمل ممتاز! 🎉
                    </div>
                  )}
                  {isPendingQuiz && !quizAlreadyPassed && (
                    <div
                      className="flex items-center gap-2 text-amber-400 text-xs bg-amber-400/8 border border-amber-400/25 rounded-xl p-3 cursor-pointer hover:bg-amber-400/12 transition-colors"
                      onClick={() => setActiveTab('quiz')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setActiveTab('quiz')}
                    >
                      <Icon name="graduation-cap" size="sm" />
                      أتممت المشاهدة! أجب على التدريب لتسجيل الإتمام وكسب النقاط →
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Comments ── */}
          {activeTab === 'comments' && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#101426]/80 to-[#0a0f1e]/60 backdrop-blur-sm p-4">
              <VideoCommentsSection
                videoId={video.id}
                comments={comments}
                canDeleteOwn
                currentUserId={user?.id ? String(user.id) : undefined}
                onRefresh={reloadComments}
              />
            </div>
          )}

          {/* ── Tab: Files ── */}
          {activeTab === 'files' && hasFiles && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#101426]/80 to-[#0a0f1e]/60 backdrop-blur-sm p-5 space-y-3">
              <h2 className="text-white font-bold flex items-center gap-2 text-sm">
                <Icon name="paperclip" className="text-primary" size="sm" />
                المرفقات ({sortedAttachments.length})
              </h2>
              <div className="space-y-2">
                {sortedAttachments.map((att) => {
                  const isPdf = att.mime_type === 'application/pdf';
                  const isImage = att.mime_type.startsWith('image/');

                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-primary/10 hover:border-primary/30 p-3 transition-all"
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Icon name={fileIcon(att.mime_type)} className="text-primary" size="sm" />
                      </div>

                      {/* Name + size */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{att.file_name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{formatBytes(att.file_size)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Open in viewer (PDF & images) */}
                        {(isPdf || isImage) && (
                          <button
                            type="button"
                            onClick={() => openAttachment(att, video.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-medium transition-all disabled:opacity-50"
                            title={isPdf ? 'فتح وقراءة' : 'عرض الصورة'}
                          >
                            <Icon name={isPdf ? 'book-open' : 'image'} size="sm" />
                            {isPdf ? 'قراءة' : 'عرض'}
                          </button>
                        )}

                        {/* Download */}
                        <a
                          href={`/api/v1/student/videos/${video.id}/attachments/${att.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs transition-all"
                          title="تنزيل"
                        >
                          <Icon name="download" size="sm" />
                          تنزيل
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Tab: Quiz ── */}
          {activeTab === 'quiz' && showQuizTab && (
            <VideoQuizStudent
              videoId={video.id}
              watchStatus={progress?.status ?? ''}
              alreadyPassed={quizAlreadyPassed}
              onQuizPassed={() => void reloadProgress()}
            />
          )}
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <aside dir="rtl" className="space-y-4">

          {/* ── Watch progress card ── */}
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#101426]/90 to-[#0a0f1e]/70 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center gap-2 border-b border-white/5">
              <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
                <Icon name="chart-bar" className="text-primary" size="sm" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">تقدمك</p>
                <p className="text-gray-500 text-xs">سجل المشاهدة</p>
              </div>
              {watchedPct >= 80 && isCompleted && (
                <span className="mr-auto text-xs px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 border border-emerald-400/25">
                  مكتمل ✓
                </span>
              )}
              {isPendingQuiz && !quizAlreadyPassed && (
                <span className="mr-auto text-xs px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-400 border border-amber-400/25 animate-pulse">
                  اختبار معلق
                </span>
              )}
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Circular-look progress */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                    <circle
                      cx="32" cy="32" r="26"
                      fill="none"
                      stroke={watchedPct >= 80 ? '#34d399' : '#4263eb'}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${(watchedPct / 100) * 163.4} 163.4`}
                      className="transition-all duration-700"
                      style={{ filter: `drop-shadow(0 0 4px ${watchedPct >= 80 ? '#34d399' : '#4263eb'})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold ${watchedPct >= 80 ? 'text-emerald-400' : 'text-white'}`}>
                      {watchedPct}%
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-400">المدة الكلية</div>
                  <div className="text-white font-medium">{formatDuration(video.duration_seconds)}</div>
                  {progress?.last_position_seconds != null && progress.last_position_seconds > 0 && (
                    <>
                      <div className="text-gray-400 text-xs mt-2">آخر موضع</div>
                      <div className="text-primary text-xs font-medium">{formatDuration(progress.last_position_seconds)}</div>
                    </>
                  )}
                </div>
              </div>
              {/* Status badge */}
              {(() => {
                // quiz_passed_at يعني مكتمل بغض النظر عن قيمة status
                const effectiveStatus = progress?.quiz_passed_at
                  ? 'completed'
                  : progress?.status;
                return (
                  <div className={`text-xs rounded-xl px-3 py-2 border flex items-center gap-2
                    ${effectiveStatus === 'completed'
                      ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                      : effectiveStatus === 'watched_pending_quiz'
                      ? 'bg-amber-400/10 border-amber-400/20 text-amber-400'
                      : effectiveStatus === 'in_progress' || effectiveStatus === 'started'
                      ? 'bg-primary/10 border-primary/20 text-primary'
                      : 'bg-white/5 border-white/10 text-gray-500'}`}>
                    <Icon
                      name={
                        effectiveStatus === 'completed' ? 'check-circle'
                        : effectiveStatus === 'watched_pending_quiz' ? 'graduation-cap'
                        : 'play-circle'
                      }
                      size="sm"
                    />
                    {effectiveStatus === 'completed' ? 'اكتملت المشاهدة'
                      : effectiveStatus === 'watched_pending_quiz' ? 'في انتظار اجتياز التدريب'
                      : effectiveStatus === 'in_progress' ? 'جاري المشاهدة'
                      : effectiveStatus === 'started' ? 'بدأت المشاهدة'
                      : 'لم تبدأ بعد'}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ── Groups card (if any) ── */}
          {groups.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#101426]/90 to-[#0a0f1e]/70 backdrop-blur-sm p-5 space-y-3">
              <p className="text-white font-bold text-sm flex items-center gap-2">
                <Icon name="users" className="text-primary" size="sm" /> المجموعات
              </p>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <span key={g.id} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs border border-primary/20 font-medium">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Files quick-list (if any) ── */}
          {hasFiles && (
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#101426]/90 to-[#0a0f1e]/70 backdrop-blur-sm p-5 space-y-3">
              <p className="text-white font-bold text-sm flex items-center gap-2">
                <Icon name="paperclip" className="text-primary" size="sm" /> المرفقات
                <span className="mr-auto text-xs text-gray-500">{sortedAttachments.length} ملف</span>
              </p>
              <div className="space-y-2">
                {sortedAttachments.slice(0, 4).map((att) => (
                  <a
                    key={att.id}
                    href={`/api/v1/student/videos/${video.id}/attachments/${att.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-gray-400 hover:text-primary transition-colors group"
                  >
                    <Icon name={fileIcon(att.mime_type)} size="sm" className="text-primary/60 flex-shrink-0 group-hover:text-primary" />
                    <span className="truncate">{att.file_name}</span>
                    <Icon name="download" size="sm" className="flex-shrink-0 mr-auto text-gray-600 group-hover:text-primary" />
                  </a>
                ))}
                {sortedAttachments.length > 4 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('files')}
                    className="text-xs text-primary hover:underline w-full text-start mt-1"
                  >
                    + {sortedAttachments.length - 4} مرفق آخر
                  </button>
                )}
              </div>
            </div>
          )}

        </aside>
      </div>

      {/* ── PDF Viewer Modal ── */}
      <PdfViewerModal
        open={pdfModal.open}
        url={pdfModal.url}
        fileName={pdfModal.fileName}
        mimeType={pdfModal.mimeType}
        onClose={() => setPdfModal({ open: false, url: '', fileName: '', mimeType: '' })}
      />
    </DashboardLayout>
  );
}
