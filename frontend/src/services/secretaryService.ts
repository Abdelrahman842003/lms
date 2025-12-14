import { fetchApi } from './authService';

export interface Secretary {
  id: string;
  name: string;
  phone: string;
  username: string;
  avatar?: string;
  permissions?: string[];
  is_active?: boolean;
  created_at?: string;
}

export interface CreateSecretaryData {
  name: string;
  phone: string;
  username: string;
  password: string;
  permissions?: string[];
}

export interface UpdateSecretaryData {
  name?: string;
  phone?: string;
  username?: string;
  password?: string;
}

export const secretaryService = {
  // Get all secretaries
  getSecretaries: async (page = 1, search = '', status = '') => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      ...(search && { search }),
      ...(status && { status }),
    });
    return fetchApi(`/teacher/secretaries?${queryParams}`);
  },

  // Get single secretary
  getSecretary: async (id: string) => {
    return fetchApi(`/teacher/secretaries/${id}`);
  },

  // Create secretary
  createSecretary: async (data: CreateSecretaryData) => {
    return fetchApi('/teacher/secretaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update secretary
  updateSecretary: async (id: string, data: UpdateSecretaryData) => {
    return fetchApi(`/teacher/secretaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete secretary
  deleteSecretary: async (id: string) => {
    return fetchApi(`/teacher/secretaries/${id}`, {
      method: 'DELETE',
    });
  },

  // Update permissions
  updatePermissions: async (id: string, permissions: string[]) => {
    return fetchApi(`/teacher/secretaries/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },
  // Toggle status
  toggleStatus: async (id: string) => {
    return fetchApi(`/teacher/secretaries/${id}/toggle-status`, {
      method: 'PUT',
    });
  },
};
