/**
 * Academy Groups Service
 * Handles group management operations
 */

import { API_BASE_URL, getAuthHeaders } from '../api/baseApi';
import axios from 'axios';

export interface GroupFilters {
  search?: string;
  grade_id?: string;
  teacher_id?: string;
  status?: 'active' | 'inactive';
}

export interface CreateGroupData {
  name: string;
  grade_id: string;
  teacher_id?: string;
  description?: string;
  capacity?: number;
  schedule?: {
    day: string;
    start_time: string;
    end_time: string;
  }[];
}

// ========== Groups Management ==========
export const getGroups = async (page = 1, perPage = 10, filters: GroupFilters = {}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/groups`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, ...filters },
  });
  return response.data;
};

export const getGroup = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/groups/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createGroup = async (data: CreateGroupData) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/groups`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateGroup = async (id: string, data: Partial<CreateGroupData>) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/groups/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteGroup = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/groups/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getGroupStudents = async (id: string, page = 1, perPage = 10) => {
  const response = await axios.get(`${API_BASE_URL}/academy/groups/${id}/students`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage },
  });
  return response.data;
};

export const addStudentToGroup = async (groupId: string, studentId: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/groups/${groupId}/students`,
    { student_id: studentId },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const removeStudentFromGroup = async (groupId: string, studentId: string) => {
  const response = await axios.delete(
    `${API_BASE_URL}/academy/groups/${groupId}/students/${studentId}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};