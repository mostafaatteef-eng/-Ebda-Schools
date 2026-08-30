export type UserRole =
  | 'Admin'
  | 'StudentAffairs'
  | 'TeacherAffairs'
  | 'Teacher'
  | 'SocialSpecialist'
  | 'Parent'
  | 'HR'
  | 'Supervisor'
  | 'BehaviorOfficer'
  | 'PayrollOfficer'
  | 'Employee'
  | 'Viewer';

export type PermissionKey =
  | 'students.view'
  | 'students.create'
  | 'students.edit'
  | 'students.delete'
  | 'students.import'
  | 'studentAttendance.view'
  | 'studentAttendance.create'
  | 'studentAttendance.edit'
  | 'studentAttendance.delete'
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  | 'teachers.import'
  | 'teacherAttendance.view'
  | 'teacherAttendance.create'
  | 'teacherAttendance.edit'
  | 'teacherAttendance.delete'
  | 'leaves.view'
  | 'leaves.create'
  | 'leaves.edit'
  | 'leaves.delete'
  | 'behavior.view'
  | 'behavior.create'
  | 'behavior.edit'
  | 'behavior.delete'
  | 'behaviorTypes.manage'
  | 'behaviorPoints.manage'
  | 'schedule.view'
  | 'schedule.manage'
  | 'schedule.exportPdf'
  | 'lessonContent.view'
  | 'lessonContent.create'
  | 'lessonContent.edit'
  | 'parentPortal.access'
  | 'payroll.view'
  | 'payroll.manage'
  | 'payroll.approve'
  | 'payroll.lock'
  | 'settings.manage'
  | 'users.manage'
  | 'audit.view'
  | 'reports.view';

export type AttendanceStatus =
  | 'حاضر'
  | 'متأخر'
  | 'غائب'
  | 'مأذونية'
  | 'إذن عمل'
  | 'إجازة'
  | 'عطلة أسبوعية'
  | 'راحة'
  | 'نصف يوم';

export type PermissionType =
  | 'إذن خروج'
  | 'إذن تأخير'
  | 'إذن انصراف مبكر'
  | 'إذن خلال اليوم'
  | 'أخرى';

export type AbsenceReasonCategory =
  | 'بدون إذن'
  | 'بعذر مقبول'
  | 'مرضي'
  | 'لم يحضر'
  | 'ظرف طارئ'
  | 'أخرى';

export type LeaveType =
  | 'سنوية'
  | 'مرضية'
  | 'طارئة'
  | 'عارضة'
  | 'بدون راتب'
  | 'رسمية'
  | 'أمومة/أبوة'
  | 'أخرى';

export type LeaveStatus = 'معلقة' | 'مقبولة' | 'مرفوضة';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
  studentIds?: string[]; // For Parent accounts linked to one or more students
  email: string;
  password?: string;
  department?: string;
  isActive?: boolean;
  status: 'Active' | 'Inactive';
  createdAt: string;
  lastLogin?: string;
  avatar?: string;
  pin?: string;
}

export interface Employee {
  id: string; // EMP001, EMP002, etc.
  name: string;
  nationalId?: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  basicSalary?: number;
  allowances?: number; // بدلات
  workingHours: number; // e.g. 8
  workStartTime: string; // e.g. "07:30"
  workEndTime: string; // e.g. "15:00"
  daysOff: string[]; // e.g. ["Friday", "Saturday"] or ["الجمعة", "السبت"]
  status: 'Active' | 'Inactive';
  phone?: string;
  email?: string;
  isTeacher?: boolean;
  teachingSubjects?: string[];
  assignedGrades?: string[];
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  dayName: string; // الأحد، الإثنين...
  checkIn: string; // "07:35" or ""
  checkOut: string; // "14:45" or ""
  workingHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeHours: number;
  status: AttendanceStatus;
  
  leaveType?: LeaveType | string;
  leaveStartDate?: string;
  leaveEndDate?: string;
  leaveDaysCount?: number;
  
  permissionType?: PermissionType | string;
  permissionFrom?: string;
  permissionTo?: string;
  permissionDurationMinutes?: number;
  
