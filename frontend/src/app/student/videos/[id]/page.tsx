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
    <div className={`flex flex-col items-center gap-1.5 px-4 py-4 rounded-[1.5rem] border bg-white/5 border-white/5 group transition-all hover:bg-white/[0.08] ${glow ?? ''}`}>
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
        <Icon name={icon} size="sm" />
      </div>
      <span className="text-white font-black text-lg leading-none mt-1">{value}</span>
      <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">{label}</span>
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
    if (updated.status === 'watched_pending_quiz') {
      setActiveTab('quiz');
    }
  }, []);

  const reloadProgress = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await getStudentVideo(params.id);
      setProgress(res.progress);
      setVideo(res.video);
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
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <Icon name="exclamation-triangle" size="xl" />
          </div>
          <p className="text-white font-bold">الفيديو غير متاح حالياً</p>
          <Link href="/student/videos">
            <Button variant="ghost" className="text-sm text-primary hover:bg-primary/5 gap-2">
              <Icon name="arrow-right" /> العودة للقائمة
            </Button>
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-3 text-[10px] font-black text-gray-light/20 mb-8 uppercase tracking-[0.2em]">
        <Link href="/student/videos" className="hover:text-primary transition-colors flex items-center gap-2">
          <Icon name="film" size="xs" /> مكتبة الفيديو
        </Link>
        <Icon name="chevron-left" size="xs" />
        <span className="text-gray-light/40 truncate max-w-[200px]">{video.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_350px]" dir="ltr">
        {/* LEFT COLUMN: Player & Tabs */}
        <div dir="rtl" className="space-y-6 min-w-0">
          <div className="relative group">
             <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-3xl opacity-20" />
             <div className="relative premium-glass p-3 rounded-[2.5rem] border-white/10 shadow-2xl">
                <SecureVideoPlayer
                  videoId={video.id}
                  studentName={user?.name || ''}
                  studentPhone={user?.phone || ''}
                  watermarkEnabled
                  watermarkRotationIntervalSeconds={8}
                  initialWatchedSeconds={progress?.watched_seconds ?? 0}
                  onProgressUpdate={handleProgressUpdate}
                />
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 px-2">
            <button
              type="button"
              disabled={liking}
              onClick={() => void handleLike()}
              className={`flex items-center gap-3 h-12 px-6 rounded-2xl border font-bold transition-all
                ${liked
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                  : 'bg-white/5 border-white/5 text-gray-light/60 hover:border-rose-500/30 hover:text-rose-500'}`}
            >
              <Icon name="thumbs-up" className={liking ? 'animate-pulse' : ''} />
              <span>{liked ? 'أعجبني' : 'إعجاب'}</span>
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${liked ? 'bg-rose-500/20' : 'bg-white/5'}`}>
                {likesCount}
              </span>
            </button>

            <div className="h-8 w-px bg-white/5 hidden sm:block" />

            <div className="flex items-center gap-6 text-gray-light/30">
               <div className="flex items-center gap-2">
                  <Icon name="comments" size="sm" className="text-primary/40" />
                  <span className="text-xs font-bold">{video.comments_count ?? comments.length} تعليق</span>
               </div>
               
               {watchedPct > 0 && (
                 <div className={`flex items-center gap-2 text-xs font-bold ${
                   isCompleted ? 'text-emerald-500' : isPendingQuiz ? 'text-amber-500' : 'text-primary'
                 }`}>
                   <Icon name={isCompleted ? 'check-circle' : isPendingQuiz ? 'graduation-cap' : 'play-circle'} />
                   <span>{isCompleted ? 'مكتمل' : isPendingQuiz ? 'يحتاج تدريب' : `${watchedPct}% شاهدت`}</span>
                 </div>
               )}
            </div>

            <div className="mr-auto hidden lg:flex items-center gap-3">
               {video.grade && (
                 <div className="px-4 py-2 rounded-xl bg-primary/5 text-primary border border-primary/10 text-[10px] font-black uppercase tracking-widest">
                    {video.grade.name}
                 </div>
               )}
               {video.teacher_reference?.name && (
                 <div className="px-4 py-2 rounded-xl bg-white/5 text-gray-light/40 border border-white/5 text-[10px] font-black uppercase tracking-widest">
                    {video.teacher_reference.name}
                 </div>
               )}
            </div>
          </div>

          <div className="premium-glass p-2 rounded-[2rem] border-white/5">
            <div className="flex gap-2 w-full overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-3 h-12 px-6 rounded-[1.25rem] font-bold transition-all flex-1 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-primary text-white shadow-xl shadow-primary/20'
                      : 'highlight' in tab && tab.highlight
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                      : 'text-gray-light/40 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon name={tab.icon} size="sm" />
                  <span className="text-sm">{tab.label}</span>
                  {'badge' in tab && tab.badge != null && tab.badge > 0 && (
                    <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black ${activeTab === tab.id ? 'bg-white/20' : 'bg-primary/10'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            {activeTab === 'details' && (
              <div className="premium-glass p-8 rounded-[2.5rem] border-white/5 space-y-8">
                <div>
                  <h1 className="text-2xl font-black text-white leading-tight mb-4">{video.title}</h1>
                  {video.description ? (
                    <p className="text-gray-light/40 font-medium leading-relaxed">{video.description}</p>
                  ) : (
                    <p className="text-gray-light/20 italic text-sm">لا يوجد وصف متاح لهذا الفيديو</p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <Stat icon="clock" value={formatDuration(video.duration_seconds)} label="المدة" />
                  <Stat icon="thumbs-up" value={likesCount} label="إعجاب" />
                  <Stat icon="comments" value={video.comments_count ?? 0} label="تعليق" />
                  <Stat icon="paperclip" value={video.attachments_count ?? 0} label="مرفق" />
                  <Stat icon="eye" value={`${watchedPct}%`} label="مشاهدة"
                    glow={watchedPct >= 80 ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : ''} />
                </div>

                {watchedPct > 0 && (
                  <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest px-2">تقدم المشاهدة</h4>
                      <span className={`text-xs font-black ${watchedPct >= 80 ? 'text-emerald-500' : 'text-primary'}`}>{watchedPct}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-white/5 border border-white/5 overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          watchedPct >= 80 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-primary shadow-[0_0_15px_rgba(66,99,235,0.4)]'
                        }`}
                        style={{ width: `${watchedPct}%` }}
                      />
                    </div>
                    {watchedPct >= 80 && !isPendingQuiz && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3 text-emerald-500 text-sm font-bold">
                        <Icon name="check-double" />
                        <span>رائع! لقد أتممت مشاهدة المحتوى التعليمي بالكامل 🎉</span>
                      </div>
                    )}
                    {isPendingQuiz && !quizAlreadyPassed && (
                      <div
                        className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer group hover:bg-amber-500/20 transition-all"
                        onClick={() => setActiveTab('quiz')}
                      >
                        <div className="flex items-center gap-3 text-amber-500 text-sm font-bold">
                           <Icon name="graduation-cap" />
                           <span>أتممت المشاهدة! بانتظارك اختبار قصير لتأكيد الفهم</span>
                        </div>
                        <Icon name="arrow-left" className="text-amber-500 group-hover:-translate-x-2 transition-transform" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="premium-glass p-6 rounded-[2.5rem] border-white/5">
                <VideoCommentsSection
                  videoId={video.id}
                  comments={comments}
                  canDeleteOwn
                  currentUserId={user?.id ? String(user.id) : undefined}
                  onRefresh={reloadComments}
                />
              </div>
            )}

            {activeTab === 'files' && hasFiles && (
              <div className="premium-glass p-8 rounded-[2.5rem] border-white/5 space-y-6">
                <div className="flex items-center gap-3">
                  <Icon name="paperclip" className="text-primary" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">المرفقات التعليمية ({sortedAttachments.length})</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {sortedAttachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-4 p-4 rounded-[1.5rem] border border-white/5 bg-white/5 hover:bg-white/[0.08] hover:border-primary/30 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Icon name={fileIcon(att.mime_type)} size="xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold truncate">{att.file_name}</p>
                        <p className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest mt-1">{formatBytes(att.file_size)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {(att.mime_type === 'application/pdf' || att.mime_type.startsWith('image/')) && (
                          <button
                            onClick={() => openAttachment(att, video.id)}
                            className="h-10 px-4 rounded-xl bg-primary/20 text-primary hover:bg-primary text-white transition-all font-bold text-xs"
                          >
                            عرض
                          </button>
                        )}
                        <a
                          href={`/api/v1/student/videos/${video.id}/attachments/${att.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-light hover:text-white transition-all"
                        >
                          <Icon name="download" size="sm" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'quiz' && showQuizTab && (
              <VideoQuizStudent
                videoId={video.id}
                watchStatus={progress?.status ?? ''}
                alreadyPassed={quizAlreadyPassed}
                onQuizPassed={() => void reloadProgress()}
              />
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar */}
        <aside dir="rtl" className="space-y-6">
          <div className="premium-glass p-6 rounded-[2.5rem] border-white/5 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Icon name="chart-pie" />
              </div>
              <div>
                <p className="text-white font-black text-sm">معدل الإنجاز</p>
                <p className="text-[10px] font-black text-gray-light/20 uppercase tracking-widest">تتبع تقدمك</p>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke={watchedPct >= 80 ? '#10b981' : '#4263eb'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(watchedPct / 100) * 282.7} 282.7`}
                    className="transition-all duration-[1500ms] ease-out"
                    style={{ filter: `drop-shadow(0 0 8px ${watchedPct >= 80 ? 'rgba(16,185,129,0.5)' : 'rgba(66,99,235,0.5)'})` }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-black ${watchedPct >= 80 ? 'text-emerald-500' : 'text-white'}`}>{watchedPct}%</span>
                  <span className="text-[8px] font-black text-gray-light/20 uppercase tracking-widest mt-1">من المحتوى</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                 <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">المدة الكلية</span>
                    <span className="text-sm font-black text-white">{formatDuration(video.duration_seconds)}</span>
                 </div>
                 {progress?.last_position_seconds != null && progress.last_position_seconds > 0 && (
                   <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                      <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-widest">توقفت عند</span>
                      <span className="text-sm font-black text-primary">{formatDuration(progress.last_position_seconds)}</span>
                   </div>
                 )}
              </div>
            </div>

            {(() => {
              const effectiveStatus = progress?.quiz_passed_at ? 'completed' : progress?.status;
              return (
                <div className={`p-4 rounded-2xl border text-center text-[10px] font-black uppercase tracking-widest transition-all
                  ${effectiveStatus === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : effectiveStatus === 'watched_pending_quiz'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse'
                    : 'bg-white/5 border-white/10 text-gray-light/40'}`}>
                  {effectiveStatus === 'completed' ? 'تم إتقان المحاضرة بنجاح ✓'
                    : effectiveStatus === 'watched_pending_quiz' ? 'بانتظار إتمام الاختبار النهائي'
                    : effectiveStatus === 'in_progress' ? 'جاري متابعة المحتوى'
                    : 'لم يبدأ المشاهدة بعد'}
                </div>
              );
            })()}
          </div>

          {groups.length > 0 && (
            <div className="premium-glass p-6 rounded-[2.5rem] border-white/5 space-y-4">
              <p className="text-white font-black text-xs flex items-center gap-2">
                <Icon name="users" className="text-primary" /> المجموعات المستهدفة
              </p>
              <div className="flex flex-wrap gap-2">
                {groups.map((g) => (
                  <span key={g.id} className="px-4 py-2 rounded-xl bg-primary/5 text-primary text-[10px] font-black border border-primary/10">
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasFiles && (
            <div className="premium-glass p-6 rounded-[2.5rem] border-white/5 space-y-4">
              <div className="flex items-center justify-between pb-2">
                <p className="text-white font-black text-xs flex items-center gap-2">
                  <Icon name="paperclip" className="text-primary" /> الملفات الملحقة
                </p>
                <span className="text-[10px] font-black text-gray-light/20">{sortedAttachments.length} ملف</span>
              </div>
              <div className="space-y-2">
                {sortedAttachments.slice(0, 3).map((att) => (
                  <a
                    key={att.id}
                    href={`/api/v1/student/videos/${video.id}/attachments/${att.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/30 group transition-all"
                  >
                    <Icon name={fileIcon(att.mime_type)} size="sm" className="text-primary/60 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-gray-light/60 group-hover:text-white truncate transition-colors">{att.file_name}</span>
                  </a>
                ))}
                {sortedAttachments.length > 3 && (
                  <button onClick={() => setActiveTab('files')} className="w-full text-center text-[10px] font-black text-primary py-2 hover:underline">
                    عرض جميع الملفات المرفقة
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

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
}
