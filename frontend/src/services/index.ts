/**
 * Services Index
 * Re-exports all services for convenient imports
 */

// Base API utilities
export * from './api/baseApi';

// Auth service
export * from './auth/authService';

// Teacher service - exclude duplicates
export {
  getTeacherDashboardStats,
  getTeacherRecentStudents,
  getTeacherUpcomingLectures,
  // getTeacherAcademies - exported from auth
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
