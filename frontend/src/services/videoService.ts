import { API_BASE_URL, fetchApi, getAuthHeaders } from '@/services/api/baseApi';
import type {
  CreateVideoPayload,
  PlaybackTokenPayload,
  VideoComment,
  VideoItem,
  VideoWatchProgress,
} from '@/types/video.types';

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

function buildFormData(payload: CreateVideoPayload): FormData {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('grade_id', payload.grade_id);
  formData.append('video_file', payload.video_file);

  payload.group_ids.forEach((groupId, index) => {
    formData.append(`group_ids[${index}]`, groupId);
  });

  if (payload.description) formData.append('description', payload.description);
  if (payload.lecture_id) formData.append('lecture_id', payload.lecture_id);
  if (payload.lesson_id) formData.append('lesson_id', payload.lesson_id);
  if (payload.scheduled_at) formData.append('scheduled_at', payload.scheduled_at);
  if (payload.available_from) formData.append('available_from', payload.available_from);
  if (payload.available_until) formData.append('available_until', payload.available_until);
  if (payload.teacher_reference_id) formData.append('teacher_reference_id', payload.teacher_reference_id);
  if (payload.teacher_reference_name) formData.append('teacher_reference_name', payload.teacher_reference_name);

  payload.attachments?.forEach((file, index) => {
    formData.append(`attachments[${index}]`, file);
  });

  return formData;
}

function uploadWithProgress(
  endpoint: string,
  payload: CreateVideoPayload,
  onProgress?: (progress: number) => void
): { promise: Promise<VideoItem>; cancel: () => void } {
  const formData = buildFormData(payload);
  const url = `${API_BASE_URL}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const xhr = new XMLHttpRequest();

  const promise = new Promise<VideoItem>((resolve, reject) => {
    xhr.open('POST', url, true);

    const headers = getAuthHeaders({}, url, { method: 'POST', body: formData });
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onerror = () => reject(new Error('فشل رفع الفيديو.'));
    xhr.onabort = () => reject(new Error('تم إلغاء الرفع.'));

    xhr.onload = () => {
      try {
        const parsed = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300 && parsed?.status) {
          resolve(parsed.data.video as VideoItem);
          return;
        }

        reject(new Error(parsed?.message || 'فشل رفع الفيديو.'));
      } catch {
        reject(new Error('استجابة غير صالحة من الخادم.'));
      }
    };

    xhr.send(formData);
  });

  return {
    promise,
    cancel: () => xhr.abort(),
  };
}

export async function getTeacherVideos(): Promise<VideoItem[]> {
  const response = await fetchApi<PaginatedResponse<VideoItem>>('/teacher/videos');
  return response.data;
}

export async function getAcademyVideos(): Promise<VideoItem[]> {
  const response = await fetchApi<PaginatedResponse<VideoItem>>('/academy/videos');
  return response.data;
}

export function uploadTeacherVideo(
  payload: CreateVideoPayload,
  onProgress?: (progress: number) => void
): { promise: Promise<VideoItem>; cancel: () => void } {
  return uploadWithProgress('/teacher/videos', payload, onProgress);
}

export function uploadAcademyVideo(
  payload: CreateVideoPayload,
  onProgress?: (progress: number) => void
): { promise: Promise<VideoItem>; cancel: () => void } {
  return uploadWithProgress('/academy/videos', payload, onProgress);
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
