'use client';

import { useCallback, useRef, useState } from 'react';
import { issuePlaybackToken } from '@/services/videoService';
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
      const tokenPayload = await issuePlaybackToken(videoId, {
        device_fingerprint: deviceFingerprintRef.current,
        session_id: sessionIdRef.current,
      });
      setPayload(tokenPayload);
      return tokenPayload;
    } catch (err: any) {
      setError(err?.message || 'تعذر إصدار رمز التشغيل.');
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
