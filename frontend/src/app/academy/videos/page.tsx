'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Filter } from '@/components/Filter';
import { Button, Icon, Input, LoadingSpinner } from '@/components/ui';
import { VideoCard, VideoCardSkeleton } from '@/components/video/VideoCard';
import { AppNotFound } from '@/components/shared/AppNotFound';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  deleteAcademyVideo,
  getAcademyVideos,
  publishAcademyVideo,
  retryAcademyVideoProcessing,
} from '@/services/videoService';
import type { VideoItem } from '@/types/video.types';

export default function AcademyVideosPage() {
  const { user, selectedAcademy, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const hasVideosAddon = selectedAcademy?.id
    ? Boolean(selectedAcademy?.has_videos_addon)
    : Boolean((user as any)?.has_videos_addon);

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<VideoItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const list = await getAcademyVideos();
      setVideos(list);
    } catch (error) {
      console.error('Failed to load videos:', error);
      toast.error('فشل تحميل الفيديوهات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!hasVideosAddon) {
      setVideos([]);
      setLoading(false);
      return;
    }

    void fetchVideos();
  }, [authLoading, hasVideosAddon]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId === null) return;
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu') && !target.closest('button')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const teacherOptions = useMemo(() => {
    const map = new Map<string, string>();

    videos.forEach((video) => {
      const id = video.teacher_reference?.id;
      const name = video.teacher_reference?.name;

      if (id && name && !map.has(id)) {
        map.set(id, name);
      }
    });

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [videos]);

  const filteredVideos = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return videos.filter((video) => {
      const matchSearch =
        !normalizedSearch ||
        video.title.toLowerCase().includes(normalizedSearch) ||
        (video.description || '').toLowerCase().includes(normalizedSearch);

      const matchStatus = !selectedStatus || video.status === selectedStatus;
      const matchTeacher = !selectedTeacherId || video.teacher_reference?.id === selectedTeacherId;

      return matchSearch && matchStatus && matchTeacher;
    });
  }, [videos, searchQuery, selectedStatus, selectedTeacherId]);

  const stats = useMemo(() => {
    return {
      total: videos.length,
      published: videos.filter((video) => video.status === 'published').length,
      processing: videos.filter((video) => ['uploading', 'uploaded', 'processing'].includes(video.status)).length,
      ready: videos.filter((video) => ['ready', 'scheduled'].includes(video.status)).length,
    };
  }, [videos]);

  const handlePublish = async (video: VideoItem) => {
    try {
      setIsProcessing(true);
      await publishAcademyVideo(video.id);
      toast.success('تم نشر الفيديو بنجاح');
      await fetchVideos();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'فشل نشر الفيديو'));
    } finally {
      setIsProcessing(false);
      setOpenMenuId(null);
    }
  };

  const handleRetry = async (video: VideoItem) => {
    try {
      setIsProcessing(true);
      await retryAcademyVideoProcessing(video.id);
      toast.success('تمت جدولة إعادة المعالجة');
      await fetchVideos();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'فشل إعادة المعالجة'));
    } finally {
      setIsProcessing(false);
      setOpenMenuId(null);
    }
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      setIsProcessing(true);
      await deleteAcademyVideo(videoToDelete.id);
      toast.success('تم حذف الفيديو');
      await fetchVideos();
      setIsDeleteModalOpen(false);
      setVideoToDelete(null);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'فشل حذف الفيديو'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasVideosAddon) {
    return (
      <AppNotFound
        description="باقة الفيديوهات الأونلاين غير مفعلة لهذه الأكاديمية."
        hint="يرجى التواصل مع الإدارة لتفعيل الميزة قبل إدارة الفيديوهات."
        actionHref="/academy/dashboard"
        actionLabel="الرجوع للوحة التحكم"
      />
    );
  }

  return (
    <DashboardLayout
      role="academy"
      user={{ name: user?.name || 'الأكاديمية', avatar: user?.avatar || '' }}
      headerActions={null}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-8">
        <StatCard title="إجمالي الفيديوهات" value={stats.total} icon="film" color="primary" variant="centered" />
        <StatCard title="فيديوهات منشورة" value={stats.published} icon="check-circle" color="success" variant="centered" />
        <StatCard title="قيد المعالجة" value={stats.processing} icon="sync" color="warning" variant="centered" />
        <StatCard title="جاهزة للنشر" value={stats.ready} icon="upload" color="info" variant="centered" />
      </div>

      <div className="header-section flex justify-between items-center mb-6 max-md:flex-col max-md:items-stretch max-md:gap-4">
        <div className="header-title flex items-center gap-3 max-md:w-full max-md:justify-center">
          <div className="w-12 h-12 rounded-xl bg-[rgba(66,99,235,0.1)] flex items-center justify-center text-primary text-2xl">
            <Icon name="film" />
          </div>
          <h2 className="text-2xl font-bold text-white m-0">إدارة الفيديوهات التعليمية</h2>
        </div>
        <div className="header-actions max-md:w-full">
          <Button onClick={() => router.push('/academy/videos/create')} variant="primary" className="max-md:w-full max-md:justify-center">
            <Icon name="plus" />
            <span>إضافة فيديو</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6 max-md:flex-col">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="بحث عن فيديو..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-56 max-md:w-full">
          <Filter
            options={[
              { value: '', label: 'كل الحالات' },
              { value: 'draft', label: 'مسودة' },
              { value: 'uploading', label: 'قيد الرفع' },
              { value: 'processing', label: 'قيد المعالجة' },
              { value: 'ready', label: 'جاهز' },
              { value: 'scheduled', label: 'مجدول' },
              { value: 'published', label: 'منشور' },
              { value: 'failed', label: 'فشل' },
            ]}
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="الحالة"
            className="w-full"
          />
        </div>
        <div className="w-56 max-md:w-full">
          <Filter
            options={[
              { value: '', label: 'كل المدرسين' },
              ...teacherOptions,
            ]}
            value={selectedTeacherId}
            onChange={setSelectedTeacherId}
            placeholder="كل المدرسين"
            className="w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => <VideoCardSkeleton key={item} />)}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center p-12 bg-white/2 rounded-2xl">
          <Icon name="film" size="2x" className="text-gray-light mb-4 opacity-50" />
          <p className="text-gray-light text-lg">لا توجد فيديوهات مطابقة</p>
          <Button onClick={() => router.push('/academy/videos/create')} variant="primary" className="mt-4">
            <Icon name="plus" />
            <span>إضافة فيديو جديد</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              href={`/academy/videos/${video.id}`}
              role="teacher"
              teacherActions={{
                isMenuOpen: openMenuId === video.id,
                onMenuToggle: (event: React.MouseEvent) => {
                  event.stopPropagation();
                  setOpenMenuId(openMenuId === video.id ? null : video.id);
                },
                onPublish: () => void handlePublish(video),
                onRetryProcessing: () => void handleRetry(video),
                onDelete: () => {
                  setVideoToDelete(video);
                  setIsDeleteModalOpen(true);
                  setOpenMenuId(null);
                },
              }}
            />
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="حذف الفيديو"
        message={`هل أنت متأكد من حذف فيديو "${videoToDelete?.title || ''}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="نعم، حذف"
        cancelText="إلغاء"
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setVideoToDelete(null);
        }}
        isProcessing={isProcessing}
        variant="danger"
      />
    </DashboardLayout>
  );
}

