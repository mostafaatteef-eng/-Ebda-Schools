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

export type NotificationCategory =
  | 'Attendance'
  | 'Behavior'
  | 'Schedule'
  | 'Homework'
  | 'LessonContent'
  | 'System'
  | 'HR'
  | 'Payroll';

export type NotificationType =
  | 'STUDENT_ABSENCE'
  | 'STUDENT_LATE'
  | 'STUDENT_REPEAT_ABSENCE'
  | 'STUDENT_UNRECORDED'
  | 'CLASS_ATTENDANCE_MISMATCH'
  | 'BEHAVIOR_VIOLATION'
  | 'POSITIVE_BEHAVIOR'
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
  category?: NotificationCategory;
  title: string;
  message: string;
  targetUserId?: string;
  targetRole?: UserRole | 'ALL';
  targetStudentId?: string;
  deduplicationKey?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionLabel?: string;
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
 * 8. Saved Report Filters & Report Architecture
 * ========================================================================= */
export type ReportModule = 'STUDENTS' | 'ACADEMIC' | 'BEHAVIOR' | 'HR' | 'PAYROLL';
export type ReportExportFormat = 'EXCEL' | 'PDF' | 'PRINT' | 'CSV';

export interface ReportColumn {
  key: string;
  label: string;
  isDefaultVisible?: boolean;
  align?: 'right' | 'center' | 'left';
  width?: string;
  isNumeric?: boolean;
}

export interface ReportFilterDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'month' | 'year' | 'number';
  options?: { value: string; label: string }[];
  defaultValue?: any;
  placeholder?: string;
}

export interface ReportDefinition {
  id: string;
  key: string;
  name: string;
  module: ReportModule;
  description: string;
  requiredPermission?: PermissionKey;
  adminOnly?: boolean;
  availableFilters: ReportFilterDef[];
  availableColumns: ReportColumn[];
  exportFormats: ReportExportFormat[];
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  isActive: boolean;
}

export interface ReportQueryResult {
  columns: ReportColumn[];
  rows: Record<string, any>[];
  totalRows: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summaryStats?: Record<string, any>;
  appliedFilters: Record<string, any>;
}

export interface SavedReportFilter {
  id: string;
  userId: string;
  reportKey: string;
  name: string;
  filtersJson: string;
  columnsJson?: string;
  sortJson?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/* =========================================================================
 * 9. Backup & Export Metadata & Restore
 * ========================================================================= */
export type BackupType = 'FULL' | 'CONFIG' | 'ACADEMIC' | 'HR' | 'PAYROLL';

export interface SystemBackupMetadata {
  id: string;
  type: BackupType;
  createdAt: string;
  createdBy: string;
  description: string;
  schemaVersion: string;
  dataVersion: string;
  status: 'SUCCESS' | 'FAILED';
  sizeEstimateBytes?: number;
  entitiesCount: Record<string, number>;
  academicYearId?: string;
}

export interface SystemBackupPackage {
  metadata: SystemBackupMetadata;
  data: Record<string, any>;
  safetyHash?: string;
}

export interface RestoreValidationReport {
  isValid: boolean;
  schemaVersion: string;
  sourceCreatedDate: string;
  sourceCreatedBy: string;
  type: BackupType;
  sheetsFound: string[];
  missingRequiredSheets: string[];
  duplicateKeysDetected: number;
  incompatibilities: string[];
  warnings: string[];
  impactEstimate: Record<string, { currentCount: number; incomingCount: number; action: string }>;
}

/* =========================================================================
 * 10. Import & Update Center
 * ========================================================================= */
export type ImportEntityType = 'STUDENTS' | 'PARENTS' | 'EMPLOYEES' | 'TEACHERS' | 'MASTER_DATA';
export type ImportMode = 'ADD_ONLY' | 'UPDATE_ONLY' | 'ADD_UPDATE';

export interface ImportFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  aliases: string[];
  type?: 'string' | 'number' | 'date' | 'phone';
}

export interface ImportValidationIssue {
  rowNumber: number;
  field: string;
  value: any;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'CONFLICT';
}

export interface ImportDiffRow {
  rowNumber: number;
  targetId?: string;
  identifier: string; // studentCode or employeeId or nationalId
  displayName: string;
  classification: 'NEW' | 'UPDATE' | 'NO_CHANGE' | 'CONFLICT' | 'ERROR';
  issues?: string[];
  changes?: Record<string, { oldValue: any; newValue: any }>;
  incomingData: Record<string, any>;
}

