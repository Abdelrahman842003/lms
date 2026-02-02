import { fetchApi } from './authService';

export interface Grade {
  id: string;
  name: string;
  groups_count: number;
  students_count: number;
  price: number;
  created_at: string;
  teacher_id?: string | null;
  teacher?: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface CreateGradeData {
  name: string;
  price: number;
}

export interface UpdateGradeData {
  name: string;
  price?: number;
}

export const getGrades = async (
  page = 1, 
  perPage = 10,
  filters?: { search?: string }
): Promise<any> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(filters?.search && { search: filters.search }),
  });

  const data = await fetchApi(`/api/teacher/grades?${queryParams}`);
  return data;
};

export const createGrade = async (data: CreateGradeData): Promise<{ grade: Grade; message: string }> => {
  const res = await fetchApi<{ grade: Grade; message: string }>('/teacher/grades', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res;
};

export const updateGrade = async (id: string, data: UpdateGradeData): Promise<{ grade: Grade; message: string }> => {
  const res = await fetchApi<{ grade: Grade; message: string }>(`/teacher/grades/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res;
};

export const deleteGrade = async (id: string): Promise<{ message: string }> => {
  const res = await fetchApi<{ message: string }>(`/teacher/grades/${id}`, {
    method: 'DELETE',
  });
  return res;
};
