'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { updateVideoProgress } from '@/services/videoService';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import { WatermarkOverlay } from './WatermarkOverlay';
import type { VideoWatchProgress } from '@/types/video.types';
import { Stream } from '@cloudflare/stream-react';

interface SecureVideoPlayerProps {
  videoId: string;
  studentName: string;
  studentPhone: string;
  watermarkEnabled: boolean;
  watermarkRotationIntervalSeconds?: number;
  initialWatchedSeconds?: number;
  onProgressUpdate?: (progress: VideoWatchProgress) => void;
}

export function SecureVideoPlayer({
  videoId,
  studentName,
  studentPhone,
  watermarkEnabled,
  watermarkRotationIntervalSeconds = 8,
  initialWatchedSeconds = 0,
  onProgressUpdate,
}: SecureVideoPlayerProps) {
  const videoRef            = useRef<HTMLVideoElement | null>(null);
  const streamRef           = useRef<any>(null); // Reference for the Stream component
  const lastSyncRef         = useRef<number>(0);
  const isRefreshingRef     = useRef<boolean>(false);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const watchedSecondsRef   = useRef<number>(initialWatchedSeconds);
  const lastTimeRef         = useRef<number>(0);
  const videoIdRef          = useRef<string>(videoId);

  // mounted flag to signal that <video> is in DOM and ready
  const [playerReady, setPlayerReady] = useState(false);

  const [retryCount, setRetryCount] = useState(0);
  const { payload, loading, error, refreshToken } = useVideoPlayback(videoId);

  // Keep refs up-to-date without triggering re-renders
  useEffect(() => { onProgressUpdateRef.current = onProgressUpdate; }, [onProgressUpdate]);
  useEffect(() => { videoIdRef.current = videoId; }, [videoId]);

  // Initial token fetch
  useEffect(() => { void refreshToken(); }, [refreshToken]);

  const streamUrl      = payload?.stream_url ?? null;
  const tokenExpiresAt = payload?.expires_at ?? null;
  const isCloudflare   = payload?.type === 'cloudflare_stream';

  const handleTokenRefreshAndResume = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try { await refreshToken(); } finally { isRefreshingRef.current = false; }
  }, [refreshToken]);

  // Stable ref callback — no dependencies, never recreated
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setPlayerReady(!!node);
  }, []);

  const setStreamRef = useCallback((node: any) => {
    streamRef.current = node;
    setPlayerReady(!!node);
  }, []);

  const handleTimeUpdateCore = useCallback((currentTime: number, duration?: number) => {
    const prev = lastTimeRef.current;
    // Accumulate only forward, continuous playback (ignore seeks)
    if (currentTime > prev && currentTime - prev < 2) {
      watchedSecondsRef.current += currentTime - prev;
    }
    lastTimeRef.current = currentTime;

    const now = Date.now();
    if (now - lastSyncRef.current < 8_000) return;
    lastSyncRef.current = now;

    void updateVideoProgress(videoIdRef.current, {
      watched_seconds:       Math.round(watchedSecondsRef.current),
      last_position_seconds: Math.floor(currentTime),
    }).then((updated) => {
      onProgressUpdateRef.current?.(updated);
    }).catch(() => { /* non-fatal */ });
  }, []);

  const syncNow = useCallback((positionOverride?: number) => {
    const playerTime = isCloudflare ? streamRef.current?.currentTime : videoRef.current?.currentTime;
    const current = positionOverride ?? (playerTime ?? 0);
    lastSyncRef.current = Date.now();
    void updateVideoProgress(videoIdRef.current, {
      watched_seconds:       Math.round(watchedSecondsRef.current),
      last_position_seconds: Math.floor(current),
    }).then((updated) => {
      onProgressUpdateRef.current?.(updated);
    }).catch(() => { /* non-fatal */ });
  }, [isCloudflare]);

  // Register/unregister progress event listeners whenever the native player is ready (Legacy)
  useEffect(() => {
    if (isCloudflare) return; // CF Stream React component handles its own events
    const player = videoRef.current;
    if (!playerReady || !player) return;

    function handleTimeUpdate() {
      if (!player) return;
      handleTimeUpdateCore(player.currentTime, player.duration);
    }

    function handleEnded() {
      if (!player) return;
      syncNow(player.duration || player.currentTime);
    }

    function handlePause() {
      if (!player) return;
      syncNow(player.currentTime);
    }

    function handleError() {
      void handleTokenRefreshAndResume();
    }

    player.addEventListener('timeupdate', handleTimeUpdate);
    player.addEventListener('ended',      handleEnded);
    player.addEventListener('pause',      handlePause);
    player.addEventListener('error',      handleError);

    return () => {
      player.removeEventListener('timeupdate', handleTimeUpdate);
      player.removeEventListener('ended',      handleEnded);
      player.removeEventListener('pause',      handlePause);
      player.removeEventListener('error',      handleError);
    };
  }, [playerReady, handleTokenRefreshAndResume, isCloudflare, handleTimeUpdateCore, syncNow]);

  // Seamlessly update src without re-mounting (Legacy)
  useEffect(() => {
    if (isCloudflare) return;
    const player = videoRef.current;
    if (!player || !streamUrl) return;
    if (player.src === streamUrl) return;

    const currentTime = player.currentTime;
    const wasPaused   = player.paused;
    player.src = streamUrl;
    player.load();

    const onCanPlay = () => {
      player.currentTime = currentTime;
      if (!wasPaused) void player.play();
      player.removeEventListener('canplay', onCanPlay);
    };
    player.addEventListener('canplay', onCanPlay);
  }, [streamUrl, isCloudflare]);

  // Auto-refresh 30 s before expiry
  useEffect(() => {
    if (!tokenExpiresAt) return;
    const delay = new Date(tokenExpiresAt).getTime() - 30_000 - Date.now();
    if (delay <= 0) { void refreshToken(); return; }
    const t = setTimeout(() => void refreshToken(), delay);
    return () => clearTimeout(t);
  }, [tokenExpiresAt, refreshToken]);

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (!streamUrl && loading) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#07090f] border border-white/10 shadow-[0_0_40px_rgba(66,99,235,0.08)]">
        <div className="aspect-video w-full flex flex-col items-center justify-center gap-4">
          {/* shimmer bars */}
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                background: 'linear-gradient(105deg, transparent 40%, rgba(66,99,235,0.5) 50%, transparent 60%)',
                animation: 'shimmer 1.8s infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
          <style>{`@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="text-gray-400 text-sm tracking-wide">جاري تهيئة الفيديو المحمي…</p>
            <p className="text-gray-600 text-xs flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V5L12 2zm0 9h4l-4-8v8z" opacity=".4"/><path d="M12 2L4 5v6c0 5.5 3.8 10.7 8 12V11H8l4-9z"/></svg>
              محتوى محمي · للمشاهدة الشخصية فقط
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error / retry state ─────────────────────────────────────────────────────
  if (!streamUrl && !loading) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden bg-[#07090f] border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.06)]">
        <div className="aspect-video w-full flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold">تعذر تحميل الفيديو</p>
            <p className="text-gray-500 text-sm mt-1">{error || 'يرجى المحاولة مرة أخرى'}</p>
          </div>
          <button
            type="button"
            onClick={() => { setRetryCount(c => c + 1); void refreshToken(); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/40 text-sm font-medium transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={retryCount > 0 ? 'animate-spin' : ''}>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // ── Player ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="group relative w-full rounded-2xl overflow-hidden bg-black border border-white/10
                 shadow-[0_0_0_1px_rgba(66,99,235,0.15),0_20px_60px_rgba(0,0,0,0.6)]
                 hover:shadow-[0_0_0_1px_rgba(66,99,235,0.3),0_20px_80px_rgba(0,0,0,0.7)]
                 transition-shadow duration-500"
      /* Block context-menu & drag on the whole player container */
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Subtle top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent pointer-events-none z-10" />

      {isCloudflare ? (
        <div className="w-full aspect-video" ref={setStreamRef}>
          <Stream
            src={streamUrl}
            controls
            primaryColor="#4263eb"
            className="w-full h-full"
            onTimeUpdate={(e) => handleTimeUpdateCore(e.currentTime, e.duration)}
            onEnded={() => syncNow(streamRef.current?.duration || streamRef.current?.currentTime)}
            onPause={() => syncNow()}
            onError={() => handleTokenRefreshAndResume()}
          />
        </div>
      ) : (
        <video
          ref={setVideoRef}
          src={streamUrl!}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          playsInline
          onContextMenu={(e) => e.preventDefault()}
          className="block w-full h-auto max-h-[72vh]"
          style={{ aspectRatio: '16/9' }}
        />
      )}

      {/* Lock badge — top right corner */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                      bg-black/60 backdrop-blur-md border border-white/10 pointer-events-none select-none">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-primary/80">
          <path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.7 1.4-3.1 3.1-3.1s3.1 1.4 3.1 3.1v2z"/>
        </svg>
        <span className="text-[10px] text-gray-300 font-medium">محمي</span>
      </div>

      {/* Watermark */}
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
