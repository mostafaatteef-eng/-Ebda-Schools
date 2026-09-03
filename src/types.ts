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
  | 'schoolAttendance.view'
  | 'schoolAttendance.create'
  | 'schoolAttendance.edit'
  | 'schoolAttendance.approve'
  | 'schoolAttendance.lock'
  | 'schoolAttendance.overrideLocked'
  | 'classAttendance.view'
  | 'classAttendance.create'
  | 'classAttendance.edit'
  | 'classAttendance.manageOwnLessons'
  | 'academicYears.view'
  | 'academicYears.create'
  | 'academicYears.edit'
  | 'academicYears.close'
  | 'academicYears.reopen'
  | 'studentPromotion.view'
  | 'studentPromotion.execute'
  | 'studentPromotion.rollback'
  | 'student360.view'
  | 'student360.viewAttendance'
  | 'student360.viewBehavior'
  | 'student360.viewParentCommunication'
  | 'student360.editNotes'
  | 'teachers.view'
  | 'teachers.create'
  | 'teachers.edit'
  | 'teachers.delete'
  | 'teachers.import'
  | 'teacherPortal.access'
  | 'teacherSchedule.viewOwn'
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
  | 'behaviorCases.view'
  | 'behaviorCases.create'
  | 'behaviorCases.edit'
  | 'behaviorCases.close'
  | 'behaviorTypes.manage'
  | 'behaviorPoints.manage'
  | 'positiveBehavior.create'
  | 'parentCommunication.view'
  | 'parentCommunication.create'
  | 'schedule.view'
  | 'schedule.manage'
  | 'schedule.publish'
  | 'schedule.cancelLesson'
  | 'schedule.exportPdf'
  | 'schedule.manageSubstitution'
  | 'schedule.viewConflicts'
  | 'lessonContent.view'
  | 'lessonContent.create'
  | 'lessonContent.edit'
  | 'lessonContent.editOwn'
  | 'lessonContent.publish'
  | 'lessonResources.manage'
  | 'homework.create'
  | 'homework.editOwn'
  | 'homework.publish'
  | 'parentPortal.access'
  | 'parentPortal.preview'
  | 'parentStudents.viewOwn'
  | 'parentAttendance.viewOwn'
  | 'parentSchedule.viewOwn'
  | 'parentLessonContent.viewOwn'
  | 'parentHomework.viewOwn'
  | 'parentBehavior.viewOwn'
  | 'parentNotifications.viewOwn'
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
  name?: string; // compatibility alias for fullName
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
  sessionToken?: string;
  mustChangePassword?: boolean;
}

