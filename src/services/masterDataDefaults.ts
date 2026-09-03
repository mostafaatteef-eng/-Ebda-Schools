import {
  AcademicYear,
  AttendanceRecord,
  AuditLogEntry,
  BehaviorCase,
  BehaviorScoreLedger,
  BehaviorType,
  BehaviorViolation,
  Employee,
  Homework,
  LeaveRecord,
  LessonContent,
  LessonInstance,
  MasterDataItem,
  PayrollAttendanceSnapshot,
  PayrollRecord,
  PendingAction,
  PositiveBehaviorType,
  SavedReportFilter,
  ScheduleItem,
  ScheduleSubstitution,
  Student,
  StudentAttendanceRecord,
  StudentEnrollment,
  SyncQueueItem,
  SystemSettings,
  User,
  UserRole,
} from '../types';
import { AppNotification } from '../types_extended';
import { ApiResponse, HomeworkQueryFilters, ParentDayViewData, StudentAttendanceQueryFilters, StudentQueryFilters } from './apiTypes';
import { getCairoCurrentDate, getCairoNowISO, getEgyptianDayName } from '../utils/egyptianTime';

/**
 * Storage Keys Registry
 */
export const STORAGE_KEYS = {
  SETTINGS: 'ntss_school_settings_v3',
  EMPLOYEES: 'ntss_employees_v3',
  ATTENDANCE: 'ntss_attendance_v3',
  USERS: 'ntss_users_v3',
  CURRENT_USER: 'ntss_current_user_v3',
  LEAVES: 'ntss_leaves_v3',
  AUDIT_LOGS: 'ntss_audit_logs_v3',
  SYNC_STATUS: 'ntss_sync_status_v3',
  STUDENTS: 'ntss_students_v3',
  STUDENT_ATTENDANCE: 'ntss_student_attendance_v3',
  CLASS_ATTENDANCE: 'ntss_class_attendance_v3',
  BEHAVIOR_TYPES: 'ntss_behavior_types_v3',
  POSITIVE_BEHAVIOR_TYPES: 'ntss_positive_behavior_types_v3',
  BEHAVIOR_VIOLATIONS: 'ntss_behavior_violations_v3',
  BEHAVIOR_LEDGER: 'ntss_behavior_ledger_v3',
  BEHAVIOR_CASES: 'ntss_behavior_cases_v3',
  SCHEDULE: 'ntss_schedule_v3',
  SCHEDULE_SUBSTITUTIONS: 'ntss_schedule_substitutions_v3',
  LESSON_INSTANCES: 'ntss_lesson_instances_v3',
  LESSON_CONTENT: 'ntss_lesson_content_v3',
  PAYROLL: 'ntss_payroll_v3',
  PAYROLL_SNAPSHOTS: 'ntss_payroll_snapshots_v3',
  ACADEMIC_YEARS: 'ntss_academic_years_v3',
  STUDENT_ENROLLMENTS: 'ntss_student_enrollments_v3',
  STUDENT_TRANSFERS: 'ntss_student_transfers_v3',
  PROMOTION_RULES: 'ntss_promotion_rules_v3',
  PARENT_COMMUNICATIONS: 'ntss_parent_communications_v3',
  LOCATIONS: 'ntss_locations_v3',
  
  // NEW ENHANCED MODULE KEYS
  HOMEWORKS: 'ntss_homeworks_v3',
  NOTIFICATIONS: 'ntss_notifications_v3',
  SYNC_QUEUE: 'ntss_sync_queue_v3',
  MASTER_DATA: 'ntss_master_data_v3',
  SAVED_REPORT_FILTERS: 'ntss_saved_report_filters_v3',
  EFFECTIVE_CONFIGS: 'ntss_effective_configs_v3',
  BACKUP_HISTORY: 'ntss_backup_history_v3',
  IMPORT_BATCHES: 'ntss_import_batches_v3',
};

