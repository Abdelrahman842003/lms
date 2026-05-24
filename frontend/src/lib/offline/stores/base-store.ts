import { getDB, NeetaqSchema } from '../db';
import { StoreNames } from 'idb';

export class BaseOfflineStore<T> {
  constructor(protected storeName: StoreNames<NeetaqSchema>) {}

  protected async getDB() {
    return await getDB();
  }

  async getAll(): Promise<T[]> {
    const db = await this.getDB();
    return (await db.getAll(this.storeName)) as T[];
  }

  async getById(id: string): Promise<T | undefined> {
    const db = await this.getDB();
    return (await db.get(this.storeName, id)) as T | undefined;
  }

  async put(item: T): Promise<void> {
    const db = await this.getDB();
    await db.put(this.storeName, item);
  }

  async putMany(items: T[]): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    for (const item of items) {
      await store.put(item);
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
