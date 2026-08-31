import { SyncQueueItem, SyncQueueItemStatus } from '../types';
import { STORAGE_KEYS } from './storageServiceConstants';
import { getCairoNowISO } from '../utils/egyptianTime';

export class SyncQueueService {
  private static getStorageKey(): string {
    return STORAGE_KEYS.SYNC_QUEUE || 'ntss_sync_queue_v3';
  }

  public static getQueue(): SyncQueueItem[] {
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
    const item: SyncQueueItem = {
      id: `SQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      entity,
      entityId: payload?.id,
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

  public static getPendingCount(): number {
    return this.getQueue().filter(q => q.status === 'pending' || q.status === 'syncing').length;
  }

  public static getFailedCount(): number {
    return this.getQueue().filter(q => q.status === 'failed' || q.status === 'conflict').length;
  }
}
