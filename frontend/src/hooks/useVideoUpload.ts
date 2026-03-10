'use client';

import { useCallback, useRef, useState } from 'react';
import {
  abortAcademyUpload,
  abortTeacherUpload,
  completeAcademyUpload,
  completeTeacherUpload,
  initiateAcademyUpload,
  initiateTeacherUpload,
  uploadAttachments,
} from '@/services/videoService';
import type {
  InitiateUploadPayload,
} from '@/types/video.types';

// ─── State machine ────────────────────────────────────────────────────────────

export type UploadPhase =
  | 'idle'
  | 'preparing'   // calling /initiate-upload
  | 'uploading'   // PUTting chunks to R2
  | 'retrying'    // retrying a failed chunk
  | 'completing'  // calling /complete-upload
  | 'completed'
  | 'failed'
  | 'aborted';

export interface UploadState {
  phase: UploadPhase;
  /** 0–100 overall percentage */
  progress: number;
  /** Which part is currently being uploaded (1-based) */
  currentPart: number;
  totalParts: number;
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
  /** Max retry attempts per part (default 3) */
  maxRetries?: number;
  /** Concurrency limit for parallel chunk uploads (default 3) */
  concurrency?: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CONCURRENCY = 3;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVideoUpload({
  mode,
  onCompleted,
  onAborted,
  maxRetries = DEFAULT_MAX_RETRIES,
  concurrency = DEFAULT_CONCURRENCY,
}: UseVideoUploadOptions) {
  const [state, setState] = useState<UploadState>({
    phase: 'idle',
    progress: 0,
    currentPart: 0,
    totalParts: 0,
    videoId: null,
    sessionId: null,
    error: null,
  });

  // Abort signal — set to true to interrupt in-flight PUT requests
  const abortedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  // Track completed bytes for accurate progress
  const completedBytesRef = useRef(0);
  const totalBytesRef = useRef(0);
  // Per-part in-flight bytes (for real-time XHR progress)
  const partProgressRef = useRef<Record<number, number>>({});

  const patch = useCallback((partial: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  /** Recalculate overall progress from completed bytes + live per-part progress */
  const recalcProgress = useCallback(() => {
    const inFlight = Object.values(partProgressRef.current).reduce((a, b) => a + b, 0);
    const total = totalBytesRef.current;
    if (total === 0) return;
    const progress = Math.min(99, Math.round(((completedBytesRef.current + inFlight) / total) * 100));
    setState((prev) => ({ ...prev, progress }));
  }, []);

  // ── Core: upload one part with retry (XHR for real-time progress) ──────────

  const uploadPart = useCallback(
    (
      presignedUrl: string,
      chunk: Blob,
      partNumber: number,
      attempt = 1
    ): Promise<void> => {
      if (abortedRef.current) return Promise.reject(new Error('aborted'));

      patch({ phase: 'uploading', currentPart: partNumber });
      // Reset in-flight counter for this part on each attempt
      partProgressRef.current[partNumber] = 0;

      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            partProgressRef.current[partNumber] = event.loaded;
            recalcProgress();
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // Mark this part fully done
            completedBytesRef.current += chunk.size;
            partProgressRef.current[partNumber] = 0;
            recalcProgress();
            resolve();
          } else {
            // HTTP error — retry with back-off
            partProgressRef.current[partNumber] = 0;
            if (attempt < maxRetries) {
              patch({ phase: 'retrying' });
              setTimeout(
                () =>
                  uploadPart(presignedUrl, chunk, partNumber, attempt + 1)
                    .then(resolve)
                    .catch(reject),
                1000 * 2 ** (attempt - 1)
              );
            } else {
              reject(new Error(`فشل رفع الجزء ${partNumber} بعد ${maxRetries} محاولات.`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          partProgressRef.current[partNumber] = 0;
          if (attempt < maxRetries) {
            patch({ phase: 'retrying' });
            setTimeout(
              () =>
                uploadPart(presignedUrl, chunk, partNumber, attempt + 1)
                  .then(resolve)
                  .catch(reject),
              1000 * 2 ** (attempt - 1)
            );
          } else {
            reject(new Error(`فشل رفع الجزء ${partNumber} بعد ${maxRetries} محاولات.`));
          }
        });

        xhr.addEventListener('abort', () => {
          partProgressRef.current[partNumber] = 0;
          reject(new Error('aborted'));
        });

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.send(chunk);
      });
    },
    [maxRetries, patch, recalcProgress]
  );

  // ── Run concurrency-limited pool ───────────────────────────────────────────

  const runPool = useCallback(
    async (
      tasks: Array<() => Promise<void>>
    ): Promise<void> => {
      const queue = [...tasks];
      let index = 0;

      const worker = async (): Promise<void> => {
        while (index < queue.length) {
          if (abortedRef.current) throw new Error('aborted');
          const task = queue[index++];
          await task();
        }
      };

      const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
      await Promise.all(workers);
    },
    [concurrency]
  );

  // ── Main upload function ───────────────────────────────────────────────────

  const startUpload = useCallback(
    async (
      file: File,
      metadata: Omit<InitiateUploadPayload, 'file_name' | 'file_size' | 'file_mime' | 'total_parts'>,
      attachments?: File[],
    ): Promise<void> => {
      abortedRef.current = false;
      completedBytesRef.current = 0;
      totalBytesRef.current = file.size;

      patch({ phase: 'preparing', progress: 0, currentPart: 0, totalParts: 0, videoId: null, sessionId: null, error: null });

      // ── 1. Initiate ────────────────────────────────────────────────────────
      let chunkSizeBytes: number;
      let sessionId: string;
      let videoId: string;
      let presignedParts: Array<{ part_number: number; url: string }>;

      try {
        // Calculate number of parts using a default 10 MB chunk; server may override
        const defaultChunkBytes = 10 * 1024 * 1024;
        const estimatedParts = Math.max(1, Math.ceil(file.size / defaultChunkBytes));

        const initiatePayload: InitiateUploadPayload = {
          ...metadata,
          file_name: file.name,
          file_size: file.size,
          file_mime: file.type || 'application/octet-stream',
          total_parts: estimatedParts,
        };

        const response =
          mode === 'teacher'
            ? await initiateTeacherUpload(initiatePayload)
            : await initiateAcademyUpload(initiatePayload);

        sessionId = response.session_id;
        videoId = response.video_id;
        chunkSizeBytes = response.chunk_size_bytes ?? defaultChunkBytes;
        presignedParts = response.presigned_parts;

        sessionIdRef.current = sessionId;
        patch({ sessionId, videoId, totalParts: presignedParts.length });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'فشل بدء الرفع.';
        patch({ phase: 'failed', error: message });
        return;
      }

      if (abortedRef.current) return;

      // ── 2. Upload all parts concurrently ───────────────────────────────────
      const tasks = presignedParts.map(({ part_number, url }) => async (): Promise<void> => {
        const start = (part_number - 1) * chunkSizeBytes;
        const end = Math.min(start + chunkSizeBytes, file.size);
        const chunk = file.slice(start, end);
        await uploadPart(url, chunk, part_number);
      });

      try {
        await runPool(tasks);
      } catch (err: unknown) {
        if (abortedRef.current) {
          patch({ phase: 'aborted' });
          return;
        }
        const message = err instanceof Error ? err.message : 'فشل رفع أجزاء الملف.';
        patch({ phase: 'failed', error: message });
        // Best-effort abort on the server
        try {
          if (mode === 'teacher') await abortTeacherUpload(sessionId, message);
          else await abortAcademyUpload(sessionId, message);
        } catch {
          // ignore
        }
        return;
      }

      if (abortedRef.current) {
        patch({ phase: 'aborted' });
        return;
      }

      // ── 3. Complete ────────────────────────────────────────────────────────
      patch({ phase: 'completing', progress: 100 });

      try {
        if (mode === 'teacher') await completeTeacherUpload(sessionId);
        else await completeAcademyUpload(sessionId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'فشل إكمال الرفع.';
        patch({ phase: 'failed', error: message });
        return;
      }

      // ── 4. Upload attachments (if any) ────────────────────────────────────
      if (attachments && attachments.length > 0) {
        const attachEndpoint =
          mode === 'teacher'
            ? `/teacher/videos/${videoId}/attachments`
            : `/academy/videos/${videoId}/attachments`;

        try {
          const { promise } = uploadAttachments(attachEndpoint, attachments, videoId);
          await promise;
        } catch (err: unknown) {
          // Attachments failure is non-fatal: video was already saved.
          // Log for debugging but don't block the completion.
          console.error('فشل رفع المرفقات:', err);
        }
      }

      patch({ phase: 'completed' });
      onCompleted?.(videoId);
    },
    [mode, onCompleted, patch, uploadPart, runPool]
  );

  // ── Cancel ─────────────────────────────────────────────────────────────────

  const cancelUpload = useCallback(
    async (reason = 'cancelled by user') => {
      abortedRef.current = true;

      const sid = sessionIdRef.current;
      if (sid) {
        try {
          if (mode === 'teacher') await abortTeacherUpload(sid, reason);
          else await abortAcademyUpload(sid, reason);
        } catch {
          // ignore — server will clean up stale sessions via a scheduled job
        }
        sessionIdRef.current = null;
      }

      patch({ phase: 'aborted', error: null });
      onAborted?.();
    },
    [mode, onAborted, patch]
  );

  const reset = useCallback(() => {
    abortedRef.current = false;
    sessionIdRef.current = null;
    completedBytesRef.current = 0;
    totalBytesRef.current = 0;
    partProgressRef.current = {};
    setState({
      phase: 'idle',
      progress: 0,
      currentPart: 0,
      totalParts: 0,
      videoId: null,
      sessionId: null,
      error: null,
    });
  }, []);

  return { state, startUpload, cancelUpload, reset };
}
