/**
 * Academy Teachers Service
 * Handles teacher management operations
 */

import { API_BASE_URL, getAuthHeaders } from '../api/baseApi';
import axios from 'axios';

// ========== Teachers Management ==========
export const getTeachers = async (page = 1, perPage = 10, search = '', status = '') => {
  const response = await axios.get(`${API_BASE_URL}/academy/teachers`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, search, status },
  });
  return response.data;
};

export const getTeacher = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/teachers/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const addTeacher = async (data: string | { name: string; phone: string; password: string; subject?: string }) => {
  const payload = typeof data === 'string' ? { teacher_id: data } : data;
  const response = await axios.post(
    `${API_BASE_URL}/academy/teachers`,
    payload,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateTeacher = async (id: string, data: { name: string; phone: string; password?: string; subject?: string }) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/teachers/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const removeTeacher = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/teachers/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const toggleTeacherStatus = async (id: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/teachers/${id}/toggle-status`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const checkTeacherPhone = async (phone: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/check-teacher-phone`,
    { phone },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getTeacherStatistics = async (teacherId: string, period: 'week' | 'month' | 'year' = 'month') => {
  const response = await axios.get(`${API_BASE_URL}/academy/teachers/${teacherId}/statistics`, {
    headers: getAuthHeaders(),
    params: { period },
  });
  return response.data;
};

export const getTeacherStudents = async (teacherId: string, page = 1, perPage = 10) => {
  const response = await axios.get(`${API_BASE_URL}/academy/teachers/${teacherId}/students`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage },
  });
  return response.data;
};