  absenceReasonCategory?: AbsenceReasonCategory | string;
  reason?: string;
  notes?: string;
  
  checkInTimestamp?: string;
  checkOutTimestamp?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  status: LeaveStatus;
  reason: string;
  approvedBy?: string;
  createdAt: string;
}

/* =========================================================================
 * 1. بيانات الطلاب والفصول (Student & Classroom Management)
 * ========================================================================= */
export type StudentStatus = 'نشط' | 'موقوف' | 'منقول' | 'متخرج' | 'غير مقيد';
export type Gender = 'ذكر' | 'أنثى';

export interface Classroom {
  id: string; // CLS001
  classroomNumber: string; // "1", "2", "3", "4"
  displayName?: string; // "الصف الأول الثانوي - فصل 1"
  gradeId: string; // "G_SEC_1"
  gradeName: string; // "الصف الأول الثانوي"
  stageId?: string;
  stageName?: string;
  capacity?: number;
  status: 'Active' | 'Inactive';
  academicYear: string; // "2025/2026"
}

export interface Student {
  id: string; // STD001, STU-2026-001
  studentCode: string; // كود الطالب
  name: string; // اسم الطالب رباعي
  nationalId?: string; // الرقم القومي
  gender: Gender;
  birthDate?: string; // YYYY-MM-DD
  stage: string; // المرحلة (ثانوي / إعدادي / ابتدائي)
  stageId?: string;
  grade: string; // الصف الدراسي (الصف الأول الثانوي...)
  gradeId?: string;
  gradeName?: string;
  classroom: string; // رقم الفصل أو اسم الفصل (1 أو فصل 1 أو 1/1)
  classroomId?: string;
  classroomNumber?: string;
  academicYear: string; // العام الدراسي (2025/2026)
  status: StudentStatus;
  enrollmentDate?: string; // تاريخ الالتحاق
  phone?: string;
  
  // بيانات ولي الأمر
  parentId?: string; // معرف حساب ولي الأمر إن وجد
  parentName: string;
  relationship: string; // أب، أم، وصي
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  
  initialBehaviorScore?: number; // درجة السلوك الافتراضية
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/* =========================================================================
 * 2. حضور وغياب الطلاب (Student Attendance)
 * ========================================================================= */
export type StudentAttendanceStatus =
  | 'حاضر'
  | 'متأخر'
  | 'غائب'
  | 'غائب بعذر'
  | 'غائب بدون عذر'
  | 'مأذون'
  | 'مريض'
  | 'نشاط / رحلة'
  | 'موقوف'
  | 'هروب'
  | 'لم يسجل'
  | string;

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  studentCode?: string;
  studentName: string;
  stage: string;
  grade: string;
  classroom: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  status: StudentAttendanceStatus;
  checkInTime?: string; // HH:mm
  lateMinutes?: number;
  absenceReason?: string;
  absenceCategory?: string;
  notes?: string;
  recordedBy?: string;
  recordedAt?: string;
  updatedAt?: string;
}

/* =========================================================================
 * 3. السلوك والمخالفات المدرسية (Behavior & Violations)
 * ========================================================================= */
export type SeverityLevel =
  | 'بسيطة'
  | 'متوسطة'
  | 'شديدة'
  | 'خطيرة جداً'
  | 'الدرجة الأولى'
  | 'الدرجة الثانية'
  | 'الدرجة الثالثة'
  | 'الدرجة الرابعة'
  | string;

export interface BehaviorType {
  id: string; // BEH001
  name: string; // اسم المخالفة
  category: string; // سلوكية، أكاديمية، انضباط مدرسي
  description?: string;
  severity: SeverityLevel;
  points?: number; // عدد النقاط
  weight: number; // خصم نقاط السلوك (مثلاً 2، 5، 10)
  defaultAction?: string; // إجراء افتراضي (تنبيه شفوي، إنذار كتابي، استدعاء ولي أمر)
  notifyParent: boolean;
  requiresAdminReview: boolean;
  isActive: boolean;
  sortOrder?: number;
}

