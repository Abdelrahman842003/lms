'use client';

import { useCallback, useRef, useState } from 'react';
import * as tus from 'tus-js-client';
import {
  abortAcademyUpload,
  abortTeacherUpload,
  initiateAcademyUpload,
  initiateTeacherUpload,
  uploadAttachments,
} from '@/services/videoService';
import type { InitiateUploadPayload } from '@/types/video.types';

// ─── State machine ────────────────────────────────────────────────────────────

export type UploadPhase =
  | 'idle'
  | 'preparing'   // calling /initiate-upload
  | 'uploading'   // TUS upload in progress
  | 'paused'      // TUS upload paused
  | 'completing'  // Waiting for Stream webhook to process (though we mark completed immediately)
  | 'completed'
  | 'failed'
  | 'aborted';

export interface UploadState {
  phase: UploadPhase;
  /** 0–100 overall percentage */
  progress: number;
  /** Current bytes uploaded */
  uploadedBytes: number;
  /** Total bytes */
  totalBytes: number;
  videoId: string | null;
  sessionId: string | null;
  error: string | null;
}

// ─── Hook options ─────────────────────────────────────────────────────────────

export interface UseVideoUploadOptions {
  mode: 'teacher' | 'academy';
  /** Called on successful completion */
  onCompleted?: (videoId: string) => void;
  /** Called when upload is aborted by user */
  onAborted?: () => void;
  /** Max retry attempts for TUS (default is handled by TUS itself, but we can configure if needed) */
  maxRetries?: number;
  /** Concurrency limit is not strictly used by standard TUS in the same way, but kept for signature compatibility */
  concurrency?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVideoUpload({
  mode,
  onCompleted,
  onAborted,
}: UseVideoUploadOptions) {
  const [state, setState] = useState<UploadState>({
    phase: 'idle',
    progress: 0,
    uploadedBytes: 0,
    totalBytes: 0,
    videoId: null,
    sessionId: null,
    error: null,
  });

  const uploadRef = useRef<tus.Upload | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const videoIdRef = useRef<string | null>(null);

  const patch = useCallback((partial: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  // ── Main upload function ───────────────────────────────────────────────────

  const startUpload = useCallback(
    async (
      file: File,
      metadata: Omit<InitiateUploadPayload, 'file_name' | 'file_size' | 'file_mime' | 'total_parts' | 'file_fingerprint'>,
      attachments?: File[]
    ): Promise<void> => {
      // 1. Reset state
      patch({
        phase: 'preparing',
        progress: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
        videoId: null,
        sessionId: null,
        error: null,
      });

      let sessionId: string;
      let videoId: string;
      let tusUploadUrl: string;

      try {
        // 2. Initiate via backend (creates DB record and gets CF Stream TUS URL)
        const initiatePayload: InitiateUploadPayload = {
          ...metadata,
          file_name: file.name,
          file_size: file.size,
          file_mime: file.type || 'application/octet-stream',
          total_parts: 1, // Not strictly used by TUS, but required by type
          file_fingerprint: `${file.name}-${file.size}-${file.lastModified}`,
        };

        const response =
          mode === 'teacher'
            ? await initiateTeacherUpload(initiatePayload)
            : await initiateAcademyUpload(initiatePayload);

        sessionId = response.session_id;
        videoId = response.video_id;
        // The backend must return tus_upload_url from Cloudflare Stream
        if (!response.tus_upload_url) {
          throw new Error('لم يتم استلام رابط الرفع (TUS URL) من الخادم.');
        }
        tusUploadUrl = response.tus_upload_url;

        sessionIdRef.current = sessionId;
        videoIdRef.current = videoId;
        patch({ sessionId, videoId });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'فشل بدء الرفع.';
        patch({ phase: 'failed', error: message });
        return;
      }

      // 3. Start TUS upload directly to Cloudflare Stream
      return new Promise<void>((resolve) => {
        const upload = new tus.Upload(file, {
          endpoint: tusUploadUrl,
          // If the endpoint is already a specific upload URL (which it is for CF Stream),
          // tus-js-client will PUT to it directly if we set uploadUrl.
          uploadUrl: tusUploadUrl,
          retryDelays: [0, 3000, 5000, 10000, 20000],
          chunkSize: 50 * 1024 * 1024, // 50MB chunks
          onError: async (error) => {
            patch({ phase: 'failed', error: 'فشل الرفع: ' + error.message });
            try {
              if (mode === 'teacher') await abortTeacherUpload(sessionId, error.message);
              else await abortAcademyUpload(sessionId, error.message);
            } catch {
              // ignore
            }
            resolve();
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const percentage = Math.min(99, Math.round((bytesUploaded / bytesTotal) * 100));
            patch({
              phase: 'uploading',
              progress: percentage,
              uploadedBytes: bytesUploaded,
              totalBytes: bytesTotal,
            });
          },
          onSuccess: async () => {
            patch({ phase: 'completing', progress: 100 });

            // Note: with CF Stream TUS, completing the TUS upload means the video is done.
            // We no longer call the backend complete-upload endpoint for videos.
            // The backend webhook will handle the "ready" event.

            // 4. Upload attachments if any
            if (attachments && attachments.length > 0) {
              const attachEndpoint =
                mode === 'teacher'
                  ? `/teacher/videos/${videoId}/attachments`
                  : `/academy/videos/${videoId}/attachments`;

              try {
                const { promise } = uploadAttachments(attachEndpoint, attachments, videoId);
                await promise;
              } catch (err: unknown) {
                console.error('فشل رفع المرفقات:', err);
              }
            }

            patch({ phase: 'completed' });
            onCompleted?.(videoId);
            resolve();
          },
        });

        uploadRef.current = upload;
        upload.start();
      });
    },
    [mode, onCompleted, patch]
  );

  // ── Controls ───────────────────────────────────────────────────────────────

  const pauseUpload = useCallback(() => {
    if (uploadRef.current && state.phase === 'uploading') {
      uploadRef.current.abort();
      patch({ phase: 'paused' });
    } else if (uploadRef.current && state.phase === 'paused') {
      uploadRef.current.start();
      patch({ phase: 'uploading' });
    }
  }, [state.phase, patch]);

  const cancelUpload = useCallback(
    async (reason = 'cancelled by user') => {
      if (uploadRef.current) {
        uploadRef.current.abort();
      }

      const sid = sessionIdRef.current;
      if (sid) {
        try {
          if (mode === 'teacher') await abortTeacherUpload(sid, reason);
          else await abortAcademyUpload(sid, reason);
        } catch {
          // ignore
        }
        sessionIdRef.current = null;
      }

      patch({ phase: 'aborted', error: null });
      onAborted?.();
    },
    [mode, onAborted, patch]
  );

  const reset = useCallback(() => {
    if (uploadRef.current) {
      uploadRef.current.abort();
      uploadRef.current = null;
    }
    sessionIdRef.current = null;
    videoIdRef.current = null;
    setState({
      phase: 'idle',
      progress: 0,
      uploadedBytes: 0,
      totalBytes: 0,
      videoId: null,
      sessionId: null,
      error: null,
    });
  }, []);

  return { state, startUpload, cancelUpload, pauseUpload, reset };
}