export const DEFAULT_MASTER_DATA: MasterDataItem[] = [
  // Departments
  { id: 'MD-DEP-1', category: 'HR', typeKey: 'DEPARTMENTS', code: 'DEP-MATH', nameAr: 'قسم الرياضيات والعلوم', sortOrder: 1, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-DEP-2', category: 'HR', typeKey: 'DEPARTMENTS', code: 'DEP-LANG', nameAr: 'قسم اللغات والترجمة', sortOrder: 2, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-DEP-3', category: 'HR', typeKey: 'DEPARTMENTS', code: 'DEP-ADMIN', nameAr: 'الإدارة المدرسية وشؤون الطلاب', sortOrder: 3, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-DEP-4', category: 'HR', typeKey: 'DEPARTMENTS', code: 'DEP-SOC', nameAr: 'الخدمة الاجتماعية والإرشاد', sortOrder: 4, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-DEP-5', category: 'HR', typeKey: 'DEPARTMENTS', code: 'DEP-IT', nameAr: 'تكنولوجيا التعليم والحاسب الآلي', sortOrder: 5, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

  // Job Titles
  { id: 'MD-JOB-1', category: 'HR', typeKey: 'JOB_TITLES', code: 'JOB-TCH-SR', nameAr: 'معلم أول أ', sortOrder: 1, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-JOB-2', category: 'HR', typeKey: 'JOB_TITLES', code: 'JOB-TCH', nameAr: 'معلم', sortOrder: 2, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-JOB-3', category: 'HR', typeKey: 'JOB_TITLES', code: 'JOB-HOD', nameAr: 'رئيس قسم / موجه', sortOrder: 3, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-JOB-4', category: 'HR', typeKey: 'JOB_TITLES', code: 'JOB-STU-OFF', nameAr: 'مسؤول شؤون طلاب', sortOrder: 4, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-JOB-5', category: 'HR', typeKey: 'JOB_TITLES', code: 'JOB-SOC-SPC', nameAr: 'أخصائي اجتماعي ونفسي', sortOrder: 5, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

  // Subjects
  { id: 'MD-SUB-1', category: 'ACADEMIC', typeKey: 'SUBJECTS', code: 'SUB-MATH', nameAr: 'الرياضيات والجبر', sortOrder: 1, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-SUB-2', category: 'ACADEMIC', typeKey: 'SUBJECTS', code: 'SUB-ARABIC', nameAr: 'اللغة العربية والتربية الإسلامية', sortOrder: 2, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-SUB-3', category: 'ACADEMIC', typeKey: 'SUBJECTS', code: 'SUB-ENG', nameAr: 'اللغة الإنجليزية', sortOrder: 3, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-SUB-4', category: 'ACADEMIC', typeKey: 'SUBJECTS', code: 'SUB-PHYSICS', nameAr: 'الفيزياء', sortOrder: 4, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-SUB-5', category: 'ACADEMIC', typeKey: 'SUBJECTS', code: 'SUB-CHEM', nameAr: 'الكيمياء', sortOrder: 5, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-SUB-6', category: 'ACADEMIC', typeKey: 'SUBJECTS', code: 'SUB-BIO', nameAr: 'الأحياء', sortOrder: 6, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-SUB-7', category: 'ACADEMIC', typeKey: 'SUBJECTS', code: 'SUB-HIST', nameAr: 'التاريخ والجغرافيا', sortOrder: 7, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

  // Leave Types
  { id: 'MD-LEAVE-1', category: 'HR', typeKey: 'LEAVE_TYPES', code: 'LEAVE-ANNUAL', nameAr: 'إجازة اعتيادية سنوية', sortOrder: 1, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-LEAVE-2', category: 'HR', typeKey: 'LEAVE_TYPES', code: 'LEAVE-SICK', nameAr: 'إجازة مرضية معتمدة', sortOrder: 2, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-LEAVE-3', category: 'HR', typeKey: 'LEAVE_TYPES', code: 'LEAVE-CASUAL', nameAr: 'إجازة عارضة', sortOrder: 3, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-LEAVE-4', category: 'HR', typeKey: 'LEAVE_TYPES', code: 'LEAVE-UNPAID', nameAr: 'إجازة بدون راتب', sortOrder: 4, isActive: true, createdAt: '2026-01-01T00:00:00Z' },

  // Transfer Types
  { id: 'MD-TRN-1', category: 'STUDENTS', typeKey: 'TRANSFER_TYPES', code: 'TRN-CLASS', nameAr: 'نقل داخلي بين الفصول', sortOrder: 1, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-TRN-2', category: 'STUDENTS', typeKey: 'TRANSFER_TYPES', code: 'TRN-STAGE', nameAr: 'ترقية إلى الصف التالي', sortOrder: 2, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'MD-TRN-3', category: 'STUDENTS', typeKey: 'TRANSFER_TYPES', code: 'TRN-OUT', nameAr: 'تحويل خارج المدرسة', sortOrder: 3, isActive: true, createdAt: '2026-01-01T00:00:00Z' },
];