export interface BehaviorViolation {
  id: string;
  studentId: string;
  studentCode?: string;
  studentName: string;
  grade: string;
  classroom: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  behaviorTypeId?: string;
  violationTypeId?: string;
  violationName: string;
  severity?: SeverityLevel;
  pointsDeducted: number;
  recordedBy: string; // المعلم / المشرف
  subject?: string; // المادة أو الحصة إن وجدت
  description?: string;
  notes?: string;
  witnesses?: string; // الشهود
  actionTaken: string; // الإجراء المتخذ
  parentNotified: boolean;
  status: 'مسجلة' | 'قيد المراجعة' | 'معتمدة' | 'ملغاة' | 'قائمة' | string;
  createdAt: string;
}

export interface BehaviorScoreRule {
  initialScore: number; // 100
  minScore: number; // 0
  maxScore: number; // 100
  excellentThreshold: number; // 90
  goodThreshold: number; // 75
  warningThreshold: number; // 60
  dangerThreshold: number; // < 60
}

/* =========================================================================
 * 4. الجدول الدراسي والمحتوى التعليمي (Schedule & Lesson Content)
 * ========================================================================= */
export interface ScheduleItem {
  id: string;
  academicYear: string;
  term?: string; // الترم الأول / الترم الثاني
  stage?: string;
  grade: string;
  classroom: string;
  dayName: string; // الأحد، الإثنين...
  periodNumber: number; // رقم الحصة (1, 2, 3...)
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  subject: string; // الرياضيات، اللغة العربية...
  teacherId?: string;
  teacherName?: string;
  roomNumber?: string;
  notes?: string;
}

export type ClassPeriodSchedule = ScheduleItem;

export interface LessonLink {
  id: string;
  title: string;
  url: string;
  type: 'drive' | 'youtube' | 'pdf' | 'presentation' | 'assignment' | 'teams' | 'other';
}

export interface LessonContent {
  id: string;
  scheduleId?: string;
  date: string; // YYYY-MM-DD
  periodNumber: number;
  teacherId: string;
  teacherName: string;
  subject: string;
  grade: string;
  classroom: string;
  lessonTitle: string;
  lessonDescription?: string;
  summaryCovered?: string;
  bookPages?: string;
  homework?: string;
  links: LessonLink[];
  createdAt: string;
}

/* =========================================================================
 * 5. المرتبات والاستحقاقات (Payroll System)
 * ========================================================================= */
export type PayrollStatus = 'Draft' | 'UnderReview' | 'Approved' | 'Paid' | 'Locked';

export interface PayrollItem {
  id: string;
  employeeId: string;
  type: 'allowance' | 'incentive' | 'overtime' | 'deduction' | 'absence' | 'late' | 'loan' | 'other';
  title: string;
  amount: number;
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  month: number; // 1 - 12
  year: number; // 2026
  
  // الاستحقاقات
  basicSalary: number;
  allowances: number;
  incentives: number;
  overtimeHours: number;
  overtimeAmount: number;
  totalGross: number; // إجمالي المستحقات
  
  // الاستقطاعات
  absentDaysCount: number;
  absenceDeductions: number;
  totalLateMinutes: number;
  lateDeductions: number;
  loanDeductions: number;
  otherDeductions: number;
  totalDeductions: number; // إجمالي الاستقطاعات
  
  // الصافي
  netSalary: number;
  
  status: PayrollStatus;
  approvedBy?: string;
  paidDate?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PayrollRule {
  workDaysPerMonth: number; // 26 أو 30 يوم
  calculationMethod: 'calendar_days' | 'work_days' | 'fixed_30';
  absenceDeductionMultiplier: number; // 1 = يوم، 1.5 = يوم ونصف
  lateMinuteDeductionRate: number; // معامل خصم الدقيقة
  lateGraceMinutes: number; // 15 دقيقة سماح
  overtimeRate: number; // 1.5
  maxOvertimeHoursPerMonth: number; // 40 ساعة
  enableSocialInsuranceDeduction: boolean;
  socialInsuranceRate: number; // %
}

/* =========================================================================
 * 6. الإعدادات المدرسية والنظام (Central Settings)
 * ========================================================================= */
export interface DepartmentItem {
  id: string;
  name: string;
  managerName?: string;
  description?: string;
  isActive: boolean;
}

export interface AcademicStage {
  id: string;
  name: string; // ابتدائي، إعدادي، ثانوي
  grades: {
    id: string;
    name: string; // الصف الأول...
    classrooms: string[]; // [1/1, 1/2, 1/3]
  }[];
}

export interface SchoolHoliday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  affectsAbsenceCalculation: boolean;
  notes?: string;
}

