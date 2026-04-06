import { fetchApi } from '@/services/api/baseApi';
import { getVersionedApiUrl } from '@/config/api-config';
import { getAuthToken } from '@/services/authService';

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

  const token = getAuthToken();
  if (!token) {
    throw new Error('غير مصرح لك بالدخول. يرجى تسجيل الدخول.');
  }

  const apiUrl = getVersionedApiUrl();
  const response = await fetch(`${apiUrl}/avatar/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = 'Failed to upload avatar';
    try {
      const error = await response.json();
      message = error?.message || message;
    } catch {
      // Keep fallback message
    }
    throw new Error(message);
  }

  const result = await response.json();
  const data = result?.data as { url: string; key: string };

  return {
    success: true,
    data,
    message: result?.message,
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
  const token = getAuthToken();
  if (!token) {
    return {
      success: false,
      message: 'غير مصرح لك بالدخول. يرجى تسجيل الدخول.',
    };
  }

  const apiUrl = getVersionedApiUrl();
  const response = await fetch(`${apiUrl}/avatar`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (response.status === 404 || response.status === 400) {
    return {
      success: false,
      message: 'لا توجد صورة',
    };
  }

  if (!response.ok) {
    let message = 'Failed to get avatar';
    try {
      const error = await response.json();
      message = error?.message || message;
    } catch {
      // Keep fallback message
    }
    throw new Error(message);
  }

  const result = await response.json();
  return {
    success: true,
    data: result?.data,
    message: result?.message,
  };
}
