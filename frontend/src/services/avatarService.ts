import { getAuthToken } from '@/services/authService';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

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

  const response = await fetch(`${API_URL}/avatar/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upload avatar');
  }

  return response.json();
}

/**
 * Delete avatar
 */
export async function deleteAvatar(): Promise<{ success: boolean; message?: string }> {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/avatar`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete avatar');
  }

  return response.json();
}

/**
 * Get avatar URL
 */
export async function getAvatarUrl(): Promise<AvatarUrlResponse> {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/avatar`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get avatar');
  }

  return response.json();
}
