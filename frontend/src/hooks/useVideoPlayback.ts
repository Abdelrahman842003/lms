'use client';

import { useCallback, useRef, useState } from 'react';
import { issuePlaybackToken } from '@/services/videoService';
import { fetchApi } from '@/services/api/baseApi';
import type { PlaybackTokenPayload } from '@/types/video.types';

export function useVideoPlayback(videoId: string) {
  const [payload, setPayload] = useState<PlaybackTokenPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deviceFingerprintRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');

  const ensureSession = useCallback(() => {
    if (!deviceFingerprintRef.current) {
      const key = `video-device:${videoId}`;
      const existing = localStorage.getItem(key);
      const generated = existing || `dev_${crypto.randomUUID()}`;
      localStorage.setItem(key, generated);
      deviceFingerprintRef.current = generated;
    }

    if (!sessionIdRef.current) {
      sessionIdRef.current = `sess_${crypto.randomUUID()}`;
    }
  }, [videoId]);

  const refreshToken = useCallback(async () => {
    ensureSession();
    setLoading(true);
    setError(null);

    try {
      // Step 1: issue a playback token
      const tokenPayload = await issuePlaybackToken(videoId, {
        device_fingerprint: deviceFingerprintRef.current,
        session_id: sessionIdRef.current,
      });

      // Step 2: exchange the token for a direct R2 signed URL via the backend
      // This avoids the browser following a redirect that loses the token,
      // and lets R2 serve the video directly with proper range-request support.
      try {
        const urlResponse = await fetchApi<{ url: string }>(
          `/student/videos/${videoId}/stream-url?token=${encodeURIComponent(tokenPayload.token)}`
        );
        tokenPayload.stream_url = urlResponse.url;
      } catch {
        // Fallback: use the stream endpoint as a redirect (legacy behaviour)
        if (!tokenPayload.stream_url && tokenPayload.stream_endpoint) {
          tokenPayload.stream_url = `${tokenPayload.stream_endpoint}?token=${encodeURIComponent(tokenPayload.token)}`;
        }
      }

      setPayload(tokenPayload);
      return tokenPayload;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذر إصدار رمز التشغيل.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ensureSession, videoId]);

  return {
    payload,
    loading,
    error,
    refreshToken,
    deviceFingerprint: deviceFingerprintRef.current,
    sessionId: sessionIdRef.current,
  };
}