export interface PermissionMatrix {
  canViewStudents: boolean;
  canEditStudents: boolean;
  canImportStudents: boolean;
  canTakeStudentAttendance: boolean;
  canEditStudentAttendance: boolean;
  canCreateViolation: boolean;
  canApproveViolation: boolean;
  canViewPayroll: boolean;
  canProcessPayroll: boolean;
  canApprovePayroll: boolean;
  canManageSchedule: boolean;
  canAddLessonContent: boolean;
  canViewParentPortal: boolean;
  canManageSettings: boolean;
  canViewAuditLogs: boolean;
}

export interface SystemSettings {
  // المدرسة والهوية
  schoolName: string;
  companyName?: string; // Compatibility
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string;
  currentAcademicYear: string; // "2025/2026"
  currentTerm: string; // "الترم الأول"
  country: string; // "مصر"
  currency: string; // "ج.م"
  timeZone: string; // "Africa/Cairo"
  defaultLanguage: string; // "العربية"
  
  // الحضور المصري
  officialStartTime: string; // "07:30"
  officialEndTime: string; // "14:30"
  gracePeriodMinutes: number; // 15
  standardDailyHours: number; // 7
  weekendDays: string[]; // ["الجمعة", "السبت"]
  
  // الإجازات
  annualLeaveAllowance: number;
  sickLeaveAllowance: number;
  emergencyLeaveAllowance: number;
  
  // الهيكل المدرسي
  stages: AcademicStage[];
  departments: DepartmentItem[];
  holidays: SchoolHoliday[];
  behaviorScoreRules: BehaviorScoreRule;
  payrollRules: PayrollRule;
  
  // الصلاحيات لكل دور
  rolePermissions?: Record<UserRole, PermissionMatrix>;
  
  // الربط السحابي
  googleSheetsUrl?: string;
  googleAppsScriptUrl?: string;
  googleSheetWebAppUrl?: string;
  spreadsheetId?: string;
  autoCalculateStatus: boolean;
  autoSyncIntervalMinutes: number;
  enableAuditLog: boolean;
}

/* =========================================================================
 * 7. سجلات المراقبة وحالات المزامنة (Audit Logs & Sync)
 * ========================================================================= */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username?: string;
  userRole?: UserRole;
  performedBy?: string;
  action: string;
  entity?:
    | 'ATTENDANCE'
    | 'EMPLOYEE'
    | 'STUDENT'
    | 'STUDENT_ATTENDANCE'
    | 'BEHAVIOR'
    | 'SCHEDULE'
    | 'LESSON'
    | 'PAYROLL'
    | 'LEAVE'
    | 'USER'
    | 'SETTINGS'
    | 'AUTH'
    | 'IMPORT'
    | 'SYNC';
  targetEntity?: string;
  targetId?: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export type AuditLog = AuditLogEntry;

export interface MonthSummaryItem {
  employeeId: string;
  employeeName: string;
  department: string;
  totalDays: number;
  presentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  absentDays: number;
  leaveDays: number;
  weekendDays: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  attendanceRate: number;
}

export interface AnnualSummaryItem {
  employeeId: string;
  employeeName: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  totalWorkDaysExpected: number;
  totalPresent: number;
  totalLateCount: number;
  totalLateMinutes: number;
  totalAbsent: number;
  totalLeaves: number;
  annualLeavesUsed: number;
  sickLeavesUsed: number;
  totalHoursWorked: number;
  attendanceRate: number;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  syncedRecordsCount?: number;
  connectedToGoogleSheets: boolean;
}

export type SyncState = SyncStatus;
