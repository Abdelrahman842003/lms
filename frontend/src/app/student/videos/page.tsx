'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Icon } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import { getStudentVideos } from '@/services/videoService';
import type { VideoItem } from '@/types/video.types';
import { VideoCard, VideoCardSkeleton } from '@/components/video/VideoCard';

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
    <DashboardLayout role="student" user={user || undefined}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
        <StatCard title="إجمالي الفيديوهات" value={stats.totalVideos} icon="fas fa-play-circle" color="info" variant="centered" />
        <StatCard title="إجمالي الإعجابات" value={stats.totalLikes} icon="fas fa-thumbs-up" color="primary" variant="centered" />
        <StatCard title="إجمالي التعليقات" value={stats.totalComments} icon="fas fa-comments" color="success" variant="centered" />
        <StatCard title="إجمالي مدة المشاهدة" value={stats.totalDurationMinutes} suffix=" د" icon="fas fa-clock" color="warning" variant="centered" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => <VideoCardSkeleton key={i} />)
        ) : videos.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <Icon name="film" className="text-5xl text-primary/30 mb-4" />
            <p className="text-lg">لا توجد فيديوهات متاحة حالياً</p>
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
