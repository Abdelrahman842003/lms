'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button, Icon, LoadingSpinner, Input } from '@/components/ui';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  getTeacherVideo,
  getTeacherVideoComments,
  publishTeacherVideo,
  retryTeacherVideoProcessing,
  deleteTeacherVideo,
  deleteTeacherAttachment,
  uploadAttachments,
} from '@/services/videoService';
import type { VideoAttachment, VideoComment, VideoItem, VideoQuiz } from '@/types/video.types';
import { fetchApi } from '@/services/api/baseApi';
import { VideoQuizManager } from '@/components/video/VideoQuizManager';
import { VideoStudentActivityDetails } from '@/components/video/VideoStudentActivityDetails';
import { cn } from '@/utils';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(seconds?: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function statusLabel(status: VideoItem['status']): string {
  const map: Record<string, string> = {
    draft: 'مسودة',
    uploading: 'قيد الرفع',
    uploaded: 'قيد التحضير',
    processing: 'قيد المعالجة',
    ready: 'جاهز للنشر',
    scheduled: 'مجدول',
    published: 'منشور',
    failed: 'فشل',
    deleted: 'محذوف',
  };
  return map[status] ?? status;
}

function statusVariant(status: VideoItem['status']): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
  if (status === 'published') return 'success';
  if (status === 'ready' || status === 'scheduled') return 'warning';
  if (status === 'failed') return 'danger';
  if (['uploading', 'uploaded', 'processing'].includes(status)) return 'info';
  return 'secondary';
}

// ─── Video Player for Teacher ───────────────────────────────────────────────

interface TeacherVideoPlayerProps {
  videoId: string;
  thumbnailUrl?: string | null;
}