export interface ImportSummaryStats {
  totalRows: number;
  newCount: number;
  updateCount: number;
  noChangeCount: number;
  conflictCount: number;
  errorCount: number;
}

export interface ImportBatchRecord {
  id: string; // e.g. "IMP-BATCH-20260902-12345"
  entityType: ImportEntityType;
  fileName: string;
  mode: ImportMode;
  totalRows: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  conflictCount: number;
  selectedUpdateFields?: string[];
  affectedIds: string[];
  rollbackPossible: boolean;
  rolledBack?: boolean;
  rolledBackAt?: string;
  rolledBackBy?: string;
  createdBy: string;
  createdAt: string;
  status: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  failedRows?: { rowNumber: number; data: any; reason: string }[];
}

/* =========================================================================
 * 11. System Health & Observability
 * ========================================================================= */
export type HealthSeverity = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface HealthCheckItem {
  id: string;
  category: 'BACKEND' | 'SHEETS' | 'SYNC' | 'DATA_INTEGRITY' | 'SECURITY' | 'CONFIGURATION' | 'PAYROLL';
  title: string;
  description: string;
  status: HealthSeverity;
  metric?: string;
  details?: string;
  recommendedAction?: string;
}

export interface DataIntegrityViolation {
  checkType: string;
  title: string;
  severity: HealthSeverity;
  count: number;
  sampleItems: { id: string; label: string; issue: string }[];
}

export interface SystemHealthOverview {
  overallStatus: HealthSeverity;
  lastCheckedAt: string;
  backend: {
    appsScriptConnected: boolean;
    lastSuccessfulRequest?: string;
    averageResponseTimeMs?: number;
    lastError?: string;
  };
  sheets: {
    reachable: boolean;
    requiredSheetsPresent: string[];
    missingSheets: string[];
    schemaVersion: string;
  };
  sync: {
    lastSuccessfulSync?: string;
    pendingCount: number;
    failedCount: number;
    conflictsCount: number;
    oldestPendingTime?: string;
  };
  dataCounts: {
    students: number;
    employees: number;
    studentAttendanceRows: number;
    employeeAttendanceRows: number;
    classAttendanceRows: number;
    violations: number;
    notifications: number;
    auditLogs: number;
  };
  checks: HealthCheckItem[];
  integrityViolations: DataIntegrityViolation[];
}

/* =========================================================================
 * 12. Load Testing & Capacity Estimation
 * ========================================================================= */
export type CapacityZone = 'SAFE' | 'WARNING' | 'MIGRATION';

export interface CapacityAssessment {
  currentStudents: number;
  currentEmployees: number;
  currentAttendanceRows: number;
  dailyApiRequestsEstimated: number;
  safeZoneLimit: string;
  warningZoneLimit: string;
  migrationZoneLimit: string;
  verdict: 'SUITABLE' | 'SUITABLE_WITH_CONSTRAINTS' | 'APPROACHING_LIMITS' | 'MIGRATION_RECOMMENDED';
  verdictReason: string;
}

/* =========================================================================
 * 10. Monthly Attendance Closing & Period Lock
 * ========================================================================= */
export interface MonthlyAttendanceClosing {
  id: string; // e.g. "CLOSE-2026-08"
  month: number;
  year: number;
  status: 'OPEN' | 'IN_REVIEW' | 'CLOSED' | 'LOCKED';
  totalEmployees: number;
  recordedEmployees: number;
  totalPresentDays: number;
  totalAbsentDays: number;
  totalLateMinutes: number;
  totalOvertimeHours: number;
  closedAt?: string;
  closedBy?: string;
  notes?: string;
  isPayrollGenerated?: boolean;
  payrollGeneratedAt?: string;
  version?: number;
}

/* =========================================================================
 * 11. Salary Adjustment & Effective Dating History
 * ========================================================================= */
export interface SalaryHistoryEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  previousBasicSalary: number;
  newBasicSalary: number;
  previousAllowances: number;
  newAllowances: number;
  effectiveDate: string; // YYYY-MM-DD
  reason: string; // e.g. "ترقية سنوية", "علاوة تميز", "تعديل هيكل الأجور"
  approvedBy: string;
  createdAt: string;
}

