import { fetchApi } from './authService';

export interface Group {
  id: string;
  name: string;
  grade_id: string | null;
  grade_name: string | null;
  time: string | null;
  days: string | null;
  type: 'general' | 'private';
  price: number | null;
  students_count: number;
  created_at: string;
  teacher?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface CreateGroupData {
  name: string;
  grade_id?: string | null;
  time?: string | null;
  days?: string | null;
  type?: 'general' | 'private';
  price?: number;
}

export interface UpdateGroupData {
  name?: string;
  grade_id?: string | null;
  time?: string | null;
  days?: string | null;
  type?: 'general' | 'private';
  price?: number;
}

export const getGroups = async (
  page = 1, 
  perPage = 10,
  filters?: { search?: string; grade_id?: string }
): Promise<{ data: Group[]; meta?: { current_page: number; last_page: number; total: number } }> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
    ...(filters?.grade_id && { grade_id: filters.grade_id }),
  });

  const data = await fetchApi<{ data: Group[]; meta?: { current_page: number; last_page: number; total: number } }>(`/api/teacher/groups?${queryParams}`);
  return data;
};

export const getGroup = async (id: string): Promise<{ group: Group; students: Array<{ id: string; name: string; phone: string }> }> => {
  const data = await fetchApi<{ group: Group; students: Array<{ id: string; name: string; phone: string }> }>(`/teacher/groups/${id}`);
  return data;
};

export const createGroup = async (data: CreateGroupData): Promise<{ group: Group; message: string }> => {
  const res = await fetchApi<{ group: Group; message: string }>('/teacher/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
};

export const updateGroup = async (id: string, data: UpdateGroupData): Promise<{ group: Group; message: string }> => {
  const res = await fetchApi<{ group: Group; message: string }>(`/teacher/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res;
};

export const deleteGroup = async (id: string): Promise<{ message: string }> => {
  const res = await fetchApi<{ message: string }>(`/teacher/groups/${id}`, {
    method: 'DELETE',
  });
  return res;
};
