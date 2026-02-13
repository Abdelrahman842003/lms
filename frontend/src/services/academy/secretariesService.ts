/**
 * Academy Secretaries Service
 * Handles secretary management operations
 */

import { API_BASE_URL, getAuthHeaders } from '../api/baseApi';
import axios from 'axios';

// ========== Secretaries Management ==========
export const getSecretaries = async (page = 1, perPage = 10, search = '') => {
  const response = await axios.get(`${API_BASE_URL}/academy/secretaries`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, search },
  });
  return response.data;
};

export const getSecretary = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/secretaries/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createSecretary = async (data: {
  name: string;
  phone: string;
  password: string;
  permissions?: string[];
  avatar_key?: string;
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/secretaries`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateSecretary = async (id: string, data: {
  name?: string;
  phone?: string;
  password?: string;
  avatar_key?: string;
}) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/secretaries/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateSecretaryPermissions = async (id: string, permissions: string[]) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/secretaries/${id}/permissions`,
    { permissions },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const toggleSecretaryStatus = async (id: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/secretaries/${id}/toggle-status`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const removeSecretary = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/secretaries/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const checkPhoneAvailability = async (phone: string, excludeId?: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/secretaries/check-phone`,
    { phone, exclude_id: excludeId },
    { headers: getAuthHeaders() }
  );
  return response.data;
};