function TeacherVideoPlayer({ videoId, thumbnailUrl }: TeacherVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [resolvedThumbnail, setResolvedThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!thumbnailUrl) return;
    fetchApi<{ url?: string | null }>(`/teacher/videos/${videoId}/thumbnail-url`)
      .then((payload) => {
        const url = payload?.url;
        if (url) setResolvedThumbnail(url);
      })
      .catch(() => {});
  }, [videoId, thumbnailUrl]);

  const loadStream = useCallback(async () => {
    if (streamUrl) {
      setPlaying(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchApi<{ url?: string }>(`/teacher/videos/${videoId}/stream-url`);
      const url = payload?.url;
      if (!url) throw new Error('لم يُعثر على رابط الفيديو');
      setStreamUrl(url);
      setPlaying(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل الفيديو');
    } finally {
      setLoading(false);
    }
  }, [videoId, streamUrl]);

  return (
    <div className="relative rounded-[2rem] overflow-hidden bg-[#050714] aspect-video premium-border shadow-2xl group">
      {playing && streamUrl ? (
        <video
          ref={videoRef}
          src={streamUrl}
          controls
          autoPlay
          className="w-full h-full object-contain"
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <button
          type="button"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 hover:bg-black/20 transition-all cursor-pointer w-full group"
          onClick={() => {
            if (error) setError(null);
            void loadStream();
          }}
          disabled={loading}
        >
          {resolvedThumbnail && (
            <Image
              src={resolvedThumbnail}
              alt="Preview"
              fill
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000"
              unoptimized
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-40" />
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            {loading ? (
              <div className="w-20 h-20 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 flex items-center justify-center">
                <LoadingSpinner size="md" color="primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 animate-in shake duration-500">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Icon name="exclamation-triangle" className="text-red-400 text-2xl" />
                </div>
                <span className="text-red-400 text-xs font-bold bg-black/60 px-4 py-1 rounded-full backdrop-blur-md">{error}</span>
                <span className="text-gray-light/40 text-[10px] font-black uppercase tracking-widest">اضغط للمحاولة مجدداً</span>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-all duration-500">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(66,99,235,0.6)]">
                  <Icon name="play" className="text-white text-2xl ml-1.5" />
                </div>
              </div>
            )}
            {!loading && !error && (
              <span className="text-white text-sm font-black tracking-widest drop-shadow-lg uppercase">
                معاينة محتوى الفيديو
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Comment Item ────────────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: VideoComment }) {
  return (
    <div className="rounded-2xl premium-glass premium-border p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shadow-lg overflow-hidden">
          {comment.author?.avatar ? (
            <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            (comment.author?.name || 'م').charAt(0)
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-white">{comment.author?.name || 'مجهول'}</span>
          <span className="text-[10px] font-bold text-gray-light/30">
            {new Date(comment.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-light/70 leading-relaxed pr-1 md:pr-13">{comment.body}</p>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="pr-6 md:pr-13 space-y-4 border-r-2 border-white/5 mr-4 md:mr-11 pt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Info Tile ──────────────────────────────────────────────────────────────

function InfoTile({ icon, label, value, color = 'primary' }: { icon: string; label: string; value: string; color?: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/5 border-primary/10',
    secondary: 'text-secondary bg-secondary/5 border-secondary/10',
    warning: 'text-warning bg-warning/5 border-warning/10',
    info: 'text-info bg-info/5 border-info/10',
    success: 'text-success bg-success/5 border-success/10',
  };

  return (
    <div className={cn("flex flex-col gap-2 p-4 rounded-2xl border transition-all hover:bg-white/5", colorMap[color] || colorMap.primary)}>
      <div className="flex items-center gap-2">
        <Icon name={icon} size="xs" />
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
      </div>
      <span className="text-sm font-black text-white truncate">{value}</span>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TeacherVideoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'student_activity' | 'comments' | 'quiz' | 'attachments'>('details');

  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const loadVideo = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const [vid, coms] = await Promise.all([
        getTeacherVideo(params.id),
        getTeacherVideoComments(params.id),
      ]);
      setVideo(vid);
      setComments(coms);
    } catch {
      toast.error('فشل تحميل بيانات الفيديو');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadVideo();
  }, [loadVideo]);

  const handlePublish = async () => {
    if (!video) return;
    setIsProcessing(true);
    try {
      await publishTeacherVideo(video.id);
      toast.success('تم نشر الفيديو بنجاح');
      await loadVideo();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل نشر الفيديو');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!video) return;
    setIsProcessing(true);
    try {
      await retryTeacherVideoProcessing(video.id);
      toast.success('تمت جدولة إعادة المعالجة');
      await loadVideo();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل إعادة المعالجة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    setIsProcessing(true);
    try {
      await deleteTeacherVideo(video.id);
      toast.success('تم حذف الفيديو');
      router.push('/teacher/videos');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل حذف الفيديو');
    } finally {
      setIsProcessing(false);
      setIsDeleteModalOpen(false);
    }
  };

  const canPublish = video?.status === 'ready' || video?.status === 'scheduled';
  const canRetry = video?.status === 'failed';
  const isPublished = video?.status === 'published';
  const isReady = video?.status === 'ready' || isPublished;

  const handleUploadAttachments = async () => {
    if (!video || attachmentFiles.length === 0) return;
    setIsUploadingAttachments(true);
    try {
      const { promise } = uploadAttachments('/teacher/videos', attachmentFiles, video.id);
      await promise;
      setAttachmentFiles([]);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      toast.success('تم رفع المرفقات بنجاح');
      await loadVideo();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل رفع المرفقات');
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  const handleDeleteAttachment = async (attachment: VideoAttachment) => {
    if (!video) return;
    setDeletingAttachmentId(attachment.id);
    try {
      await deleteTeacherAttachment(video.id, attachment.id);
      toast.success('تم حذف المرفق');
      setVideo((prev) =>
        prev
          ? { ...prev, attachments: prev.attachments?.filter((a) => a.id !== attachment.id) }
          : prev
      );
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'فشل حذف المرفق');
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
      >
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" color="primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
      >
        <div className="text-center py-24">
          <Icon name="film" className="text-6xl text-gray-light/10 mb-6" />
          <h2 className="text-2xl font-black text-white">الفيديو غير متاح</h2>
          <p className="text-gray-light/40 mt-2">ربما تم حذف الفيديو أو أنك لا تملك صلاحية الوصول إليه.</p>
          <Button onClick={() => router.push('/teacher/videos')} variant="ghost" className="mt-8 text-primary font-bold">
            <Icon name="arrow-right" size="sm" />
            <span>العودة لمكتبة الفيديوهات</span>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
    >
      <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-light/30">
          <Link href="/teacher/videos" className="hover:text-primary transition-colors flex items-center gap-2">
            <Icon name="film" size="sm" />
            <span>الاستوديو</span>
          </Link>
          <Icon name="chevron-left" className="opacity-50" size="xs" />
          <span className="text-primary truncate max-w-xs">{video.title}</span>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">

          {/* LEFT: Player & Detailed Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Player Container */}
            {isReady ? (
              <TeacherVideoPlayer videoId={video.id} thumbnailUrl={video.thumbnail_url} />
            ) : (
              <div className="aspect-video rounded-[2rem] premium-glass premium-border flex flex-col items-center justify-center gap-6 text-center p-8">
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                  <Icon name={video.status === 'failed' ? 'exclamation-triangle' : 'sync'} className={cn("text-4xl", video.status === 'failed' ? 'text-red-500' : 'text-primary animate-spin-slow')} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white">
                    {video.status === 'failed' ? 'فشل معالجة المحتوى' : 'جاري تحضير الفيديو...'}
                  </h3>
                  <p className="text-gray-light/40 text-sm font-medium max-w-sm mx-auto">
                    {video.status === 'failed'
                      ? video.processing_error || 'حدث خطأ غير متوقع أثناء معالجة ملف الفيديو.'
                      : 'نقوم الآن بضغط الفيديو وتجهيزه للمشاهدة بأعلى جودة ممكنة. يرجى الانتظار.'}
                  </p>
                </div>
                {video.status === 'failed' && (
                  <Button onClick={handleRetry} variant="primary" className="rounded-xl px-8">إعادة المحاولة</Button>
                )}
              </div>
            )}

            {/* Tab navigation */}
            <div className="p-2 rounded-2xl md:rounded-[2rem] premium-glass premium-border flex overflow-x-auto scrollbar-none gap-1 md:gap-2">
              {(['details', 'student_activity', 'attachments', 'comments', 'quiz'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 min-w-fit px-4 md:px-6 py-2.5 md:py-3.5 rounded-xl md:rounded-[1.5rem] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2",
                    activeTab === tab
                      ? "bg-primary text-white shadow-lg"
                      : "text-gray-light/40"
                  )}
                >
                  <Icon name={
                    tab === 'details' ? 'info-circle' :
                    tab === 'student_activity' ? 'users' :
                    tab === 'attachments' ? 'paperclip' :
                    tab === 'quiz' ? 'graduation-cap' : 'comments'
                  } size="sm" className={cn("transition-colors", activeTab === tab ? "text-white" : "text-primary/20")} />
                  <span className="hidden sm:inline">{
                    tab === 'details' ? 'التفاصيل' :
                    tab === 'student_activity' ? 'التفاعل' :
                    tab === 'attachments' ? 'المرفقات' :
                    tab === 'quiz' ? 'التدريب' : 'التعليقات'
                  }</span>
                </button>
              ))}
            </div>

            {/* Tab Panels */}
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              {activeTab === 'details' && (
                <div className="space-y-8">
                  <div className="p-6 md:p-10 rounded-[2.5rem] premium-glass premium-border space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 space-y-6">
                      <div className="flex flex-col gap-2">
                        <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{video.title}</h1>
                        <p className="text-gray-light/50 leading-relaxed text-sm md:text-base">
                          {video.description || 'لا يوجد وصف مضاف لهذا الفيديو التعليمي.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                        <InfoTile icon="graduation-cap" label="الصف الدراسي" value={video.grade?.name || '—'} color="primary" />
                        <InfoTile icon="clock" label="مدة الفيديو" value={formatDuration(video.duration_seconds)} color="secondary" />
                        <InfoTile icon="calendar" label="تاريخ الإضافة" value={new Date(video.created_at).toLocaleDateString('ar-EG')} color="info" />
                        <InfoTile icon="thumbs-up" label="الإعجابات" value={String(video.likes_count ?? 0)} color="success" />
                        <InfoTile icon="comments" label="إجمالي التعليقات" value={String(comments.length)} color="warning" />
                        <InfoTile icon="paperclip" label="المرفقات" value={String(video.attachments?.length ?? 0)} color="primary" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'student_activity' && (
                <VideoStudentActivityDetails video={video} defaultCollapsed={false} />
              )}

              {activeTab === 'attachments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Upload Card */}
                  <div className="p-6 md:p-8 rounded-[2rem] premium-glass premium-border space-y-6">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Icon name="upload" className="text-primary" />
                      رفع مرفقات
                    </h3>
                    <div
                      className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      onClick={() => attachmentInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Icon name="paperclip" className="text-2xl text-gray-light/30" />
                      </div>
                      <p className="text-sm text-gray-light/60 font-bold mb-1">اضغط لاختيار ملفات</p>
                      <p className="text-[10px] text-gray-light/20 uppercase font-black">PDF, JPG, PNG (Max 25MB)</p>
                      <input
                        ref={attachmentInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          setAttachmentFiles((prev) => [...prev, ...files].slice(0, 10));
                        }}
                      />
                    </div>

                    {attachmentFiles.length > 0 && (
                      <div className="space-y-3">
                        {attachmentFiles.map((file, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                            <span className="text-xs text-white truncate max-w-[150px]">{file.name}</span>
                            <button onClick={() => setAttachmentFiles(p => p.filter((_, idx) => idx !== i))} className="text-red-400 p-1"><Icon name="times" size="xs" /></button>
                          </div>
                        ))}
                        <Button
                          variant="primary"
                          className="w-full h-12 rounded-xl"
                          onClick={handleUploadAttachments}
                          disabled={isUploadingAttachments}
                        >
                          {isUploadingAttachments ? <LoadingSpinner size="sm" /> : <span>بدء الرفع ({attachmentFiles.length})</span>}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Existing List */}
                  <div className="p-6 md:p-8 rounded-[2rem] premium-glass premium-border space-y-6">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Icon name="paperclip" className="text-secondary" />
                      المرفقات المتاحة
                    </h3>
                    <div className="space-y-3">
                      {video.attachments?.map((att) => (
                        <div key={att.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <Icon name={att.mime_type?.includes('pdf') ? 'file-pdf' : 'file-image'} />
                            </div>
                            <div className="truncate min-w-0">
                              <p className="text-xs font-black text-white truncate">{att.title || att.file_name}</p>
                              <p className="text-[10px] text-gray-light/30">{(att.file_size / 1024).toFixed(0)} KB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeleteAttachment(att)}
                            disabled={deletingAttachmentId === att.id}
                            className="text-gray-light/40 hover:text-red-400 p-2 transition-colors"
                          >
                            {deletingAttachmentId === att.id ? <LoadingSpinner size="xs" /> : <Icon name="trash" size="sm" />}
                          </button>
                        </div>
                      ))}
                      {!video.attachments?.length && (
                        <div className="py-12 text-center text-gray-light/20 italic text-sm">لا توجد مرفقات حالياً</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <div className="py-24 text-center premium-glass rounded-[2rem] premium-border opacity-60">
                      <Icon name="comments" className="text-5xl text-primary/20 mb-4" />
                      <p className="text-gray-light/40 font-bold tracking-widest uppercase text-xs">كن أول من يضيف تعليقاً</p>
                    </div>
                  ) : (
                    comments.map((c) => <CommentItem key={c.id} comment={c} />)
                  )}
                </div>
              )}

              {activeTab === 'quiz' && (
                <VideoQuizManager
                  videoId={video.id}
                  role="teacher"
                  initialQuiz={video.quiz}
                  onQuizChange={(q: VideoQuiz | null) => setVideo((prev) => prev ? { ...prev, quiz: q } : prev)}
                />
              )}
            </div>
          </div>

          {/* RIGHT: Actions & Status Aside */}
          <aside className="space-y-6">
            
            {/* Status Panel */}
            <div className="p-6 md:p-8 rounded-[2rem] premium-glass premium-border space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black text-white uppercase tracking-widest text-[10px]">حالة المحتوى</h3>
                <Badge variant={statusVariant(video.status)}>{statusLabel(video.status)}</Badge>
              </div>

              {isPublished ? (
                <div className="p-4 rounded-2xl bg-success/10 border border-success/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
                    <Icon name="check-circle" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">منشور بنجاح</span>
                    <span className="text-[10px] text-success/80">الفيديو الآن متاح لجميع الطلاب المستهدفين.</span>
                  </div>
                </div>
              ) : video.status === 'ready' ? (
                <div className="p-4 rounded-2xl bg-warning/10 border border-warning/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center text-warning shrink-0">
                    <Icon name="clock" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-white">جاهز للنشر</span>
                    <span className="text-[10px] text-warning/80">اكتملت المعالجة، يمكنك نشره الآن ليراه الطلاب.</span>
                  </div>
                </div>
              ) : null}

              <div className="space-y-3 pt-2">
                {canPublish && (
                  <Button onClick={handlePublish} disabled={isProcessing} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl">
                    <Icon name="upload" />
                    <span>نشر الفيديو الآن</span>
                  </Button>
                )}
                {canRetry && (
                  <Button onClick={handleRetry} disabled={isProcessing} variant="outline" className="w-full h-14 rounded-2xl border-warning text-warning">
                    <Icon name="sync" />
                    <span>إعادة المعالجة</span>
                  </Button>
                )}
                <Button onClick={() => setIsDeleteModalOpen(true)} disabled={isProcessing} variant="ghost" className="w-full h-12 rounded-2xl text-red-500 font-bold bg-red-500/5">
                  <Icon name="trash" />
                  <span>حذف الفيديو نهائياً</span>
                </Button>
              </div>
            </div>

            {/* Targeting Details */}
            {video.groups && video.groups.length > 0 && (
              <div className="p-6 md:p-8 rounded-[2rem] premium-glass premium-border space-y-6">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Icon name="users" className="text-info" />
                  المجموعات المستهدفة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {video.groups.map((g) => (
                    <div key={g.id} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-gray-light/60">
                      {g.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Quick Tips/Info */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-white/5 space-y-4">
              <Icon name="lightbulb" className="text-primary text-2xl" />
              <p className="text-xs text-gray-light/40 leading-relaxed">
                تأكد من مراجعة المرفقات والتدريبات المرتبطة بالفيديو قبل نشره لضمان حصول الطالب على تجربة تعليمية كاملة.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="حذف المحتوى التعليمي"
        message={`هل أنت متأكد من حذف فيديو "${video.title}"؟ هذا الإجراء سيؤدي لحذف الفيديو وجميع التعليقات والمرفقات المرتبطة به ولا يمكن التراجع عنه.`}
        confirmText="نعم، حذف نهائي"
        cancelText="تراجع"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isProcessing={isProcessing}
        variant="danger"
      />
    </DashboardLayout>
  );
}
