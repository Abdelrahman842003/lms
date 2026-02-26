/**
 * Auth Service - Backward Compatibility Re-exports
 * 
 * This file re-exports all functions from the new modular services
 * to maintain backward compatibility with existing imports.
 * 
 * New code should import from specific services:
 * - import { loginTeacher } from '@/services/auth/authService'
 * - import { getTeachers } from '@/services/admin/adminService'
 * - import { getGrades } from '@/services/teacher/teacherService'
 */

// Re-export everything from auth service
export * from './auth/authService';

// Re-export teacher service (excluding duplicates)
export {
  getTeacherDashboardStats,
  getTeacherRecentStudents,
  getTeacherUpcomingLectures,
  // getTeacherAcademies - already exported from auth
  getTeacherStudentStatistics,
  getTeacherStudents,
  searchStudentByPhone,
  createTeacherStudent,
  updateTeacherStudent,
  updateTeacherStudentPermissions,
  getTeacherStudentDetails,
  deleteTeacherStudent,
  activateTeacherStudent,
  getStudentActivationDetails,
  toggleTeacherStudentStatus,
  createTeacherStudentPayment,
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getLectures,
  createLecture,
  updateLecture,
  deleteLecture,
  generateLectureQrCode,
  getExams,
  createExam,
  getExam,
  updateExam,
  deleteExam,
  toggleExamStatus,
  endExam,
  copyExam,
  getSecretaries,
  createSecretary,
  updateSecretary,
  updateSecretaryPermissions,
  toggleSecretaryStatus,
  deleteSecretary,
  getPermissions,
  getNotifications,
  sendNotification,
  getMyTeacherReport,
  downloadMyTeacherReportPdf,
} from './teacher/teacherService';

// Re-export base API utilities
export { 
  fetchApi, 
  getAuthHeaders, 
  getAuthToken, 
  getRefreshToken,
  csrf,
  API_BASE_URL,
  ENDPOINTS,
} from './api/baseApi';

// Re-export types for backward compatibility
export type { ApiErrorExtended } from './api/baseApi';

// Legacy type exports (these are now in @/types)
export type { 
  AuthResponse, 
  TeacherInfo, 
  ChildInfo, 
  AcademyInfo 
} from '@/types/auth.types';

export type { ReportParams } from '@/types/api.types';
