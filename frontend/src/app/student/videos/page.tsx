'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Icon } from '@/components/ui';
import { AppNotFound } from '@/components/shared/AppNotFound';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getStudentVideos } from '@/services/videoService';
import type { VideoItem } from '@/types/video.types';
import { VideoCard, VideoCardSkeleton } from '@/components/video/VideoCard';

export default function StudentVideosPage() {
  const { user, selectedTeacher } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const hasSelectedTeacher = !!selectedTeacher;
  const hasVideosAddon = selectedTeacher?.has_videos_addon !== false;
  const canAccessVideos = hasSelectedTeacher && hasVideosAddon;

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      try {
        setVideos(await getStudentVideos());
      } finally {
        setLoading(false);
      }
    };

    if (!canAccessVideos) {
      setVideos([]);
      setLoading(false);
      return;
    }

    void loadVideos();
  }, [canAccessVideos]);

  const stats = useMemo(() => {
    const totalLikes = videos.reduce((sum, video) => sum + (video.likes_count || 0), 0);
    const totalComments = videos.reduce((sum, video) => sum + (video.comments_count || 0), 0);
    const totalAttachments = videos.reduce((sum, video) => sum + (video.attachments_count || 0), 0);
    const totalDurationSeconds = videos.reduce((sum, video) => sum + (video.duration_seconds || 0), 0);

    return {
      totalVideos: videos.length,
      totalLikes,
      totalComments,
      totalAttachments,
      totalDurationMinutes: Math.floor(totalDurationSeconds / 60),
    };
  }, [videos]);

  if (!hasSelectedTeacher) {
    return (
      <AppNotFound
        title="اختر مدرساً"
        description="يرجى اختيار مدرس أولاً لعرض مكتبة الفيديوهات الخاصة به."
        hint="تلميح: اختر المدرس من صفحة المعلمين ثم ارجع لمكتبة الفيديوهات."
        actionHref="/student/teachers"
        actionLabel="اختيار مدرس"
      />
    );
  }

  if (!hasVideosAddon) {
    return (
      <AppNotFound
        title="الميزة غير متاحة"
        description="باقة الفيديوهات غير مفعلة لهذا المدرس حالياً."
        hint="تلميح: يمكنك متابعة المحاضرات والامتحانات مع هذا المدرس بدون فيديوهات."
        actionHref="/student/dashboard"
        actionLabel="الرجوع للوحة التحكم"
      />
    );
  }

  return (
    <DashboardLayout role="student" user={user || undefined}>
      {/* Page Header */}
      <div className="relative mb-12 p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] premium-glass premium-border overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 blur-[120px] translate-y-1/2 -translate-x-1/3"></div>

        <div className="relative flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-right">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-primary text-4xl shadow-2xl premium-border">
              <Icon name="film" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">مكتبة الفيديو</h2>
              <p className="text-gray-light/60 text-lg font-medium">شاهد المحاضرات المسجلة وراجع دروسك في أي وقت</p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">المعلم الحالي</span>
                <span className="text-xl font-black text-white">{selectedTeacher?.teacher_name || (selectedTeacher as any)?.name || 'اختر مدرساً'}</span>
             </div>
             <div className="w-px h-10 bg-white/10 hidden md:block" />
             <div className="flex flex-col items-center md:items-end">
                <span className="text-[10px] font-black text-gray-light/30 uppercase tracking-[0.2em] mb-1">إجمالي المحتوى</span>
                <span className="text-xl font-black text-white">{videos.length} فيديو تعليمي</span>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6 mb-10">
        <StatCard
          title="إجمالي الفيديوهات"
          value={stats.totalVideos}
          icon="fas fa-play-circle"
          color="primary"
          variant="centered"
        />
        <StatCard
          title="إجمالي الإعجابات"
          value={stats.totalLikes}
          icon="fas fa-heart"
          color="success"
          variant="centered"
        />
        <StatCard
          title="إجمالي التعليقات"
          value={stats.totalComments}
          icon="fas fa-comments"
          color="warning"
          variant="centered"
        />
        <StatCard
          title="إجمالي المدة"
          value={stats.totalDurationMinutes}
          suffix=" د"
          icon="fas fa-clock"
          color="info"
          variant="centered"
        />
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <VideoCardSkeleton key={i} />)
        ) : videos.length === 0 ? (
          <div className="col-span-full premium-glass py-24 rounded-[3rem] border-white/5 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-gray-light/20 mb-6">
              <Icon name="film" size="2x" />
            </div>
            <p className="text-gray-light/40 font-medium">لا توجد فيديوهات متاحة في مكتبتك حالياً</p>
          </div>
        ) : (
          videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              href={`/student/videos/${video.id}`}
              role="student"
            />
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
