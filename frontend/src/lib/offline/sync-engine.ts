import { getDB, SyncQueueItem } from './db';
import { networkMonitor } from './network-monitor';
import { conflictResolver } from './conflict-resolver';
import * as stores from './stores';
import { getAccessToken, refreshAccessToken, isTokenExpired } from '@/lib/tokenManager';

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  errors: string[];
}

class SyncEngine {
  private isProcessing = false;
  private syncListeners: Set<(status: { isSyncing: boolean; pendingCount: number }) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for online events to automatically process queue
      networkMonitor.addListener((isOnline) => {
        if (isOnline) {
          this.processQueue().catch((err) => {
            console.error('[SyncEngine] Auto-process queue failed:', err);
          });
        }
      });
    }
  }

  addSyncListener(callback: (status: { isSyncing: boolean; pendingCount: number }) => void) {
    this.syncListeners.add(callback);
    this.getQueueCount().then(count => {
      callback({ isSyncing: this.isProcessing, pendingCount: count });
    });
  }

  removeSyncListener(callback: (status: { isSyncing: boolean; pendingCount: number }) => void) {
    this.syncListeners.delete(callback);
  }

  private notifyListeners(pendingCount: number) {
    this.syncListeners.forEach(listener => {
      listener({ isSyncing: this.isProcessing, pendingCount });
    });
  }

  async getQueueCount(): Promise<number> {
    const db = await getDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('by-status');
    return await index.count('pending');
  }

  async getQueueStatus(): Promise<{ pending: number; inProgress: number; failed: number; conflict: number }> {
    const db = await getDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const index = store.index('by-status');
    
    const [pending, inProgress, failed, conflict] = await Promise.all([
      index.count('pending'),
      index.count('in-progress'),
      index.count('failed'),
      index.count('conflict')
    ]);
    
    return {
      pending,
      inProgress,
      failed,
      conflict
    };
  }

  /**
   * Enqueues a write mutation when the user is offline
   */
  async enqueue(
    url: string,
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    body: any,
    entityType: string,
    entityId?: string,
    headers: Record<string, string> = {}
  ): Promise<string> {
    const db = await getDB();
    const id = crypto.randomUUID();
    const item: SyncQueueItem = {
      id,
      url,
      method,
      body,
      headers,
      createdAt: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
      entityType,
      entityId,
    };

    await db.put('syncQueue', item);
    const count = await this.getQueueCount();
    this.notifyListeners(count);

    // If online, trigger background processing immediately
    if (networkMonitor.isOnline) {
      this.processQueue().catch(err => {
        console.error('[SyncEngine] Immediate queue processing failed:', err);
      });
    }

    return id;
  }

  /**
   * Processes all pending items in the sync queue sequentially (FIFO)
   */
  async processQueue(): Promise<SyncResult> {
    if (this.isProcessing) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    if (!networkMonitor.isOnline) {
      return { success: false, syncedCount: 0, errors: ['Cannot process sync queue while offline'] };
    }

    this.isProcessing = true;
    const db = await getDB();
    let syncedCount = 0;
    const errors: string[] = [];

    try {
      let pendingCount = await this.getQueueCount();
      this.notifyListeners(pendingCount);

      while (pendingCount > 0) {
        // Fetch the oldest pending item
        const tx = db.transaction('syncQueue', 'readonly');
        const store = tx.objectStore('syncQueue');
        const index = store.index('by-created');
        let cursor = await index.openCursor(null, 'next');
        
        let item: SyncQueueItem | null = null;
        while (cursor) {
          if (cursor.value.status === 'pending') {
            item = cursor.value;
            break;
          }
          cursor = await cursor.continue();
        }

        if (!item) break; // No more pending items

        // Mark item as in-progress
        item.status = 'in-progress';
        await db.put('syncQueue', item);

        // Process item
        const success = await this.sendMutation(item, db);
        
        if (success) {
          // Delete from queue on success
          await db.delete('syncQueue', item.id);
          syncedCount++;
        } else {
          // Check if status changed (e.g., to conflict or failed)
          const updatedItem = await db.get('syncQueue', item.id);
          if (updatedItem && updatedItem.status === 'in-progress') {
            updatedItem.status = 'failed';
            await db.put('syncQueue', updatedItem);
          }
        }

        pendingCount = await this.getQueueCount();
        this.notifyListeners(pendingCount);
      }
    } catch (err: any) {
      console.error('[SyncEngine] Error during queue processing:', err);
      errors.push(err.message || 'Queue processing error');
    } finally {
      this.isProcessing = false;
      const count = await this.getQueueCount();
      this.notifyListeners(count);
    }

    return {
      success: errors.length === 0,
      syncedCount,
      errors,
    };
  }

  private async sendMutation(item: SyncQueueItem, db: any): Promise<boolean> {
    try {
      // Re-fetch token from manager if needed, headers should have Auth Bearer
      if (isTokenExpired()) {
        try {
          await refreshAccessToken();
        } catch (e) {
          console.warn('[SyncEngine] Token refresh failed before sending mutation:', e);
        }
      }

      const token = getAccessToken();
      const authHeaders: Record<string, string> = {};
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...item.headers,
          ...authHeaders,
          'X-Client-Timestamp': item.createdAt,
        },
        body: JSON.stringify(item.body),
      });

      if (response.ok) {
        return true;
      }

      // Handle 409 Conflict
      if (response.status === 409) {
        const responseData = await response.json();
        await this.handleConflict(item, responseData.serverData, db);
        return false;
      }

      // Handle other validation or bad request errors (don't retry, mark failed)
      if (response.status >= 400 && response.status < 500 && response.status !== 401 && response.status !== 419) {
        // Special case: studentAttendance items should retry on 404/422
        // because the teacher may not have synced their offline code yet
        if (item.entityType === 'studentAttendance' && (response.status === 404 || response.status === 422)) {
          item.retryCount++;
          if (item.retryCount >= (item.maxRetries + 3)) { // extra retries for attendance
            item.status = 'failed';
            item.errorMessage = 'الكود غير موجود على السيرفر بعد عدة محاولات';
          } else {
            item.status = 'pending'; // retry later
          }
          await db.put('syncQueue', item);
          return false;
        }

        const errData = await response.json().catch(() => ({}));
        item.status = 'failed';
        item.errorMessage = errData.message || `Client Error ${response.status}`;
        await db.put('syncQueue', item);
        return false;
      }

      // Server error, allow retry
      throw new Error(`Server returned status ${response.status}`);
    } catch (err: any) {
      item.retryCount++;
      if (item.retryCount >= item.maxRetries) {
        item.status = 'failed';
        item.errorMessage = err.message || 'Maximum retries reached';
      } else {
        item.status = 'pending'; // retry later
      }
      await db.put('syncQueue', item);
      return false;
    }
  }

  /**
   * Handle conflict resolution using the conflictResolver
   */
  private async handleConflict(item: SyncQueueItem, serverData: any, db: any) {
    item.status = 'conflict';
    await db.put('syncQueue', item);

    const resolution = await conflictResolver.resolve({
      queueId: item.id,
      entityType: item.entityType,
      entityId: item.entityId || '',
      localData: item.body,
      serverData: serverData.data || serverData,
      clientTimestamp: item.createdAt,
      serverTimestamp: serverData.updated_at || new Date().toISOString(),
    });

    if (resolution === 'local') {
      // Resolve by forcing local data. We mark as pending again but flag it
      // so the server knows to force overwrite
      item.status = 'pending';
      item.headers = {
        ...item.headers,
        'X-Force-Sync': 'true',
      };
      await db.put('syncQueue', item);
    } else {
      // Resolve by accepting server data. Drop mutation from queue and update IndexedDB
      await db.delete('syncQueue', item.id);
      
      // Attempt to save server data to the matching store
      const targetStore = (stores as any)[item.entityType + 'Store'] || (stores as any)[item.entityType];
      if (targetStore && typeof targetStore.put === 'function') {
        await targetStore.put(serverData.data || serverData);
      }
    }
  }

  /**
   * Trigger delta sync (Pull from server) for a list of stores
   */
  async pullDeltaSync(userId: string, userType: string): Promise<void> {
    if (!networkMonitor.isOnline) return;

    const db = await getDB();
    const typeNormalized = (userType || '').toLowerCase();
    let entityTypes = ['notifications'];
    if (typeNormalized.includes('teacher')) {
      entityTypes = [...entityTypes, 'grades', 'groups', 'lectures', 'exams', 'notes', 'students'];
    } else if (typeNormalized.includes('student')) {
      entityTypes = [...entityTypes, 'studentTeachers', 'studentLectures', 'studentExams', 'studentPoints'];
    } else if (typeNormalized.includes('academy')) {
      entityTypes = [...entityTypes, 'academyTeachers', 'academyStudents', 'academyLectures'];
    } else if (typeNormalized.includes('guardian') || typeNormalized.includes('parent')) {
      entityTypes = [...entityTypes, 'children'];
    } else {
      entityTypes = [...entityTypes, 'students', 'lectures', 'exams', 'notes'];
    }
    
    // Get last sync timestamps
    const syncRequests = await Promise.all(
      entityTypes.map(async (entity) => {
        const lastSync = await db.get('syncMeta', `${entity}_${userId}_${userType}`);
        return {
          entity,
          since: lastSync ? lastSync.lastSyncAt : '1970-01-01T00:00:00Z',
        };
      })
    );

    try {
      // Build query string
      const sinceParam = encodeURIComponent(JSON.stringify(
        syncRequests.reduce((acc, req) => ({ ...acc, [req.entity]: req.since }), {})
      ));
      
      const response = await fetch(`/api/v1/sync/pull?since=${sinceParam}`, {
        headers: {
          'Accept': 'application/json',
          // auth token handles in middleware rewrites
        }
      });

      if (!response.ok) return;
      const responseData = await response.json();
      const data = responseData.data || {};
      const now = new Date().toISOString();

      // Batch save pulled data to matching stores
      await Promise.all(
        Object.keys(data).map(async (entityKey) => {
          const targetStore = (stores as any)[entityKey + 'Store'] || (stores as any)[entityKey];
          const records = data[entityKey] || [];

          if (targetStore && records.length > 0) {
            // Apply deletions if server explicitly specifies deleted IDs
            const itemsToUpsert = records.filter((r: any) => !r.is_deleted);
            const itemsToDelete = records.filter((r: any) => r.is_deleted).map((r: any) => r.id);

            if (itemsToUpsert.length > 0) {
              await targetStore.putMany(itemsToUpsert);
            }
            for (const id of itemsToDelete) {
              await targetStore.delete(id);
            }
          }

          // Update sync metadata
          await db.put('syncMeta', {
            key: `${entityKey}_${userId}_${userType}`,
            lastSyncAt: now,
            userId,
            userType,
          });
        })
      );
    } catch (err) {
      console.error('[SyncEngine] Delta sync pull failed:', err);
    }
  }
}

export const syncEngine = new SyncEngine();
