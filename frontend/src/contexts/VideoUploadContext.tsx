'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { UploadState, UploadPhase } from '@/hooks/useVideoUpload';
import { 
  initiateTeacherUpload, 
  initiateAcademyUpload, 
  completeTeacherUpload, 
  completeAcademyUpload, 
  abortTeacherUpload, 
  abortAcademyUpload,
  uploadAttachments
} from '@/services/videoService';
import { fetchApi } from '@/services/api/baseApi';
import type { InitiateUploadPayload, VideoItem } from '@/types/video.types';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'neetaq_pending_video_v1';

interface SavedSession {
  sessionId: string;
  videoId: string;
  metadata: any;
  mode: 'teacher' | 'academy';
  fileInfo: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

interface VideoUploadContextType {
  state: UploadState;
  startUpload: (
    file: File,
    metadata: any,
    mode: 'teacher' | 'academy',
    attachments?: File[]
  ) => Promise<void>;
  resumeUpload: (file: File) => Promise<void>;
  cancelUpload: (mode: 'teacher' | 'academy', reason?: string) => Promise<void>;
  reset: () => void;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  savedSession: SavedSession | null;
}

const VideoUploadContext = createContext<VideoUploadContextType | null>(null);

export function VideoUploadProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UploadState>({
    phase: 'idle',
    progress: 0,
    currentPart: 0,
    totalParts: 0,
    videoId: null,
    sessionId: null,
    error: null,
  });
  
  const [isMinimized, setIsMinimized] = useState(false);
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  const abortedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const completedBytesRef = useRef(0);
  const totalBytesRef = useRef(0);
  const partProgressRef = useRef<Record<number, number>>({});

