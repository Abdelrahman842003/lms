/**
 * Academy Notifications Service
 * Handles notification management and messaging
 */

import { API_BASE_URL, getAuthHeaders } from '../api/baseApi';
import axios from 'axios';

export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  target_type: 'teachers' | 'secretaries' | 'students' | 'parents' | 'all';
  target_ids?: string[]; // Specific users to send to
  scheduled_at?: string; // For scheduled notifications
  expires_at?: string; // Notification expiration
}

export interface NotificationFilters {
  page?: number;
  per_page?: number;
  target_type?: string;
  type?: string;
  read_status?: 'read' | 'unread' | 'all';
  date_from?: string;
  date_to?: string;
}

// ========== Notifications Management ==========
export const getNotifications = async (params: NotificationFilters = {}) => {
  const { page = 1, per_page = 15, ...filters } = params;
  const response = await axios.get(`${API_BASE_URL}/academy/notifications`, {
    headers: getAuthHeaders(),
    params: { page, per_page, ...filters },
  });
  return response.data;
};

export const getNotification = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/notifications/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createNotification = async (data: CreateNotificationData) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateNotification = async (id: string, data: Partial<CreateNotificationData>) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/notifications/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteNotification = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/notifications/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications/${id}/read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications/mark-all-read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const sendNotificationToTeachers = async (data: {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'danger';
  teacher_ids?: string[];
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications/send-to-teachers`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const sendNotificationToStudents = async (data: {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'danger';
  student_ids?: string[];
  grade_ids?: string[];
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications/send-to-students`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getUnreadNotificationsCount = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getNotificationSettings = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/notifications/settings`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateNotificationSettings = async (settings: {
  email_notifications?: boolean;
  push_notifications?: boolean;
  sms_notifications?: boolean;
  notification_types?: string[];
}) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/notifications/settings`,
    settings,
    { headers: getAuthHeaders() }
  );
  return response.data;
};