import { fetchApi } from './authService';

export interface Secretary {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  permissions?: string[];
  is_active?: boolean;
  created_at?: string;
}

export interface CreateSecretaryData {
  name: string;
  phone: string;
  password: string;
  permissions?: string[];
}

export interface UpdateSecretaryData {
  name?: string;
  phone?: string;
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
    const res = await fetchApi<any>(`/api/teacher/secretaries?${queryParams}`);
    const secretariesData = res.secretaries?.data || res.secretaries || [];
    const total = res.secretaries?.total || res.total || 0;
    const last_page = res.secretaries?.last_page || res.last_page || 1;
    
    return {
      secretaries: secretariesData,
      total: total,
      last_page: last_page
    };
  },

  // Get single secretary
  getSecretary: async (id: string) => {
    return fetchApi(`/api/teacher/secretaries/${id}`);
  },

  // Check phone
  checkPhone: async (phone: string) => {
    return fetchApi('/teacher/secretaries/check-phone', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
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
    return fetchApi(`/api/teacher/secretaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete secretary
  deleteSecretary: async (id: string) => {
    return fetchApi(`/api/teacher/secretaries/${id}`, {
      method: 'DELETE',
    });
  },

  // Update permissions
  updatePermissions: async (id: string, permissions: string[]) => {
    return fetchApi(`/api/teacher/secretaries/${id}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  },
  // Toggle status
  toggleStatus: async (id: string) => {
    return fetchApi(`/api/teacher/secretaries/${id}/toggle-status`, {
      method: 'PUT',
    });
  },
};