  // Check storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.sessionId && parsed?.videoId) {
          setSavedSession(parsed);
          console.log('Detected saved upload session:', parsed.sessionId);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const patch = useCallback((partial: Partial<UploadState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const recalcProgress = useCallback(() => {
    const inFlight = Object.values(partProgressRef.current).reduce((a, b) => a + b, 0);
    const total = totalBytesRef.current;
    if (total === 0) return;
    
    // During resume, completedBytesRef already has the 'skipped' bytes
    const progress = Math.min(99, Math.round(((completedBytesRef.current + inFlight) / total) * 100));
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const uploadPart = useCallback(
    (
      presignedUrl: string,
      chunk: Blob,
      partNumber: number,
      maxRetries = 3,
      attempt = 1
    ): Promise<void> => {
      if (abortedRef.current) return Promise.reject(new Error('aborted'));

      patch({ phase: 'uploading', currentPart: partNumber });
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
            completedBytesRef.current += chunk.size;
            partProgressRef.current[partNumber] = 0;
            recalcProgress();
            resolve();
          } else {
            partProgressRef.current[partNumber] = 0;
            if (attempt < maxRetries) {
              patch({ phase: 'retrying' });
              setTimeout(
                () =>
                  uploadPart(presignedUrl, chunk, partNumber, maxRetries, attempt + 1)
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
                uploadPart(presignedUrl, chunk, partNumber, maxRetries, attempt + 1)
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
    [patch, recalcProgress]
  );

  const runPool = useCallback(
    async (
      tasks: Array<() => Promise<void>>,
      concurrency = 3
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
    []
  );

  const performUpload = async (
    file: File, 
    parts: Array<{part_number: number, url: string}>, 
    chunkSizeBytes: number,
    mode: 'teacher' | 'academy',
    videoId: string,
    attachments?: File[]
  ) => {
    const tasks = parts.map(({ part_number, url }) => async (): Promise<void> => {
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
      toast.error(message);
      return;
    }

    if (abortedRef.current) {
      patch({ phase: 'aborted' });
      return;
    }

    patch({ phase: 'completing', progress: 100 });

    try {
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) throw new Error('Session ID is missing');

      if (mode === 'teacher') await completeTeacherUpload(currentSessionId);
      else await completeAcademyUpload(currentSessionId);
      
      localStorage.removeItem(STORAGE_KEY);
      setSavedSession(null);
      patch({ phase: 'completed' });
      toast.success('تم رفع الفيديو بنجاح! مجهودك في أمان.');
    } catch (err: any) {
      const message = err.message || 'فشل إكمال الرفع.';
      patch({ phase: 'failed', error: message });
      toast.error(message);
    }

    if (attachments && attachments.length > 0) {
      const attachEndpoint = mode === 'teacher'
          ? `/teacher/videos/${videoId}/attachments`
          : `/academy/videos/${videoId}/attachments`;

      try {
        const { promise } = uploadAttachments(attachEndpoint, attachments, videoId);
        await promise;
      } catch (err: unknown) {
        console.error('فشل رفع المرفقات:', err);
      }
    }
  };

  const startUpload = useCallback(
    async (
      file: File,
      metadata: Omit<InitiateUploadPayload, 'file_name' | 'file_size' | 'file_mime' | 'total_parts'>,
      mode: 'teacher' | 'academy',
      attachments?: File[],
    ): Promise<void> => {
      abortedRef.current = false;
      completedBytesRef.current = 0;
      totalBytesRef.current = file.size;
      setIsMinimized(false);
      setSavedSession(null);
      partProgressRef.current = {};

      patch({ phase: 'preparing', progress: 0, currentPart: 0, totalParts: 0, videoId: null, sessionId: null, error: null });

      let chunkSizeBytes: number;
      let sessionId: string;
      let videoId: string;
      let presignedParts: Array<{ part_number: number; url: string }>;

      try {
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
        
        const sessionToSave: SavedSession = {
          sessionId,
          videoId,
          metadata,
          mode,
          fileInfo: { 
            name: file.name, 
            size: file.size, 
            type: file.type,
            lastModified: file.lastModified 
          }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionToSave));

        patch({ sessionId, videoId, totalParts: presignedParts.length });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'فشل بدء الرفع.';
        patch({ phase: 'failed', error: message });
        toast.error(message);
        return;
      }

      await performUpload(file, presignedParts, chunkSizeBytes, mode, videoId, attachments);
    },
    [patch, uploadPart, runPool]
  );

  const resumeUpload = useCallback(async (file: File) => {
    if (!savedSession) return;

    const isSameName = file.name === savedSession.fileInfo.name;
    const isSameSize = file.size === savedSession.fileInfo.size;
    const isSameDate = file.lastModified === savedSession.fileInfo.lastModified;

    if (!isSameName || !isSameSize) {
      toast.error('الملف المختار لا يطابق الملف الأصلي (الاسم أو الحجم مختلف).');
      return;
    }

    if (!isSameDate) {
      const confirmChange = window.confirm('يبدو أن هذا الملف قد تم تعديله منذ آخر محاولة رفع. هل تريد الاستمرار على أي حال؟ قد يؤدي هذا لفساد الفيديو.');
      if (!confirmChange) return;
    }

    abortedRef.current = false;
    setIsMinimized(false);
    patch({ phase: 'preparing', error: null });

    try {
      const endpoint = savedSession.mode === 'teacher' 
        ? `/teacher/videos/resume-upload/${savedSession.sessionId}`
        : `/academy/videos/resume-upload/${savedSession.sessionId}`;
      
      const response = await fetchApi(endpoint, { method: 'POST' });
      
      const { missing_parts, chunk_size_bytes, progress, uploaded_count, total_parts } = response;
      
      sessionIdRef.current = savedSession.sessionId;
      totalBytesRef.current = file.size;
      completedBytesRef.current = uploaded_count * chunk_size_bytes;
      partProgressRef.current = {};
      
      patch({ 
        phase: 'uploading', 
        sessionId: savedSession.sessionId, 
        videoId: savedSession.videoId, 
        totalParts: total_parts,
        progress: progress
      });

      await performUpload(file, missing_parts, chunk_size_bytes, savedSession.mode, savedSession.videoId);
    } catch (err: any) {
      const message = err.message || 'فشل استكمال الرفع.';
      patch({ phase: 'failed', error: message });
      toast.error(message);
    }
  }, [savedSession, patch]);

  const cancelUpload = useCallback(
    async (mode: 'teacher' | 'academy', reason = 'cancelled by user') => {
      abortedRef.current = true;
      localStorage.removeItem(STORAGE_KEY);
      setSavedSession(null);

      const sid = sessionIdRef.current;
      if (sid) {
        try {
          if (mode === 'teacher') await abortTeacherUpload(sid, reason);
          else await abortAcademyUpload(sid, reason);
        } catch { /* ignore */ }
        sessionIdRef.current = null;
      }

      patch({ phase: 'aborted', error: null });
    },
    [patch]
  );

  const reset = useCallback(() => {
    abortedRef.current = false;
    sessionIdRef.current = null;
    completedBytesRef.current = 0;
    totalBytesRef.current = 0;
    partProgressRef.current = {};
    localStorage.removeItem(STORAGE_KEY);
    setSavedSession(null);
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

  return (
    <VideoUploadContext.Provider value={{ state, startUpload, resumeUpload, cancelUpload, reset, isMinimized, setIsMinimized, savedSession }}>
      {children}
    </VideoUploadContext.Provider>
  );
}

export function useVideoUploadContext() {
  const context = useContext(VideoUploadContext);
  if (!context) {
    throw new Error('useVideoUploadContext must be used within a VideoUploadProvider');
  }
  return context;
}
