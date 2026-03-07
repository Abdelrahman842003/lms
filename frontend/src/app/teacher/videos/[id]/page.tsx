'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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
} from '@/services/videoService';
import type { VideoComment, VideoItem } from '@/types/video.types';
import { API_BASE_URL } from '@/services/api/baseApi';

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
    fetch(`${API_BASE_URL}/teacher/videos/${videoId}/thumbnail-url`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then((json: { data?: { url?: string | null } }) => {
        const url = json?.data?.url;
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
      const res = await fetch(`${API_BASE_URL}/teacher/videos/${videoId}/stream-url`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { message?: string }).message || 'تعذّر تحميل الفيديو');
      }
      const json = await res.json() as { data?: { url?: string }; url?: string };
      const url = json?.data?.url ?? json?.url;
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
            <img
              src={resolvedThumbnail}
              alt="صورة مصغرة"
              className="absolute inset-0 w-full h-full object-cover opacity-50"
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
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');

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
      const updated = await publishTeacherVideo(video.id);
      setVideo(updated);
      toast.success('تم نشر الفيديو بنجاح');
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
            {(['details', 'comments'] as const).map((tab) => (
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

              <div className="grid grid-cols-2 gap-4 text-sm">
                <InfoRow icon="graduation-cap" label="الصف" value={video.grade?.name || '—'} />
                <InfoRow icon="users" label="المجموعات" value={`${video.groups?.length || 0} مجموعة`} />
                <InfoRow icon="clock" label="المدة" value={formatDuration(video.duration_seconds)} />
                <InfoRow icon="expand" label="الدقة" value={video.width ? `${video.width}×${video.height}` : '—'} />
                <InfoRow icon="film" label="الترميز" value={video.codec || '—'} />
                <InfoRow icon="tachometer-alt" label="معدل الإطار" value={video.frame_rate ? `${video.frame_rate} fps` : '—'} />
                <InfoRow icon="thumbs-up" label="الإعجابات" value={String(video.likes_count ?? 0)} />
                <InfoRow icon="comments" label="التعليقات" value={String(video.comments_count ?? 0)} />
                <InfoRow
                  icon="calendar"
                  label="تاريخ الإضافة"
                  value={video.created_at ? new Date(video.created_at).toLocaleDateString('ar-EG') : '—'}
                />
                {video.published_at && (
                  <InfoRow
                    icon="check-circle"
                    label="تاريخ النشر"
                    value={new Date(video.published_at).toLocaleDateString('ar-EG')}
                  />
                )}
                {video.scheduled_at && (
                  <InfoRow
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

// ─── Tiny helper component ────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon name={icon} className="text-primary mt-0.5 w-4 flex-shrink-0" size="sm" />
      <div>
        <div className="text-gray-400 text-xs">{label}</div>
        <div className="text-white font-medium">{value}</div>
      </div>
    </div>
  );
}
