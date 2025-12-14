const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

export const getRoles = async () => {
  return fetchApi<Role[]>('/api/admin/roles');
};

export const createRole = async (data: { name: string; permissions?: string[] }) => {
  return fetchApi<Role>('/api/admin/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateRole = async (id: number, data: { name: string; permissions?: string[] }) => {
  return fetchApi<Role>(`/api/admin/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteRole = async (id: number) => {
  return fetchApi<void>(`/api/admin/roles/${id}`, {
    method: 'DELETE',
  });
};

export const getPermissions = async () => {
  return fetchApi<Permission[]>('/api/admin/permissions');
};

export const getTeacherPermissions = async () => {
  return fetchApi<Permission[]>('/api/teacher/permissions');
};

export const createPermission = async (data: { name: string }) => {
  return fetchApi<Permission>('/api/admin/permissions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updatePermission = async (id: number, data: { name: string }) => {
  return fetchApi<Permission>(`/api/admin/permissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deletePermission = async (id: number) => {
  return fetchApi<void>(`/api/admin/permissions/${id}`, {
    method: 'DELETE',
  });
};
