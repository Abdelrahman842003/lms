import { fetchApi, getAuthHeaders } from '@/services/api/baseApi';
import { getApiBaseUrl } from '@/config/api-config';
import type {
  CompleteUploadResponse,
  InitiateUploadPayload,
  InitiateUploadResponse,
  PlaybackTokenPayload,
  SubmitQuizResult,
  UploadSessionStatus,
  VideoComment,
  VideoItem,
  VideoQuiz,
  VideoQuizAttempt,
  VideoQuizForm,
  VideoWatchProgress,
} from '@/types/video.types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

// ─── Direct-to-R2 upload API calls ──────────────────────────────────────────

/**
 * Step 1 — Initiate a multipart upload.
 * Sends video metadata (no bytes) to the server, which creates an upload session
 * in R2 and returns presigned PUT URLs for each part.
 */
export async function initiateTeacherUpload(
  payload: InitiateUploadPayload
): Promise<InitiateUploadResponse> {
  return fetchApi<InitiateUploadResponse>('/teacher/videos/initiate-upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function initiateAcademyUpload(
  payload: InitiateUploadPayload
): Promise<InitiateUploadResponse> {
  return fetchApi<InitiateUploadResponse>('/academy/videos/initiate-upload', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Step 2 — Complete a multipart upload.
 * Tells the server all parts have been PUT to R2; server fetches ETags via ListParts
 * and calls CompleteMultipartUpload directly — no ETags needed from the client.
 */
export async function completeTeacherUpload(
  sessionId: string,
): Promise<CompleteUploadResponse> {
  return fetchApi<CompleteUploadResponse>('/teacher/videos/complete-upload', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

export async function completeAcademyUpload(
  sessionId: string,
): Promise<CompleteUploadResponse> {
  return fetchApi<CompleteUploadResponse>('/academy/videos/complete-upload', {
    method: 'POST',
    body: JSON.stringify({ session_id: sessionId }),
  });
}

/**
 * Abort — call when user cancels or an unrecoverable error occurs.
 * Server will AbortMultipartUpload on R2 and mark the session ABORTED.
 */
export async function abortTeacherUpload(sessionId: string, reason?: string): Promise<void> {
  await fetchApi(`/teacher/videos/abort-upload`, {
    method: 'DELETE',
    body: JSON.stringify({ session_id: sessionId, reason }),
  });
}

export async function abortAcademyUpload(sessionId: string, reason?: string): Promise<void> {
  await fetchApi(`/academy/videos/abort-upload`, {
    method: 'DELETE',
    body: JSON.stringify({ session_id: sessionId, reason }),
  });
}

/** Poll upload session status (optional — useful for recovery on page reload). */
export async function getTeacherUploadStatus(sessionId: string): Promise<UploadSessionStatus> {
  return fetchApi<UploadSessionStatus>(`/teacher/videos/upload-status/${sessionId}`);
}

export async function getAcademyUploadStatus(sessionId: string): Promise<UploadSessionStatus> {
  return fetchApi<UploadSessionStatus>(`/academy/videos/upload-status/${sessionId}`);
}

// ─── Upload a single attachment (still goes through server) ─────────────────

function buildAttachmentsFormData(attachments: File[], videoId: string): FormData {
  const fd = new FormData();
  fd.append('video_id', videoId);
  attachments.forEach((file, index) => fd.append(`attachments[${index}]`, file));
  return fd;
}

export function uploadAttachments(
  endpoint: string,
  attachments: File[],
  videoId: string
): { promise: Promise<void>; cancel: () => void } {
  const formData = buildAttachmentsFormData(attachments, videoId);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const apiPath = `/api/v1${cleanEndpoint}`;
  const url = `${getApiBaseUrl()}${apiPath}`;
  const xhr = new XMLHttpRequest();

  const promise = new Promise<void>((resolve, reject) => {
    xhr.open('POST', url, true);
    const headers = getAuthHeaders({}, url, { method: 'POST', body: formData });
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.withCredentials = true;
    xhr.onerror = () => reject(new Error('فشل رفع المرفقات.'));
    xhr.onabort = () => reject(new Error('تم إلغاء رفع المرفقات.'));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      try {
        const parsed = JSON.parse(xhr.responseText);
        reject(new Error(parsed?.message || 'فشل رفع المرفقات.'));
      } catch {
        reject(new Error('استجابة غير صالحة من الخادم.'));
      }
    };
    xhr.send(formData);
  });

  return { promise, cancel: () => xhr.abort() };
}

// ─── Video listing ───────────────────────────────────────────────────────────

export async function getTeacherVideos(): Promise<VideoItem[]> {
  const response = await fetchApi<PaginatedResponse<VideoItem>>('/teacher/videos');
  return response.data;
}

export async function getTeacherVideo(videoId: string): Promise<VideoItem> {
  const response = await fetchApi<{ video: VideoItem }>(`/teacher/videos/${videoId}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });
  return response.video;
}

export async function getTeacherVideoComments(videoId: string): Promise<VideoComment[]> {
  const response = await fetchApi<PaginatedResponse<VideoComment>>(`/teacher/videos/${videoId}/comments`);
  return response.data;
}

export async function getAcademyVideos(): Promise<VideoItem[]> {
  const response = await fetchApi<PaginatedResponse<VideoItem>>('/academy/videos');
  return response.data;
}

export async function getAcademyVideo(videoId: string): Promise<VideoItem> {
  const response = await fetchApi<{ video: VideoItem }>(`/academy/videos/${videoId}`, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
    },
  });
  return response.video;
}

export async function getAcademyVideoComments(videoId: string): Promise<VideoComment[]> {
  const response = await fetchApi<PaginatedResponse<VideoComment>>(`/academy/videos/${videoId}/comments`);
  return response.data;
}

export async function publishTeacherVideo(videoId: string): Promise<VideoItem> {
  const response = await fetchApi<{ video: VideoItem }>(`/teacher/videos/${videoId}/publish`, {
    method: 'POST',
  });
  return response.video;
}

export async function publishAcademyVideo(videoId: string): Promise<VideoItem> {
  const response = await fetchApi<{ video: VideoItem }>(`/academy/videos/${videoId}/publish`, {
    method: 'POST',
  });
  return response.video;
}

export async function retryTeacherVideoProcessing(videoId: string): Promise<void> {
  await fetchApi(`/teacher/videos/${videoId}/retry-processing`, { method: 'POST' });
}

export async function retryAcademyVideoProcessing(videoId: string): Promise<void> {
  await fetchApi(`/academy/videos/${videoId}/retry-processing`, { method: 'POST' });
}

export async function deleteTeacherVideo(videoId: string): Promise<void> {
  await fetchApi(`/teacher/videos/${videoId}`, { method: 'DELETE' });
}

export async function deleteAcademyVideo(videoId: string): Promise<void> {
  await fetchApi(`/academy/videos/${videoId}`, { method: 'DELETE' });
}

export async function deleteTeacherAttachment(videoId: string, attachmentId: string): Promise<void> {
  await fetchApi(`/teacher/videos/${videoId}/attachments/${attachmentId}`, { method: 'DELETE' });
}

export async function deleteAcademyAttachment(videoId: string, attachmentId: string): Promise<void> {
  await fetchApi(`/academy/videos/${videoId}/attachments/${attachmentId}`, { method: 'DELETE' });
}

export async function getAttachmentViewUrl(
  videoId: string,
  attachmentId: string
): Promise<{ url: string; mime_type: string; file_name: string }> {
  return fetchApi<{ url: string; mime_type: string; file_name: string }>(
    `/student/videos/${videoId}/attachments/${attachmentId}/view-url`
  );
}

export async function getStudentVideos(): Promise<VideoItem[]> {
  const response = await fetchApi<PaginatedResponse<VideoItem>>('/student/videos');
  return response.data;
}

export async function getStudentVideo(videoId: string): Promise<{
  video: VideoItem;
  progress: VideoWatchProgress | null;
  comments: VideoComment[];
}> {
  return await fetchApi(`/student/videos/${videoId}`);
}

export async function issuePlaybackToken(
  videoId: string,
  payload: { device_fingerprint?: string; session_id?: string }
): Promise<PlaybackTokenPayload> {
  return await fetchApi(`/student/videos/${videoId}/playback-token`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateVideoProgress(
  videoId: string,
  payload: { watched_seconds: number; last_position_seconds: number; playback_token_id?: string }
): Promise<VideoWatchProgress> {
  const response = await fetchApi<{ progress: VideoWatchProgress }>(`/student/videos/${videoId}/progress`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.progress;
}

export async function toggleVideoLike(videoId: string): Promise<{ liked: boolean; likes_count: number }> {
  return await fetchApi(`/student/videos/${videoId}/like`, {
    method: 'POST',
  });
}

export async function getVideoComments(videoId: string): Promise<VideoComment[]> {
  const response = await fetchApi<PaginatedResponse<VideoComment>>(`/student/videos/${videoId}/comments`);
  return response.data;
}

export async function addVideoComment(videoId: string, body: string, parentId?: string): Promise<VideoComment> {
  const response = await fetchApi<{ comment: VideoComment }>(`/student/videos/${videoId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body, parent_id: parentId }),
  });

  return response.comment;
}

export async function deleteOwnComment(videoId: string, commentId: string): Promise<void> {
  await fetchApi(`/student/videos/${videoId}/comments/${commentId}`, {
    method: 'DELETE',
  });
}

// ─── Video Quiz — Teacher / Academy ─────────────────────────────────────────

export async function getTeacherVideoQuiz(videoId: string): Promise<VideoQuiz | null> {
  const res = await fetchApi<{ quiz: VideoQuiz | null }>(`/teacher/videos/${videoId}/quiz`);
  return res.quiz;
}

export async function saveTeacherVideoQuiz(videoId: string, data: VideoQuizForm): Promise<VideoQuiz> {
  const res = await fetchApi<{ quiz: VideoQuiz }>(`/teacher/videos/${videoId}/quiz`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.quiz;
}

export async function updateTeacherVideoQuiz(videoId: string, data: VideoQuizForm): Promise<VideoQuiz> {
  const res = await fetchApi<{ quiz: VideoQuiz }>(`/teacher/videos/${videoId}/quiz`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.quiz;
}

export async function deleteTeacherVideoQuiz(videoId: string): Promise<void> {
  await fetchApi(`/teacher/videos/${videoId}/quiz`, { method: 'DELETE' });
}

export async function getTeacherVideoQuizResults(
  videoId: string
): Promise<VideoQuizAttempt[]> {
  const res = await fetchApi<{ quiz: unknown; summary: unknown; attempts: VideoQuizAttempt[] }>(`/teacher/videos/${videoId}/quiz/results`);
  return res.attempts ?? [];
}

// Academy mirrors
export async function getAcademyVideoQuiz(videoId: string): Promise<VideoQuiz | null> {
  const res = await fetchApi<{ quiz: VideoQuiz | null }>(`/academy/videos/${videoId}/quiz`);
  return res.quiz;
}

export async function saveAcademyVideoQuiz(videoId: string, data: VideoQuizForm): Promise<VideoQuiz> {
  const res = await fetchApi<{ quiz: VideoQuiz }>(`/academy/videos/${videoId}/quiz`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.quiz;
}

export async function updateAcademyVideoQuiz(videoId: string, data: VideoQuizForm): Promise<VideoQuiz> {
  const res = await fetchApi<{ quiz: VideoQuiz }>(`/academy/videos/${videoId}/quiz`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.quiz;
}

export async function deleteAcademyVideoQuiz(videoId: string): Promise<void> {
  await fetchApi(`/academy/videos/${videoId}/quiz`, { method: 'DELETE' });
}

export async function getAcademyVideoQuizResults(
  videoId: string
): Promise<VideoQuizAttempt[]> {
  const res = await fetchApi<{ quiz: unknown; summary: unknown; attempts: VideoQuizAttempt[] }>(`/academy/videos/${videoId}/quiz/results`);
  return res.attempts ?? [];
}

// ─── Video Quiz — Student ────────────────────────────────────────────────────

export async function getStudentVideoQuiz(videoId: string): Promise<VideoQuiz | null> {
  const res = await fetchApi<{ quiz: VideoQuiz | null }>(`/student/videos/${videoId}/quiz`);
  return res.quiz;
}

export async function submitStudentVideoQuiz(
  videoId: string,
  answers: Record<string, string>
): Promise<SubmitQuizResult> {
  return fetchApi<SubmitQuizResult>(`/student/videos/${videoId}/quiz/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function getStudentVideoQuizAttempts(videoId: string): Promise<VideoQuizAttempt[]> {
  const res = await fetchApi<{ attempts: VideoQuizAttempt[] }>(`/student/videos/${videoId}/quiz/attempts`);
  return res.attempts;
}
