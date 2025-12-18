import {
  getPendingPayments,
  markPaymentSynced,
  markPaymentError,
  incrementRetryCount,
  getPendingPaymentsCount,
} from './offlineDb';
import { fetchApi } from './authService';

// ===================
// Constants
// ===================

const BATCH_SIZE = 50;
const MAX_RETRIES = 3;

// ===================
// Types
// ===================

interface SyncResult {
  synced: number;
  errors: number;
  total: number;
}

interface BatchSyncResponse {
  success: Array<{
    client_side_uuid: string;
    status: 'created' | 'duplicate';
    payment_id: string;
  }>;
  errors: Array<{
    client_side_uuid: string;
    error: string;
  }>;
}

// ===================
// Sync Functions
// ===================

/**
 * Sync all pending payments in batches of 50
 */
export async function syncPendingPayments(): Promise<SyncResult> {
  const pending = await getPendingPayments();

  if (pending.length === 0) {
    return { synced: 0, errors: 0, total: 0 };
  }

  let syncedCount = 0;
  let errorCount = 0;

  // Process in batches of 50
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetchApi('/api/teacher/payments/sync', {
        method: 'POST',
        body: JSON.stringify({
          payments: batch.map((p) => ({
            client_side_uuid: p.client_side_uuid,
            student_id: p.student_id,
            amount: p.amount,
            confirmation_code: p.confirmation_code,
            created_at: p.created_at,
            notes: p.notes,
          })),
        }),
      });

      const data = response.data as BatchSyncResponse;

      // Process successful syncs
      for (const result of data.success) {
        await markPaymentSynced(result.client_side_uuid);
        syncedCount++;
      }

      // Process errors
      for (const error of data.errors) {
        await markPaymentError(error.client_side_uuid, error.error);
        errorCount++;
      }
    } catch (networkError: unknown) {
      // Network error - increment retry count for all in batch
      for (const payment of batch) {
        if (payment.retry_count < MAX_RETRIES) {
          await incrementRetryCount(payment.client_side_uuid);
        } else {
          await markPaymentError(
            payment.client_side_uuid,
            networkError instanceof Error ? networkError.message : 'Network error'
          );
          errorCount++;
        }
      }
    }
  }

  return {
    synced: syncedCount,
    errors: errorCount,
    total: pending.length,
  };
}

/**
 * Setup auto-sync when online
 */
export function setupAutoSync() {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', async () => {
    const pendingCount = await getPendingPaymentsCount();
    if (pendingCount === 0) return;

    const result = await syncPendingPayments();

    // Dispatch event for UI update
    window.dispatchEvent(
      new CustomEvent('sync:complete', {
        detail: result,
      })
    );
  });
}

/**
 * Manual sync trigger
 */
export async function triggerSync(): Promise<SyncResult> {
  if (!navigator.onLine) {
    throw new Error('لا يوجد اتصال بالإنترنت');
  }
  return syncPendingPayments();
}

/**
 * Check if there are pending items to sync
 */
export async function hasPendingSync(): Promise<boolean> {
  const count = await getPendingPaymentsCount();
  return count > 0;
}

// ===================
// Service Worker Communication
// ===================

/**
 * Register background sync with service worker
 */
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-payments');
    } catch (error) {
      // Background sync not supported, fall back to manual sync
      console.warn('Background sync not supported:', error);
    }
  }
}

/**
 * Listen for sync messages from service worker
 */
export function listenForSyncMessages() {
  if (typeof window === 'undefined') return;

  navigator.serviceWorker?.addEventListener('message', async (event) => {
    if (event.data?.type === 'SYNC_PAYMENTS') {
      const result = await syncPendingPayments();
      window.dispatchEvent(
        new CustomEvent('sync:complete', {
          detail: result,
        })
      );
    }
  });
}

// ===================
// Initialize
// ===================

export function initSyncManager() {
  setupAutoSync();
  listenForSyncMessages();
}
