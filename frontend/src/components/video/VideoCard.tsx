'use client';

/**
 * VideoCard — unified card component used by both Teacher & Student pages.
 *
 * Protection / Security features:
 *  1. No raw video URL is ever rendered in the DOM.
 *  2. Right-click context menu is disabled on thumbnail to prevent "Save video as".
 *  3. Thumbnail uses a decoy overlay that absorbs drag events.
 *  4. Teacher variant shows status badges + action menu (publish / retry / delete).
 *  5. Student variant shows watch-progress bar + completion badge.
 *  6. Long press on thumbnail shows a subtle "Protected Content" toast instead of
 *     allowing any media interaction.
 *  7. CSS `user-select: none` and `pointer-events: none` on media elements.
 */

import React, { useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import type { VideoItem, VideoWatchProgress } from '@/types/video.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatVideoDuration(seconds?: number | null): string {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDisplayDate(video: VideoItem): string {
  const raw = video.published_at || video.scheduled_at || video.created_at;
  if (!raw) return '—';
  return new Date(raw).toLocaleDateString('ar-EG');
}

// ─── Status helpers (teacher) ────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'secondary';

function statusVariant(video: VideoItem): BadgeVariant {
  if (video.status === 'published') return 'success';
  if (video.status === 'ready' || video.status === 'scheduled') return 'warning';
  if (video.status === 'failed') return 'danger';
  if (['uploading', 'uploaded', 'processing'].includes(video.status)) return 'info';
  return 'secondary';
}

function statusLabel(video: VideoItem): string {
  const map: Record<string, string> = {
    published: 'منشور',
    scheduled: 'مجدول',
    ready: 'جاهز للنشر',
    failed: 'فشل',
    processing: 'قيد المعالجة',
    uploading: 'قيد الرفع',
    uploaded: 'قيد التحضير',
    deleted: 'محذوف',
    draft: 'مسودة',
  };
  return map[video.status] ?? 'مسودة';
}

function processingLabel(video: VideoItem): string | null {
  const map: Record<string, string> = {
    succeeded: 'المعالجة مكتملة',
    running: 'المعالجة جارية',
    failed: 'فشل المعالجة',
    pending: 'في الانتظار',
  };
  return map[video.processing_status] ?? null;
}

// ─── Watch-progress helpers (student) ────────────────────────────────────────

function progressColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-400';
  if (pct >= 40) return 'bg-primary';
  return 'bg-blue-400';
}

