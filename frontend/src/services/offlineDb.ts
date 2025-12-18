import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ===================
// Database Schema
// ===================

interface LMSDatabase extends DBSchema {
  user: {
    key: string;
    value: {
      id: string;
      data: Record<string, unknown>;
      cachedAt: number;
    };
  };
  payments: {
    key: string; // client_side_uuid
    value: {
      client_side_uuid: string;
      student_id: string;
      student_name: string;
      amount: number;
      confirmation_code: string;
      created_at: string;
      notes?: string;
      sync_status: 'pending' | 'synced' | 'error';
      error_message?: string;
      retry_count: number;
    };
    indexes: { 'by-status': string };
  };
  syncErrors: {
    key: string;
    value: {
      client_side_uuid: string;
      error: string;
      payload: Record<string, unknown>;
      createdAt: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: unknown;
      cachedAt: number;
      expiresAt: number;
    };
  };
}

// ===================
// Constants
// ===================

const DB_NAME = 'lms-offline-db';
const DB_VERSION = 1;
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_PENDING_PAYMENTS = 500;

// ===================
// Database Instance
// ===================

let dbInstance: IDBPDatabase<LMSDatabase> | null = null;

export async function getDB(): Promise<IDBPDatabase<LMSDatabase>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<LMSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // User store
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
      }

      // Payments store (offline queue)
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', {
          keyPath: 'client_side_uuid',
        });
        paymentStore.createIndex('by-status', 'sync_status');
      }

      // Sync errors
      if (!db.objectStoreNames.contains('syncErrors')) {
        db.createObjectStore('syncErrors', { keyPath: 'client_side_uuid' });
      }

      // General cache
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

// ===================
// Confirmation Code Generation
// ===================

/**
 * Generate confirmation code (XXXX-XXXX)
 * Excludes confusing characters: O, 0, I, 1
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ===================
// Payment Operations
// ===================

export interface OfflinePayment {
  student_id: string;
  student_name: string;
  amount: number;
  notes?: string;
}

/**
 * Save payment offline (atomic transaction)
 * Returns the confirmation code
 */
export async function savePaymentOffline(payment: OfflinePayment): Promise<string> {
  const db = await getDB();

  // Check limit
  const pendingCount = await getPendingPaymentsCount();
  if (pendingCount >= MAX_PENDING_PAYMENTS) {
    throw new Error(`الحد الأقصى للدفعات المعلقة هو ${MAX_PENDING_PAYMENTS}`);
  }

  const client_side_uuid = crypto.randomUUID();
  const confirmation_code = generateConfirmationCode();

  // Atomic transaction
  const tx = db.transaction('payments', 'readwrite');
  await tx.store.add({
    client_side_uuid,
    student_id: payment.student_id,
    student_name: payment.student_name,
    amount: payment.amount,
    confirmation_code,
    created_at: new Date().toISOString(),
    notes: payment.notes,
    sync_status: 'pending',
    retry_count: 0,
  });
  await tx.done;

  return confirmation_code;
}

/**
 * Get all pending payments
 */
export async function getPendingPayments() {
  const db = await getDB();
  return db.getAllFromIndex('payments', 'by-status', 'pending');
}

/**
 * Get pending payments count
 */
export async function getPendingPaymentsCount(): Promise<number> {
  const db = await getDB();
  return db.countFromIndex('payments', 'by-status', 'pending');
}

/**
 * Get all payments (for display)
 */
export async function getAllPayments() {
  const db = await getDB();
  const payments = await db.getAll('payments');
  return payments.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Mark payment as synced (delete from local store)
 */
export async function markPaymentSynced(client_side_uuid: string) {
  const db = await getDB();
  await db.delete('payments', client_side_uuid);
}

/**
 * Mark payment as error (after max retries)
 */
export async function markPaymentError(
  client_side_uuid: string,
  error: string
) {
  const db = await getDB();
  const payment = await db.get('payments', client_side_uuid);

  if (payment) {
    payment.retry_count++;

    if (payment.retry_count >= 3) {
      payment.sync_status = 'error';
      payment.error_message = error;

      // Move to sync errors
      await db.add('syncErrors', {
        client_side_uuid,
        error,
        payload: { ...payment },
        createdAt: Date.now(),
      });
    }

    await db.put('payments', payment);
  }
}

/**
 * Increment retry count
 */
export async function incrementRetryCount(client_side_uuid: string) {
  const db = await getDB();
  const payment = await db.get('payments', client_side_uuid);

  if (payment) {
    payment.retry_count++;
    await db.put('payments', payment);
  }
}

// ===================
// Sync Errors
// ===================

export async function getSyncErrors() {
  const db = await getDB();
  const errors = await db.getAll('syncErrors');
  return errors.sort((a, b) => b.createdAt - a.createdAt);
}

export async function clearSyncError(client_side_uuid: string) {
  const db = await getDB();
  await db.delete('syncErrors', client_side_uuid);
}

// ===================
// General Cache
// ===================

/**
 * Cache data with expiration
 */
export async function cacheData(key: string, data: unknown) {
  const db = await getDB();
  await db.put('cache', {
    key,
    data,
    cachedAt: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION,
  });
}

/**
 * Get cached data (null if expired)
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const db = await getDB();
  const cached = await db.get('cache', key);

  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    await db.delete('cache', key);
    return null;
  }

  return cached.data as T;
}

/**
 * Check if cache is valid
 */
export async function isCacheValid(key: string): Promise<boolean> {
  const db = await getDB();
  const cached = await db.get('cache', key);
  return cached !== undefined && Date.now() <= cached.expiresAt;
}

/**
 * Cleanup expired cache entries
 */
export async function cleanupExpiredCache() {
  const db = await getDB();
  const tx = db.transaction('cache', 'readwrite');
  let cursor = await tx.store.openCursor();

  while (cursor) {
    if (Date.now() > cursor.value.expiresAt) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
}

// ===================
// User Cache
// ===================

export async function cacheUser(userId: string, data: Record<string, unknown>) {
  const db = await getDB();
  await db.put('user', {
    id: userId,
    data,
    cachedAt: Date.now(),
  });
}

export async function getCachedUser(userId: string) {
  const db = await getDB();
  const user = await db.get('user', userId);

  if (!user) return null;

  // Check if cache is still valid (7 days)
  if (Date.now() - user.cachedAt > CACHE_DURATION) {
    await db.delete('user', userId);
    return null;
  }

  return user.data;
}

// ===================
// Database Cleanup
// ===================

export async function clearAllData() {
  const db = await getDB();
  await db.clear('payments');
  await db.clear('syncErrors');
  await db.clear('cache');
  await db.clear('user');
}
