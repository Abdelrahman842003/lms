import { fetchApi } from '@/services/api/baseApi';

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'true_false' | 'ordering' | 'matching';
  difficulty: 'easy' | 'medium' | 'hard';
  options: any;
  correct_answer: any;
  grade_id?: string;
  subject?: string;
  teacher_id?: string;
  teacher?: {
    id: string;
    name: string;
  };
  duration?: number;
  tags?: string[];
  is_locked?: boolean;
}

export interface QuestionsResponse {
  data: Question[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export const getQuestions = async (page = 1, perPage = 15, filters: Record<string, any> = {}): Promise<QuestionsResponse> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });

  return await fetchApi<QuestionsResponse>(`/teacher/questions?${queryParams.toString()}`);
};

export const getQuestion = async (id: string): Promise<Question> => {
  return await fetchApi<Question>(`/teacher/questions/${id}`);
};

export const createQuestion = async (data: any): Promise<Question> => {
  return await fetchApi<Question>('/teacher/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateQuestion = async (id: string, data: any): Promise<Question> => {
  return await fetchApi<Question>(`/teacher/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteQuestion = async (id: string): Promise<void> => {
  return await fetchApi<void>(`/teacher/questions/${id}`, {
    method: 'DELETE',
  });
};
