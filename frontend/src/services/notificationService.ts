import { fetchApi } from './authService';
import { getAccessToken } from '@/lib/tokenManager';

export interface Notification {
  id: number;
  title: string;
  message: string;
  recipient_type: 'all' | 'grade' | 'group' | 'admin' | 'all_users' | 'all_teachers' | 'all_students' | 'all_secretaries';
  recipient_count: number;
  created_at: string;
  is_voice?: boolean;
  voice_path?: string;
  voice_url?: string;
  voice_duration?: number;
}

export interface SendNotificationData {
  title: string;
  message: string;
  recipient_type: 'all' | 'grade' | 'group' | 'admin' | 'all_users' | 'all_teachers' | 'all_students' | 'all_secretaries';
  grade_id?: number;
  group_id?: number;
}

export interface ReceivedNotification {
  id: string;
  type: string;
  data: {
    title?: string;
    message?: string;
    is_voice?: boolean;
    voice_url?: string;
    voice_duration?: number;
    [key: string]: string | boolean | number | undefined;
  };
  voice_url?: string;
  read_at: string | null;
  created_at: string;
}

export interface VoiceLimitResponse {
  can_send_voice: boolean;
  max_duration: number;
}

const getNotificationEndpoint = () => {
  const userType = localStorage.getItem('userType');
  if (userType === 'student') return '/api/v1/student/notifications';
  if (userType === 'parent') return '/api/v1/parent/notifications';
  if (userType === 'secretary') return '/api/v1/secretary/notifications';
  if (userType === 'academy') return '/api/v1/academy/notifications';
  return '/api/v1/teacher/notifications';
};

export const getNotifications = async () => {
  const endpoint = getNotificationEndpoint();
  const data = await fetchApi(endpoint);
  return data as { notifications: Notification[], received_notifications: ReceivedNotification[] };
};

export const sendNotification = async (data: SendNotificationData) => {
  const endpoint = getNotificationEndpoint();
  return await fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const checkVoiceLimit = async (): Promise<VoiceLimitResponse> => {
  try {
    const endpoint = getNotificationEndpoint() + '/voice-limit';
    return await fetchApi(endpoint) as VoiceLimitResponse;
  } catch (error: unknown) {
    // If endpoint doesn't exist (404), return default values silently
    // This handles the case before backend is updated
    return { can_send_voice: true, max_duration: 40 };
  }
};

export interface SendVoiceNotificationData {
  title: string;
  voice: Blob;
  duration: number;
  recipient_type: 'all' | 'grade' | 'group' | 'admin' | 'all_users' | 'all_teachers' | 'all_students' | 'all_secretaries';
  grade_id?: number;
  group_id?: number;
}

export const sendVoiceNotification = async (data: SendVoiceNotificationData) => {
  const endpoint = getNotificationEndpoint() + '/voice';
  const token = getAccessToken();
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/api\/?$/, '').replace(/\/$/, '');
  
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('voice', data.voice, 'voice.webm');
  formData.append('duration', data.duration.toString());
  formData.append('recipient_type', data.recipient_type);
  
  if (data.grade_id) {
    formData.append('grade_id', data.grade_id.toString());
  }
  if (data.group_id) {
    formData.append('group_id', data.group_id.toString());
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'فشل في إرسال الرسالة الصوتية');
  }

  return response.json();
};

export const storeDeviceToken = async (token: string) => {
  return await fetchApi('/device-tokens', {
    method: 'POST',
    body: JSON.stringify({
      token,
      device_type: 'web',
    }),
  });
};
