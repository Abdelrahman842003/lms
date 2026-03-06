'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { VideoCard } from '@/components/dashboard/VideoCard';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { Filter } from '@/components/Filter';
import { AppNotFound } from '@/components/shared/AppNotFound';
import { Button, Icon, Input, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  deleteTeacherVideo,
  getTeacherVideos,
  publishTeacherVideo,
  retryTeacherVideoProcessing,
} from '@/services/videoService';
import type { VideoItem } from '@/types/video.types';

export default function TeacherVideosPage() {
  const { user, selectedAcademy, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isIndependentSelected = selectedAcademy?.id === 'independent';

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProcessingStatus, setSelectedProcessingStatus] = useState('');
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
      const list = await getTeacherVideos();
      setVideos(list);
    } catch (error) {
      console.error('Failed to load videos:', error);
      toast.error('فشل تحميل الفيديوهات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    if (!isIndependentSelected) {
      setVideos([]);
      setLoading(false);
      return;
    }

    void fetchVideos();
  }, [authLoading, isIndependentSelected]);

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

  const filteredVideos = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return videos.filter((video) => {
      const matchSearch =
        !normalizedSearch ||
        video.title.toLowerCase().includes(normalizedSearch) ||
        (video.description || '').toLowerCase().includes(normalizedSearch);

      const matchStatus = !selectedStatus || video.status === selectedStatus;
      const matchProcessing = !selectedProcessingStatus || video.processing_status === selectedProcessingStatus;

      return matchSearch && matchStatus && matchProcessing;
    });
  }, [videos, searchQuery, selectedStatus, selectedProcessingStatus]);

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
      await publishTeacherVideo(video.id);
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
      await retryTeacherVideoProcessing(video.id);
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
      await deleteTeacherVideo(videoToDelete.id);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-400 mt-4">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isIndependentSelected) {
    return (
      <AppNotFound
        description="هذه الصفحة متاحة فقط عند اختيار وضع المدرس المستقل."
        hint="تلميح: اختر (مدرس مستقل) من مبدّل الأكاديمية في أعلى الصفحة."
        actionHref="/teacher/dashboard"
        actionLabel="الرجوع للوحة التحكم"
      />
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
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
          <Button onClick={() => router.push('/teacher/videos/create')} variant="primary" className="max-md:w-full max-md:justify-center">
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
              { value: '', label: 'كل المعالجات' },
              { value: 'pending', label: 'في الانتظار' },
              { value: 'running', label: 'جارية' },
              { value: 'succeeded', label: 'نجحت' },
              { value: 'failed', label: 'فشلت' },
            ]}
            value={selectedProcessingStatus}
            onChange={setSelectedProcessingStatus}
            placeholder="حالة المعالجة"
            className="w-full"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="rounded-2xl bg-[#101426]/15 border border-white/10 h-[320px] flex flex-col gap-4 p-6">
              <div className="flex justify-between items-start">
                <div className="skeleton-item w-[60%] h-6"></div>
                <div className="skeleton-item w-[20%] h-6 rounded-xl"></div>
              </div>
              <div className="skeleton-item w-full h-10"></div>
              <div className="flex flex-col gap-3 mt-auto">
                <div className="skeleton-item w-[40%] h-4"></div>
                <div className="skeleton-item w-[50%] h-4"></div>
                <div className="skeleton-item w-[30%] h-4"></div>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="skeleton-item flex-1 h-9 rounded-lg"></div>
                <div className="skeleton-item flex-1 h-9 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="text-center p-12 bg-white/2 rounded-2xl">
          <Icon name="film" size="2x" className="text-gray-light mb-4 opacity-50" />
          <p className="text-gray-light text-lg">لا توجد فيديوهات مطابقة</p>
          <Button onClick={() => router.push('/teacher/videos/create')} variant="primary" className="mt-4">
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
              isMenuOpen={openMenuId === video.id}
              onMenuToggle={(event) => {
                event.stopPropagation();
                setOpenMenuId(openMenuId === video.id ? null : video.id);
              }}
              onPublish={() => void handlePublish(video)}
              onRetryProcessing={() => void handleRetry(video)}
              onDelete={() => {
                setVideoToDelete(video);
                setIsDeleteModalOpen(true);
                setOpenMenuId(null);
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
