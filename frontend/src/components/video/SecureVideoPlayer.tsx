'use client';

import React, { useEffect, useRef } from 'react';
import { updateVideoProgress } from '@/services/videoService';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { WatermarkOverlay } from './WatermarkOverlay';

interface SecureVideoPlayerProps {
  videoId: string;
  studentName: string;
  studentPhone: string;
  watermarkEnabled: boolean;
  watermarkRotationIntervalSeconds?: number;
}

export function SecureVideoPlayer({
  videoId,
  studentName,
  studentPhone,
  watermarkEnabled,
  watermarkRotationIntervalSeconds = 8,
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSyncRef = useRef<number>(0);
  const { payload, refreshToken } = useVideoPlayback(videoId);

  useEffect(() => {
    void refreshToken();
  }, [refreshToken]);

  const streamUrl = payload?.stream_url || '';

  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;

    const handleTimeUpdate = async () => {
      const now = Date.now();
      if (now - lastSyncRef.current < 8000) return;

      lastSyncRef.current = now;

      try {
        await updateVideoProgress(videoId, {
          watched_seconds: Math.floor(player.currentTime),
          last_position_seconds: Math.floor(player.currentTime),
        });
      } catch {
        // Keep player running even if progress sync fails momentarily.
      }
    };

    const handleEnded = async () => {
      try {
        await updateVideoProgress(videoId, {
          watched_seconds: Math.floor(player.duration || player.currentTime),
          last_position_seconds: Math.floor(player.duration || player.currentTime),
        });
      } catch {
        // Ignore transient end-sync errors.
      }
    };

    const handleError = async () => {
      // Token may expire during long sessions; refresh and continue.
      await refreshToken();
    };

    player.addEventListener('timeupdate', handleTimeUpdate);
    player.addEventListener('ended', handleEnded);
    player.addEventListener('error', handleError);

    return () => {
      player.removeEventListener('timeupdate', handleTimeUpdate);
      player.removeEventListener('ended', handleEnded);
      player.removeEventListener('error', handleError);
    };
  }, [refreshToken, videoId]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
      <video
        ref={videoRef}
        key={streamUrl}
        src={streamUrl}
        controls
        // No web implementation can block screen recording 100%; this only reduces casual leakage.
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(event) => event.preventDefault()}
        className="h-auto w-full"
      />

      {watermarkEnabled && (
        <WatermarkOverlay
          studentName={studentName}
          studentPhone={studentPhone}
          intervalSeconds={watermarkRotationIntervalSeconds}
        />
      )}
    </div>
  );
}
