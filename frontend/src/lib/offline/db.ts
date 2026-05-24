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
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NeetaqSchema>> | null = null;

export function getDB(): Promise<IDBPDatabase<NeetaqSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser environments'));
  }

  if (!dbPromise) {
    dbPromise = openDB<NeetaqSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Meta & Queue
        db.createObjectStore('syncMeta', { keyPath: 'key' });
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('by-status', 'status');
        queueStore.createIndex('by-created', 'createdAt');

        // Shared
        db.createObjectStore('notifications', { keyPath: 'id' });
        db.createObjectStore('userProfile', { keyPath: 'id' });
        db.createObjectStore('appSettings', { keyPath: 'key' });

        // Teacher
        db.createObjectStore('students', { keyPath: 'id' });
        db.createObjectStore('grades', { keyPath: 'id' });
        db.createObjectStore('groups', { keyPath: 'id' });
        db.createObjectStore('lectures', { keyPath: 'id' });
        db.createObjectStore('attendances', { keyPath: 'id' });
        db.createObjectStore('exams', { keyPath: 'id' });
        db.createObjectStore('payments', { keyPath: 'id' });
        db.createObjectStore('notes', { keyPath: 'id' });

        // Student
        db.createObjectStore('studentTeachers', { keyPath: 'id' });
        db.createObjectStore('studentLectures', { keyPath: 'id' });
        db.createObjectStore('studentExams', { keyPath: 'id' });
        db.createObjectStore('studentPoints', { keyPath: 'id' });
        db.createObjectStore('studentMistakes', { keyPath: 'id' });

        // Academy
        db.createObjectStore('academyTeachers', { keyPath: 'id' });
        db.createObjectStore('academyStudents', { keyPath: 'id' });
        db.createObjectStore('academyLectures', { keyPath: 'id' });
        db.createObjectStore('academyDashboard', { keyPath: 'key' });

        // Guardian
        db.createObjectStore('children', { keyPath: 'id' });
        db.createObjectStore('childSummaries', { keyPath: 'id' });
      },
    });
  }

  return dbPromise;
}
