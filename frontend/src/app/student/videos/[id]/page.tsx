'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/EnhancedAuthContext';
import {
  getStudentVideo,
  getVideoComments,
  toggleVideoLike,
} from '@/services/videoService';
import type { VideoComment, VideoItem, VideoWatchProgress } from '@/types/video.types';
import { SecureVideoPlayer } from '@/components/video/SecureVideoPlayer';
import { VideoCommentsSection } from '@/components/video/VideoCommentsSection';

export default function StudentVideoDetailsPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [progress, setProgress] = useState<VideoWatchProgress | null>(null);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVideo = useCallback(async () => {
    if (!params.id) return;

    setLoading(true);
    try {
      const response = await getStudentVideo(params.id);
      setVideo(response.video);
      setProgress(response.progress);
      setComments(response.comments || []);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const reloadComments = useCallback(async () => {
    if (!params.id) return;
    const loadedComments = await getVideoComments(params.id);
    setComments(loadedComments);
  }, [params.id]);

  useEffect(() => {
    void loadVideo();
  }, [loadVideo]);

  if (loading) {
    return (
      <DashboardLayout role="student" user={user || undefined} title="الفيديو التعليمي">
        <p className="text-gray-300">جاري التحميل...</p>
      </DashboardLayout>
    );
  }

  if (!video) {
    return (
      <DashboardLayout role="student" user={user || undefined} title="الفيديو التعليمي">
        <p className="text-red-300">الفيديو غير متاح حالياً.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student" user={user || undefined} title={video.title}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <SecureVideoPlayer
            videoId={video.id}
            studentName={user?.name || 'Student'}
            studentPhone={user?.phone || ''}
            watermarkEnabled
            watermarkRotationIntervalSeconds={8}
          />

          <VideoCommentsSection
            videoId={video.id}
            comments={comments}
            canDeleteOwn
            currentUserId={user?.id ? String(user.id) : undefined}
            onRefresh={reloadComments}
          />
        </div>

        <aside className="space-y-4 rounded-xl border border-white/10 bg-[#1e1e2d] p-4">
          <h3 className="text-lg font-bold text-white">تفاصيل الفيديو</h3>
          <p className="text-sm text-gray-300">{video.description || 'بدون وصف'}</p>

          <div className="space-y-2 text-sm text-gray-300">
            <p>الحالة: {video.status}</p>
            <p>مدة الفيديو: {video.duration_seconds || 0} ثانية</p>
            <p>نسبة المشاهدة: {progress?.watched_percentage || 0}%</p>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              void toggleVideoLike(video.id).then((result) => {
                setVideo((current) => current ? { ...current, likes_count: result.likes_count } : current);
              })
            }
          >
            👍 إعجاب ({video.likes_count || 0})
          </Button>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-white">المرفقات</h4>
            <div className="space-y-2">
              {(video.attachments || []).map((attachment) => (
                <a
                  key={attachment.id}
                  href={`/api/v1/student/videos/${video.id}/attachments/${attachment.id}`}
                  className="block rounded-lg border border-white/10 p-2 text-sm text-blue-200 hover:bg-white/5"
                >
                  {attachment.file_name}
                </a>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  );
}
