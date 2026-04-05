'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
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

// ─── Video Player for Teacher (no token needed) ──────────────────────────────

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

  // Fetch the actual signed thumbnail URL from JSON endpoint on mount
  useEffect(() => {
    if (!thumbnailUrl) return; // no thumbnail_path in DB
    fetchApi<{ url?: string | null }>(`/teacher/videos/${videoId}/thumbnail-url`)
      .then((payload) => {
        const url = payload?.url;
        if (url) setResolvedThumbnail(url);
      })
      .catch(() => {/* silently ignore thumbnail errors */});
  }, [videoId, thumbnailUrl]);

  const loadStream = useCallback(async () => {
    if (streamUrl) {
      setPlaying(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch the signed R2 URL as JSON — avoids browser redirect issues with <video src>
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
    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10">
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
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 hover:bg-black/40 transition-colors cursor-pointer w-full"
          onClick={() => {
            if (error) setError(null);
            void loadStream();
          }}
          disabled={loading}
        >
          {resolvedThumbnail && (
            <Image
              src={resolvedThumbnail}
              alt="صورة مصغرة"
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
              unoptimized
            />
          )}
          <div className="relative z-10 flex flex-col items-center gap-3">
            {loading ? (
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Icon name="sync" className="text-primary text-2xl animate-spin" />
              </div>
            ) : error ? (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
                  <Icon name="exclamation-triangle" className="text-red-400 text-2xl" />
                </div>
                <span className="text-red-400 text-sm font-medium drop-shadow text-center px-4">{error}</span>
                <span className="text-gray-400 text-xs">اضغط للمحاولة مجدداً</span>
              </>
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/60 flex items-center justify-center hover:bg-primary/30 transition-all">
                <Icon name="play" className="text-primary text-3xl mr-1" />
              </div>
            )}
            {!loading && !error && (
              <span className="text-white text-sm font-medium drop-shadow">
                معاينة الفيديو
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Comment Component ───────────────────────────────────────────────────────

function CommentItem({ comment }: { comment: VideoComment }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
          {(comment.author?.name || 'م').charAt(0)}
        </div>
        <div>
          <span className="text-sm font-semibold text-white">{comment.author?.name || 'مجهول'}</span>
          <span className="text-xs text-gray-400 mr-2">
            {new Date(comment.created_at).toLocaleDateString('ar-EG')}
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-300 pr-10">{comment.body}</p>
      {comment.replies && comment.replies.length > 0 && (
        <div className="pr-8 space-y-2 border-r border-white/10 mr-4 pt-2">
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} />
          ))}
        </div>
      )}
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

  // ── Attachments state ────────────────────────────────────────────────────
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
      console.debug('[TeacherVideo] likes_count:', vid.likes_count, 'comments_count:', vid.comments_count);
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

  // ── Attachment handlers ──────────────────────────────────────────────────
  const handleUploadAttachments = async () => {
    if (!video || attachmentFiles.length === 0) return;
    setIsUploadingAttachments(true);
    try {
      const { promise } = uploadAttachments(`/teacher/videos/${video.id}/attachments`, attachmentFiles, video.id);
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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
        headerActions={null}
      >
        <div className="space-y-6">
          <div className="skeleton-item h-8 w-64 rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="skeleton-item aspect-video rounded-2xl" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton-item h-12 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout
        role="teacher"
        user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
        headerActions={null}
      >
        <div className="text-center py-20">
          <Icon name="film" className="text-6xl text-gray-500 mb-4" />
          <p className="text-gray-300 text-lg">الفيديو غير موجود أو تم حذفه.</p>
          <Link href="/teacher/videos" className="mt-6 inline-block text-primary hover:underline">
            ← العودة إلى قائمة الفيديوهات
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
      headerActions={null}
    >
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/teacher/videos" className="hover:text-primary transition-colors flex items-center gap-1">
          <Icon name="film" size="sm" />
          <span>إدارة الفيديوهات</span>
        </Link>
        <Icon name="chevron-left" size="sm" className="text-gray-600" />
        <span className="text-white truncate max-w-xs">{video.title}</span>
      </div>

      {/* ── Main grid ── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

        {/* LEFT: Player + Tabs */}
        <div className="space-y-6">

          {/* Video player / preview */}
          {isReady ? (
            <TeacherVideoPlayer videoId={video.id} thumbnailUrl={video.thumbnail_url} />
          ) : (
            <div className="aspect-video rounded-2xl border border-white/10 bg-[#101426]/60 flex flex-col items-center justify-center gap-4 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <Icon name={video.status === 'failed' ? 'exclamation-triangle' : 'clock'} className="text-4xl" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">
                  {video.status === 'failed'
                    ? 'فشل في معالجة الفيديو'
                    : 'الفيديو قيد المعالجة'}
                </p>
                <p className="text-sm mt-1">
                  {video.status === 'failed'
                    ? video.processing_error || 'حدث خطأ أثناء المعالجة'
                    : 'سيكون الفيديو متاحاً للمعاينة بعد اكتمال المعالجة'}
                </p>
              </div>
            </div>
          )}

          {/* Tab navigation */}
          <div className="flex gap-1 border-b border-white/10 pb-0">
            {(['details', 'student_activity', 'attachments', 'comments', 'quiz'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-all ${
                  activeTab === tab
                    ? 'bg-primary/10 text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'details' ? (
                  <span className="flex items-center gap-2"><Icon name="info-circle" size="sm" /> التفاصيل</span>
                ) : tab === 'student_activity' ? (
                  <span className="flex items-center gap-2">
                    <Icon name="users" size="sm" /> الحضور والتفاعل
                    {(video?.student_activity_summary?.target_students_count ?? 0) > 0 && (
                      <span className="bg-primary/20 text-primary text-xs rounded-full px-2">
                        {video?.student_activity_summary?.target_students_count}
                      </span>
                    )}
                  </span>
                ) : tab === 'attachments' ? (
                  <span className="flex items-center gap-2">
                    <Icon name="paperclip" size="sm" /> المرفقات
                    {(video?.attachments?.length ?? 0) > 0 && (
                      <span className="bg-primary/20 text-primary text-xs rounded-full px-2">{video?.attachments?.length}</span>
                    )}
                  </span>
                ) : tab === 'quiz' ? (
                  <span className="flex items-center gap-2">
                    <Icon name="graduation-cap" size="sm" /> التدريب
                    {video?.quiz && (
                      <span className="bg-primary/20 text-primary text-xs rounded-full px-2">1</span>
                    )}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icon name="comments" size="sm" /> التعليقات
                    {comments.length > 0 && (
                      <span className="bg-primary/20 text-primary text-xs rounded-full px-2">{comments.length}</span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'details' && (
            <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-6 space-y-5">
              <div>
                <h1 className="text-2xl font-bold text-white">{video.title}</h1>
                {video.description && (
                  <p className="text-gray-400 mt-2 leading-relaxed">{video.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon="graduation-cap" label="الصف"        value={video.grade?.name || '—'} />
                <StatCard icon="users"          label="المجموعات"   value={`${video.groups?.length || 0} مجموعة`} />
                <StatCard icon="clock"          label="المدة"        value={formatDuration(video.duration_seconds)} />
                <StatCard icon="film"           label="الترميز"     value={video.codec?.toUpperCase() || '—'} />
                <StatCard icon="thumbs-up" label="الإعجابات"  value={String(video.likes_count ?? 0)} />
                <StatCard icon="comments"  label="التعليقات"  value={String(comments.length)} />
                <StatCard
                  icon="calendar"
                  label="تاريخ الإضافة"
                  value={video.created_at ? new Date(video.created_at).toLocaleDateString('ar-EG') : '—'}
                />
                {video.published_at && (
                  <StatCard
                    icon="check-circle"
                    label="تاريخ النشر"
                    value={new Date(video.published_at).toLocaleDateString('ar-EG')}
                  />
                )}
                {video.scheduled_at && (
                  <StatCard
                    icon="calendar-alt"
                    label="موعد النشر"
                    value={new Date(video.scheduled_at).toLocaleDateString('ar-EG')}
                  />
                )}
              </div>

              {video.processing_error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300">
                  <div className="flex items-center gap-2 font-semibold text-red-400 mb-1">
                    <Icon name="exclamation-triangle" size="sm" />
                    خطأ في المعالجة
                  </div>
                  {video.processing_error}
                </div>
              )}
            </div>
          )}

          {activeTab === 'student_activity' && (
            <VideoStudentActivityDetails video={video} defaultCollapsed={false} />
          )}

          {activeTab === 'attachments' && (
            <div className="space-y-5">
              {/* Upload new attachments */}
              <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-5 space-y-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Icon name="upload" className="text-primary" />
                  رفع مرفقات جديدة
                </h3>
                <div
                  className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                  onClick={() => attachmentInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    setAttachmentFiles((prev) => [...prev, ...files].slice(0, 10));
                  }}
                >
                  <Icon name="paperclip" className="text-3xl text-gray-500 mb-2" />
                  <p className="text-gray-400 text-sm">اسحب الملفات هنا أو <span className="text-primary">اضغط للاختيار</span></p>
                  <p className="text-gray-600 text-xs mt-1">PDF, صور (حتى 25MB لكل ملف، 10 مرفقات كحد أقصى)</p>
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
                  <div className="space-y-2">
                    {attachmentFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon name="file" className="text-primary shrink-0" size="sm" />
                          <span className="text-white truncate">{file.name}</span>
                          <span className="text-gray-500 text-xs shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachmentFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-500 hover:text-red-400 transition-colors shrink-0 mr-2"
                        >
                          <Icon name="times" size="sm" />
                        </button>
                      </div>
                    ))}
                    <Button
                      variant="primary"
                      className="w-full justify-center mt-2"
                      onClick={handleUploadAttachments}
                      disabled={isUploadingAttachments}
                    >
                      {isUploadingAttachments ? (
                        <><Icon name="sync" className="animate-spin" size="sm" /><span>جاري الرفع...</span></>
                      ) : (
                        <><Icon name="upload" size="sm" /><span>رفع {attachmentFiles.length} مرفق</span></>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Existing attachments */}
              <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-5 space-y-3">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Icon name="paperclip" className="text-primary" />
                  المرفقات الحالية
                  <span className="text-gray-400 text-sm font-normal">({video.attachments?.length ?? 0})</span>
                </h3>
                {!video.attachments || video.attachments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Icon name="paperclip" className="text-3xl mb-2 opacity-40" />
                    <p className="text-sm">لا توجد مرفقات بعد</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {video.attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between bg-white/5 hover:bg-white/8 rounded-xl px-4 py-3 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                            <Icon
                              name={att.mime_type === 'application/pdf' ? 'file-pdf' : 'file-image'}
                              className="text-primary"
                              size="sm"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{att.title || att.file_name}</p>
                            <p className="text-gray-500 text-xs">{(att.file_size / 1024).toFixed(0)} KB &bull; {att.mime_type}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteAttachment(att)}
                          disabled={deletingAttachmentId === att.id}
                          className="shrink-0 mr-2 text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50"
                          title="حذف المرفق"
                        >
                          {deletingAttachmentId === att.id ? (
                            <Icon name="sync" className="animate-spin" size="sm" />
                          ) : (
                            <Icon name="trash" size="sm" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#101426]/40 p-12 text-center text-gray-400">
                  <Icon name="comments" className="text-4xl mb-3 opacity-40" />
                  <p>لا توجد تعليقات بعد</p>
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

        {/* RIGHT: Status card + Actions */}
        <aside className="space-y-4">

          {/* Status card */}
          <div className="rounded-2xl border border-white/10 bg-[#101426]/60 p-5 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Icon name="info-circle" className="text-primary" />
              حالة الفيديو
            </h3>

            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(video.status)} size="sm">
                {statusLabel(video.status)}
              </Badge>
              {video.processing_status === 'succeeded' && (
                <Badge variant="success" size="sm">المعالجة مكتملة</Badge>
              )}
              {video.processing_status === 'running' && (
                <Badge variant="info" size="sm">
                  <Icon name="sync" className="animate-spin ml-1" size="sm" />
                  المعالجة جارية
                </Badge>
              )}
              {video.processing_status === 'failed' && (
                <Badge variant="danger" size="sm">فشل المعالجة</Badge>
              )}
            </div>

            {isPublished && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl p-3">
                <Icon name="check-circle" />
                <span>الفيديو منشور ومتاح للطلاب</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="rounded-2xl border border-white/10 bg-[#101426]/60 p-5 space-y-3">
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <Icon name="cog" className="text-primary" />
              الإجراءات
            </h3>

            {canPublish && (
              <Button
                variant="primary"
                className="w-full justify-center"
                onClick={handlePublish}
                disabled={isProcessing}
              >
                <Icon name="upload" size="sm" />
                <span>نشر الفيديو</span>
              </Button>
            )}

            {canRetry && (
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={handleRetry}
                disabled={isProcessing}
              >
                <Icon name="sync" size="sm" />
                <span>إعادة المعالجة</span>
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full justify-center text-gray-300 hover:text-white"
              onClick={() => router.push(`/teacher/videos`)}
            >
              <Icon name="arrow-right" size="sm" />
              <span>العودة للقائمة</span>
            </Button>

            <hr className="border-white/10" />

            <Button
              variant="ghost"
              className="w-full justify-center !text-red-400 hover:!text-red-300 hover:!bg-red-400/10"
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={isProcessing}
            >
              <Icon name="trash" size="sm" />
              <span>حذف الفيديو</span>
            </Button>
          </div>

          {/* Groups */}
          {video.groups && video.groups.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#101426]/60 p-5 space-y-3">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Icon name="users" className="text-primary" />
                المجموعات المستهدفة
              </h3>
              <div className="flex flex-wrap gap-2">
                {video.groups.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs border border-primary/20"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="حذف الفيديو"
        message={`هل أنت متأكد من حذف فيديو "${video.title}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isProcessing={isProcessing}
        variant="danger"
      />
    </DashboardLayout>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border bg-white/5 border-white/10 text-center">
      <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
        <Icon name={icon} className="text-primary" size="xs" />
      </div>
      <span className="text-white font-bold text-base leading-none">{value}</span>
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}
