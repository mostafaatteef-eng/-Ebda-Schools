import {
  AcademicYear,
  AttendanceStatus,
  Employee,
  Gender,
  LeaveType,
  PermissionKey,
  PermissionType,
  Student,
  UserRole,
} from './types';

/* =========================================================================
 * 1. Homework Entity (واجبات مستقلة مرتبطة بالحصص)
 * ========================================================================= */
export type HomeworkStatus = 'Draft' | 'Published' | 'Closed' | 'Archived';

export interface Homework {
  id: string; // HW-2026-001
  academicYearId: string;
  termId?: string;
  lessonInstanceId?: string; // Link to specific taught lesson
  scheduleItemId?: string;
  subjectId?: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  gradeId?: string;
  grade: string;
  classroomId?: string;
  classroom: string;
  targetStudentId?: string; // If assigned to a single student, otherwise entire classroom
  title: string;
  description: string;
  instructions?: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  link?: string;
  attachmentUrl?: string;
  status: HomeworkStatus;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  isArchived?: boolean;
}

/* =========================================================================
 * 2. Notification Entity (مركز التنبيهات الداخلي)
 * ========================================================================= */
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationType =
  | 'STUDENT_ABSENCE'
  | 'STUDENT_LATE'
  | 'STUDENT_REPEAT_ABSENCE'
  | 'STUDENT_UNRECORDED'
  | 'BEHAVIOR_VIOLATION'
  | 'BEHAVIOR_CASE_NEW'
  | 'BEHAVIOR_FOLLOWUP_DUE'
  | 'PARENT_CONTACT_REQUIRED'
  | 'HOMEWORK_NEW'
  | 'HOMEWORK_UPDATE'
  | 'HOMEWORK_DUE_SOON'
  | 'SCHEDULE_CHANGE'
  | 'SCHEDULE_SUBSTITUTION'
  | 'LESSON_CONTENT_MISSING'
  | 'TEACHER_ABSENT'
  | 'TEACHER_LATE'
  | 'SYNC_ERROR'
  | 'SYNC_PENDING'
  | 'PAYROLL_REVIEW'
  | 'ACADEMIC_YEAR_CLOSE'
  | 'SYSTEM_ALERT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetUserId?: string;
  targetRole?: UserRole | 'ALL';
  targetStudentId?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  createdBySystem: boolean;
}

/* =========================================================================
 * 3. Pending Actions Model (مطلوب منك اليوم)
 * ========================================================================= */
export interface PendingAction {
  id: string;
  type: string;
  title: string;
  description: string;
  assignedToRole?: UserRole;
  assignedToUserId?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueDate?: string;
  relatedEntity?: string;
  relatedId?: string;
  actionUrl?: string;
  actionLabel?: string;
  count?: number;
}

/* =========================================================================
 * 4. Payroll Attendance Snapshot & Detailed Calculation Breakdown
 * ========================================================================= */
export interface PayrollAttendanceSnapshot {
  id: string;
  payrollPeriodId: string; // e.g. "PAY-2026-08"
  employeeId: string;
  employeeName: string;
  department: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  lateCount: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeHours: number;
  permissionsCount: number;
  sourceCalculatedAt: string;
  sourceCalculatedBy: string;
  isLocked: boolean;
}

export interface PayrollCalculationBreakdown {
  basicSalary: number;
  allowances: number;
  bonuses: number;
  overtimeAmount: number;
  absenceDeduction: number;
  lateDeduction: number;
  otherDeductions: number;
  grossSalary: number;
  netSalary: number;
  calculationDetails: {
    overtimeRatePerHour: number;
    dailyWage: number;
    minuteRate: number;
    appliedGracePeriodMinutes: number;
    calculationFormula: string;
  };
}

/* =========================================================================
 * 5. Sync Queue & Conflict Resolution (Offline-First Real Architecture)
 * ========================================================================= */
export type SyncQueueItemStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface SyncQueueItem {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  payload: any;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  status: SyncQueueItemStatus;
  priority: number; // Higher is processed first
  version?: number;
  clientTimestamp: string;
}

/* =========================================================================
 * 6. Master Data Management Model (مرجع القوائم والتعريفات)
 * ========================================================================= */
export type MasterDataCategory =
  | 'ACADEMIC'
  | 'STUDENTS'
  | 'HR'
  | 'BEHAVIOR'
  | 'SYSTEM';

export interface MasterDataItem {
  id: string;
  category: MasterDataCategory;
  typeKey: string; // e.g. "DEPARTMENTS", "JOB_TITLES", "LEAVE_TYPES", "SUBJECTS", "ROOMS"
  code: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
  isSystemProtected?: boolean; // Cannot be hard-deleted
  metaData?: Record<string, any>;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt: string;
  updatedAt?: string;
}

/* =========================================================================
 * 7. Effective Date & Config Versioning
 * ========================================================================= */
export interface EffectiveConfigRecord {
  id: string;
  key: string;
  category: string;
  title: string;
  value: any;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveTo?: string; // YYYY-MM-DD
  version: number;
  reason?: string;
  changedBy: string;
  createdAt: string;
}

/* =========================================================================
 * 8. Saved Report Filters
 * ========================================================================= */
export interface SavedReportFilter {
  id: string;
  userId: string;
  reportType: 'STUDENT_ATTENDANCE' | 'EMPLOYEE_ATTENDANCE' | 'BEHAVIOR' | 'SCHEDULE' | 'PAYROLL' | 'STUDENT_360';
  name: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  createdAt: string;
}

/* =========================================================================
 * 9. Backup & Export Metadata
 * ========================================================================= */
export interface SystemBackupMetadata {
  id: string;
  createdAt: string;
  createdBy: string;
  type: 'FULL_BACKUP' | 'STUDENTS_SNAPSHOT' | 'ATTENDANCE_SNAPSHOT' | 'SETTINGS_SNAPSHOT';
  academicYearId?: string;
  description: string;
  entitiesCount: Record<string, number>;
  fileSizeKb?: number;
}
