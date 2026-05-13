'use client';

/**
 * VideoCard — unified card component used by both Teacher & Student pages.
 */

import React, { useRef } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils';
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
  return new Date(raw).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' });
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
  if (pct >= 80) return 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]';
  if (pct >= 40) return 'bg-primary shadow-[0_0_10px_rgba(66,99,235,0.5)]';
  return 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]';
}

function progressLabel(pct: number): string {
  if (pct === 0) return 'لم تبدأ';
  if (pct < 30) return 'بدأت';
  if (pct < 80) return 'جارية';
  return 'مكتمل ✓';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProtectedThumbnail({ thumbnailUrl }: { thumbnailUrl?: string | null }) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelLong = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#0a0f1e] select-none"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      onTouchStart={() => {
        longPressTimer.current = setTimeout(() => {}, 500);
      }}
      onTouchEnd={cancelLong}
      onTouchMove={cancelLong}
    >
      {thumbnailUrl ? (
        <>
          <img
            src={thumbnailUrl}
            alt=""
            draggable={false}
            className="w-full h-full object-cover pointer-events-none transition-transform duration-700 group-hover:scale-110"
            style={{ userSelect: 'none' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-white/5 to-white/0">
          <Icon name="film" className="text-4xl text-primary/20" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-light/20">لا توجد صورة</span>
        </div>
      )}

      {/* Play Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(66,99,235,0.6)]">
            <Icon name="play" className="text-white text-lg ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, color = 'primary' }: { icon: string; label: string; color?: 'primary' | 'secondary' | 'warning' | 'info' }) {
  const colors = {
    primary: 'text-primary bg-primary/5 border-primary/10',
    secondary: 'text-secondary bg-secondary/5 border-secondary/10',
    warning: 'text-warning bg-warning/5 border-warning/10',
    info: 'text-info bg-info/5 border-info/10',
  };

  return (
    <div className={cn("flex items-center gap-2 p-2 rounded-xl border transition-all", colors[color])}>
      <Icon name={icon} size="xs" />
      <span className="text-[10px] font-bold truncate">{label}</span>
    </div>
  );
}

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface TeacherActions {
  isMenuOpen: boolean;
  onMenuToggle: (e: React.MouseEvent) => void;
  onPublish: () => void;
  onRetryProcessing: () => void;
  onDelete: () => void;
}

interface VideoCardProps {
  video: VideoItem;
  href: string;
  role: 'teacher' | 'student';
  watchProgress?: VideoWatchProgress | null;
  teacherActions?: TeacherActions;
}

// ─── VideoCard ────────────────────────────────────────────────────────────────

export const VideoCard: React.FC<VideoCardProps> = ({
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
      className={cn(
        "group relative flex flex-col rounded-[2.5rem] border premium-glass premium-border overflow-hidden transition-all duration-500 hover:-translate-y-2",
        isPublished ? "shadow-[0_20px_50px_rgba(66,99,235,0.15)] border-primary/20" : "hover:border-white/20"
      )}
    >
      {/* ── Thumbnail Section ── */}
      <Link href={href} className="block relative p-3 pb-0">
        <ProtectedThumbnail thumbnailUrl={video.thumbnail_url} />
        
        {/* Duration Chip */}
        {video.duration_seconds && (
          <span className="absolute bottom-5 left-5 px-3 py-1 rounded-lg bg-black/60 text-white text-[10px] font-black tracking-widest backdrop-blur-md border border-white/10">
            {formatVideoDuration(video.duration_seconds)}
          </span>
        )}

        {/* Status Badge Over Thumbnail */}
        <div className="absolute top-6 right-6">
          <Badge 
            variant={statusVariant(video)} 
            size="sm" 
            className="shadow-xl backdrop-blur-md"
          >
            {statusLabel(video)}
          </Badge>
        </div>
      </Link>

      {/* ── Content Body ── */}
      <div className="flex flex-col flex-1 p-6 md:p-8 gap-4">
        
        {/* Header: Title & Actions */}
        <div className="flex items-start justify-between gap-4">
          <Link href={href} className="flex-1">
            <h3 className="text-lg md:text-xl font-black text-white leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {video.title}
            </h3>
          </Link>

          {isTeacher && teacherActions && (
            <div className="relative">
              <button
                onClick={teacherActions.onMenuToggle}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-light hover:text-white hover:bg-primary/20 hover:border-primary/40 transition-all"
              >
                <Icon name="ellipsis-v" />
              </button>

              {teacherActions.isMenuOpen && (
                <div className="absolute left-0 top-12 w-48 rounded-2xl premium-glass premium-border p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  {canPublish && (
                    <button onClick={(e) => { e.stopPropagation(); teacherActions.onPublish(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-primary/20 transition-all">
                      <Icon name="upload" className="text-primary" />
                      <span>نشر الفيديو</span>
                    </button>
                  )}
                  {canRetry && (
                    <button onClick={(e) => { e.stopPropagation(); teacherActions.onRetryProcessing(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:bg-warning/20 transition-all">
                      <Icon name="sync" className="text-warning" />
                      <span>إعادة المعالجة</span>
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); teacherActions.onDelete(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all">
                    <Icon name="trash" />
                    <span>حذف الفيديو</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-light/50 line-clamp-2 leading-relaxed">
          {video.description || 'لا يوجد وصف مضاف لهذا الفيديو التعليمي.'}
        </p>

        {/* Info Grid (Tiles) */}
        <div className="grid grid-cols-2 gap-2">
          <InfoTile icon="calendar" label={formatDisplayDate(video)} color="primary" />
          <InfoTile icon="users" label={`${video.groups?.length || 0} مجموعات`} color="info" />
          {video.grade?.name && (
            <div className="col-span-2">
              <InfoTile icon="graduation-cap" label={video.grade.name} color="secondary" />
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 py-4 border-y border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-light/60">
            <Icon name="thumbs-up" size="xs" className="text-primary" />
            {video.likes_count ?? 0}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-light/60">
            <Icon name="comments" size="xs" className="text-secondary" />
            {video.comments_count ?? 0}
          </div>
          {isTeacher && (
            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-light/60">
              <Icon name="paperclip" size="xs" className="text-info" />
              {video.attachments_count ?? 0}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 mt-auto">
          {isTeacher ? (
            <div className="flex gap-2">
              <Link
                href={href}
                className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[1rem] bg-white/5 border border-white/10 text-white text-xs font-black hover:bg-white/10 transition-all"
              >
                <Icon name="eye" size="sm" />
                <span>عرض التفاصيل</span>
              </Link>
              {canPublish && (
                <button
                  onClick={teacherActions.onPublish}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-[1rem] bg-primary text-white text-xs font-black shadow-[0_5px_15px_rgba(66,99,235,0.4)] hover:shadow-[0_8px_25px_rgba(66,99,235,0.6)] transition-all"
                >
                  <Icon name="upload" size="sm" />
                  <span>نشر الآن</span>
                </button>
              )}
              {isPublished && (
                <div className="flex flex-1 items-center justify-center gap-2 text-success font-black text-[10px]">
                  <Icon name="check-circle" size="xs" />
                  <span>متاح للطلاب</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {watchedPct > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-light/40 px-1">
                    <span>تقدم المشاهدة</span>
                    <span className={watchedPct >= 80 ? 'text-success' : 'text-primary'}>{watchedPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", progressColor(watchedPct))}
                      style={{ width: `${watchedPct}%` }}
                    />
                  </div>
                </div>
              )}
              <Link
                href={href}
                className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-black hover:shadow-[0_10px_30px_rgba(66,99,235,0.4)] transition-all"
              >
                <Icon name="play-circle" />
                <span>مشاهدة الفيديو</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

export function VideoCardSkeleton() {
  return (
    <div className="rounded-[2.5rem] border border-white/10 bg-[#101426]/60 p-3 space-y-4 animate-pulse">
      <div className="aspect-video rounded-2xl bg-white/5" />
      <div className="p-4 space-y-4">
        <div className="h-6 w-3/4 bg-white/5 rounded-lg" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-3 w-2/3 bg-white/5 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-8 bg-white/5 rounded-xl" />
          <div className="h-8 bg-white/5 rounded-xl" />
        </div>
        <div className="h-12 w-full bg-white/5 rounded-2xl" />
      </div>
    </div>
  );
}