export interface Employee {
  id: string; // EMP001, EMP002, etc.
  employeeNumber?: string;
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
 * 0. العام الدراسي والترم الدراسي (Academic Years & Terms Entities)
 * ========================================================================= */
export type AcademicYearStatus = 'Draft' | 'Active' | 'Closed' | 'Archived' | 'ACTIVE' | 'CLOSED';
export type TermStatus = 'Draft' | 'Active' | 'Closed' | 'ACTIVE' | 'CLOSED' | 'UPCOMING' | 'Draft';

export interface Term {
  id: string; // e.g. "TERM-2026-T1"
  academicYearId?: string; // e.g. "AY-2026-2027"
  name: string; // "الترم الأول" / "الترم الثاني"
  code?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: TermStatus;
  isCurrent?: boolean;
  order?: number;
}

export interface AcademicYear {
  id: string; // e.g. "AY-2026-2027"
  name: string; // "2026/2027"
  code?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: AcademicYearStatus;
  isActive?: boolean;
  isCurrent?: boolean;
  isDefault?: boolean;
  isLocked?: boolean;
  terms: Term[];
  createdAt?: string;
  createdBy?: string;
  closedAt?: string;
  closedBy?: string;
  closedNotes?: string;
  notes?: string;
}

/* =========================================================================
 * 1. بيانات الطلاب والفصول (Student & Classroom Management)
 * ========================================================================= */
export type StudentStatus = 'نشط' | 'موقوف' | 'منقول' | 'متخرج' | 'غير مقيد' | 'غير نشط';
export type Gender = 'ذكر' | 'أنثى';

export type EnrollmentStatus = 
  | 'نشط' 
  | 'مرقى' 
  | 'معيد' 
  | 'منقول' 
  | 'متخرج' 
  | 'موقوف' 
  | 'غير مستمر';

export interface StudentEnrollment {
  id: string; // "ENR-STU001-2026-2027"
  studentId: string; // "STU-000001" (Internal Fixed ID)
  studentCode?: string;
  studentName?: string;
  academicYearId: string; // "AY-2026-2027"
  academicYearName: string; // "2026/2027"
  termId?: string;
  gradeId?: string;
  grade: string; // "الصف الأول الثانوي"
  classroomId?: string;
  classroom: string; // "1/1"
  section?: string;
  stage?: string;
  enrollmentStatus?: EnrollmentStatus;
  status?: string;
  promotionStatus?: 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED_OUT' | string;
  promotionNotes?: string;
  enrollmentDate: string;
  exitDate?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TransferType = 
  | 'نقل فصل' 
  | 'ترقية' 
  | 'إعادة صف' 
  | 'تحويل مدرسة' 
  | 'عودة' 
  | 'تغيير إداري';

export interface StudentTransferHistory {
  id: string; // "TRF-2026-0001"
  studentId: string;
  studentCode?: string;
  studentName?: string;
  academicYearId: string;
  fromGrade: string;
  fromClassroom: string;
  toGrade: string;
  toClassroom: string;
  transferType: TransferType;
  reason: string;
  transferDate: string;
  performedBy?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface PromotionRule {
  id: string;
  sourceGrade?: string;
  fromGrade?: string;
  targetGrade?: string;
  toGrade?: string;
  ruleType?: 'AUTOMATIC_ALL' | 'MANUAL_SELECTION' | 'CONDITION_BASED' | string;
  isGraduation?: boolean;
  defaultAction?: 'ترقية للصف التالي' | 'إعادة نفس الصف' | 'تخرج' | 'نقل' | 'موقوف' | string;
  minAttendancePercentage?: number;
  minBehaviorScore?: number;
  isActive: boolean;
}

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
  id: string; // Fixed immutable internal reference (e.g. STU-000001)
  studentId?: string; // Explicit alias for fixed ID
  studentCode: string; // Current school code (e.g. 2026-00154)
  schoolStudentCode?: string;
  name: string; // اسم الطالب رباعي
  nationalId?: string; // الرقم القومي
  gender: Gender;
  birthDate?: string; // YYYY-MM-DD
  stage?: string; // المرحلة (ثانوي / إعدادي / ابتدائي)
  stageId?: string;
  grade: string; // الصف الدراسي (الصف الأول الثانوي...)
  gradeId?: string;
  gradeName?: string;
  classroom: string; // رقم الفصل أو اسم الفصل (1 أو فصل 1 أو 1/1)
  classroomId?: string;
  classroomNumber?: string;
  section?: string;
  academicYear?: string; // العام الدراسي (2025/2026)
  academicYearId?: string;
  status: StudentStatus;
  enrollmentDate?: string; // تاريخ الالتحاق
  phone?: string;
  
