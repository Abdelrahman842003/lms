'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
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
import { VideoCard, VideoCardSkeleton } from '@/components/video/VideoCard';

export default function TeacherVideosPage() {
  const { user, selectedAcademy, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const isIndependentSelected = !selectedAcademy || selectedAcademy?.id === 'independent';
  const hasVideosAddon = isIndependentSelected
    ? Boolean((user as any)?.has_videos_addon)
    : Boolean(selectedAcademy?.has_videos_addon);

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
      setVideos(list || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
      toast.error('فشل تحميل الفيديوهات التعليمية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

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
      published: videos.filter((v) => v.status === 'published').length,
      processing: videos.filter((v) => ['uploading', 'uploaded', 'processing'].includes(v.status)).length,
      ready: videos.filter((v) => ['ready', 'scheduled'].includes(v.status)).length,
    };
  }, [videos]);

  const handlePublish = async (video: VideoItem) => {
    try {
      setIsProcessing(true);
      await publishTeacherVideo(video.id);
      toast.success('تم نشر الفيديو بنجاح للطلاب');
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
      toast.success('تمت جدولة إعادة معالجة الفيديو');
      await fetchVideos();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'فشل إعادة معالجة الفيديو'));
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
      toast.success('تم حذف الفيديو نهائياً');
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
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c1b]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-light/60 mt-4 animate-pulse">جاري تحميل مكتبة الفيديوهات...</p>
        </div>
      </div>
    );
  }



  if (!hasVideosAddon) {
    return (
      <AppNotFound
        description="باقة الفيديوهات الأونلاين غير مفعلة لهذا الحساب."
        hint="يرجى التواصل مع الإدارة أو الاشتراك في باقة الفيديوهات لتفعيل الميزة."
        actionHref="/teacher/subscription"
        actionLabel="الذهاب للاشتراك"
      />
    );
  }

  return (
    <DashboardLayout
      role="teacher"
      user={{ name: user?.name || 'المدرس', avatar: user?.avatar || '' }}
    >
      <div className="space-y-8 pb-12 animate-in fade-in duration-700">
        
        {/* Header Section */}
        <div className="relative p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 blur-[100px] translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-right">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-3xl md:text-4xl shadow-2xl">
                <Icon name="film" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">إدارة الفيديوهات</h1>
                <p className="text-gray-light/60 text-sm md:text-lg font-medium mt-2">تحكم في مكتبتك التعليمية، ارفع فيديوهات جديدة وتابع حالات المعالجة.</p>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/teacher/videos/create')} 
              variant="primary" 
              className="h-14 md:h-16 px-8 rounded-2xl md:rounded-[1.5rem] bg-gradient-to-r from-primary to-secondary hover:shadow-[0_10px_30px_rgba(66,99,235,0.4)] text-white font-black uppercase tracking-widest border-none gap-3 transition-all w-full lg:w-auto"
            >
              <Icon name="plus" />
              <span>إضافة فيديو جديد</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="إجمالي المحتوى" value={stats.total} icon="film" color="primary" variant="premium" />
          <StatCard title="منشور للطلاب" value={stats.published} icon="check-circle" color="success" variant="premium" />
          <StatCard title="قيد المعالجة" value={stats.processing} icon="sync" color="warning" variant="premium" />
          <StatCard title="جاهز للنشر" value={stats.ready} icon="cloud-upload-alt" color="info" variant="premium" />
        </div>

        {/* Filters Section */}
        <div className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] premium-glass premium-border space-y-6">
          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 relative">
              <Icon name="search" className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/40" />
              <Input
                type="text"
                placeholder="ابحث بالعنوان أو الوصف..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full bg-white/5 border-white/10 focus:border-primary/50 h-14 rounded-2xl pr-14 pl-6 text-white text-lg placeholder:text-gray-light/20"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-56">
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
                  placeholder="الحالة العامة"
                  className="w-full h-14"
                />
              </div>
              <div className="w-full md:w-56">
                <Filter
                  options={[
                    { value: '', label: 'حالة المعالجة' },
                    { value: 'pending', label: 'في الانتظار' },
                    { value: 'running', label: 'جارية الآن' },
                    { value: 'succeeded', label: 'مكتملة' },
                    { value: 'failed', label: 'فاشلة' },
                  ]}
                  value={selectedProcessingStatus}
                  onChange={setSelectedProcessingStatus}
                  placeholder="المعالجة التقنية"
                  className="w-full h-14"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map((item) => <VideoCardSkeleton key={item} />)}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="text-center py-24 rounded-[3rem] premium-glass premium-border relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 opacity-20"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                <Icon name="film" className="text-5xl text-primary/20" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">لا توجد فيديوهات</h3>
              <p className="text-gray-light/40 font-medium mb-8">لم نتمكن من العثور على أي محتوى يطابق بحثك حالياً.</p>
              <Button 
                onClick={() => router.push('/teacher/videos/create')} 
                variant="primary"
                className="px-8 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest"
              >
                <Icon name="plus" />
                <span>إضافة أول فيديو لك</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                href={`/teacher/videos/${video.id}`}
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
          title="تأكيد حذف الفيديو"
          message={`أنت على وشك حذف فيديو "${videoToDelete?.title || ''}" بشكل نهائي. سيؤدي هذا إلى مسح جميع البيانات والإحصائيات المرتبطة به. هل أنت متأكد؟`}
          confirmText="نعم، احذف الفيديو"
          cancelText="تراجع عن الإجراء"
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setVideoToDelete(null);
          }}
          isProcessing={isProcessing}
          variant="danger"
        />
      </div>
    </DashboardLayout>
  );
}