/* =========================================================================
 * 12. Employee Permission Request (أذونات وتصاريح العمل)
 * ========================================================================= */
export interface EmployeePermissionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  permissionType: string; // e.g. "إذن خروج مؤقت", "إذن تأخير صباحي", "مهمة عمل رسمية"
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  reason: string;
  status: 'معلقة' | 'مقبولة' | 'مرفوضة';
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

/* =========================================================================
 * 13. Global Search Types
 * ========================================================================= */
export type SearchCategory = 'ALL' | 'STUDENTS' | 'EMPLOYEES' | 'CLASSROOMS' | 'BEHAVIOR' | 'SCHEDULE';

export interface GlobalSearchResultItem {
  id: string;
  category: 'STUDENTS' | 'EMPLOYEES' | 'CLASSROOMS' | 'BEHAVIOR' | 'SCHEDULE' | string;
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge?: string;
  actionTab: string;
  entityId?: string;
  raw?: any;
  meta?: Record<string, any>;
}

/* =========================================================================
 * 14. Phase 10: UAT, Pilot, Operations & Release Candidate Types
 * ========================================================================= */
export type UatResult = 'PASS' | 'FAIL' | 'BLOCKED';
export type IssueSeverity = 'P0' | 'P1' | 'P2' | 'P3';
export type IncidentSeverity = 'SEV-1' | 'SEV-2' | 'SEV-3' | 'SEV-4';

export interface UatTestCase {
  id: string;
  role: 'Admin' | 'StudentAffairs' | 'TeacherAffairs' | 'Teacher' | 'SocialSpecialist' | 'Parent' | 'Security';
  roleLabel: string;
  module: string;
  scenario: string;
  steps: string[];
  expected: string;
  actual: string;
  result: UatResult;
  severity: IssueSeverity;
  notes: string;
}

export interface UatRoleSignoff {
  role: string;
  roleTitle: string;
  status: 'PASS' | 'PASS_WITH_ISSUES' | 'FAIL';
  signoffUser: string;
  testedScenariosCount: number;
  passedCount: number;
  notes: string;
}

export interface PilotIssueItem {
  id: string;
  role: string;
  module: string;
  description: string;
  severity: IssueSeverity;
  frequency: 'Isolated' | 'Occasional' | 'Frequent';
  workaround: string;
  fixStatus: 'Open' | 'InReview' | 'Resolved' | 'PostGoLiveBacklog';
  reportedAt: string;
}

export interface PilotMetricsData {
  pilotActiveUsers: number;
  loginSuccessRate: number; // e.g. 99.6%
  attendanceSaveSuccessRate: number; // 100%
  avgClassroomAttendanceSec: number; // e.g. 11.2s for 40 students
  avgStudentAffairsReviewSec: number; // e.g. 24.5s
  syncFailuresCount: number; // 0
  apiFailuresCount: number; // 0
  activeTeachersCount: number;
  lessonsRecordedCount: number;
  activeParentsCount: number;
  attendanceCompletionRate: number; // e.g. 98.5%
}

export interface IncidentRecord {
  id: string;
  reportedAt: string;
  reportedBy: string;
  role: string;
  module: string;
  description: string;
  severity: IncidentSeverity;
  affectedUsers: string;
  status: 'Open' | 'UnderInvestigation' | 'Mitigated' | 'Resolved';
  errorCategory: 'Validation Error' | 'Permission Error' | 'Network Error' | 'System Bug';
  requestId?: string;
  rootCause?: string;
  resolution?: string;
  closedAt?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  category?: string;
  notes?: string;
}

export interface BacklogItem {
  id: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  frequency: 'Frequent' | 'Occasional' | 'Rare';
  priority: 'High' | 'Medium' | 'Low';
  risk: 'Low' | 'Medium' | 'High';
  requestedBy: string;
  createdAt: string;
}

export interface ReleaseCandidateMeta {
  version: string;
  buildVersion: string;
  schemaVersion: string;
  configVersion: string;
  appsScriptVersion: string;
  frontendVersion: string;
  releaseDate: string;
  featureFreeze: boolean;
  environment: 'Production' | 'Staging';
  schoolName: string;
  timezone: string;
  currency: string;
}

