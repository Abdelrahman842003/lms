import { fetchApi } from './authService';

export interface Notification {
  id: number;
  title: string;
  message: string;
  recipient_type: 'all' | 'grade' | 'group' | 'admin' | 'all_users' | 'all_teachers' | 'all_students' | 'all_secretaries';
  recipient_count: number;
  created_at: string;
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
    [key: string]: any;
  };
  read_at: string | null;
  created_at: string;
}

export const getNotifications = async () => {
  const userType = localStorage.getItem('userType');
  let endpoint = '/teacher/notifications';

  if (userType === 'admin') {
    endpoint = '/admin/notifications';
  } else if (userType === 'student') {
    endpoint = '/student/notifications';
  } else if (userType === 'parent') {
    endpoint = '/parent/notifications';
  } else if (userType === 'secretary') {
    endpoint = '/secretary/notifications';
  }
  
  const data = await fetchApi(endpoint);
  return data as { notifications: Notification[], received_notifications: ReceivedNotification[] };
};

export const sendNotification = async (data: SendNotificationData) => {
  const userType = localStorage.getItem('userType');
  let endpoint = '/teacher/notifications';
  
  if (userType === 'admin') {
    endpoint = '/admin/notifications';
  } else if (userType === 'student') {
    endpoint = '/student/notifications';
  } else if (userType === 'parent') {
    endpoint = '/parent/notifications';
  } else if (userType === 'secretary') {
    endpoint = '/secretary/notifications';
  }

  return await fetchApi(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