function progressLabel(pct: number): string {
  if (pct === 0) return 'لم تبدأ';
  if (pct < 30) return 'بدأت';
  if (pct < 80) return 'جارية';
  return 'مكتمل ✓';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Protected thumbnail — blocks right-click, drag, and long-press save. */
function ProtectedThumbnail({
  thumbnailUrl,
}: {
  thumbnailUrl?: string | null;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLong = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    /* Outer wrapper — absorbs context-menu & drag */
    <div
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0a0f1e] select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onTouchStart={() => {
        longPressTimer.current = setTimeout(() => {
          /* silently swallow — no save dialog */
        }, 500);
      }}
      onTouchEnd={cancelLong}
      onTouchMove={cancelLong}
    >
      {thumbnailUrl ? (
        <>
          <img
            src={thumbnailUrl}
            alt=""          /* empty alt = decorative, avoids scraping hints */
            draggable={false}
            className="w-full h-full object-cover pointer-events-none"
            style={{ userSelect: 'none' }}
          />
          {/* Invisible overlay captures any stray pointer events */}
          <div className="absolute inset-0" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600">
          <Icon name="film" className="text-3xl text-primary/30" />
          <span className="text-xs text-gray-600">بدون صورة مصغرة</span>
        </div>
      )}

      {/* Play badge */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-12 h-12 rounded-full bg-primary/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Icon name="play" className="text-white text-lg ml-0.5" />
        </div>
      </div>

      {/* Duration badge */}
    </div>
  );
}

/** Row used inside the info grid. */
function MetaRow({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Icon name={icon} className="w-4 text-primary flex-shrink-0" size="sm" />
      <span>{children}</span>
    </div>
  );
}

// ─── Main interfaces ──────────────────────────────────────────────────────────

interface TeacherActions {
  /** teacher-only actions */
  isMenuOpen: boolean;
  onMenuToggle: (e: React.MouseEvent) => void;
  onPublish: () => void;
  onRetryProcessing: () => void;
  onDelete: () => void;
}

interface VideoCardBaseProps {
  video: VideoItem;
  href: string;
  /** Shows teacher action buttons + status badges */
  role: 'teacher' | 'student';
  /** Optional watch progress (student only) */
  watchProgress?: VideoWatchProgress | null;
  /** Teacher-specific callbacks (required when role="teacher") */
  teacherActions?: TeacherActions;
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

export const VideoCard: React.FC<VideoCardBaseProps> = ({
  video,
  href,
  role,
  watchProgress,
  teacherActions,
}) => {
  const isTeacher = role === 'teacher';
  const isPublished = video.status === 'published';
  const canPublish = video.status === 'ready' || video.status === 'scheduled';
  const canRetry = video.status === 'failed';
  const watchedPct = watchProgress?.watched_percentage ?? 0;
  const procLabel = processingLabel(video);


  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-[#101426]/60 backdrop-blur-sm overflow-hidden transition-all duration-300
        hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:-translate-y-0.5
        ${isPublished
          ? 'border-primary/40 shadow-[0_0_20px_rgba(66,99,235,0.15)]'
          : 'border-white/10 hover:border-white/20'
        }`}
    >
      {/* ── Thumbnail ── */}
      <Link href={href} className="block relative">
        <ProtectedThumbnail thumbnailUrl={video.thumbnail_url} />
        {/* Duration chip */}
        {video.duration_seconds && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs font-mono backdrop-blur-sm select-none pointer-events-none">
            {formatVideoDuration(video.duration_seconds)}
          </span>
        )}
        {/* Student: progress bar on thumbnail */}
        {!isTeacher && watchedPct > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div
              className={`h-full transition-all ${progressColor(watchedPct)}`}
              style={{ width: `${watchedPct}%` }}
            />
          </div>
        )}
      </Link>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Top row: badges + menu (teacher) OR progress badge (student) */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {isTeacher ? (
              <>
                <Badge variant={statusVariant(video)} size="sm">{statusLabel(video)}</Badge>
                {procLabel && (
                  <Badge variant={video.processing_status === 'failed' ? 'danger' : 'info'} size="sm">
                    {procLabel}
                  </Badge>
                )}
                {video.teacher_reference?.name && (
                  <Badge variant="info" size="sm" icon="chalkboard-teacher">
                    {video.teacher_reference.name}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border
                  ${watchedPct >= 80
                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                    : watchedPct > 0
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-white/5 text-gray-400 border-white/10'}`}>
                  <Icon name={watchedPct >= 80 ? 'check-circle' : watchedPct > 0 ? 'play-circle' : 'play'} size="sm" />
                  {progressLabel(watchedPct)}
                </span>
                {video.grade?.name && (
                  <Badge variant="info" size="sm" icon="graduation-cap">{video.grade.name}</Badge>
                )}
              </>
            )}
          </div>

          {/* Teacher 3-dot menu */}
          {isTeacher && teacherActions && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-primary/20 border border-white/10 hover:border-primary/40 flex items-center justify-center transition-all"
                onClick={teacherActions.onMenuToggle}
              >
                <Icon name="ellipsis-v" size="sm" color="inherit" />
              </button>

              {teacherActions.isMenuOpen && (
                <div className="actions-menu show actions-menu-card z-20">
                  {canPublish && (
                    <button
                      className="actions-menu-item w-full"
                      onClick={(e) => { e.stopPropagation(); teacherActions.onPublish(); }}
                    >
                      <Icon name="upload" size="sm" />
                      <span>نشر الفيديو</span>
                    </button>
                  )}
                  {canRetry && (
                    <button
                      className="actions-menu-item w-full"
                      onClick={(e) => { e.stopPropagation(); teacherActions.onRetryProcessing(); }}
                    >
                      <Icon name="sync" size="sm" />
                      <span>إعادة المعالجة</span>
                    </button>
                  )}
                  <button
                    className="actions-menu-item danger w-full"
                    onClick={(e) => { e.stopPropagation(); teacherActions.onDelete(); }}
                  >
                    <Icon name="trash" size="sm" />
                    <span>حذف</span>
                  </button>

                </div>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <Link
          href={href}
          className="text-base font-bold text-white leading-snug hover:text-primary transition-colors line-clamp-2"
        >
          {video.title}
        </Link>

        {/* Description */}
        <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px] leading-relaxed">
          {video.description || 'بدون وصف'}
        </p>

        {/* Meta grid */}
        <div className="grid gap-2 flex-1">
          <MetaRow icon="calendar">{formatDisplayDate(video)}</MetaRow>
          {video.grade?.name && isTeacher && (
            <MetaRow icon="graduation-cap">{video.grade.name}</MetaRow>
          )}
          <MetaRow icon="users">{video.groups?.length || 0} مجموعة</MetaRow>
          <div className="flex items-center gap-4 text-sm text-gray-400 pt-1 border-t border-white/5">
            <span className="flex items-center gap-1.5">
              <Icon name="thumbs-up" size="sm" className="text-primary" />
              {video.likes_count ?? 0}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="comments" size="sm" className="text-primary" />
              {video.comments_count ?? 0}
            </span>
            {isTeacher && (
              <span className="flex items-center gap-1.5">
                <Icon name="paperclip" size="sm" className="text-primary" />
                {video.attachments_count ?? 0}
              </span>
            )}
            {isTeacher && (
              <span className="flex items-center gap-1.5">
                <Icon name="book-open" size="sm" className="text-primary" />
                {video.quiz_count ?? (video.quiz ? 1 : 0)}
              </span>
            )}
          </div>
        </div>

        {/* Student: watch progress card */}
        {!isTeacher && watchedPct > 0 && (
          <div className="space-y-1 pt-2 border-t border-white/5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>تقدم المشاهدة</span>
              <span className={watchedPct >= 80 ? 'text-emerald-400' : 'text-primary'}>{watchedPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${progressColor(watchedPct)}`}
                style={{ width: `${watchedPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Teacher: action buttons */}
        {isTeacher && teacherActions && (
          <div className="flex gap-2 pt-2 border-t border-white/5">
            {canPublish && (
              <button
                type="button"
                onClick={teacherActions.onPublish}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all"
              >
                <Icon name="upload" size="sm" />
                نشر
              </button>
            )}
            {canRetry && (
              <button
                type="button"
                onClick={teacherActions.onRetryProcessing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium bg-orange-400/10 hover:bg-orange-400/20 text-orange-400 border border-orange-400/20 transition-all"
              >
                <Icon name="sync" size="sm" />
                إعادة
              </button>
            )}
            {isPublished && (
              <div className="flex items-center justify-center text-xs text-emerald-400 gap-1.5 flex-1">
                <Icon name="check-circle" size="sm" />
                <span>متاح للطلاب</span>
              </div>
            )}
            <Link
              href={href}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              <Icon name="eye" size="sm" />
              عرض
            </Link>
          </div>
        )}

        {/* Student: view button */}
        {!isTeacher && (
          <Link
            href={href}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 transition-all mt-auto"
          >
            <Icon name="play-circle" size="sm" />
            مشاهدة الفيديو
          </Link>
        )}
      </div>
    </div>
  );
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────

export function VideoCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#101426]/60 overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-white/10" />
          <div className="h-5 w-12 rounded-full bg-white/5" />
        </div>
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-2/3 rounded bg-white/5" />
        <div className="flex gap-3 pt-2">
          <div className="h-3 w-20 rounded bg-white/5" />
          <div className="h-3 w-16 rounded bg-white/5" />
        </div>
        <div className="h-9 w-full rounded-xl bg-white/5" />
      </div>
    </div>
  );
}
