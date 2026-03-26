import axios from '@/lib/axios';
import { getAuthHeaders, fetchApi } from './api/baseApi';
import { getVersionedApiUrl } from '@/config/api-config';

const API_BASE_URL = getVersionedApiUrl();

/**
 * Academy Service - API client for academy management features
 * Transitional facade while migrating to `services/academy/*`
 */

// ========== Dashboard ==========
export const getDashboardStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/dashboard`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ========== Teachers Management ==========
export const getTeachers = async (page = 1, perPage = 10, search = '', status = '') => {
  const response = await axios.get(`${API_BASE_URL}/academy/teachers`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, search, status },
  });
  return response.data;
};

export const getTeacher = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/teachers/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const addTeacher = async (data: string | { name: string; phone: string; password: string; subject?: string }) => {
  const payload = typeof data === 'string' ? { teacher_id: data } : data;
  const response = await axios.post(
    `${API_BASE_URL}/academy/teachers`,
    payload,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateTeacher = async (id: string, data: { name: string; phone: string; password?: string; subject?: string }) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/teachers/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const removeTeacher = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/teachers/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const toggleTeacherStatus = async (id: string) => {
  return await fetchApi<{ message: string; is_active: boolean }>(`/academy/teachers/${id}/toggle-status`, {
    method: 'PUT'
  });
};

export const checkTeacherPhone = async (phone: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/check-teacher-phone`,
    { phone },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

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
  return await fetchApi<{ data: any; message: string }>('/academy/secretaries', {
    method: 'POST',
    body: JSON.stringify(data)
  });
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
  return await fetchApi<{ message: string; is_active: boolean }>(`/academy/secretaries/${id}/toggle-status`, {
    method: 'PUT'
  });
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

// ========== Grades Management ==========
export const getGrades = async (page = 1, perPage = 10, filters: string | { search?: string; name?: string; teacher_id?: string } = '') => {
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

export const createGrade = async (data: { name: string; description?: string }) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/grades`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateGrade = async (id: string, data: { name?: string; description?: string }) => {
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

// ========== Groups Management ==========
export const getGroups = async (page = 1, perPage = 10, filters: { search?: string; grade_id?: string; teacher_id?: string } = {}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/groups`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, ...filters },
  });
  return response.data;
};

