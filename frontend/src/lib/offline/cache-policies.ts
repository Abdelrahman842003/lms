export interface CachePolicy {
  maxAgeMs: number;       // Max age before data is considered stale (in milliseconds)
  syncOnLoad: boolean;    // Whether to sync from network immediately when the view loads
  priority: 'high' | 'medium' | 'low';
}

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const CACHE_POLICIES: Record<string, CachePolicy> = {
  // === High Priority (Sync often, critical for operations) ===
  students: {
    maxAgeMs: 1 * HOUR,
    syncOnLoad: true,
    priority: 'high',
  },
  grades: {
    maxAgeMs: 6 * HOUR,
    syncOnLoad: true,
    priority: 'high',
  },
  groups: {
    maxAgeMs: 6 * HOUR,
    syncOnLoad: true,
    priority: 'high',
  },

  // === Medium Priority (Sync on dashboard view, average stale tolerance) ===
  lectures: {
    maxAgeMs: 2 * HOUR,
    syncOnLoad: true,
    priority: 'medium',
  },
  attendances: {
    maxAgeMs: 2 * HOUR,
    syncOnLoad: false,
    priority: 'medium',
  },
  exams: {
    maxAgeMs: 4 * HOUR,
    syncOnLoad: false,
    priority: 'medium',
  },

  // === Low Priority (Lag is okay, sync in background) ===
  notifications: {
    maxAgeMs: 15 * MINUTE,
    syncOnLoad: false,
    priority: 'low',
  },
  notes: {
    maxAgeMs: 12 * HOUR,
    syncOnLoad: false,
    priority: 'low',
  },
  payments: {
    maxAgeMs: 6 * HOUR,
    syncOnLoad: false,
    priority: 'low',
  },
  userProfile: {
    maxAgeMs: 24 * HOUR,
    syncOnLoad: false,
    priority: 'low',
  },
  appSettings: {
    maxAgeMs: 24 * HOUR,
    syncOnLoad: false,
    priority: 'low',
  },
};

export function isCacheStale(storeName: string, lastSyncTimeStr: string | null): boolean {
  if (!lastSyncTimeStr) return true;
  
  const policy = CACHE_POLICIES[storeName];
  if (!policy) return true;

  const lastSync = new Date(lastSyncTimeStr).getTime();
  const now = Date.now();
  
  return now - lastSync > policy.maxAgeMs;
}
