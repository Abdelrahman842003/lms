import { getDB, NeetaqSchema } from '../db';
import { StoreNames } from 'idb';

function getKeyPathForStore(storeName: string): string {
  if (['academyDashboard', 'appSettings', 'syncMeta'].includes(storeName)) {
    return 'key';
  }
  return 'id';
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class BaseOfflineStore<T> {
  constructor(protected storeName: StoreNames<NeetaqSchema>) {}

  protected async getDB() {
    return await getDB();
  }

  private sanitizeItem(item: T): T {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const keyPath = getKeyPathForStore(this.storeName);
    const obj = item as any;

    if (obj[keyPath] === undefined || obj[keyPath] === null || obj[keyPath] === '') {
      // Key path is missing! Clone to avoid mutating original
      const cloned = { ...item } as any;
      if (this.storeName === 'academyDashboard') {
        cloned[keyPath] = 'dashboard';
      } else if (this.storeName === 'appSettings') {
        cloned[keyPath] = 'settings';
      } else {
        const fallbackId = obj.key || obj._id || obj.code || obj.userId || obj.id;
        if (fallbackId !== undefined && fallbackId !== null && fallbackId !== '') {
          cloned[keyPath] = String(fallbackId);
        } else {
          console.warn(`[BaseOfflineStore] Store "${this.storeName}" requires key "${keyPath}", but it was missing in item. Auto-generating a temporary UUID.`, item);
          cloned[keyPath] = generateUUID();
        }
      }
      return cloned;
    }

    return item;
  }

  async getAll(): Promise<T[] | T | undefined> {
    const db = await this.getDB();
    const result = await db.getAll(this.storeName);
    if (this.storeName === 'academyDashboard') {
      return (result && result.length > 0 ? result[0] : undefined) as any;
    }
    return result as T[];
  }

  async getById(id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return (await db.get(this.storeName, id)) as T | undefined;
  }

  async put(item: T): Promise<void> {
    const sanitized = this.sanitizeItem(item);
    const db = await this.getDB();
    await db.put(this.storeName, sanitized);
  }

  async putMany(items: T[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    for (const item of items) {
      const sanitized = this.sanitizeItem(item);
      await store.put(sanitized);
    }
    await tx.done;
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete(this.storeName, id);
  }

  async clear(): Promise<void> {
    const db = await this.getDB();
    await db.clear(this.storeName);
  }

  async count(): Promise<number> {
    const db = await this.getDB();
    return await db.count(this.storeName);
  }

  // Sync timestamps helpers
  async getLastSyncTime(userId: string, userType: string): Promise<string | null> {
    const db = await this.getDB();
    const meta = await db.get('syncMeta', `${this.storeName}_${userId}_${userType}`);
    return meta ? meta.lastSyncAt : null;
  }

  async setLastSyncTime(userId: string, userType: string, lastSyncAt: string, etag?: string): Promise<void> {
    const db = await this.getDB();
    await db.put('syncMeta', {
      key: `${this.storeName}_${userId}_${userType}`,
      lastSyncAt,
      userId,
      userType,
      etag,
    });
  }
}