export const createGroup = async (data: { name: string; grade_id: string; teacher_id?: string }) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/groups`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// ========== Payments ==========

export const updateGroup = async (id: string, data: { name?: string; grade_id?: string }) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/groups/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteGroup = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/groups/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ========== Attendance Management ==========
export const getAttendanceLogs = async (params: {
  page?: number;
  per_page?: number;
  teacher_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/attendance`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const getTodayAttendance = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/attendance/today`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const markAbsent = async (data: {
  teacher_id: string;
  date: string;
  notes?: string;
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/attendance/mark-absent`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateAttendanceNotes = async (logId: string, notes: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/attendance/${logId}/notes`,
    { notes },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getAttendanceStats = async (dateFrom: string, dateTo: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/attendance/stats`, {
    headers: getAuthHeaders(),
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return response.data;
};

// ========== Notifications ==========
export const getNotifications = async (page = 1, perPage = 15, targetType?: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/notifications`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, target_type: targetType },
  });
  return response.data;
};

export const createNotification = async (data: {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  target_type: 'teachers' | 'secretaries' | 'all';
  target_id?: string | null;
  target_ids?: string[];
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications/${id}/read`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const sendNotificationToTeachers = async (data: {
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'danger';
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/notifications/send-to-teachers`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getUnreadNotificationsCount = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/notifications/unread-count`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

// ========== Reports ==========
export const getAttendanceReport = async (params: {
  date_from: string;
  date_to: string;
  teacher_id?: string;
}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/attendance`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};



export const getMonthlyReport = async (month: number, year: number) => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/monthly`, {
    headers: getAuthHeaders(),
    params: { month, year },
  });
  return response.data;
};

export const getStudentsReport = async (params: {
  date_from?: string;
  date_to?: string;
}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/students`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const getFinancialReport = async (params: {
  date_from?: string;
  date_to?: string;
}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/financial`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const exportReportToPDF = async (params: {
  report_type: 'attendance' | 'teachers' | 'monthly' | 'students' | 'financial';
  month?: number;
  year?: number;
  date_from?: string;
  date_to?: string;
  teacher_id?: string;
}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/reports/export-pdf`, {
    headers: getAuthHeaders(),
    params,
    responseType: 'blob',
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `report_${Date.now()}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  return response.data;
};

// ========== Lectures Management (Student Attendance) ==========
export interface CreateLectureData {
  teacher_id: string;
  title: string;
  description?: string | null;
  grade_id: string;
  group_id?: string | null;
  date?: string;
  is_recurring?: boolean;
  recurrence_days?: string[];
  recurrence_time: string;
  duration_minutes: number;
}

export const getLectures = async (page = 1, perPage = 10, filters: {
  search?: string;
  teacher_id?: string;
  status?: string;
  group_id?: string;
} = {}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/lectures`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, ...filters },
  });
  return response.data;
};

export const getLectureTeachers = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/lectures/teachers`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getLecture = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/lectures/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const createLecture = async (data: CreateLectureData) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/lectures`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateLecture = async (id: string, data: Partial<CreateLectureData>) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/lectures/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const deleteLecture = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/lectures/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const toggleLectureActive = async (id: string) => {
  return await fetchApi<{ message: string; is_active: boolean }>(`/academy/lectures/${id}/toggle-active`, {
    method: 'PUT'
  });
};

export const endLecture = async (id: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/lectures/${id}/end`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const generateLectureQrCode = async (id: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/lectures/${id}/qr-code`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getLectureAttendees = async (id: string, filters: {
  date_from?: string;
  date_to?: string;
} = {}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/lectures/${id}/attendees`, {
    headers: getAuthHeaders(),
    params: filters,
  });
  return response.data;
};

export const exportAttendeesPDF = async (lectureId: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/lectures/${lectureId}/attendees/export`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `attendance_report_${lectureId}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const cancelLectureSession = async (id: string, date: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/lectures/${id}/cancel-session`,
    { date },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const recordManualAttendance = async (lectureId: string, studentId: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/lectures/${lectureId}/attendance`,
    { student_id: studentId },
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getLectureSessions = async (lectureId: string, params?: { date_from?: string; date_to?: string }) => {
  const response = await axios.get(`${API_BASE_URL}/academy/lectures/${lectureId}/sessions`, {
    headers: getAuthHeaders(),
    params: params
  });
  return response.data;
};

export const updateLectureSession = async (lectureId: string, data: { date: string; title?: string; description?: string }) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/lectures/${lectureId}/sessions`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

// ========== Students Management ==========
export const getAcademyStudents = async (page = 1, perPage = 10, search = '', status = '') => {
  const response = await axios.get(`${API_BASE_URL}/academy/students`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, search, status },
  });
  return response.data;
};

export const getAcademyStudentStatistics = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/students/statistics`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const getAcademyStudentDetails = async (id: string, teacherId?: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/students/${id}`, {
    headers: getAuthHeaders(),
    params: { teacher_id: teacherId },
  });
  return { ...response.data.data.student, subscription_history: response.data.data.subscription_history, enrolled_teachers: response.data.data.enrolled_teachers };
};

export const deleteAcademyStudent = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/students/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const toggleAcademyStudentStatus = async (id: string, teacherId?: string) => {
  return await fetchApi<{ message: string; is_active: boolean }>(`/academy/students/${id}/toggle-status`, {
    method: 'PUT',
    body: JSON.stringify({ teacher_id: teacherId })
  });
};export const createAcademyStudent = async (data: { name: string; phone: string; grade_id: string; group_id?: string; teacher_id?: string }) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/students`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const updateAcademyStudent = async (id: string, data: { name?: string; phone?: string; grade_id?: string; group_id?: string }) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/students/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const searchAcademyStudentByPhone = async (phone: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/students/search-phone`, {
    headers: getAuthHeaders(),
    params: { phone },
  });
  return response.data;
};

// ========== Exams Management ==========
export const getAcademyExams = async (page = 1, perPage = 10, filters: {
  search?: string;
  teacher_id?: string;
  date_from?: string;
  date_to?: string;
} = {}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/exams`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, ...filters },
  });
  return response.data.data;
};

export const getAcademyExam = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/exams/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data.data.exam;
};

export const createAcademyExam = async (data: {
  teacher_id: string;
  title: string;
  subject: string;
  grade_id: string;
  group_id?: string;
  date: string;
  duration: number;
  total_marks: number;
  actual_question_count: number;
  time_per_question?: number;
  questions: {
    text: string;
    options: string[];
    correct_answer: string;
    duration?: number;
  }[];
}) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/exams`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data.data;
};

export const updateAcademyExam = async (id: string, data: {
  teacher_id?: string;
  title: string;
  subject: string;
  grade_id: string;
  group_id?: string;
  date: string;
  duration: number;
  total_marks: number;
  actual_question_count: number;
  time_per_question?: number;
  questions: {
    text: string;
    options: string[];
    correct_answer: string;
    duration?: number;
  }[];
}) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/exams/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  return response.data.data;
};

export const deleteAcademyExam = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/academy/exams/${id}`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const copyAcademyExam = async (id: string, title?: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/academy/exams/${id}/copy`,
    title ? { title } : {},
    { headers: getAuthHeaders() }
  );
  return response.data.data.exam;
};

export const toggleAcademyExamStatus = async (id: string) => {
  return await fetchApi<{ message: string; is_active: boolean }>(`/academy/exams/${id}/toggle-status`, {
    method: 'PUT'
  });
};

export const endAcademyExam = async (id: string) => {
  const response = await axios.put(
    `${API_BASE_URL}/academy/exams/${id}/end`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const getAcademyExamResults = async (id: string) => {
  const response = await axios.get(`${API_BASE_URL}/academy/exams/${id}/results`, {
    headers: getAuthHeaders(),
  });
  return response.data.data;
};

export const getExamTeachers = async () => {
  const response = await axios.get(`${API_BASE_URL}/academy/exams/teachers`, {
    headers: getAuthHeaders(),
  });
  return response.data.data.teachers;
};

// ========== Gamification ==========
export const getLeaderboard = async (page = 1, perPage = 15, filters: { grade_name?: string; group_id?: string } = {}) => {
  const response = await axios.get(`${API_BASE_URL}/academy/leaderboard`, {
    headers: getAuthHeaders(),
    params: { page, per_page: perPage, ...filters },
  });
  return response.data;
};

export default {
  // Dashboard
  getDashboardStats,
  
  // Teachers
  getTeachers,
  getTeacher,

  // Payments

  addTeacher,
  removeTeacher,
  toggleTeacherStatus,
  checkTeacherPhone,
  
  // Secretaries
  getSecretaries,
  getSecretary,
  createSecretary,
  updateSecretary,
  updateSecretaryPermissions,
  toggleSecretaryStatus,
  removeSecretary,
  checkPhoneAvailability,
  
  // Attendance
  getAttendanceLogs,
  getTodayAttendance,
  markAbsent,
  updateAttendanceNotes,
  getAttendanceStats,
  
  // Notifications
  getNotifications,
  createNotification,
  markNotificationAsRead,
  sendNotificationToTeachers,
  getUnreadNotificationsCount,
  
  // Reports
  getAttendanceReport,

  getMonthlyReport,
  getStudentsReport,
  getFinancialReport,
  exportReportToPDF,
  
  // Lectures
  getLectures,
  getLectureTeachers,
  getLecture,
  createLecture,
  updateLecture,
  deleteLecture,
  toggleLectureActive,
  endLecture,
  generateLectureQrCode,
  getLectureAttendees,
  
  // Students
  getAcademyStudents,
  getAcademyStudentStatistics,
  getAcademyStudentDetails,
  deleteAcademyStudent,
  toggleAcademyStudentStatus,
  createAcademyStudent,
  updateAcademyStudent,
  searchAcademyStudentByPhone,

  // Exams
  getAcademyExams,
  getAcademyExam,
  createAcademyExam,
  updateAcademyExam,
  deleteAcademyExam,
  copyAcademyExam,
  toggleAcademyExamStatus,
  endAcademyExam,
  getAcademyExamResults,
  getExamTeachers,
};