  // بيانات ولي الأمر
  parentId?: string; // معرف حساب ولي الأمر إن وجد
  parentName?: string;
  relationship?: string; // أب، أم، وصي
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  
  initialBehaviorScore?: number; // درجة السلوك الافتراضية
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* =========================================================================
 * 2. حضور وغياب الطلاب (School Attendance & Class Attendance Separation)
 * ========================================================================= */
export type AttendanceDayStatus = 'Open' | 'UnderReview' | 'Approved' | 'Locked';

export interface AttendanceDay {
  id: string; // "DAY-2026-10-13" or "DAY-2026-10-13-AY1"
  date: string; // YYYY-MM-DD
  academicYearId: string;
  academicYearName?: string;
  termId?: string;
  termName?: string;
  dayName: string;
  status: AttendanceDayStatus;
  totalStudentsCount: number;
  recordedCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount?: number;
  unrecordedCount: number;
  openedAt?: string;
  openedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  lockedBy?: string;
  lockedAt?: string;
  lockNotes?: string;
  version?: number;
}

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
  | 'عطلة'
  | string;

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  studentCode?: string;
  studentName: string;
  enrollmentId?: string;
  academicYearId?: string;
  academicYearName?: string;
  termId?: string;
  termName?: string;
  stage: string;
  grade: string;
  gradeId?: string;
  classroom: string;
  classroomId?: string;
  date: string; // YYYY-MM-DD
  dayName: string;
  status: StudentAttendanceStatus;
  statusId?: string;
  checkInTime?: string; // HH:mm
  checkOutTime?: string; // HH:mm
  lateMinutes?: number;
  excused?: boolean;
  isExcused?: boolean;
  absenceReason?: string;
  absenceReasonId?: string;
  absenceReasonText?: string;
  absenceCategory?: string;
  notes?: string;
  source?: 'Manual' | 'Fingerprint' | 'Barcode' | 'TeacherApp' | 'AutoSystem';
  recordedBy?: string;
  recordedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  lockedBy?: string;
  lockedAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  version?: number;
  isArchived?: boolean;
}

export type StudentSchoolAttendance = StudentAttendanceRecord;
export type SchoolAttendanceRecord = StudentAttendanceRecord;

export interface ClassAttendanceRecord {
  id: string; // "ATT-CLS-STU001-2026-10-13-P3"
  studentId: string;
  studentCode?: string;
  studentName?: string;
  enrollmentId?: string;
  scheduleItemId: string;
  lessonInstanceId?: string;
  academicYearId?: string;
  termId?: string;
  date: string; // YYYY-MM-DD
  periodId?: number;
  periodNumber?: number;
  subjectId?: string;
  subject: string;
  teacherId?: string;
  teacherName: string;
  grade: string;
  classroom: string;
  classroomId?: string;
  subjectName?: string;
  status: 'حاضر' | 'غائب' | 'متأخر' | 'مأذون' | 'خرج أثناء الحصة' | string;
  statusId?: string;
  lateMinutes?: number;
  notes?: string;
  mismatchFlag?: 'NONE' | 'SCHOOL_PRESENT_CLASS_ABSENT' | 'SCHOOL_ABSENT_CLASS_PRESENT';
  recordedBy?: string;
  recordedAt?: string;
  takenBy?: string;
  takenAt?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
}

export type ClassAttendance = ClassAttendanceRecord;

export interface AttendanceException {
  id: string;
  date: string;
  academicYearId?: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  grade: string;
  classroom: string;
  type:
    | 'MISMATCH_PRESENT_ABSENT'
    | 'MISMATCH_ABSENT_PRESENT'
    | 'UNRECORDED_SCHOOL'
    | 'REPEAT_UNEXCUSED_ABSENCE'
    | 'EXCESSIVE_LATENESS'
    | 'SCHOOL_ABSENT_CLASS_PRESENT'
    | 'SCHOOL_PRESENT_CLASS_ABSENT'
    | 'CLASS_TRUANCY';
  severity: 'WARNING' | 'ERROR' | 'CRITICAL';
  description: string;
  periodNumber?: number;
  subject?: string;
  teacherName?: string;
  schoolStatus?: string;
  classStatus?: string;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

/* =========================================================================
 * 2.5 التواصل مع ولي الأمر (Parent Communication Log)
 * ========================================================================= */
export type CommunicationType = 
  | 'مكالمة هاتفية' 
  | 'مقابلة شخصية' 
  | 'رسالة SMS' 
  | 'WhatsApp' 
  | 'بريد إلكتروني' 
  | 'اجتماع رسمي' 
  | 'أخرى';

export interface ParentCommunicationLog {
  id: string;
  studentId: string;
  studentName?: string;
  parentId?: string;
  parentName: string;
  communicationType: CommunicationType;
  type?: string;
  date: string;
  time?: string;
  subject?: string;
  reason: string;
  details: string;
  result: string;
  nextAction?: string;
  followUpDate?: string;
  recordedBy?: string;
  performedBy?: string;
  performedByName?: string;
  createdAt: string;
  updatedAt?: string;
}

/* =========================================================================
 * 3. السلوك، الحالات والمخالفات المدرسية (Behavior Cases & Positive Points)
 * ========================================================================= */
export type BehaviorCaseStatus = 
  | 'New' 
  | 'Under Review' 
  | 'Parent Contact Required' 
  | 'Parent Contacted' 
  | 'Action Required' 
  | 'Monitoring' 
  | 'Resolved' 
  | 'Closed'
  | 'CLOSED'
  | string;

export interface BehaviorCase {
  id: string; // "CASE-B102"
  caseCode: string; // "B-102"
  caseNumber?: string;
  studentId: string;
  studentName: string;
  academicYearId?: string;
  termId?: string;
  grade: string;
  classroom: string;
  openedDate: string;
  openedBy?: string;
  status: BehaviorCaseStatus;
  severity: string;
  assignedTo: string;
  assignedToName: string;
  specialistName?: string;
  parentContacted?: boolean;
  summary: string;
  resolution?: string;
  resolutionSummary?: string;
  violationIds: string[];
  closedDate?: string;
  closedAt?: string;
  closedBy?: string;
  followups?: BehaviorFollowup[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BehaviorFollowup {
  id: string;
  caseId: string;
  date: string;
  time?: string;
  actionType: string;
  summary?: string;
  notes: string;
  performedBy: string;
  performedByName?: string;
  nextAction?: string;
  followUpDate?: string;
  status?: string;
  createdAt: string;
}

export interface PositiveBehaviorType {
  id: string;
  name: string;
  category: string;
  points: number; // +5, +10
  description?: string;
  icon?: string;
  isActive: boolean;
  sortOrder?: number;
}

export interface BehaviorScoreLedger {
  id: string;
  studentId: string;
  studentName?: string;
  type: 'credit' | 'debit' | 'POSITIVE' | 'RESTORE' | 'VIOLATION' | 'ADJUSTMENT' | string;
  sourceType: 'positive_behavior' | 'violation' | 'adjustment' | 'annual_reset' | string;
  sourceId?: string;
  points: number;
  pointsAwarded?: number;
  grade?: string;
  classroom?: string;
  balanceAfter: number;
  academicYearId?: string;
  date: string;
  reason: string;
  createdBy?: string;
  recordedBy?: string;
  createdAt: string;
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
  degree?: string; // alias for severity
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
 * 4. الجدول الدراسي والمحتوى التعليمي (Schedule & Lesson Content Engine)
 * ========================================================================= */
export interface TeacherProfile {
  id: string; // TP-EMP001
  employeeId: string;
  userId?: string;
  teacherCode?: string;
  specialization?: string;
  assignedGradeIds?: string[];
  assignedSubjectIds?: string[];
  maxWeeklyPeriods?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  academicYearId: string;
  gradeId?: string;
  isActive: boolean;
  createdAt?: string;
}

export type ScheduleItemStatus = 'Active' | 'Draft' | 'Suspended' | 'Archived' | 'Published';

export interface ScheduleItem {
  id: string;
  academicYear?: string;
  academicYearId?: string;
  term?: string; // الترم الأول / الترم الثاني
  termId?: string;
  stage?: string;
  stageId?: string;
  grade: string;
  gradeId?: string;
  classroom: string;
  classroomId?: string;
  dayName?: string; // الأحد، الإثنين...
  dayOfWeek?: string; // 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس' | string
  periodNumber: number; // رقم الحصة (1, 2, 3...)
  periodId?: number | string;
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  subject: string; // الرياضيات، اللغة العربية...
  subjectId?: string;
  teacherId: string; // Teacher / Employee ID
  teacherName?: string;
  roomNumber?: string;
  room?: string;
  roomId?: string;
  locationId?: string;
  isSubstituted?: boolean;
  substituteTeacherName?: string;
  isCancelled?: boolean;
  validFrom?: string; // YYYY-MM-DD
  validTo?: string; // YYYY-MM-DD
  status?: ScheduleItemStatus;
  isActive?: boolean;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  version?: number;
}

export type ClassPeriodSchedule = ScheduleItem;

export type SubstitutionStatus = 'Pending' | 'Approved' | 'Active' | 'Completed' | 'Cancelled';

export interface ScheduleSubstitution {
  id: string; // "SUB-2026-10-13-SCH01"
  academicYearId?: string;
  termId?: string;
  date: string; // YYYY-MM-DD
  scheduleItemId: string;
  lessonInstanceId?: string;
  periodNumber: number;
  dayOfWeek: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  subjectId?: string;
  subject: string;
  gradeId?: string;
  grade: string;
  classroomId?: string;
  classroom: string;
  reasonId?: string;
  reason: string;
  reasonText?: string;
  notes?: string;
  status: SubstitutionStatus | string;
  assignedBy?: string;
  createdBy?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  updatedAt?: string;
}

export type LessonDeliveryStatus = 
  | 'Scheduled' 
  | 'InProgress'
  | 'Delivered' 
  | 'PartiallyDelivered'
  | 'Partially Delivered' 
  | 'Cancelled' 
  | 'Substituted' 
  | 'NotRecorded'
  | 'Not Recorded';

export interface LessonInstance {
  id: string;
  scheduleItemId: string;
  academicYearId?: string;
  academicYear?: string;
  termId?: string;
  term?: string;
  date: string; // YYYY-MM-DD
  periodNumber: number;
  periodId?: number | string;
  gradeId?: string;
  grade: string;
  classroomId?: string;
  classroom: string;
  subjectId?: string;
  subject: string;
  plannedTeacherId: string;
  plannedTeacherName?: string;
  actualTeacherId: string;
  actualTeacherName?: string;
  teacherId?: string; // compatibility
  teacherName?: string; // compatibility
  substitutionId?: string;
  deliveryStatus: LessonDeliveryStatus;
  status?: LessonDeliveryStatus;
  cancelReason?: string;
  partialReason?: string;
  startedAt?: string;
  completedAt?: string;
  recordedBy?: string;
  recordedAt?: string;
  lessonTitle?: string;
  lessonDescription?: string;
  bookPages?: string;
  homework?: string;
  links?: LessonLink[];
  createdAt?: string;
  updatedAt?: string;
}

export type ScheduleConflictType = 
  | 'TEACHER_DOUBLE_BOOKING' 
  | 'CLASSROOM_DOUBLE_BOOKING' 
  | 'ROOM_DOUBLE_BOOKING' 
  | 'MAX_SUBJECT_EXCEEDED'
  | 'SUBSTITUTE_TEACHER_CONFLICT';

export interface ScheduleConflict {
  type: ScheduleConflictType;
  severity: 'BLOCK' | 'WARNING';
  message: string;
  conflictingItemIds: string[];
  dayName: string;
  periodNumber: number;
}

export interface ScheduleConflictResult {
  hasConflicts: boolean;
  hasBlockingConflicts: boolean;
  hasWarnings: boolean;
  conflicts: ScheduleConflict[];
  messages: string[];
}

export interface LocationItem {
  id: string;
  name: string; // الفصل، المعمل، الملعب، الفناء، الممر، البوابة، الحافلة
  code?: string;
  type?: 'classroom' | 'lab' | 'sports' | 'outdoor' | 'bus' | 'other' | 'معمل' | 'ملعب' | 'مسرح' | 'مكتبة' | string;
  capacity?: number;
  isActive: boolean;
}

export interface ConflictRuleConfig {
  blockTeacherDoubleBooking?: boolean;
  preventTeacherDoubleBooking?: boolean;
  blockClassroomDoubleBooking?: boolean;
  preventRoomDoubleBooking?: boolean;
  preventStudentGroupDoubleBooking?: boolean;
  blockRoomDoubleBooking?: boolean;
  warnMaxDailySubjectLimit?: boolean;
  maxDailySubjectLimit?: number;
  maxTeacherDailyPeriods?: number;
  maxConsecutiveTeacherPeriods?: number;
  warnOnSubjectRepetitionPerDay?: boolean;
  warnOnHeavySubjectsInEndPeriods?: boolean;
  warnDuplicateSubjectPerDay?: boolean;
  maxSubjectPeriodsPerDay?: number;
}

export interface LessonLink {
  id: string;
  title: string;
  url: string;
  type: 'drive' | 'youtube' | 'pdf' | 'presentation' | 'assignment' | 'teams' | 'other';
}

export type LessonResourceType = 
  | 'PDF' 
  | 'Google Drive' 
  | 'YouTube' 
  | 'Presentation' 
  | 'Website' 
  | 'Assignment' 
  | 'Other';

export interface LessonResource {
  id: string;
  lessonContentId?: string;
  lessonInstanceId?: string;
  homeworkId?: string;
  title: string;
  resourceType: LessonResourceType | string;
  url: string;
  description?: string;
  displayOrder?: number;
  isVisibleToParent: boolean;
  isVisibleToStudent: boolean;
  createdAt: string;
}

export type LessonContentStatus = 'Draft' | 'Published' | 'Archived';

export interface LessonContent {
  id: string;
  lessonInstanceId?: string;
  scheduleItemId?: string;
  scheduleId?: string;
  academicYearId?: string;
  termId?: string;
  date: string; // YYYY-MM-DD
  periodNumber: number;
  teacherId: string;
  teacherName: string;
  subjectId?: string;
  subject: string;
  gradeId?: string;
  grade: string;
  classroomId?: string;
  classroom: string;
  title?: string;
  lessonTitle?: string; // alias
  lessonUnit?: string;
  lessonChapter?: string;
  summary?: string;
  summaryCovered?: string; // alias
  lessonDescription?: string;
  bookPages?: string;
  bookPageFrom?: number;
  bookPageTo?: number;
  learningObjectives?: string;
  notes?: string;
  internalNotes?: string;
  parentVisibleSummary?: string;
  isVisibleToParent?: boolean;
  hasHomework?: boolean;
  homework?: string;
  homeworkTitle?: string;
  homeworkDescription?: string;
  homeworkDueDate?: string;
  homeworkDueDays?: number;
  homeworkId?: string;
  status?: LessonContentStatus;
  resources?: LessonResource[];
  links?: LessonLink[];
  deliveryStatus?: LessonDeliveryStatus;
  publishedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  version?: number;
}

export type HomeworkStatus = 'Draft' | 'Published' | 'Archived';
export type HomeworkSubmissionStatus = 'Assigned' | 'Submitted' | 'Graded' | 'Late' | 'Missing';

export interface Homework {
  id: string;
  lessonContentId?: string;
  lessonInstanceId?: string;
  scheduleItemId?: string;
  academicYearId?: string;
  termId?: string;
  teacherId: string;
  teacherName: string;
  subjectId?: string;
  subject: string;
  gradeId?: string;
  grade: string;
  classroomId?: string;
  classroom: string;
  targetStudentId?: string;
  title: string;
  description: string;
  instructions?: string;
  assignedDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // "23:59"
  maxScore?: number;
  bookPages?: string;
  questions?: string;
  link?: string;
  links?: LessonLink[];
  attachmentUrl?: string;
  resources?: LessonResource[];
  status?: HomeworkStatus;
  isVisibleToParent?: boolean;
  isVisibleToStudent?: boolean;
  isArchived?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
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
  bonuses?: number;
  overtimeHours: number;
  overtimeAmount: number;
  totalGross: number; // إجمالي المستحقات
  grossSalary?: number; // alias for totalGross
  
  // الاستقطاعات
  absentDaysCount: number;
  absenceDeductions: number;
  absenceDeduction?: number;
  totalLateMinutes: number;
  lateDeductions: number;
  lateDeduction?: number;
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

export interface JobTitleItem {
  id: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  isTeachingStaff: boolean;
  description?: string;
  isActive: boolean;
}

export interface GradeItem {
  id: string;
  name: string;
  shortName: string;
  order: number;
  isActive: boolean;
  academicStage: string;
  stageId?: string;
}

export interface ClassroomItem {
  id: string;
  gradeId: string;
  gradeName?: string;
  classroomNumber: string;
  displayName: string;
  capacity: number;
  academicYear: string;
  isActive: boolean;
}

export interface SubjectItem {
  id: string;
  name: string;
  shortName: string;
  color?: string;
  assignedGrades: string[]; // grade IDs or Grade Names
  weeklyPeriods?: number;
  isActive: boolean;
}

export interface SchedulePeriodItem {
  periodNumber: number;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBreak?: boolean;
}

export interface ScheduleBreakItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ScheduleConfig {
  studyDays: string[]; // ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس"]
  periodCount: number; // 7 or 8
  dayStartTime: string; // "08:00"
  dayEndTime: string; // "14:30"
  defaultPeriodDurationMinutes: number; // 45
  periods: SchedulePeriodItem[];
  breakTimes: ScheduleBreakItem[];
  nonStudyDays: string[]; // ["الجمعة", "السبت"]
  periodTimes?: Array<{ startTime: string; endTime: string }>;
}

export interface StudentAttendanceStatusConfig {
  id: string;
  name: string;
  shortCode: string; // e.g. "ح", "ت", "غ", "ع", "م", "هـ"
  color: string;
  textColor?: string;
  badgeBg?: string;
  countsAsPresent: boolean;
  countsAsAbsent: boolean;
  isExcused?: boolean;
  requiresReason: boolean;
  requiresTime: boolean;
  displayOrder?: number;
  scope?: 'School' | 'Class' | 'Both';
  isActive: boolean;
}

export interface AbsenceReasonItem {
  id: string;
  name: string;
  category: 'مرضي' | 'عائلي' | 'طارئ' | 'إذن مسبق' | 'أخرى';
  isExcused: boolean;
  requiresDocument?: boolean;
  isActive: boolean;
}

export interface StudentAttendanceRules {
  startTime: string; // "07:30" or "08:00"
  gracePeriodMinutes: number; // 15
  lateThresholdMinutes: number; // 30
  lateCalculationMode?: 'from_start' | 'after_grace'; // from_start (e.g. 08:16 -> 16m) or after_grace (08:16 -> 1m)
  allowManualTime?: boolean;
  allowRetroactiveEntry?: boolean;
  maxRetroactiveDays?: number;
  allowFutureEntry?: boolean;
  autoSuggestStatus?: boolean;
  requireAbsenceReason?: boolean;
  missingRecordOnApproval?: 'block' | 'convertToAbsent' | 'allowNotRecorded';
  allowTeacherTakeAttendance: boolean;
  allowTeacherEditAttendance: boolean;
  requireStudentAffairsApproval: boolean;
  allowPastDaysEdit: boolean;
  maxPastDaysEditLimit: number; // 3 days
  absenceWarningThresholdDays: number; // 5 days
  lateWarningThresholdCount: number; // 3 times
}

export interface TeacherAttendanceRules {
  workStartTime: string; // "07:30"
  workEndTime: string; // "14:30"
  gracePeriodMinutes: number; // 15
  standardDailyHours: number; // 7
  workDays: string[];
  weekendDays: string[];
  lateDeductionMultiplier: number; // 1.0
  earlyLeaveDeductionMultiplier: number; // 1.0
  overtimeRate: number; // 1.5
  allowRetroactiveAttendance: boolean;
  maxRetroactiveDays: number; // 2
}

export interface BehaviorLevelItem {
  id: string;
  name: string;
  minPercentage: number;
  maxPercentage: number;
  color: string;
  badgeColor?: string;
  description?: string;
  actionRequired?: string;
}

export interface AlertRuleItem {
  id: string;
  title: string;
  category: 'student_absence' | 'student_late' | 'behavior_points' | 'teacher_lesson_delay' | 'teacher_late' | 'payroll_closing';
  thresholdValue: number;
  unitText: string;
  targetRoles: UserRole[];
  isActive: boolean;
  messageTemplate: string;
}

export interface LeaveTypeConfig {
  id: string;
  name: string;
  isPaid: boolean;
  deductFromBalance: boolean;
  defaultAnnualQuota: number;
  requiresApproval: boolean;
  color?: string;
  isActive: boolean;
}

export interface PermissionTypeConfig {
  id: string;
  name: string;
  maxHoursPerMonth: number;
  isPaid: boolean;
  requiresApproval: boolean;
  isActive: boolean;
}

export interface AllowanceTypeItem {
  id: string;
  name: string;
  defaultAmount: number;
  isTaxable: boolean;
  isActive: boolean;
}

export interface DeductionTypeItem {
  id: string;
  name: string;
  defaultAmount: number;
  isPercentage: boolean;
  isActive: boolean;
}

export interface ParentPortalSettings {
  showAttendance: boolean;
  showCheckInTime: boolean;
  showCheckOutTime: boolean;
  showLateMinutes: boolean;
  showAttendanceRate: boolean;
  showAbsenceReason: boolean;
  showClassAttendance: boolean;
  showBehavior: boolean;
  showBehaviorPoints: boolean;
  showBehaviorScore: boolean;
  showPositiveBehavior: boolean;
  showBehaviorCaseStatus: boolean;
  showViolationDescription: boolean;
  showTeacherName: boolean;
  showSubstituteTeacherName: boolean;
  showLessonContent: boolean;
  showHomework: boolean;
  showLearningLinks: boolean;
  showWeeklySchedule: boolean;
  homeworkUpcomingDays: number;
  enableNotifications: boolean;
  notifyOnAbsence: boolean;
  notifyOnLate: boolean;
  notifyOnHomework: boolean;
  notifyOnBehaviorViolation: boolean;
  notifyOnPositiveBehavior: boolean;
  notifyOnScheduleSubstitution: boolean;
}

export interface TeacherPortalSettings {
  allowTakeAttendance: boolean;
  allowEditAttendance: boolean;
  editTimeLimitHours: number;
  allowRecordViolation: boolean;
  allowViewBehaviorHistory: boolean;
  allowAddLessonAfterPeriod: boolean;
  allowEditPastLessons: boolean;
}

export interface SocialSpecialistSettings {
  canCreateViolation: boolean;
  canEditViolation: boolean;
  canDeleteViolation: boolean;
  canAdjustPoints: boolean;
  canManageViolationCatalog: boolean;
  canViewStudentAttendance: boolean;
  canAddFollowUpNotes: boolean;
}

export interface ImportSettings {
  requireStudentId: boolean;
  requireNationalId: boolean;
  requireParentPhone: boolean;
  duplicateDetectionMethod: 'studentCode' | 'nationalId' | 'nameAndGrade';
  autoUpdateExisting: boolean;
}

export interface ExportSettings {
  showLogo: boolean;
  schoolTitle: string;
  subHeader: string;
  footerText: string;
  paperSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  showPrintDate: boolean;
  showPrintedBy: boolean;
  tableFormat: 'compact' | 'standard' | 'relaxed';
  schedulePdf: {
    orientation: 'portrait' | 'landscape';
    showTeacherName: boolean;
    showTimes: boolean;
    showRoomNumber: boolean;
    showAcademicYear: boolean;
  };
}

export interface DashboardSettings {
  roleWidgets: Record<
    string,
    {
      showAttendanceSummary: boolean;
      showLateList: boolean;
      showBehaviorSummary: boolean;
      showSchedule: boolean;
      showRecentLessons: boolean;
      showPayrollSummary: boolean;
      showQuickActions: boolean;
    }
  >;
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

export interface FeeCategoryItem {
  id: string;
  name: string;
  defaultAmount: number;
  gradeIds?: string[];
  isMandatory: boolean;
  frequency?: 'Annual' | 'Semester' | 'Monthly' | 'OneTime';
  dueDate?: string;
  description?: string;
  isActive: boolean;
  isRecurring?: boolean;
  allowInstallments?: boolean;
  isRefundable?: boolean;
}

export interface PaymentInstallmentPlan {
  id: string;
  name: string;
  installmentsCount: number;
  distributionPercentages: number[];
  dueMonths: string[];
  latePenaltyPercentage: number;
  discountEarlyPaymentPercentage: number;
  isActive: boolean;
}

export interface PaymentMethodConfig {
  id: string;
  name: string;
  type?: string;
  accountNumber?: string;
  bankName?: string;
  serviceFeePercentage?: number;
  requiresReferenceNumber?: boolean;
  requiresTransactionNumber?: boolean;
  isActive: boolean;
}

export type PayrollRulesConfig = PayrollRule;
export type PeriodSlot = SchedulePeriodItem;
export type ScheduleBreakTime = ScheduleBreakItem;

export interface SystemSettings {
  // المدرسة والهوية
  schoolName: string;
  shortSchoolName?: string;
  companyName?: string; // Compatibility
  schoolAddress?: string;
  schoolPhone?: string;
  schoolPhones?: string[];
  schoolEmail?: string;
  schoolWebsite?: string;
  schoolLogo?: string;
  logoUrl?: string;
  schoolCode?: string;
  currentSemester?: string;
  currentAcademicYear: string; // "2025/2026"
  currentTerm: string; // "الترم الأول"
  academicYearStartDate?: string;
  academicYearEndDate?: string;
  country: string; // "مصر"
  currency: string; // "ج.م"
  currencyLabel?: string;
  timeZone: string; // "Africa/Cairo"
  defaultLanguage: string; // "العربية"
  dateFormat?: string; // "YYYY-MM-DD"
  
  // الحضور المصري
  officialStartTime: string; // "07:30"
  officialEndTime: string; // "14:30"
  gracePeriodMinutes: number; // 15
  standardDailyHours: number; // 7
  weekendDays: string[]; // ["الجمعة", "السبت"]
  lateCalculationMode?: 'from_start' | 'after_grace'; // Mode A (default): from official start; Mode B: after grace period
  
  // الإجازات
  annualLeaveAllowance: number;
  sickLeaveAllowance: number;
  emergencyLeaveAllowance: number;
  
  // الهيكل المدرسي والقوائم الديناميكية
  stages: AcademicStage[];
  grades: GradeItem[];
  classrooms: ClassroomItem[];
  subjects: SubjectItem[];
  departments: DepartmentItem[];
  jobTitles: JobTitleItem[];
  holidays: SchoolHoliday[];
  academicYears?: AcademicYear[];
  promotionRules?: PromotionRule[];
  positiveBehaviorTypes?: PositiveBehaviorType[];
  locations?: LocationItem[];
  conflictRules?: ConflictRuleConfig;
  attendanceLockPolicy?: {
    allowAutoAbsentOnApproval: boolean;
    allowTeacherEditAfterLockWithPermission: boolean;
    maxDaysRetroactiveApproval: number;
  };
  
  // الحضور والسلوك
  scheduleConfig: ScheduleConfig;
  studentAttendanceStatuses: StudentAttendanceStatusConfig[];
  studentAttendanceRules: StudentAttendanceRules;
  teacherAttendanceRules: TeacherAttendanceRules;
  behaviorScoreRules: BehaviorScoreRule;
  behaviorLevels: BehaviorLevelItem[];
  alertRules: AlertRuleItem[];
  
  // الإجازات والأذونات
  leaveTypes: LeaveTypeConfig[];
  permissionTypes: PermissionTypeConfig[];
  
  // المرتبات والرسوم والأقساط
  payrollRules: PayrollRule;
  allowanceTypes: AllowanceTypeItem[];
  deductionTypes: DeductionTypeItem[];
  feeCategories?: FeeCategoryItem[];
  installmentPlans?: PaymentInstallmentPlan[];
  paymentMethods?: PaymentMethodConfig[];
  
  // بوابات المستخدمين
  parentPortalSettings: ParentPortalSettings;
  teacherPortalSettings: TeacherPortalSettings;
  socialSpecialistSettings: SocialSpecialistSettings;
  
  // الاستيراد والتصدير
  importSettings: ImportSettings;
  exportSettings: ExportSettings;
  dashboardSettings?: DashboardSettings;
  
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
  
  // الإصدار والمزامنة
  configVersion: string;
  lastConfigUpdate: string;
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
    | 'CLASS_ATTENDANCE'
    | 'ATTENDANCE_DAY'
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

// Re-export extended modern entities
export * from './types_extended';
