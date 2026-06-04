import { BaseOfflineStore } from './base-store';

// === Teacher Stores ===
export const studentsStore = new BaseOfflineStore<any>('students');
export const gradesStore = new BaseOfflineStore<any>('grades');
export const groupsStore = new BaseOfflineStore<any>('groups');
export const lecturesStore = new BaseOfflineStore<any>('lectures');
export const attendancesStore = new BaseOfflineStore<any>('attendances');
export const examsStore = new BaseOfflineStore<any>('exams');
export const paymentsStore = new BaseOfflineStore<any>('payments');
export const notesStore = new BaseOfflineStore<any>('notes');

// === Student Stores ===
export const studentTeachersStore = new BaseOfflineStore<any>('studentTeachers');
export const studentLecturesStore = new BaseOfflineStore<any>('studentLectures');
export const studentExamsStore = new BaseOfflineStore<any>('studentExams');
export const studentPointsStore = new BaseOfflineStore<any>('studentPoints');
export const studentMistakesStore = new BaseOfflineStore<any>('studentMistakes');
export const studentDashboardStore = new BaseOfflineStore<any>('studentDashboard');

// === Academy Stores ===
export const academyTeachersStore = new BaseOfflineStore<any>('academyTeachers');
export const academyStudentsStore = new BaseOfflineStore<any>('academyStudents');
export const academyLecturesStore = new BaseOfflineStore<any>('academyLectures');
export const academyDashboardStore = new BaseOfflineStore<any>('academyDashboard');

// === Guardian Stores ===
export const childrenStore = new BaseOfflineStore<any>('children');
export const childSummariesStore = new BaseOfflineStore<any>('childSummaries');

// === Shared Stores ===
export const notificationsStore = new BaseOfflineStore<any>('notifications');
export const userProfileStore = new BaseOfflineStore<any>('userProfile');
export const appSettingsStore = new BaseOfflineStore<any>('appSettings');

// Helper to clear all stores (useful for logout)
export async function clearAllOfflineStores() {
  const stores = [
    studentsStore, gradesStore, groupsStore, lecturesStore, attendancesStore,
    examsStore, paymentsStore, notesStore, studentTeachersStore,
    studentLecturesStore, studentExamsStore, studentPointsStore, studentMistakesStore,
    studentDashboardStore,
    academyTeachersStore, academyStudentsStore, academyLecturesStore, academyDashboardStore,
    childrenStore, childSummariesStore, notificationsStore, userProfileStore, appSettingsStore
  ];
  
  await Promise.all(stores.map(store => store.clear().catch(err => {
    console.error(`Failed to clear store ${store.constructor.name}:`, err);
  })));
}
