/**
 * Academy Grades Service
 * Handles grade/class management operations
 */

import { API_BASE_URL, getAuthHeaders } from '../api/baseApi';
import axios from 'axios';

export interface GradeFilters {
  search?: string;
  name?: string; 
  teacher_id?: string;
}

export interface CreateGradeData {
  name: string;
  teacher_id?: string;
  description?: string;
  capacity?: number;
}

// ========== Grades Management ==========
export const getGrades = async (page = 1, perPage = 10, filters: string | GradeFilters = '') => {
  const params: Record<string, string | number> = { page, per_page: perPage };
  
  if (typeof filters === 'string') {
    if (filters) params.search = filters;
  } else {
    if (filters.search) params.search = filters.search;
    if (filters.name) params.name = filters.name;
    if (filters.teacher_id) params.teacher_id = filters.teacher_id;
  }

  const response = await axios.get(`${API_BASE_URL}/academy/grades`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const createGrade = async (data: CreateGradeData) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/grades`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateGrade = async (id: string, data: Partial<CreateGradeData>) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/grades/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteGrade = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/grades/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const updateGradeName = async (oldName: string, newName: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/grades/bulk-update-name`,
    { old_name: oldName, new_name: newName },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteGradeByName = async (name: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/grades/bulk-delete`,
    { name },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getGradeDetails = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/grades/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getGradeStudents = async (id: string, page = 1, perPage = 10) => {
  const response = await axios.get(`${API_BASE_URL}/academy/grades/${id}/students`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage },
  });
  return response.data;
};