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

const STORAGE_KEY = 'neetaq_pending_video_v2';

export type UploadPhase =
  | 'draft'
  | 'initiating'
  | 'uploading'
  | 'paused'
  | 'interrupted'
  | 'retrying'
  | 'completing'
  | 'completed'
  | 'failed'
  | 'aborted';

export interface UploadState {
  phase: UploadPhase;
  progress: number;
  currentPart: number;
  totalParts: number;
  videoId: string | null;
  sessionId: string | null;
  error: string | null;
}

interface SavedSession {
  sessionId: string;
  videoId: string;
  metadata: any;
  mode: 'teacher' | 'academy';
  fileFingerprint: string;
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
  pauseUpload: () => Promise<void>;
  cancelUpload: (mode: 'teacher' | 'academy', reason?: string) => Promise<void>;
  reset: () => void;
  isMinimized: boolean;
  setIsMinimized: (val: boolean) => void;
  savedSession: SavedSession | null;
}

const VideoUploadContext = createContext<VideoUploadContextType | null>(null);

export function VideoUploadProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<UploadState>({
    phase: 'draft',
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
  const pausedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const currentModeRef = useRef<'teacher' | 'academy' | null>(null);
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
          sessionIdRef.current = parsed.sessionId;
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
    
    const progress = Math.min(99, Math.round(((completedBytesRef.current + inFlight) / total) * 100));
    setState((prev) => ({ ...prev, progress }));
  }, []);

  const reportPartSuccess = async (
    sessionId: string, 
    partNumber: number, 
    etag: string, 
    mode: 'teacher' | 'academy',
    maxRetries = 5
  ) => {
    const endpoint = mode === 'teacher' 
      ? '/teacher/videos/report-part-success'
      : '/academy/videos/report-part-success';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await fetchApi(endpoint, {
          method: 'POST',
          body: JSON.stringify({ session_id: sessionId, part_number: partNumber, etag }),
        });
        return; // Success
      } catch (err: any) {
        const isRateLimit = err?.statusCode === 429;
        const delay = isRateLimit ? 2000 * attempt : 1000 * Math.pow(2, attempt - 1);
        
        console.warn(`Failed to report part ${partNumber} success (attempt ${attempt}/${maxRetries}):`, err.message);
        
        if (attempt === maxRetries) {
          console.error(`Final failure reporting part ${partNumber} success. This part will need re-uploading if session is resumed.`);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const uploadPart = useCallback(
    (
      presignedUrl: string,
      chunk: Blob,
      partNumber: number,
      mode: 'teacher' | 'academy',
      maxRetries = 3,
      attempt = 1
    ): Promise<void> => {
      if (abortedRef.current || pausedRef.current) return Promise.reject(new Error('interrupted'));

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

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const etag = xhr.getResponseHeader('ETag')?.replace(/"/g, '') || '';
            const currentSessionId = sessionIdRef.current;
            
            if (currentSessionId) {
              await reportPartSuccess(currentSessionId, partNumber, etag, mode);
            }

            completedBytesRef.current += chunk.size;
            partProgressRef.current[partNumber] = 0;
            recalcProgress();
            resolve();
          } else {
            partProgressRef.current[partNumber] = 0;
            if (attempt < maxRetries && !abortedRef.current && !pausedRef.current) {
              patch({ phase: 'retrying' });
              setTimeout(
                () =>
                  uploadPart(presignedUrl, chunk, partNumber, mode, maxRetries, attempt + 1)
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
          if (attempt < maxRetries && !abortedRef.current && !pausedRef.current) {
            patch({ phase: 'retrying' });
            setTimeout(
              () =>
                uploadPart(presignedUrl, chunk, partNumber, mode, maxRetries, attempt + 1)
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
          reject(new Error('interrupted'));
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
          if (abortedRef.current || pausedRef.current) throw new Error('interrupted');
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
      await uploadPart(url, chunk, part_number, mode);
    });

    try {
      await runPool(tasks);
    } catch (err: unknown) {
      if (abortedRef.current) {
        patch({ phase: 'aborted' });
        return;
      }
      if (pausedRef.current) {
        patch({ phase: 'paused' });
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
    if (pausedRef.current) {
      patch({ phase: 'paused' });
      return;
    }

    patch({ phase: 'completing', progress: 100 });

    try {
      const currentSessionId = sessionIdRef.current;
      if (!currentSessionId) throw new Error('Session ID is missing');

      const completeRes = mode === 'teacher' 
        ? await completeTeacherUpload(currentSessionId)
        : await completeAcademyUpload(currentSessionId);
      
      // Use the videoId returned from completion if available, otherwise fallback to context
      const finalVideoId = completeRes.video_id || videoId;

      localStorage.removeItem(STORAGE_KEY);
      setSavedSession(null);
      patch({ phase: 'completed', videoId: finalVideoId });
      toast.success('تم رفع الفيديو بنجاح! مجهودك في أمان.');

      if (attachments && attachments.length > 0) {
        const attachEndpoint = mode === 'teacher'
            ? `/teacher/videos/${finalVideoId}/attachments`
            : `/academy/videos/${finalVideoId}/attachments`;

        try {
          const { promise } = uploadAttachments(attachEndpoint, attachments, finalVideoId);
          await promise;
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'فشل رفع المرفقات';
          console.error('فشل رفع المرفقات:', errorMessage);
          toast.error(`فشل رفع المرفقات: ${errorMessage}`);
        }
      }
    } catch (err: any) {
      const message = err.message || 'فشل إكمال الرفع.';
      patch({ phase: 'failed', error: message });
      toast.error(message);
    }
  };

  const generateFingerprint = (file: File) => {
    return `${file.name}-${file.size}-${file.lastModified}`;
  };

  const startUpload = useCallback(
    async (
      file: File,
      metadata: Omit<InitiateUploadPayload, 'file_name' | 'file_size' | 'file_mime' | 'total_parts' | 'file_fingerprint'>,
      mode: 'teacher' | 'academy',
      attachments?: File[],
    ): Promise<void> => {
      abortedRef.current = false;
      pausedRef.current = false;
      completedBytesRef.current = 0;
      totalBytesRef.current = file.size;
      setIsMinimized(false);
      setSavedSession(null);
      partProgressRef.current = {};
      currentModeRef.current = mode;

      patch({ phase: 'initiating', progress: 0, currentPart: 0, totalParts: 0, videoId: null, sessionId: null, error: null });

      let chunkSizeBytes: number;
      let sessionId: string;
      let videoId: string;
      let presignedParts: Array<{ part_number: number; url: string }>;

      try {
        const defaultChunkBytes = 10 * 1024 * 1024;
        const estimatedParts = Math.max(1, Math.ceil(file.size / defaultChunkBytes));
        const fileFingerprint = generateFingerprint(file);

        const initiatePayload: InitiateUploadPayload = {
          ...metadata,
          file_name: file.name,
          file_size: file.size,
          file_mime: file.type || 'application/octet-stream',
          total_parts: estimatedParts,
          file_fingerprint: fileFingerprint,
        };

        const response =
          mode === 'teacher'
            ? await initiateTeacherUpload(initiatePayload)
            : await initiateAcademyUpload(initiatePayload);

        sessionId = response.session_id;
        videoId = response.video_id;
        chunkSizeBytes = response.chunk_size_bytes ?? defaultChunkBytes;
        presignedParts = response.presigned_parts || response.missing_parts; // Might be a resume from backend

        sessionIdRef.current = sessionId;
        
        const sessionToSave: SavedSession = {
          sessionId,
          videoId,
          metadata,
          mode,
          fileFingerprint,
          fileInfo: { 
            name: file.name, 
            size: file.size, 
            type: file.type,
            lastModified: file.lastModified 
          }
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionToSave));

        // Handle resume or new upload with uploaded_parts knowledge
        const uploadedParts = response.uploaded_parts || [];
        const totalParts = response.total_parts || estimatedParts;
        
        // Calculate initial bytes from parts the server already has
        completedBytesRef.current = uploadedParts.reduce((acc, partNum) => {
          const isLast = partNum === totalParts;
          const size = isLast ? (file.size - (totalParts - 1) * chunkSizeBytes) : chunkSizeBytes;
          return acc + size;
        }, 0);

        patch({ 
          sessionId, 
          videoId, 
          totalParts, 
          progress: response.progress ?? Math.round((completedBytesRef.current / file.size) * 100) 
        });

        // Filter: only upload parts that are NOT in uploaded_parts
        const allParts = response.presigned_parts || response.missing_parts || [];
        const pendingParts = allParts.filter(p => !uploadedParts.includes(p.part_number));

        await performUpload(file, pendingParts, chunkSizeBytes, mode, videoId, attachments);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'فشل بدء الرفع.';
        patch({ phase: 'failed', error: message });
        toast.error(message);
        return;
      }
    },
    [patch, uploadPart, runPool]
  );

  const resumeUpload = useCallback(async (file: File) => {
    if (!savedSession) return;

    const fileFingerprint = generateFingerprint(file);
    if (fileFingerprint !== savedSession.fileFingerprint) {
      toast.error('الملف المختار لا يطابق الملف الأصلي.');
      return;
    }

    abortedRef.current = false;
    pausedRef.current = false;
    setIsMinimized(false);
    patch({ phase: 'initiating', error: null });

    try {
      const endpoint = savedSession.mode === 'teacher' 
        ? `/teacher/videos/resume-upload/${savedSession.sessionId}`
        : `/academy/videos/resume-upload/${savedSession.sessionId}`;
      
      const response = await fetchApi(endpoint, { method: 'POST' });
      
      const { missing_parts, chunk_size_bytes, progress, uploaded_parts, total_parts } = response;
      const actualTotalParts = total_parts || 0;
      const actualUploadedParts = uploaded_parts || [];
      
      sessionIdRef.current = savedSession.sessionId;
      currentModeRef.current = savedSession.mode;
      totalBytesRef.current = file.size;
      
      // Calculate initial bytes accurately
      completedBytesRef.current = actualUploadedParts.reduce((acc: number, partNum: number) => {
        const isLast = partNum === actualTotalParts;
        const size = isLast ? (file.size - (actualTotalParts - 1) * chunk_size_bytes) : chunk_size_bytes;
        return acc + size;
      }, 0);

      partProgressRef.current = {};
      
      patch({ 
        phase: 'uploading', 
        sessionId: savedSession.sessionId, 
        videoId: savedSession.videoId, 
        totalParts: actualTotalParts,
        progress: progress ?? Math.round((completedBytesRef.current / file.size) * 100)
      });

      // Filter: only upload parts that are NOT in uploaded_parts
      const pendingParts = (missing_parts || []).filter((p: any) => !actualUploadedParts.includes(p.part_number));

      await performUpload(file, pendingParts, chunk_size_bytes, savedSession.mode, savedSession.videoId);
    } catch (err: any) {
      const message = err.message || 'فشل استكمال الرفع.';
      patch({ phase: 'failed', error: message });
      toast.error(message);
    }
  }, [savedSession, patch]);

  const pauseUpload = useCallback(async () => {
    pausedRef.current = true;
    const sid = sessionIdRef.current;
    const mode = currentModeRef.current;
    
    if (sid && mode) {
      const endpoint = mode === 'teacher' 
        ? '/teacher/videos/pause-upload'
        : '/academy/videos/pause-upload';
      
      try {
        await fetchApi(endpoint, {
          method: 'POST',
          body: JSON.stringify({ session_id: sid }),
        });
      } catch { /* ignore */ }
    }
    
    patch({ phase: 'paused' });
  }, [patch]);

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
    pausedRef.current = false;
    sessionIdRef.current = null;
    currentModeRef.current = null;
    completedBytesRef.current = 0;
    totalBytesRef.current = 0;
    partProgressRef.current = {};
    localStorage.removeItem(STORAGE_KEY);
    setSavedSession(null);
    setState({
      phase: 'draft',
      progress: 0,
      currentPart: 0,
      totalParts: 0,
      videoId: null,
      sessionId: null,
      error: null,
    });
  }, []);

  return (
    <VideoUploadContext.Provider value={{ state, startUpload, resumeUpload, pauseUpload, cancelUpload, reset, isMinimized, setIsMinimized, savedSession }}>
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
