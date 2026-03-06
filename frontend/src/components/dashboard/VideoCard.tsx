import React from 'react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import type { VideoItem } from '@/types/video.types';

interface VideoCardProps {
  video: VideoItem;
  isMenuOpen: boolean;
  onMenuToggle: (event: React.MouseEvent) => void;
  onPublish: () => void;
  onRetryProcessing: () => void;
  onDelete: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isMenuOpen,
  onMenuToggle,
  onPublish,
  onRetryProcessing,
  onDelete,
}) => {
  const canPublish = video.status === 'ready' || video.status === 'scheduled';
  const canRetry = video.status === 'failed';
  const isPublished = video.status === 'published';
  const isProcessing = ['uploading', 'uploaded', 'processing'].includes(video.status);

  const statusVariant = (() => {
    if (isPublished) return 'success';
    if (canPublish) return 'warning';
    if (canRetry || video.processing_status === 'failed') return 'danger';
    if (isProcessing) return 'info';
    return 'secondary';
  })();

  const statusLabel = (() => {
    if (video.status === 'published') return 'منشور';
    if (video.status === 'scheduled') return 'مجدول';
    if (video.status === 'ready') return 'جاهز للنشر';
    if (video.status === 'failed') return 'فشل';
    if (video.status === 'processing') return 'قيد المعالجة';
    if (video.status === 'uploading' || video.status === 'uploaded') return 'قيد الرفع';
    if (video.status === 'deleted') return 'محذوف';
    return 'مسودة';
  })();

  const processingLabel = (() => {
    if (video.processing_status === 'succeeded') return 'المعالجة مكتملة';
    if (video.processing_status === 'running') return 'المعالجة جارية';
    if (video.processing_status === 'failed') return 'فشل المعالجة';
    return 'في الانتظار';
  })();

  const displayDate = video.published_at || video.scheduled_at || video.created_at;
  const dateText = displayDate
    ? new Date(displayDate).toLocaleDateString('ar-EG')
    : '-';

  return (
    <Card
      hover
      className={`stat-card ux-relative ux-rounded-2xl ux-p-6 ux-transition-all ux-duration-500 ux-ease-in-out ux-flex ux-flex-col ${isMenuOpen ? 'ux-z-10' : ''} ${
        isPublished
          ? 'ux-border-2 ux-border-primary ux-shadow-0-0-30px-rgba-66-99-235-0dot3'
          : 'ux-hover-shadow-0-12px-40px-rgba-0-0-0-0dot3 ux-hover-translate-y-1px ux-hover-backdrop-blur-20px ux-hover-border-1bc5f8-50'
      }`}
    >
      <div className="ux-flex ux-justify-between ux-items-start ux-mb-6">
        <div className="ux-flex ux-gap-2 ux-flex-wrap">
          <Badge variant={statusVariant} size="sm">
            {statusLabel}
          </Badge>

          <Badge variant={video.processing_status === 'failed' ? 'danger' : 'info'} size="sm">
            {processingLabel}
          </Badge>

          {video.teacher_reference?.name && (
            <Badge variant="info" size="sm" icon="chalkboard-teacher">
              {video.teacher_reference.name}
            </Badge>
          )}
        </div>

        <div className="ux-relative">
          <Button
            variant="ghost"
            size="sm"
            className="ux-w-10 ux-h-10 ux-rounded-xl ux-bg-rgba-16-20-38-0dot8 ux-hover-bg-rgba-66-99-235-0dot2 ux-border ux-border-white-10 ux-hover-border-primary-50 ux-flex ux-items-center ux-justify-center ux-transition-all ux-p-0"
            onClick={onMenuToggle}
          >
            <Icon name="ellipsis-v" color="inherit" />
          </Button>

          {isMenuOpen && (
            <div className="actions-menu show actions-menu-card">
              {canPublish && (
                <button
                  className="actions-menu-item ux-w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPublish();
                  }}
                >
                  <Icon name="upload" size="sm" />
                  <span>نشر الفيديو</span>
                </button>
              )}

              {canRetry && (
                <button
                  className="actions-menu-item ux-w-full"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRetryProcessing();
                  }}
                >
                  <Icon name="sync" size="sm" />
                  <span>إعادة المعالجة</span>
                </button>
              )}

              <button
                className="actions-menu-item danger ux-w-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <Icon name="trash" size="sm" />
                <span>حذف</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="ux-text-2xl ux-font-bold ux-text-white ux-mb-3 ux-leading-tight">
        {video.title}
      </h3>

      <p className="ux-text-sm ux-text-gray-light-80 ux-mb-6 ux-line-clamp-2 ux-min-h-40px">
        {video.description || 'بدون وصف'}
      </p>

      <div className="ux-grid ux-gap-3dot5 ux-mb-6">
        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="calendar" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{dateText}</span>
        </div>

        {video.grade?.name && (
          <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
            <Icon name="graduation-cap" className="ux-w-5 ux-text-primary ux-text-base" />
            <span>{video.grade.name}</span>
          </div>
        )}

        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="users" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{video.groups?.length || 0} مجموعة</span>
        </div>

        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="clock" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{video.duration_seconds ? `${video.duration_seconds} ثانية` : 'قيد التحضير'}</span>
        </div>

        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="thumbs-up" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{video.likes_count || 0} لايك</span>
        </div>

        <div className="ux-flex ux-items-center ux-gap-3 ux-text-sm ux-text-gray-light">
          <Icon name="comments" className="ux-w-5 ux-text-primary ux-text-base" />
          <span>{video.comments_count || 0} تعليق</span>
        </div>
      </div>

      <div className="ux-mt-auto ux-grid ux-gap-3">
        {canPublish && (
          <Button
            variant="outline"
            className="ux-flex-1 ux-py-3 ux-rounded-xl ux-bg-rgba-66-99-235-0dot15 ux-hover-bg-rgba-66-99-235-0dot25 ux-text-primary ux-border-primary-30 ux-hover-border-primary-50 ux-font-medium ux-text-xs ux-flex ux-items-center ux-justify-center ux-gap-1dot5 ux-transition-all ux-h-auto"
            onClick={onPublish}
          >
            <Icon name="upload" size="sm" />
            <span>نشر الفيديو</span>
          </Button>
        )}

        {canRetry && (
          <Button
            variant="outline"
            className="ux-flex-1 ux-py-3 ux-rounded-xl ux-bg-rgba-66-99-235-0dot15 ux-hover-bg-rgba-66-99-235-0dot25 ux-text-primary ux-border-primary-30 ux-hover-border-primary-50 ux-font-medium ux-text-xs ux-flex ux-items-center ux-justify-center ux-gap-1dot5 ux-transition-all ux-h-auto"
            onClick={onRetryProcessing}
          >
            <Icon name="sync" size="sm" />
            <span>إعادة المعالجة</span>
          </Button>
        )}

        {isPublished && (
          <div className="ux-flex ux-items-center ux-justify-center ux-text-sm ux-text-primary ux-gap-2 ux-py-2">
            <Icon name="check-circle" />
            <span>الفيديو منشور ومتاح للطلاب</span>
          </div>
        )}
      </div>
    </Card>
  );
};
