import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncQueueItem {
  id: string; // UUID
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: any;
  headers: Record<string, string>;
  createdAt: string;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'in-progress' | 'failed' | 'conflict';
  errorMessage?: string;
  entityType: string;
  entityId?: string;
}

export interface SyncMeta {
  key: string; // e.g. "students", "lectures"
  lastSyncAt: string; // ISO String
  userId: string;
  userType: string;
  etag?: string;
}

export interface NeetaqSchema extends DBSchema {
  syncMeta: {
    key: string;
    value: SyncMeta;
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-status': string; 'by-created': string };
  };
  
  // Shared / generic stores
  notifications: {
    key: string;
    value: any;
  };
  userProfile: {
    key: string;
    value: any;
  };
  appSettings: {
    key: string;
    value: any;
  };

  // Teacher Stores
  students: { key: string; value: any };
  grades: { key: string; value: any };
  groups: { key: string; value: any };
  lectures: { key: string; value: any };
  attendances: { key: string; value: any };
  exams: { key: string; value: any };
  payments: { key: string; value: any };
  notes: { key: string; value: any };

  // Student Stores
  studentTeachers: { key: string; value: any };
  studentLectures: { key: string; value: any };
  studentExams: { key: string; value: any };
  studentPoints: { key: string; value: any };
  studentMistakes: { key: string; value: any };
  studentDashboard: { key: string; value: any };

  // Academy Stores
  academyTeachers: { key: string; value: any };
  academyStudents: { key: string; value: any };
  academyLectures: { key: string; value: any };
  academyDashboard: { key: string; value: any };

  // Guardian Stores
  children: { key: string; value: any };
  childSummaries: { key: string; value: any };
}

const DB_NAME = 'neetaq-offline-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<NeetaqSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<NeetaqSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser environments'));
  }

  if (!dbPromise) {
    dbPromise = openDB<NeetaqSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        // Safe check-and-create helper to prevent ConstraintErrors on existing stores
        const createStoreIfMissing = (name: string, options: any) => {
          if (!db.objectStoreNames.contains(name as any)) {
            return db.createObjectStore(name as any, options);
          }
          return null;
        };

        // Meta & Queue
        createStoreIfMissing('syncMeta', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          queueStore.createIndex('by-status', 'status');
          queueStore.createIndex('by-created', 'createdAt');
        }

        // Shared
        createStoreIfMissing('notifications', { keyPath: 'id' });
        createStoreIfMissing('userProfile', { keyPath: 'id' });
        createStoreIfMissing('appSettings', { keyPath: 'key' });

        // Teacher
        createStoreIfMissing('students', { keyPath: 'id' });
        createStoreIfMissing('grades', { keyPath: 'id' });
        createStoreIfMissing('groups', { keyPath: 'id' });
        createStoreIfMissing('lectures', { keyPath: 'id' });
        createStoreIfMissing('attendances', { keyPath: 'id' });
        createStoreIfMissing('exams', { keyPath: 'id' });
        createStoreIfMissing('payments', { keyPath: 'id' });
        createStoreIfMissing('notes', { keyPath: 'id' });

        // Student
        createStoreIfMissing('studentTeachers', { keyPath: 'id' });
        createStoreIfMissing('studentLectures', { keyPath: 'id' });
        createStoreIfMissing('studentExams', { keyPath: 'id' });
        createStoreIfMissing('studentPoints', { keyPath: 'id' });
        createStoreIfMissing('studentMistakes', { keyPath: 'id' });

        // Academy
        createStoreIfMissing('academyTeachers', { keyPath: 'id' });
        createStoreIfMissing('academyStudents', { keyPath: 'id' });
        createStoreIfMissing('academyLectures', { keyPath: 'id' });
        createStoreIfMissing('academyDashboard', { keyPath: 'key' });

        // Guardian
        createStoreIfMissing('children', { keyPath: 'id' });
        createStoreIfMissing('childSummaries', { keyPath: 'id' });

        // Version 2 additions: studentDashboard
        createStoreIfMissing('studentDashboard', { keyPath: 'key' });

        // Migration: If upgrading from version 1 to 2, clear studentLectures to remove the corrupted dashboard object.
        if (oldVersion === 1 && transaction) {
          try {
            transaction.objectStore('studentLectures').clear();
          } catch (err) {
            console.error('Failed to clear studentLectures store during upgrade:', err);
          }
        }
      },
    });
  }

  return dbPromise;
}
