import { fetchApi } from '@/services/authService';

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

  // We pass Content-Type as undefined to let the browser set it with the boundary for FormData
  // fetchApi logic we just updated will handle this correctly
  const response = await fetchApi('/avatar/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': undefined as any, 
    },
  });

  return response;
}

/**
 * Delete avatar
 */
export async function deleteAvatar(): Promise<{ success: boolean; message?: string }> {
  const response = await fetchApi('/avatar', {
    method: 'DELETE',
  });

  return response;
}

/**
 * Get avatar URL
 */
export async function getAvatarUrl(): Promise<AvatarUrlResponse> {
  const response = await fetchApi('/avatar', {
    method: 'GET',
  });

  return response;
}
