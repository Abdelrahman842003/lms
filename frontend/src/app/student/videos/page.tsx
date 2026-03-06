'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardCard } from '@/components/dashboard/DashboardCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Skeleton, Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getStudentVideos } from '@/services/videoService';
import type { VideoItem } from '@/types/video.types';

function formatDuration(durationSeconds?: number | null): string {
  if (!durationSeconds) {
    return 'غير محددة';
  }

  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;

  if (hours > 0) {
    return `${hours}س ${minutes}د`;
  }

  if (minutes > 0) {
    return `${minutes}د ${seconds}ث`;
  }

  return `${seconds}ث`;
}

function formatDisplayDate(video: VideoItem): string {
  const displayDate = video.published_at || video.scheduled_at || video.created_at;

  if (!displayDate) {
    return 'غير محدد';
  }

  return new Date(displayDate).toLocaleDateString('ar-EG');
}

export default function StudentVideosPage() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      setLoading(true);
      try {
        setVideos(await getStudentVideos());
      } finally {
        setLoading(false);
      }
    };

    void loadVideos();
  }, []);

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

  return (
    <DashboardLayout
      role="student"
      user={user || undefined}
      title="الفيديوهات التعليمية"
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
        <StatCard
          title="إجمالي الفيديوهات"
          value={stats.totalVideos}
          icon="fas fa-play-circle"
          color="info"
          variant="centered"
        />
        <StatCard
          title="إجمالي الإعجابات"
          value={stats.totalLikes}
          icon="fas fa-thumbs-up"
          color="primary"
          variant="centered"
        />
        <StatCard
          title="إجمالي التعليقات"
          value={stats.totalComments}
          icon="fas fa-comments"
          color="success"
          variant="centered"
        />
        <StatCard
          title="إجمالي مدة المشاهدة"
          value={stats.totalDurationMinutes}
          suffix=" د"
          icon="fas fa-clock"
          color="warning"
          variant="centered"
        />
      </div>

      <DashboardCard
        title="كل الفيديوهات التعليمية"
        icon="fas fa-video"
      >
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
          {loading ? (
            [1, 2, 3].map((item) => (
              <div
                key={item}
                className="p-5 bg-white/5 rounded-xl border border-white/10"
              >
                <Skeleton width="100%" height="160px" className="mb-4 rounded-xl" />
                <Skeleton width="60%" height="24px" className="mb-3" />
                <Skeleton width="100%" height="16px" className="mb-2" />
                <Skeleton width="80%" height="16px" className="mb-4" />
              </div>
            ))
          ) : (
            videos.map((video) => (
              <Link
                key={video.id}
                href={`/student/videos/${video.id}`}
                className="block p-5 bg-white/5 rounded-xl border border-white/10 border-r-4 border-r-primary transition hover:bg-white/10"
              >
                <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-white/5 aspect-video flex items-center justify-center">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-light">
                      <Icon name="play-circle" className="text-4xl text-primary" />
                      <span className="text-sm">بدون صورة مصغرة</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-start mb-2 gap-3">
                  <h3 className="text-[1.05rem] font-bold text-white">
                    {video.title}
                  </h3>
                  <span className="px-2 py-1 rounded-md text-xs font-medium border bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                    فيديو
                  </span>
                </div>

                <p className="text-[0.85rem] text-gray-light mb-3 line-clamp-2 min-h-[40px]">
                  {video.description || 'بدون وصف'}
                </p>

                <div className="grid gap-3 mb-4">
                  <div className="flex items-center gap-2 text-[0.9rem] text-light">
                    <Icon name="calendar" className="w-5 text-primary" />
                    <span>{formatDisplayDate(video)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[0.9rem] text-light">
                    <Icon name="clock" className="w-5 text-primary" />
                    <span>{formatDuration(video.duration_seconds)}</span>
                  </div>

                  {video.grade?.name && (
                    <div className="flex items-center gap-2 text-[0.9rem] text-light">
                      <Icon name="graduation-cap" className="w-5 text-primary" />
                      <span>{video.grade.name}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[0.9rem] text-light">
                    <Icon name="users" className="w-5 text-primary" />
                    <span>{video.groups?.length || 0} مجموعة</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs text-gray-400 pt-3 border-t border-white/10">
                  <span className="flex items-center gap-2">
                    <Icon name="thumbs-up" className="text-primary" />
                    {video.likes_count || 0} لايك
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon name="comments" className="text-primary" />
                    {video.comments_count || 0} تعليق
                  </span>
                  <span className="flex items-center gap-2">
                    <Icon name="paperclip" className="text-primary" />
                    {video.attachments_count || 0} مرفق
                  </span>
                </div>
              </Link>
            ))
          )}

          {!loading && videos.length === 0 && (
            <div className="col-span-full text-center p-10 text-gray-light">
              لا توجد فيديوهات متاحة حالياً
            </div>
          )}
        </div>
      </DashboardCard>
    </DashboardLayout>
  );
}
