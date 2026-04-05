import { fetchApi } from '@/services/api/baseApi';

export interface AvatarUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
    key: string;
  };
}

export interface AvatarUrlResponse {
  success: boolean;
  message?: string;
  data?: {
    url: string;
  };
}

/**
 * Upload avatar image
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  const formData = new FormData();
  formData.append('avatar', file);

  const data = await fetchApi<{ url: string; key: string }>('/avatar/upload', {
    method: 'POST',
    body: formData,
  });

  return {
    success: true,
    data,
  };
}

/**
 * Delete avatar
 */
export async function deleteAvatar(): Promise<{ success: boolean; message?: string }> {
  await fetchApi<unknown>('/avatar', {
    method: 'DELETE',
  });

  return {
    success: true,
  };
}

/**
 * Get avatar URL
 */
export async function getAvatarUrl(): Promise<AvatarUrlResponse> {
  const data = await fetchApi<{ url: string }>('/avatar', {
    method: 'GET',
  });

  return {
    success: true,
    data,
  };
}
