import { AppNotification, NotificationType, NotificationCategory, UserRole } from '../types';
import { STORAGE_KEYS } from './storageServiceConstants';
import { getCairoNowISO, getCairoCurrentDate } from '../utils/egyptianTime';

export class NotificationService {
  private static getStorageKey(): string {
    return STORAGE_KEYS.NOTIFICATIONS || 'ntss_notifications_v3';
  }

  public static getNotifications(
    currentUserRole?: UserRole,
    currentUserId?: string,
    targetStudentId?: string,
    category?: NotificationCategory
  ): AppNotification[] {
    const raw = localStorage.getItem(this.getStorageKey());
    let list: AppNotification[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    // Seed realistic initial notifications if empty
    if (list.length === 0) {
      const now = getCairoNowISO();
      list = [
        {
          id: 'NOTIF-01',
          type: 'HOMEWORK_NEW',
          category: 'Homework',
          title: 'واجب جديد: الرياضيات والجبر',
          message: 'تم إضافة واجب تدريبات الدرس الثالث للصف الأول الثانوي، موعد التسليم غداً.',
          priority: 'NORMAL',
          targetRole: 'Parent',
          isRead: false,
          createdAt: now,
          createdBySystem: true,
          deduplicationKey: 'homework-seed-math-01',
        },
        {
          id: 'NOTIF-02',
          type: 'STUDENT_ABSENCE',
          category: 'Attendance',
          title: 'تنبيه غياب طالب',
          message: 'تم تسجيل غياب في طابور الصباح اليوم بدون إذن مسبق.',
          priority: 'HIGH',
          targetRole: 'StudentAffairs',
          isRead: false,
          createdAt: now,
          createdBySystem: true,
          deduplicationKey: 'attendance-seed-abs-02',
        },
      ];
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    }

    return list.filter(n => {
      if (currentUserId && n.targetUserId && n.targetUserId !== currentUserId) {
        return false;
      }
      if (
        currentUserRole &&
        currentUserRole !== 'Admin' &&
        n.targetRole &&
        n.targetRole !== 'ALL' &&
        n.targetRole !== currentUserRole
      ) {
        return false;
      }
      if (targetStudentId && n.targetStudentId && n.targetStudentId !== targetStudentId) {
        return false;
      }
      if (category && n.category && n.category !== category) {
        return false;
      }
      return true;
    });
  }

  public static addNotification(notif: Partial<AppNotification>): AppNotification {
    const raw = localStorage.getItem(this.getStorageKey());
    let list: AppNotification[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    // Deduplication check: prevent spamming identical notifications
    if (notif.deduplicationKey) {
      const existing = list.find(n => n.deduplicationKey === notif.deduplicationKey);
      if (existing) {
        // Return existing notification if already sent recently
        return existing;
      }
    }

    const now = getCairoNowISO();
    const item: AppNotification = {
      id: notif.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: notif.type || 'SYSTEM_ALERT',
      category: notif.category || 'System',
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
      deduplicationKey: notif.deduplicationKey,
    };

    list.unshift(item);
    localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    return item;
  }

  public static markAsRead(id: string): void {
    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) return;
    try {
      const list: AppNotification[] = JSON.parse(raw);
      const idx = list.findIndex(n => n.id === id);
      if (idx >= 0) {
        list[idx].isRead = true;
        list[idx].readAt = getCairoNowISO();
        localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
      }
    } catch {}
  }

  public static markAllAsRead(role?: UserRole, userId?: string, targetStudentId?: string): void {
    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) return;
    try {
      const list: AppNotification[] = JSON.parse(raw);
      const now = getCairoNowISO();
      list.forEach(n => {
        if (userId && n.targetUserId && n.targetUserId !== userId) return;
        if (role && role !== 'Admin' && n.targetRole && n.targetRole !== 'ALL' && n.targetRole !== role) return;
        if (targetStudentId && n.targetStudentId && n.targetStudentId !== targetStudentId) return;

        if (!n.isRead) {
          n.isRead = true;
          n.readAt = now;
        }
      });
      localStorage.setItem(this.getStorageKey(), JSON.stringify(list));
    } catch {}
  }

