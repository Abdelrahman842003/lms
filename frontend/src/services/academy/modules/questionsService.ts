import { fetchApi } from '@/services/api/baseApi';
import { Question, QuestionsResponse } from '@/services/teacher/modules/questionsService';

export const getAcademyQuestions = async (page = 1, perPage = 15, filters: Record<string, any> = {}): Promise<QuestionsResponse> => {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      queryParams.append(key, filters[key]);
    }
  });

  return await fetchApi<QuestionsResponse>(`/academy/questions?${queryParams.toString()}`);
};

export const getAcademyQuestion = async (id: string): Promise<Question> => {
  return await fetchApi<Question>(`/academy/questions/${id}`);
};

export const createAcademyQuestion = async (data: any): Promise<Question> => {
  return await fetchApi<Question>('/academy/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAcademyQuestion = async (id: string, data: any): Promise<Question> => {
  return await fetchApi<Question>(`/academy/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteAcademyQuestion = async (id: string): Promise<void> => {
  return await fetchApi<void>(`/academy/questions/${id}`, {
    method: 'DELETE',
  });
};
