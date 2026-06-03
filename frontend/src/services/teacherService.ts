import { fetchApi } from './authService';


export const getGrades = async () => {
  return await fetchApi('/teacher/grades?per_page=100');
};

export const getGroups = async (gradeId?: string) => {
  const query = gradeId ? `?grade_id=${gradeId}&per_page=100` : '?per_page=100';
  return await fetchApi(`/api/teacher/groups${query}`);
};