  public static deleteNotification(id: string): void {
    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) return;
    try {
      const list: AppNotification[] = JSON.parse(raw);
      const filtered = list.filter(n => n.id !== id);
      localStorage.setItem(this.getStorageKey(), JSON.stringify(filtered));
    } catch {}
  }

  public static getUnreadCount(role?: UserRole, userId?: string, targetStudentId?: string): number {
    return this.getNotifications(role, userId, targetStudentId).filter(n => !n.isRead).length;
  }

  // ---------------- Automated Dispatch Helpers ----------------

  public static dispatchAbsenceNotification(
    studentId: string,
    studentName: string,
    date: string,
    isExcused: boolean
  ): void {
    this.addNotification({
      type: 'STUDENT_ABSENCE',
      category: 'Attendance',
      title: isExcused ? 'إخطار غياب بعذر مقبول' : 'تنبيه: تسجيل غياب بدون إذن',
      message: isExcused
        ? `تم اعتماد عذر غياب الطالب ${studentName} لتاريخ ${date}.`
        : `نحيطكم علماً بأنه تم تسجيل غياب للطالب ${studentName} لتاريخ اليوم ${date} ولم يرد عذر للمدرسة بعد.`,
      priority: isExcused ? 'NORMAL' : 'HIGH',
      targetRole: 'Parent',
      targetStudentId: studentId,
      relatedEntity: 'ATTENDANCE',
      relatedEntityId: `${studentId}_${date}`,
      deduplicationKey: `att-absence-${studentId}-${date}`,
    });
  }

  public static dispatchLateNotification(
    studentId: string,
    studentName: string,
    date: string,
    lateMinutes: number,
    checkInTime?: string
  ): void {
    this.addNotification({
      type: 'STUDENT_LATE',
      category: 'Attendance',
      title: 'تنبيه: تأخر عن طابور الصباح',
      message: `حضر الطالب ${studentName} للمدرسة متأخراً بمقدار (${lateMinutes} دقيقة) في تمام الساعة (${checkInTime || 'صباحاً'}).`,
      priority: 'NORMAL',
      targetRole: 'Parent',
      targetStudentId: studentId,
      relatedEntity: 'ATTENDANCE',
      relatedEntityId: `${studentId}_${date}`,
      deduplicationKey: `att-late-${studentId}-${date}`,
    });
  }

  public static dispatchHomeworkNotification(
    studentId: string,
    homeworkTitle: string,
    subjectName: string,
    dueDate: string
  ): void {
    this.addNotification({
      type: 'HOMEWORK_NEW',
      category: 'Homework',
      title: `واجب جديد: ${subjectName}`,
      message: `تم تكليف الطلاب بواجب (${homeworkTitle}) في مادة ${subjectName}. موعد التسليم الأخير: ${dueDate}.`,
      priority: 'NORMAL',
      targetRole: 'Parent',
      targetStudentId: studentId,
      relatedEntity: 'HOMEWORK',
      deduplicationKey: `hw-${homeworkTitle}-${subjectName}-${dueDate}`,
    });
  }

  public static dispatchBehaviorViolationNotification(
    studentId: string,
    studentName: string,
    violationName: string,
    pointsDeducted: number,
    date: string
  ): void {
    this.addNotification({
      type: 'BEHAVIOR_VIOLATION',
      category: 'Behavior',
      title: 'إشعار مخالفة سلوكية',
      message: `تم رصد وتوثيق مخالفة (${violationName}) للطالب ${studentName} وخصم (${pointsDeducted}) نقاط من رصيد الانضباط.`,
      priority: 'HIGH',
      targetRole: 'Parent',
      targetStudentId: studentId,
      relatedEntity: 'BEHAVIOR',
      deduplicationKey: `beh-vio-${studentId}-${violationName}-${date}`,
    });
  }

  public static dispatchPositiveBehaviorNotification(
    studentId: string,
    studentName: string,
    title: string,
    pointsAwarded: number
  ): void {
    this.addNotification({
      type: 'POSITIVE_BEHAVIOR',
      category: 'Behavior',
      title: '⭐ شكر وتقدير لسلوك إيجابي متميز',
      message: `يسر المدرسة تهنئتكم بتميز الطالب ${studentName} في (${title}) ومنحه (${pointsAwarded}) نقاط إضافية في رصيد الانضباط!`,
      priority: 'NORMAL',
      targetRole: 'Parent',
      targetStudentId: studentId,
      relatedEntity: 'BEHAVIOR',
      deduplicationKey: `beh-pos-${studentId}-${title}-${getCairoCurrentDate()}`,
    });
  }

  public static dispatchSubstitutionNotification(
    studentId: string,
    subjectName: string,
    periodNumber: number,
    date: string,
    subTeacherName: string
  ): void {
    this.addNotification({
      type: 'SCHEDULE_CHANGE',
      category: 'Schedule',
      title: `تعديل حصة: ${subjectName}`,
      message: `نحيطكم علماً بتعيين الأستاذ/ة (${subTeacherName}) لتغطية الحصة (${periodNumber}) في مادة ${subjectName} اليوم.`,
      priority: 'LOW',
      targetRole: 'Parent',
      targetStudentId: studentId,
      relatedEntity: 'SCHEDULE',
      deduplicationKey: `sub-${studentId}-${date}-${periodNumber}`,
    });
  }
}
