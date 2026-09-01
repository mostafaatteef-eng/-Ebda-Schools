import { SyncQueueItem, SyncQueueItemStatus } from '../types';
import { STORAGE_KEYS } from './storageServiceConstants';
import { getCairoNowISO } from '../utils/egyptianTime';

export class SyncQueueService {
  private static isProcessing = false;
  private static MAX_RETRIES = 5;

  private static getStorageKey(): string {
    return STORAGE_KEYS.SYNC_QUEUE || 'ntss_sync_queue_v3';
  }

  public static getQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static enqueue(action: string, entity: string, payload: any, priority: number = 1): SyncQueueItem {
    const queue = this.getQueue();
    const now = getCairoNowISO();
    const entityId = payload?.id || payload?.entityId || '';

    // De-duplicate if pending mutation exists for same action and entityId
    if (entityId) {
      const existingIdx = queue.findIndex(q => q.action === action && q.entityId === entityId && (q.status === 'pending' || q.status === 'failed'));
      if (existingIdx >= 0) {
        queue[existingIdx].payload = payload;
        queue[existingIdx].clientTimestamp = now;
        queue[existingIdx].status = 'pending';
        localStorage.setItem(this.getStorageKey(), JSON.stringify(queue));
        return queue[existingIdx];
      }
    }

    const item: SyncQueueItem = {
      id: `SQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      action,
      entity,
      entityId,
      payload,
      createdAt: now,
      attempts: 0,
      status: 'pending',
      priority,
      clientTimestamp: now,
    };

    queue.push(item);
    localStorage.setItem(this.getStorageKey(), JSON.stringify(queue));
    return item;
  }

  public static updateItemStatus(id: string, status: SyncQueueItemStatus, error?: string): void {
    const queue = this.getQueue();
    const idx = queue.findIndex(q => q.id === id);
    if (idx >= 0) {
      queue[idx].status = status;
      queue[idx].attempts += 1;
      queue[idx].lastAttemptAt = getCairoNowISO();
      if (error) queue[idx].lastError = error;
      localStorage.setItem(this.getStorageKey(), JSON.stringify(queue));
    }
  }

  public static clearSynced(): void {
    const queue = this.getQueue().filter(q => q.status !== 'synced');
    localStorage.setItem(this.getStorageKey(), JSON.stringify(queue));
  }

  public static clearAll(): void {
    localStorage.removeItem(this.getStorageKey());
  }

  public static retryFailed(): void {
    const queue = this.getQueue();
    let updated = false;
    queue.forEach(item => {
      if (item.status === 'failed' || item.status === 'conflict') {
        item.status = 'pending';
        item.attempts = 0;
        updated = true;
      }
    });
    if (updated) {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(queue));
    }
  }

  public static getPendingCount(): number {
    return this.getQueue().filter(q => q.status === 'pending' || q.status === 'syncing').length;
  }

  public static getFailedCount(): number {
    return this.getQueue().filter(q => q.status === 'failed' || q.status === 'conflict').length;
  }

  public static getQueueSummary(): {
    total: number;
    pending: number;
    failed: number;
    synced: number;
    items: SyncQueueItem[];
  } {
    const items = this.getQueue();
    return {
      total: items.length,
      pending: items.filter(q => q.status === 'pending' || q.status === 'syncing').length,
      failed: items.filter(q => q.status === 'failed' || q.status === 'conflict').length,
      synced: items.filter(q => q.status === 'synced').length,
      items,
    };
  }

  public static async processQueue(
    pushFn: (action: string, payload: any) => Promise<{ success: boolean; message?: string }>
  ): Promise<{ processed: number; succeeded: number; failed: number }> {
    if (this.isProcessing || !navigator.onLine) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let succeeded = 0;
    let failed = 0;

    try {
      const queue = this.getQueue();
      const pendingItems = queue
        .filter(q => q.status === 'pending' || (q.status === 'failed' && q.attempts < this.MAX_RETRIES))
        .sort((a, b) => (b.priority || 1) - (a.priority || 1));

      for (const item of pendingItems) {
        this.updateItemStatus(item.id, 'syncing');

        try {
          const res = await pushFn(item.action, item.payload);
          if (res.success) {
            this.updateItemStatus(item.id, 'synced');
            succeeded++;
          } else {
            const newStatus: SyncQueueItemStatus = (item.attempts + 1 >= this.MAX_RETRIES) ? 'failed' : 'pending';
            this.updateItemStatus(item.id, newStatus, res.message || 'Server returned error');
            failed++;
          }
        } catch (err: any) {
          const newStatus: SyncQueueItemStatus = (item.attempts + 1 >= this.MAX_RETRIES) ? 'failed' : 'pending';
          this.updateItemStatus(item.id, newStatus, err.message || 'Network error');
          failed++;
        }
      }

      // Cleanup successfully synced items older than 5 minutes to keep storage compact
      this.clearSynced();
    } finally {
      this.isProcessing = false;
    }

    return { processed: succeeded + failed, succeeded, failed };
  }
}
