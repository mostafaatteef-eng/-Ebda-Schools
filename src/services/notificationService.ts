import { AppNotification, NotificationType, UserRole } from '../types';
import { STORAGE_KEYS } from './storageServiceConstants';
import { getCairoNowISO } from '../utils/egyptianTime';

export class NotificationService {
  private static getStorageKey(): string {
    return STORAGE_KEYS.NOTIFICATIONS || 'ntss_notifications_v3';
  }

  public static getNotifications(currentUserRole?: UserRole, currentUserId?: string, targetStudentId?: string): AppNotification[] {
    const raw = localStorage.getItem(this.getStorageKey());
    let list: AppNotification[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    // Default Seed Notifications if completely empty for intuitive experience
    if (list.length === 0) {
      const now = getCairoNowISO();
      list = [
        {
          id: 'NOTIF-01',
          type: 'HOMEWORK_NEW',
          title: 'واجب جديد: الرياضيات والجبر',
          message: 'تم إضافة واجب تدريبات الدرس الثالث للصف الأول الثانوي، موعد التسليم غداً.',
          priority: 'NORMAL',
          targetRole: 'Parent',
          isRead: false,
          createdAt: now,
          createdBySystem: true,
        },
        {
          id: 'NOTIF-02',
          type: 'STUDENT_ABSENCE',
          title: 'تنبيه غياب طالب',
          message: 'تم تسجيل غياب في طابور الصباح اليوم بدون إذن مسبق.',
          priority: 'HIGH',
          targetRole: 'StudentAffairs',
          isRead: false,
          createdAt: now,
          createdBySystem: true,
        },
      ];
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    }

    return list.filter(n => {
      if (currentUserId && n.targetUserId && n.targetUserId !== currentUserId) {
        return false;
      }
      if (currentUserRole && currentUserRole !== 'Admin' && n.targetRole && n.targetRole !== 'ALL' && n.targetRole !== currentUserRole) {
        return false;
      }
      if (targetStudentId && n.targetStudentId && n.targetStudentId !== targetStudentId) {
        return false;
      }
      return true;
    });
  }

  public static addNotification(notif: Partial<AppNotification>): AppNotification {
    const list = this.getNotifications();
    const now = getCairoNowISO();
    const item: AppNotification = {
      id: notif.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: notif.type || 'SYSTEM_ALERT',
      title: notif.title || 'تنبيه مدرسي',
      message: notif.message || '',
      targetUserId: notif.targetUserId,
      targetRole: notif.targetRole || 'ALL',
      targetStudentId: notif.targetStudentId,
      relatedEntity: notif.relatedEntity,
      relatedEntityId: notif.relatedEntityId,
      priority: notif.priority || 'NORMAL',
      isRead: false,
      createdAt: notif.createdAt || now,
      expiresAt: notif.expiresAt,
      actionUrl: notif.actionUrl,
      createdBySystem: notif.createdBySystem ?? true,
    };

    list.unshift(item);
    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    return item;
  }

  public static markAsRead(id: string): void {
    const list = this.getNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx >= 0) {
      list[idx].isRead = true;
      list[idx].readAt = getCairoNowISO();
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    }
  }

  public static markAllAsRead(role?: UserRole, userId?: string): void {
    const list = this.getNotifications();
    const now = getCairoNowISO();
    list.forEach(n => {
      if (!n.isRead) {
        n.isRead = true;
        n.readAt = now;
      }
    });
    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
  }
}
