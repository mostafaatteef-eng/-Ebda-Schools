import {
  AbsenceReasonItem,
  AcademicStage,
  AcademicYear,
  AlertRuleItem,
  AllowanceTypeItem,
  AttendanceRecord,
  AuditLogEntry,
  BehaviorCase,
  BehaviorLevelItem,
  BehaviorScoreLedger,
  BehaviorScoreRule,
  BehaviorType,
  ClassAttendanceRecord,
  ClassroomItem,
  ConflictRuleConfig,
  DashboardSettings,
  DeductionTypeItem,
  DepartmentItem,
  Employee,
  ExportSettings,
  FeeCategoryItem,
  GradeItem,
  ImportSettings,
  JobTitleItem,
  LeaveRecord,
  LeaveTypeConfig,
  LessonInstance,
  LocationItem,
  ParentCommunicationLog,
  ParentPortalSettings,
  PaymentInstallmentPlan,
  PaymentMethodConfig,
  PayrollRule,
  PermissionMatrix,
  PermissionTypeConfig,
  PositiveBehaviorType,
  PromotionRule,
  ScheduleConfig,
  ScheduleSubstitution,
  SchoolHoliday,
  SocialSpecialistSettings,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceRules,
  StudentAttendanceStatusConfig,
  StudentEnrollment,
  StudentTransferHistory,
  SubjectItem,
  SystemSettings,
  TeacherAttendanceRules,
  TeacherPortalSettings,
  User,
  UserRole,
} from '../types';

export const DEFAULT_PERMISSION_MATRIX: Record<UserRole, PermissionMatrix> = {
  Admin: {
    canViewStudents: true,
    canEditStudents: true,
    canImportStudents: true,
    canTakeStudentAttendance: true,
    canEditStudentAttendance: true,
    canCreateViolation: true,
    canApproveViolation: true,
    canViewPayroll: true,
    canProcessPayroll: true,
    canApprovePayroll: true,
    canManageSchedule: true,
    canAddLessonContent: true,
    canViewParentPortal: true,
    canManageSettings: true,
    canViewAuditLogs: true,
  },
  HR: {
    canViewStudents: true,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: true,
    canEditStudentAttendance: false,
    canCreateViolation: false,
    canApproveViolation: false,
    canViewPayroll: true,
    canProcessPayroll: true,
    canApprovePayroll: true,
    canManageSchedule: false,
    canAddLessonContent: false,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: true,
  },
  Supervisor: {
    canViewStudents: true,
    canEditStudents: true,
    canImportStudents: false,
    canTakeStudentAttendance: true,
    canEditStudentAttendance: true,
    canCreateViolation: true,
    canApproveViolation: true,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: true,
    canAddLessonContent: true,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  Teacher: {
    canViewStudents: true,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: true,
    canEditStudentAttendance: true,
    canCreateViolation: true,
    canApproveViolation: false,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: true,
    canAddLessonContent: true,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  StudentAffairs: {
    canViewStudents: true,
    canEditStudents: true,
    canImportStudents: true,
    canTakeStudentAttendance: true,
    canEditStudentAttendance: true,
    canCreateViolation: true,
    canApproveViolation: false,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: true,
    canAddLessonContent: false,
    canViewParentPortal: true,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  TeacherAffairs: {
    canViewStudents: false,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: false,
    canEditStudentAttendance: false,
    canCreateViolation: false,
    canApproveViolation: false,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: true,
    canAddLessonContent: false,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  SocialSpecialist: {
    canViewStudents: true,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: false,
    canEditStudentAttendance: false,
    canCreateViolation: true,
    canApproveViolation: true,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: false,
    canAddLessonContent: false,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  BehaviorOfficer: {
    canViewStudents: true,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: false,
    canEditStudentAttendance: false,
    canCreateViolation: true,
    canApproveViolation: true,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: false,
    canAddLessonContent: false,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  PayrollOfficer: {
    canViewStudents: false,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: false,
    canEditStudentAttendance: false,
    canCreateViolation: false,
    canApproveViolation: false,
    canViewPayroll: true,
    canProcessPayroll: true,
    canApprovePayroll: false,
    canManageSchedule: false,
    canAddLessonContent: false,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  Parent: {
    canViewStudents: false, // Access limited to their own children via Portal
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: false,
    canEditStudentAttendance: false,
    canCreateViolation: false,
    canApproveViolation: false,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: false,
    canAddLessonContent: false,
    canViewParentPortal: true,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  Employee: {
    canViewStudents: false,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: false,
    canEditStudentAttendance: false,
    canCreateViolation: false,
    canApproveViolation: false,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: false,
    canAddLessonContent: false,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
  Viewer: {
    canViewStudents: true,
    canEditStudents: false,
    canImportStudents: false,
    canTakeStudentAttendance: false,
    canEditStudentAttendance: false,
    canCreateViolation: false,
    canApproveViolation: false,
    canViewPayroll: false,
    canProcessPayroll: false,
    canApprovePayroll: false,
    canManageSchedule: true,
    canAddLessonContent: false,
    canViewParentPortal: false,
    canManageSettings: false,
    canViewAuditLogs: false,
  },
};

export const DEFAULT_DEPARTMENTS: DepartmentItem[] = [
  { id: 'DEP001', name: 'هيئة التدريس والتعليم', managerName: 'الناظر الأكاديمي', description: 'المعلمون والمعلمات لكافة التخصصات', isActive: true },
  { id: 'DEP002', name: 'شؤون الطلاب والتسجيل', managerName: 'مسؤول شؤون الطلاب', description: 'ملفات الطلاب والتسجيل والتحويلات', isActive: true },
  { id: 'DEP003', name: 'الإدارة العامة والتوجيه', managerName: 'مدير المدرسة', description: 'القيادة الإدارية والإشراف العام', isActive: true },
  { id: 'DEP004', name: 'الموارد البشرية وشؤون العاملين', managerName: 'مدير الموارد البشرية', description: 'الحضور، المرتبات، الإجازات للموظفين والمعلمين', isActive: true },
  { id: 'DEP005', name: 'الإشراف السلوكي والتربوي', managerName: 'الأخصائي الاجتماعي', description: 'الانضباط المدرسي والمخالفات ومتابعة أولياء الأمور', isActive: true },
  { id: 'DEP006', name: 'الشؤون المالية والحسابات', managerName: 'المحاسب المالي', description: 'المرتبات والمصروفات المدرسية', isActive: true },
  { id: 'DEP007', name: 'الخدمات المعاونة والأمن', managerName: 'مشرف الخدمات', description: 'أمن المدرسة، النظافة، والصيانة', isActive: true },
];

export const DEFAULT_JOB_TITLES: JobTitleItem[] = [
  { id: 'JOB001', title: 'معلم أول لغة عربية', departmentId: 'DEP001', isTeachingStaff: true, isActive: true },
  { id: 'JOB002', title: 'معلم لغة إنجليزية', departmentId: 'DEP001', isTeachingStaff: true, isActive: true },
  { id: 'JOB003', title: 'معلم رياضيات', departmentId: 'DEP001', isTeachingStaff: true, isActive: true },
  { id: 'JOB004', title: 'معلم علوم / فيزياء', departmentId: 'DEP001', isTeachingStaff: true, isActive: true },
  { id: 'JOB005', title: 'معلم دراسات اجتماعية', departmentId: 'DEP001', isTeachingStaff: true, isActive: true },
  { id: 'JOB006', title: 'مسؤول شؤون طلاب', departmentId: 'DEP002', isTeachingStaff: false, isActive: true },
  { id: 'JOB007', title: 'أخصائي اجتماعي أول', departmentId: 'DEP005', isTeachingStaff: false, isActive: true },
  { id: 'JOB008', title: 'أخصائي نفسي وتربوي', departmentId: 'DEP005', isTeachingStaff: false, isActive: true },
  { id: 'JOB009', title: 'مدير مالي وإداري', departmentId: 'DEP006', isTeachingStaff: false, isActive: true },
  { id: 'JOB010', title: 'مسؤول موارد بشرية', departmentId: 'DEP004', isTeachingStaff: false, isActive: true },
  { id: 'JOB011', title: 'أمين معمل حاسب آلي', departmentId: 'DEP001', isTeachingStaff: false, isActive: true },
  { id: 'JOB012', title: 'مشرف أمن وسلامة', departmentId: 'DEP007', isTeachingStaff: false, isActive: true },
];

export const DEFAULT_GRADES: GradeItem[] = [
  { id: 'G_SEC_1', name: 'الصف الأول الثانوي', shortName: '1 ث', order: 1, isActive: true, academicStage: 'المرحلة الثانوية', stageId: 'STAGE_SEC' },
  { id: 'G_SEC_2', name: 'الصف الثاني الثانوي', shortName: '2 ث', order: 2, isActive: true, academicStage: 'المرحلة الثانوية', stageId: 'STAGE_SEC' },
  { id: 'G_SEC_3', name: 'الصف الثالث الثانوي', shortName: '3 ث', order: 3, isActive: true, academicStage: 'المرحلة الثانوية', stageId: 'STAGE_SEC' },
  { id: 'G_PREP_1', name: 'الصف الأول الإعدادي', shortName: '1 ع', order: 4, isActive: true, academicStage: 'المرحلة الإعدادية', stageId: 'STAGE_PREP' },
  { id: 'G_PREP_2', name: 'الصف الثاني الإعدادي', shortName: '2 ع', order: 5, isActive: true, academicStage: 'المرحلة الإعدادية', stageId: 'STAGE_PREP' },
  { id: 'G_PREP_3', name: 'الصف الثالث الإعدادي', shortName: '3 ع', order: 6, isActive: true, academicStage: 'المرحلة الإعدادية', stageId: 'STAGE_PREP' },
  { id: 'G_PRI_1', name: 'الصف الأول الابتدائي', shortName: '1 ب', order: 7, isActive: true, academicStage: 'المرحلة الابتدائية', stageId: 'STAGE_PRI' },
  { id: 'G_PRI_2', name: 'الصف الثاني الابتدائي', shortName: '2 ب', order: 8, isActive: true, academicStage: 'المرحلة الابتدائية', stageId: 'STAGE_PRI' },
  { id: 'G_PRI_3', name: 'الصف الثالث الابتدائي', shortName: '3 ب', order: 9, isActive: true, academicStage: 'المرحلة الابتدائية', stageId: 'STAGE_PRI' },
];

export const DEFAULT_CLASSROOMS: ClassroomItem[] = [
  { id: 'CLS_S1_1', gradeId: 'G_SEC_1', gradeName: 'الصف الأول الثانوي', classroomNumber: '1', displayName: 'الصف الأول الثانوي - فصل 1', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S1_2', gradeId: 'G_SEC_1', gradeName: 'الصف الأول الثانوي', classroomNumber: '2', displayName: 'الصف الأول الثانوي - فصل 2', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S1_3', gradeId: 'G_SEC_1', gradeName: 'الصف الأول الثانوي', classroomNumber: '3', displayName: 'الصف الأول الثانوي - فصل 3', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S1_4', gradeId: 'G_SEC_1', gradeName: 'الصف الأول الثانوي', classroomNumber: '4', displayName: 'الصف الأول الثانوي - فصل 4', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S2_1', gradeId: 'G_SEC_2', gradeName: 'الصف الثاني الثانوي', classroomNumber: '1', displayName: 'الصف الثاني الثانوي - فصل 1', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S2_2', gradeId: 'G_SEC_2', gradeName: 'الصف الثاني الثانوي', classroomNumber: '2', displayName: 'الصف الثاني الثانوي - فصل 2', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S2_3', gradeId: 'G_SEC_2', gradeName: 'الصف الثاني الثانوي', classroomNumber: '3', displayName: 'الصف الثاني الثانوي - فصل 3', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S3_1', gradeId: 'G_SEC_3', gradeName: 'الصف الثالث الثانوي', classroomNumber: '1', displayName: 'الصف الثالث الثانوي - فصل 1', capacity: 35, academicYear: '2025/2026', isActive: true },
  { id: 'CLS_S3_2', gradeId: 'G_SEC_3', gradeName: 'الصف الثالث الثانوي', classroomNumber: '2', displayName: 'الصف الثالث الثانوي - فصل 2', capacity: 35, academicYear: '2025/2026', isActive: true },
];

export const DEFAULT_SUBJECTS: SubjectItem[] = [
  { id: 'SUB001', name: 'اللغة العربية والخط', shortName: 'عربي', color: '#008e8b', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 5, isActive: true },
  { id: 'SUB002', name: 'اللغة الإنجليزية', shortName: 'English', color: '#2563eb', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 5, isActive: true },
  { id: 'SUB003', name: 'الرياضيات التطبيقية والبحته', shortName: 'رياضيات', color: '#7c3aed', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 6, isActive: true },
  { id: 'SUB004', name: 'الفيزياء والكيمياء', shortName: 'علوم/فيزياء', color: '#ea580c', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 4, isActive: true },
  { id: 'SUB005', name: 'الأحياء والجيولوجيا', shortName: 'أحياء', color: '#16a34a', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 3, isActive: true },
  { id: 'SUB006', name: 'التاريخ والجغرافيا', shortName: 'دراسات', color: '#ca8a04', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 3, isActive: true },
  { id: 'SUB007', name: 'الحاسب الآلي وتكنولوجيا المعلومات', shortName: 'حاسب آلي', color: '#0891b2', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 2, isActive: true },
  { id: 'SUB008', name: 'التربية الدينية والأخلاقية', shortName: 'تربية دينية', color: '#059669', assignedGrades: ['G_SEC_1', 'G_SEC_2', 'G_SEC_3'], weeklyPeriods: 2, isActive: true },
];

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  studyDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  periodCount: 7,
  dayStartTime: '08:00',
  dayEndTime: '14:15',
  defaultPeriodDurationMinutes: 45,
  periods: [
    { periodNumber: 1, name: 'الحصة الأولى', startTime: '08:00', endTime: '08:45' },
    { periodNumber: 2, name: 'الحصة الثانية', startTime: '08:45', endTime: '09:30' },
    { periodNumber: 3, name: 'الحصة الثالثة', startTime: '09:30', endTime: '10:15' },
    { periodNumber: 4, name: 'فسحة راحة وأنشطة', startTime: '10:15', endTime: '10:45', isBreak: true },
    { periodNumber: 5, name: 'الحصة الرابعة', startTime: '10:45', endTime: '11:30' },
    { periodNumber: 6, name: 'الحصة الخامسة', startTime: '11:30', endTime: '12:15' },
    { periodNumber: 7, name: 'الحصة السادسة', startTime: '12:15', endTime: '13:00' },
    { periodNumber: 8, name: 'الحصة السابعة', startTime: '13:00', endTime: '13:45' },
  ],
  breakTimes: [
    { id: 'BRK1', name: 'الفسحة الكبرى (طابور وتغذية)', startTime: '10:15', endTime: '10:45' },
  ],
  nonStudyDays: ['الجمعة', 'السبت'],
};

export const DEFAULT_STUDENT_ATTENDANCE_STATUSES: StudentAttendanceStatusConfig[] = [
  { id: 'STAT_PRES', name: 'حاضر', shortCode: 'ح', color: '#10b981', textColor: '#065f46', badgeBg: '#d1fae5', countsAsPresent: true, countsAsAbsent: false, isExcused: false, requiresReason: false, requiresTime: false, displayOrder: 1, scope: 'Both', isActive: true },
  { id: 'STAT_LATE', name: 'متأخر', shortCode: 'ت', color: '#f59e0b', textColor: '#92400e', badgeBg: '#fef3c7', countsAsPresent: true, countsAsAbsent: false, isExcused: false, requiresReason: false, requiresTime: true, displayOrder: 2, scope: 'Both', isActive: true },
  { id: 'STAT_ABS_NO', name: 'غائب بدون عذر', shortCode: 'غ', color: '#ef4444', textColor: '#991b1b', badgeBg: '#fee2e2', countsAsPresent: false, countsAsAbsent: true, isExcused: false, requiresReason: false, requiresTime: false, displayOrder: 3, scope: 'Both', isActive: true },
  { id: 'STAT_ABS_EX', name: 'غائب بعذر', shortCode: 'ع', color: '#6366f1', textColor: '#3730a3', badgeBg: '#e0e7ff', countsAsPresent: false, countsAsAbsent: true, isExcused: true, requiresReason: true, requiresTime: false, displayOrder: 4, scope: 'Both', isActive: true },
  { id: 'STAT_PERM', name: 'مأذون', shortCode: 'م', color: '#8b5cf6', textColor: '#5b21b6', badgeBg: '#ede9fe', countsAsPresent: true, countsAsAbsent: false, isExcused: true, requiresReason: true, requiresTime: true, displayOrder: 5, scope: 'Both', isActive: true },
  { id: 'STAT_ESCAPE', name: 'هروب من المدرسة', shortCode: 'هـ', color: '#dc2626', textColor: '#7f1d1d', badgeBg: '#fecaca', countsAsPresent: false, countsAsAbsent: true, isExcused: false, requiresReason: false, requiresTime: false, displayOrder: 6, scope: 'Both', isActive: true },
  { id: 'STAT_SICK', name: 'إجازة مرضية معتمدة', shortCode: 'س', color: '#06b6d4', textColor: '#155e75', badgeBg: '#cffafe', countsAsPresent: false, countsAsAbsent: false, isExcused: true, requiresReason: true, requiresTime: false, displayOrder: 7, scope: 'School', isActive: true },
  { id: 'STAT_TRIP', name: 'نشاط / مسابقة مدرسية', shortCode: 'ن', color: '#14b8a6', textColor: '#115e59', badgeBg: '#ccfbf1', countsAsPresent: true, countsAsAbsent: false, isExcused: true, requiresReason: false, requiresTime: false, displayOrder: 8, scope: 'Both', isActive: true },
];

export const DEFAULT_ABSENCE_REASONS: AbsenceReasonItem[] = [
  { id: 'REA_SICK', name: 'عذر مرضي / تقرير طبي معتمد', category: 'مرضي', isExcused: true, requiresDocument: true, isActive: true },
  { id: 'REA_FAM', name: 'ظرف عائلي طارئ معتمد من ولي الأمر', category: 'عائلي', isExcused: true, requiresDocument: false, isActive: true },
  { id: 'REA_TRAV', name: 'سفر مفاجئ بإخطار مسبق', category: 'إذن مسبق', isExcused: true, requiresDocument: true, isActive: true },
  { id: 'REA_APPT', name: 'موعد حكومي أو فحص رسمي', category: 'طارئ', isExcused: true, requiresDocument: true, isActive: true },
  { id: 'REA_OTHER_EX', name: 'عذر قهري آخر مقبول لدى إدارة المدرسة', category: 'أخرى', isExcused: true, requiresDocument: false, isActive: true },
  { id: 'REA_UNEXCUSED', name: 'غياب بدون إبداء أسباب أو تقديم عذر', category: 'أخرى', isExcused: false, requiresDocument: false, isActive: true },
];

export const DEFAULT_STUDENT_ATTENDANCE_RULES: StudentAttendanceRules = {
  startTime: '07:45',
  gracePeriodMinutes: 15,
  lateThresholdMinutes: 30,
  lateCalculationMode: 'from_start',
  allowManualTime: true,
  allowRetroactiveEntry: true,
  maxRetroactiveDays: 3,
  allowFutureEntry: false,
  autoSuggestStatus: true,
  requireAbsenceReason: false,
  missingRecordOnApproval: 'block',
  allowTeacherTakeAttendance: true,
  allowTeacherEditAttendance: true,
  requireStudentAffairsApproval: false,
  allowPastDaysEdit: true,
  maxPastDaysEditLimit: 3,
  absenceWarningThresholdDays: 5,
  lateWarningThresholdCount: 3,
};

export const DEFAULT_TEACHER_ATTENDANCE_RULES: TeacherAttendanceRules = {
  workStartTime: '07:30',
  workEndTime: '14:30',
  gracePeriodMinutes: 15,
  standardDailyHours: 7,
  workDays: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
  weekendDays: ['الجمعة', 'السبت'],
  lateDeductionMultiplier: 1.0,
  earlyLeaveDeductionMultiplier: 1.0,
  overtimeRate: 1.5,
  allowRetroactiveAttendance: true,
  maxRetroactiveDays: 2,
};

export const DEFAULT_BEHAVIOR_LEVELS: BehaviorLevelItem[] = [
  { id: 'LVL1', name: 'سلوك ممتاز ومثالي', minPercentage: 90, maxPercentage: 100, color: '#10b981', badgeColor: 'bg-emerald-100 text-emerald-800', description: 'سجل انضباطي ناصع وتقدير شرفي' },
  { id: 'LVL2', name: 'سلوك جيد ومقبول', minPercentage: 75, maxPercentage: 89, color: '#3b82f6', badgeColor: 'bg-blue-100 text-blue-800', description: 'انضباط جيد مع متابعة دورية' },
  { id: 'LVL3', name: 'يحتاج متابعة وتوجيه', minPercentage: 60, maxPercentage: 74, color: '#f59e0b', badgeColor: 'bg-amber-100 text-amber-800', description: 'تنبيه الأخصائي الاجتماعي وإخطار ولي الأمر' },
  { id: 'LVL4', name: 'مستوى حرج وتدخل فوري', minPercentage: 0, maxPercentage: 59, color: '#ef4444', badgeColor: 'bg-rose-100 text-rose-800', description: 'استدعاء فوري لولي الأمر وتطبيق لائحة الانضباط' },
];

export const DEFAULT_ALERT_RULES: AlertRuleItem[] = [
  { id: 'ALT1', title: 'تنبيه تجاوز حد غياب الطلاب', category: 'student_absence', thresholdValue: 5, unitText: 'أيام خلال الشهر', targetRoles: ['StudentAffairs', 'SocialSpecialist', 'Admin'], isActive: true, messageTemplate: 'تجاوز الطالب {student} حد الغياب المسموح ({count} أيام)' },
  { id: 'ALT2', title: 'تنبيه تكرار تأخير الطالب', category: 'student_late', thresholdValue: 3, unitText: 'مرات تأخير', targetRoles: ['StudentAffairs', 'Parent', 'Admin'], isActive: true, messageTemplate: 'تكرر تأخير الطالب {student} {count} مرات هذا الأسبوع' },
  { id: 'ALT3', title: 'تنبيه انخفاض نقاط السلوك', category: 'behavior_points', thresholdValue: 15, unitText: 'نقطة مخصومة', targetRoles: ['SocialSpecialist', 'Admin'], isActive: true, messageTemplate: 'تم خصم {points} نقطة سلوك من الطالب {student}' },
  { id: 'ALT4', title: 'تنبيه تأخر توثيق الحصص', category: 'teacher_lesson_delay', thresholdValue: 4, unitText: 'ساعات بعد انتهاء اليوم', targetRoles: ['Teacher', 'TeacherAffairs', 'Admin'], isActive: true, messageTemplate: 'يرجى توثيق ما تم تدريسه والواجبات لحصص اليوم' },
];

export const DEFAULT_LEAVE_TYPES: LeaveTypeConfig[] = [
  { id: 'LEV_ANN', name: 'إجازة اعتيادية / سنوية', isPaid: true, deductFromBalance: true, defaultAnnualQuota: 21, requiresApproval: true, color: '#3b82f6', isActive: true },
  { id: 'LEV_CAS', name: 'إجازة عارضة', isPaid: true, deductFromBalance: true, defaultAnnualQuota: 6, requiresApproval: true, color: '#f59e0b', isActive: true },
  { id: 'LEV_SICK', name: 'إجازة مرضية معتمدة', isPaid: true, deductFromBalance: false, defaultAnnualQuota: 15, requiresApproval: true, color: '#06b6d4', isActive: true },
  { id: 'LEV_UNP', name: 'إجازة بدون مرتب', isPaid: false, deductFromBalance: false, defaultAnnualQuota: 0, requiresApproval: true, color: '#64748b', isActive: true },
  { id: 'LEV_MAT', name: 'إجازة رعاية طفل / أمومة', isPaid: true, deductFromBalance: false, defaultAnnualQuota: 90, requiresApproval: true, color: '#ec4899', isActive: true },
  { id: 'LEV_OFF', name: 'إجازة رسمية / أعياد', isPaid: true, deductFromBalance: false, defaultAnnualQuota: 0, requiresApproval: false, color: '#10b981', isActive: true },
];

export const DEFAULT_PERMISSION_TYPES: PermissionTypeConfig[] = [
  { id: 'PRM_OUT', name: 'إذن خروج مؤقت خلال اليوم', maxHoursPerMonth: 4, isPaid: true, requiresApproval: true, isActive: true },
  { id: 'PRM_LATE', name: 'إذن تأخير صباحي مقبول', maxHoursPerMonth: 2, isPaid: true, requiresApproval: true, isActive: true },
  { id: 'PRM_EARLY', name: 'إذن انصراف مبكر لظرف طارئ', maxHoursPerMonth: 2, isPaid: true, requiresApproval: true, isActive: true },
  { id: 'PRM_DUTY', name: 'مأمورية عمل مدرسية رسمية', maxHoursPerMonth: 20, isPaid: true, requiresApproval: true, isActive: true },
  { id: 'PRM_PERS', name: 'إذن شخصي اعتيادي', maxHoursPerMonth: 2, isPaid: true, requiresApproval: true, isActive: true },
];

export const DEFAULT_ALLOWANCE_TYPES: AllowanceTypeItem[] = [
  { id: 'ALW_TRANS', name: 'بدل انتقال ومواصلات', defaultAmount: 500, isTaxable: false, isActive: true },
  { id: 'ALW_SUP', name: 'بدل إشراف وريادة فصل', defaultAmount: 400, isTaxable: true, isActive: true },
  { id: 'ALW_ACT', name: 'مكافأة أنشطة وتفوق', defaultAmount: 600, isTaxable: true, isActive: true },
  { id: 'ALW_SPEC', name: 'بدل طبيعة عمل وتخصص', defaultAmount: 800, isTaxable: true, isActive: true },
];

export const DEFAULT_DEDUCTION_TYPES: DeductionTypeItem[] = [
  { id: 'DED_ABS', name: 'خصم غياب بدون عذر', defaultAmount: 1, isPercentage: false, isActive: true },
  { id: 'DED_LATE', name: 'خصم تأخير صباحي تراكمي', defaultAmount: 1, isPercentage: false, isActive: true },
  { id: 'DED_LOAN', name: 'استقطاع سلفة شخصية', defaultAmount: 0, isPercentage: false, isActive: true },
  { id: 'DED_PEN', name: 'جزاء إداري أو انضباطي', defaultAmount: 0, isPercentage: false, isActive: true },
  { id: 'DED_INS', name: 'تأمينات ومعاشات حكومية', defaultAmount: 11, isPercentage: true, isActive: true },
];

export const DEFAULT_PARENT_PORTAL_SETTINGS: ParentPortalSettings = {
  showAttendance: true,
  showCheckInTime: true,
  showCheckOutTime: true,
  showLateMinutes: true,
  showAttendanceRate: true,
  showAbsenceReason: true,
  showClassAttendance: true,
  showBehavior: true,
  showBehaviorPoints: true,
  showBehaviorScore: true,
  showPositiveBehavior: true,
  showBehaviorCaseStatus: true,
  showViolationDescription: true,
  showTeacherName: true,
  showSubstituteTeacherName: true,
  showLessonContent: true,
  showHomework: true,
  showLearningLinks: true,
  showWeeklySchedule: true,
  homeworkUpcomingDays: 7,
  enableNotifications: true,
  notifyOnAbsence: true,
  notifyOnLate: true,
  notifyOnHomework: true,
  notifyOnBehaviorViolation: true,
  notifyOnPositiveBehavior: true,
  notifyOnScheduleSubstitution: true,
};

export const DEFAULT_TEACHER_PORTAL_SETTINGS: TeacherPortalSettings = {
  allowTakeAttendance: true,
  allowEditAttendance: true,
  editTimeLimitHours: 24,
  allowRecordViolation: true,
  allowViewBehaviorHistory: true,
  allowAddLessonAfterPeriod: true,
  allowEditPastLessons: true,
};

export const DEFAULT_SOCIAL_SPECIALIST_SETTINGS: SocialSpecialistSettings = {
  canCreateViolation: true,
  canEditViolation: true,
  canDeleteViolation: true,
  canAdjustPoints: true,
  canManageViolationCatalog: true,
  canViewStudentAttendance: true,
  canAddFollowUpNotes: true,
};

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  requireStudentId: true,
  requireNationalId: false,
  requireParentPhone: true,
  duplicateDetectionMethod: 'studentCode',
  autoUpdateExisting: true,
};

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  showLogo: true,
  schoolTitle: 'المدارس الوطنية للعلوم التقنية - NTSS',
  subHeader: 'إدارة شؤون الطلاب والانضباط المدرسي والتعليم الفني المتقدم',
  footerText: 'تم استخراج هذا التقرير آلياً من المنظومة المدرسية الموحدة — وزارة التربية والتعليم والتعليم الفني',
  paperSize: 'A4',
  orientation: 'portrait',
  showPrintDate: true,
  showPrintedBy: true,
  tableFormat: 'standard',
  schedulePdf: {
    orientation: 'landscape',
    showTeacherName: true,
    showTimes: true,
    showRoomNumber: true,
    showAcademicYear: true,
  },
};

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  roleWidgets: {
    Admin: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: true, showSchedule: true, showRecentLessons: true, showPayrollSummary: true, showQuickActions: true },
    StudentAffairs: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: true, showSchedule: true, showRecentLessons: false, showPayrollSummary: false, showQuickActions: true },
    TeacherAffairs: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: false, showSchedule: true, showRecentLessons: false, showPayrollSummary: false, showQuickActions: true },
    Teacher: { showAttendanceSummary: true, showLateList: false, showBehaviorSummary: false, showSchedule: true, showRecentLessons: true, showPayrollSummary: false, showQuickActions: true },
    SocialSpecialist: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: true, showSchedule: false, showRecentLessons: false, showPayrollSummary: false, showQuickActions: true },
    Parent: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: true, showSchedule: true, showRecentLessons: true, showPayrollSummary: false, showQuickActions: false },
    HR: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: false, showSchedule: false, showRecentLessons: false, showPayrollSummary: true, showQuickActions: true },
    Supervisor: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: true, showSchedule: true, showRecentLessons: true, showPayrollSummary: false, showQuickActions: true },
    Viewer: { showAttendanceSummary: true, showLateList: false, showBehaviorSummary: true, showSchedule: true, showRecentLessons: false, showPayrollSummary: false, showQuickActions: false },
    BehaviorOfficer: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: true, showSchedule: false, showRecentLessons: false, showPayrollSummary: false, showQuickActions: true },
    PayrollOfficer: { showAttendanceSummary: true, showLateList: true, showBehaviorSummary: false, showSchedule: false, showRecentLessons: false, showPayrollSummary: true, showQuickActions: true },
    Employee: { showAttendanceSummary: true, showLateList: false, showBehaviorSummary: false, showSchedule: false, showRecentLessons: false, showPayrollSummary: false, showQuickActions: false },
  },
};

export const DEFAULT_STAGES: AcademicStage[] = [
  {
    id: 'STAGE_SEC',
    name: 'المرحلة الثانوية',
    grades: [
      { id: 'G_SEC_1', name: 'الصف الأول الثانوي', classrooms: ['فصل 1', 'فصل 2', 'فصل 3', 'فصل 4'] },
      { id: 'G_SEC_2', name: 'الصف الثاني الثانوي', classrooms: ['فصل 1', 'فصل 2', 'فصل 3'] },
      { id: 'G_SEC_3', name: 'الصف الثالث الثانوي', classrooms: ['فصل 1', 'فصل 2', 'فصل 3'] },
    ],
  },
  {
    id: 'STAGE_PREP',
    name: 'المرحلة الإعدادية',
    grades: [
      { id: 'G_PREP_1', name: 'الصف الأول الإعدادي', classrooms: ['فصل 1', 'فصل 2', 'فصل 3'] },
      { id: 'G_PREP_2', name: 'الصف الثاني الإعدادي', classrooms: ['فصل 1', 'فصل 2'] },
      { id: 'G_PREP_3', name: 'الصف الثالث الإعدادي', classrooms: ['فصل 1', 'فصل 2'] },
    ],
  },
  {
    id: 'STAGE_PRI',
    name: 'المرحلة الابتدائية',
    grades: [
      { id: 'G_PRI_1', name: 'الصف الأول الابتدائي', classrooms: ['فصل 1', 'فصل 2', 'فصل 3'] },
      { id: 'G_PRI_2', name: 'الصف الثاني الابتدائي', classrooms: ['فصل 1', 'فصل 2'] },
      { id: 'G_PRI_3', name: 'الصف الثالث الابتدائي', classrooms: ['فصل 1', 'فصل 2'] },
    ],
  },
];

export const DEFAULT_HOLIDAYS: SchoolHoliday[] = [
  { id: 'HOL001', name: 'عيد القوات المسلحة (6 أكتوبر)', startDate: '2026-10-06', endDate: '2026-10-06', affectsAbsenceCalculation: false },
  { id: 'HOL002', name: 'المولد النبوي الشريف', startDate: '2026-09-04', endDate: '2026-09-04', affectsAbsenceCalculation: false },
  { id: 'HOL003', name: 'عيد الشرطة وثورة 25 يناير', startDate: '2026-01-25', endDate: '2026-01-25', affectsAbsenceCalculation: false },
  { id: 'HOL004', name: 'إجازة نصف العام الدراسي', startDate: '2026-01-24', endDate: '2026-02-05', affectsAbsenceCalculation: false },
  { id: 'HOL005', name: 'عيد الفطر المبارك', startDate: '2026-03-20', endDate: '2026-03-23', affectsAbsenceCalculation: false },
  { id: 'HOL006', name: 'عيد تحرير سيناء', startDate: '2026-04-25', endDate: '2026-04-25', affectsAbsenceCalculation: false },
  { id: 'HOL007', name: 'عيد العمال وشم النسيم', startDate: '2026-05-01', endDate: '2026-05-04', affectsAbsenceCalculation: false },
  { id: 'HOL008', name: 'عيد الأضحى المبارك', startDate: '2026-05-26', endDate: '2026-05-30', affectsAbsenceCalculation: false },
  { id: 'HOL009', name: 'ثورة 30 يونيو', startDate: '2026-06-30', endDate: '2026-06-30', affectsAbsenceCalculation: false },
];

export const DEFAULT_BEHAVIOR_TYPES: BehaviorType[] = [
  { id: 'BEH001', name: 'التأخر المتكرر عن الطابور أو الحصة', category: 'انضباط مدرسي', severity: 'بسيطة', points: 3, weight: 3, defaultAction: 'تنبيه شفوي وتسجيل التأخير بالدقائق', notifyParent: false, requiresAdminReview: false, isActive: true, sortOrder: 1 },
  { id: 'BEH002', name: 'عدم الالتزام بالزي المدرسي أو المظهر اللائق', category: 'مظهر وانضباط', severity: 'بسيطة', points: 2, weight: 2, defaultAction: 'تنبيه شفوي وتعهد بالالتزام', notifyParent: false, requiresAdminReview: false, isActive: true, sortOrder: 2 },
  { id: 'BEH003', name: 'استخدام الهاتف أثناء الحصة بدون إذن', category: 'سلوكية داخل الفصل', severity: 'متوسطة', points: 5, weight: 5, defaultAction: 'مصادرة الهاتف حتى نهاية اليوم الدراسي', notifyParent: true, requiresAdminReview: false, isActive: true, sortOrder: 3 },
  { id: 'BEH004', name: 'عدم الالتزام بتعليمات المعلم أو إثارة الفوضى', category: 'سلوكية داخل الفصل', severity: 'متوسطة', points: 5, weight: 5, defaultAction: 'إنذار كتابي وتكليف إضافي', notifyParent: true, requiresAdminReview: false, isActive: true, sortOrder: 4 },
  { id: 'BEH005', name: 'الهروب من الحصة أو مغادرة المدرسة', category: 'انضباط مدرسي', severity: 'شديدة', points: 10, weight: 10, defaultAction: 'استدعاء فوري لولي الأمر وإنذار بالفصل', notifyParent: true, requiresAdminReview: true, isActive: true, sortOrder: 5 },
  { id: 'BEH006', name: 'التعدي اللفظي أو استخدام ألفاظ غير لائقة', category: 'أخلاقية وتربوية', severity: 'شديدة', points: 10, weight: 10, defaultAction: 'اعتذار رسمي وتعهد كتابي وإخطار ولي الأمر', notifyParent: true, requiresAdminReview: true, isActive: true, sortOrder: 6 },
  { id: 'BEH007', name: 'التعدي الجسدي أو التشاجر العنيف', category: 'خطيرة', severity: 'خطيرة جداً', points: 20, weight: 20, defaultAction: 'فصل مؤقت 3 أيام واستدعاء ولي الأمر للتحقيق', notifyParent: true, requiresAdminReview: true, isActive: true, sortOrder: 7 },
  { id: 'BEH008', name: 'التعدي على المعلم أو الكادر الإداري', category: 'خطيرة', severity: 'خطيرة جداً', points: 30, weight: 30, defaultAction: 'إحالة لمجلس التأديب مع الفصل الإداري الفوري', notifyParent: true, requiresAdminReview: true, isActive: true, sortOrder: 8 },
  { id: 'BEH009', name: 'إتلاف مرافق المدرسة أو الأجهزة والمقاعد', category: 'ممتلكات عامة', severity: 'شديدة', points: 15, weight: 15, defaultAction: 'إلزام ولي الأمر بالتعويض المالي وإنذار رسمي', notifyParent: true, requiresAdminReview: true, isActive: true, sortOrder: 9 },
];

export const DEFAULT_BEHAVIOR_RULES: BehaviorScoreRule = {
  initialScore: 100,
  minScore: 0,
  maxScore: 100,
  excellentThreshold: 90,
  goodThreshold: 75,
  warningThreshold: 60,
  dangerThreshold: 50,
};

export const DEFAULT_FEE_CATEGORIES: FeeCategoryItem[] = [
  { id: 'FEE001', name: 'المصروفات الدراسية الأساسية', defaultAmount: 18000, isMandatory: true, frequency: 'Annual', description: 'الرسوم التعليمية السنوية المقررة لكافة المراحل', isActive: true },
  { id: 'FEE002', name: 'رسوم الكتب الدراسية والمنصات التعليمية', defaultAmount: 3500, isMandatory: true, frequency: 'Annual', description: 'المناهج الوزارية والأنشطة الرقمية التفاعلية', isActive: true },
  { id: 'FEE003', name: 'خدمة اشتراك أتوبيس المدرسة (ذهاب وعودة)', defaultAmount: 6000, isMandatory: false, frequency: 'Annual', description: 'النقل المدرسي الآمن المكيف لجميع المناطق', isActive: true },
  { id: 'FEE004', name: 'رسوم الأنشطة الرياضية والاشتراك بالنوادي', defaultAmount: 1500, isMandatory: false, frequency: 'Annual', description: 'الأنشطة اللاصفية والبطولات المدرسية والرحلات', isActive: true },
  { id: 'FEE005', name: 'رسوم التسجيل واستمارة القيد لأول مرة', defaultAmount: 1000, isMandatory: false, frequency: 'OneTime', description: 'رسوم الملف الإداري واستخراج الكارنيهات المدرسية', isActive: true },
];

export const DEFAULT_INSTALLMENT_PLANS: PaymentInstallmentPlan[] = [
  { id: 'PLN_FULL', name: 'سداد كامل المصروفات دفعة واحدة (خصم 5%)', installmentsCount: 1, distributionPercentages: [100], dueMonths: ['2025-09'], latePenaltyPercentage: 2, discountEarlyPaymentPercentage: 5, isActive: true },
  { id: 'PLN_TWO', name: 'نظام القسطين (ترم أول وترم ثاني)', installmentsCount: 2, distributionPercentages: [50, 50], dueMonths: ['2025-09', '2026-01'], latePenaltyPercentage: 2, discountEarlyPaymentPercentage: 0, isActive: true },
  { id: 'PLN_FOUR', name: 'نظام الأربعة أقساط ربع السنوية', installmentsCount: 4, distributionPercentages: [25, 25, 25, 25], dueMonths: ['2025-09', '2025-11', '2026-01', '2026-03'], latePenaltyPercentage: 3, discountEarlyPaymentPercentage: 0, isActive: true },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'PAY_CASH', name: 'الدفع النقدي بخزينة المدرسة المباشرة', serviceFeePercentage: 0, requiresReferenceNumber: false, isActive: true },
  { id: 'PAY_FAWRY', name: 'منافذ فوري والمدفوعات الإلكترونية', accountNumber: '7891234', serviceFeePercentage: 1.5, requiresReferenceNumber: true, isActive: true },
  { id: 'PAY_BANK', name: 'تحويل بنكي / الإيداع بحساب بنك مصر', bankName: 'بنك مصر', accountNumber: '1234567890123456', serviceFeePercentage: 0, requiresReferenceNumber: true, isActive: true },
  { id: 'PAY_INSTA', name: 'إنستاباي InstaPay الفوري', accountNumber: 'school@instapay', serviceFeePercentage: 0, requiresReferenceNumber: true, isActive: true },
  { id: 'PAY_VODAFONE', name: 'محافظ إلكترونية كاش (فودافون/أورنج/اتصالات)', accountNumber: '01000000000', serviceFeePercentage: 1.0, requiresReferenceNumber: true, isActive: true },
];

export const DEFAULT_PAYROLL_RULES: PayrollRule = {
  workDaysPerMonth: 26,
  calculationMethod: 'work_days',
  absenceDeductionMultiplier: 1.0, // خصم يوم لكل يوم غياب بدون عذر
  lateMinuteDeductionRate: 1.0, // معامل خصم دقيقة التأخير بعد فترة السماح
  lateGraceMinutes: 15,
  overtimeRate: 1.5,
  maxOvertimeHoursPerMonth: 40,
  enableSocialInsuranceDeduction: true,
  socialInsuranceRate: 11, // حصة الموظف في التأمينات الاجتماعية بمصر
};

export const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'AY_2025_2026',
    name: 'العام الدراسي 2025/2026',
    code: '2025-2026',
    startDate: '2025-09-20',
    endDate: '2026-06-15',
    status: 'ACTIVE',
    terms: [
      {
        id: 'TERM_1_2526',
        name: 'الفصل الدراسي الأول',
        code: 'T1',
        startDate: '2025-09-20',
        endDate: '2026-01-22',
        status: 'ACTIVE',
        isCurrent: true,
      },
      {
        id: 'TERM_2_2526',
        name: 'الفصل الدراسي الثاني',
        code: 'T2',
        startDate: '2026-02-07',
        endDate: '2026-06-15',
        status: 'UPCOMING',
        isCurrent: false,
      },
    ],
    isDefault: true,
    isLocked: false,
    notes: 'العام الدراسي النشط الحالي للمدرسة',
  },
  {
    id: 'AY_2024_2025',
    name: 'العام الدراسي 2024/2025',
    code: '2024-2025',
    startDate: '2024-09-21',
    endDate: '2025-06-12',
    status: 'CLOSED',
    terms: [
      {
        id: 'TERM_1_2425',
        name: 'الفصل الدراسي الأول',
        code: 'T1',
        startDate: '2024-09-21',
        endDate: '2025-01-23',
        status: 'CLOSED',
        isCurrent: false,
      },
      {
        id: 'TERM_2_2425',
        name: 'الفصل الدراسي الثاني',
        code: 'T2',
        startDate: '2025-02-08',
        endDate: '2025-06-12',
        status: 'CLOSED',
        isCurrent: false,
      },
    ],
    isDefault: false,
    isLocked: true,
    notes: 'العام الدراسي السابق - مغلق للأرشفة',
  },
];

export const DEFAULT_PROMOTION_RULES: PromotionRule[] = [
  {
    id: 'PROM_PRI_1_2',
    sourceGrade: 'الصف الأول الابتدائي',
    targetGrade: 'الصف الثاني الابتدائي',
    ruleType: 'AUTOMATIC_ALL',
    minAttendancePercentage: 75,
    minBehaviorScore: 60,
    isActive: true,
  },
  {
    id: 'PROM_PRI_2_3',
    sourceGrade: 'الصف الثاني الابتدائي',
    targetGrade: 'الصف الثالث الابتدائي',
    ruleType: 'AUTOMATIC_ALL',
    minAttendancePercentage: 75,
    minBehaviorScore: 60,
    isActive: true,
  },
  {
    id: 'PROM_PREP_1_2',
    sourceGrade: 'الصف الأول الإعدادي',
    targetGrade: 'الصف الثاني الإعدادي',
    ruleType: 'AUTOMATIC_ALL',
    minAttendancePercentage: 75,
    minBehaviorScore: 60,
    isActive: true,
  },
  {
    id: 'PROM_PREP_2_3',
    sourceGrade: 'الصف الثاني الإعدادي',
    targetGrade: 'الصف الثالث الإعدادي',
    ruleType: 'AUTOMATIC_ALL',
    minAttendancePercentage: 75,
    minBehaviorScore: 60,
    isActive: true,
  },
  {
    id: 'PROM_SEC_1_2',
    sourceGrade: 'الصف الأول الثانوي',
    targetGrade: 'الصف الثاني الثانوي',
    ruleType: 'MANUAL_SELECTION',
    minAttendancePercentage: 80,
    minBehaviorScore: 65,
    isActive: true,
  },
  {
    id: 'PROM_SEC_2_3',
    sourceGrade: 'الصف الثاني الثانوي',
    targetGrade: 'الصف الثالث الثانوي',
    ruleType: 'MANUAL_SELECTION',
    minAttendancePercentage: 80,
    minBehaviorScore: 65,
    isActive: true,
  },
  {
    id: 'PROM_SEC_3_GRAD',
    sourceGrade: 'الصف الثالث الثانوي',
    targetGrade: 'متخرج',
    ruleType: 'MANUAL_SELECTION',
    minAttendancePercentage: 80,
    minBehaviorScore: 65,
    isActive: true,
  },
];

export const DEFAULT_POSITIVE_BEHAVIOR_TYPES: PositiveBehaviorType[] = [
  {
    id: 'POS_001',
    name: 'المشاركة الفعالة والتميز الأكاديمي',
    category: 'أكاديمي',
    points: 5,
    description: 'المشاركة الإيجابية والتفوق داخل الحصص الدراسية',
    icon: 'Award',
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'POS_002',
    name: 'مساعدة الزملاء وروح التعاون الإيجابي',
    category: 'اجتماعي',
    points: 5,
    description: 'دعم الزملاء والعمل الجماعي المثمر والتطوع',
    icon: 'Heart',
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'POS_003',
    name: 'الانضباط التام ونظافة المكان',
    category: 'انضباط',
    points: 3,
    description: 'الالتزام التام بالنظافة والمظهر والهدوء',
    icon: 'ShieldCheck',
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'POS_004',
    name: 'التميز في الأنشطة المدرسية والمسابقات',
    category: 'أنشطة',
    points: 10,
    description: 'الفوز ببطولة أو تقديم فقرة مميزة بالإذاعة المدرسية',
    icon: 'Trophy',
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'POS_005',
    name: 'الأمانة وتقديم سلوك أخلاقي مثالي',
    category: 'أخلاقي',
    points: 10,
    description: 'تسليم مفقودات أو إظهار أمانة وشجاعة أدبية فائقة',
    icon: 'Star',
    isActive: true,
    sortOrder: 5,
  },
];

export const DEFAULT_LOCATIONS: LocationItem[] = [
  { id: 'LOC_LAB_1', name: 'معمل الحاسب الآلي 1', code: 'LAB-COMP-1', type: 'معمل', capacity: 30, isActive: true },
  { id: 'LOC_LAB_2', name: 'معمل العلوم والفيزياء', code: 'LAB-SCI-1', type: 'معمل', capacity: 35, isActive: true },
  { id: 'LOC_PLAYGROUND', name: 'الملعب الرياضي الرئيسي', code: 'FIELD-MAIN', type: 'ملعب', capacity: 100, isActive: true },
  { id: 'LOC_HALL_1', name: 'المسرح المدرسي والقاعة الكبرى', code: 'HALL-MAIN', type: 'مسرح', capacity: 250, isActive: true },
  { id: 'LOC_LIBRARY', name: 'المكتبة المدرسية المركزية', code: 'LIB-CENTRAL', type: 'مكتبة', capacity: 50, isActive: true },
  { id: 'LOC_ROBOTICS', name: 'معمل الروبوتات والذكاء الاصطناعي', code: 'LAB-ROBOT', type: 'معمل', capacity: 25, isActive: true },
];

export const DEFAULT_CONFLICT_RULES: ConflictRuleConfig = {
  preventTeacherDoubleBooking: true,
  preventRoomDoubleBooking: true,
  preventStudentGroupDoubleBooking: true,
  maxTeacherDailyPeriods: 6,
  maxConsecutiveTeacherPeriods: 3,
  warnOnSubjectRepetitionPerDay: true,
  warnOnHeavySubjectsInEndPeriods: true,
};

export const INITIAL_SETTINGS: SystemSettings = {
  schoolName: 'المدارس الوطنية للعلوم التقنية - NTSS',
  shortSchoolName: 'NTSS Schools',
  companyName: 'المدارس الوطنية للعلوم التقنية - NTSS',
  schoolAddress: 'جمهورية مصر العربية - القاهرة - التجمع الخامس',
  schoolPhone: '+20 2 27598800',
  schoolPhones: ['+20 2 27598800', '+20 100 1234567'],
  schoolEmail: 'contact@ntss-schools.edu.eg',
  schoolWebsite: 'https://ntss-schools.edu.eg',
  currentAcademicYear: '2025/2026',
  currentTerm: 'الفصل الدراسي الأول',
  academicYearStartDate: '2025-09-20',
  academicYearEndDate: '2026-06-15',
  country: 'مصر',
  currency: 'EGP',
  currencyLabel: 'ج.م',
  timeZone: 'Africa/Cairo',
  defaultLanguage: 'العربية',
  dateFormat: 'YYYY-MM-DD',
  
  officialStartTime: '07:30',
  officialEndTime: '14:30',
  gracePeriodMinutes: 15,
  standardDailyHours: 7,
  weekendDays: ['الجمعة', 'السبت'],
  
  annualLeaveAllowance: 21,
  sickLeaveAllowance: 15,
  emergencyLeaveAllowance: 6,
  
  stages: DEFAULT_STAGES,
  grades: DEFAULT_GRADES,
  classrooms: DEFAULT_CLASSROOMS,
  subjects: DEFAULT_SUBJECTS,
  departments: DEFAULT_DEPARTMENTS,
  jobTitles: DEFAULT_JOB_TITLES,
  holidays: DEFAULT_HOLIDAYS,

  academicYears: DEFAULT_ACADEMIC_YEARS,
  promotionRules: DEFAULT_PROMOTION_RULES,
  positiveBehaviorTypes: DEFAULT_POSITIVE_BEHAVIOR_TYPES,
  locations: DEFAULT_LOCATIONS,
  conflictRules: DEFAULT_CONFLICT_RULES,
  
  scheduleConfig: DEFAULT_SCHEDULE_CONFIG,
  studentAttendanceStatuses: DEFAULT_STUDENT_ATTENDANCE_STATUSES,
  studentAttendanceRules: DEFAULT_STUDENT_ATTENDANCE_RULES,
  teacherAttendanceRules: DEFAULT_TEACHER_ATTENDANCE_RULES,
  behaviorScoreRules: DEFAULT_BEHAVIOR_RULES,
  behaviorLevels: DEFAULT_BEHAVIOR_LEVELS,
  alertRules: DEFAULT_ALERT_RULES,
  
  leaveTypes: DEFAULT_LEAVE_TYPES,
  permissionTypes: DEFAULT_PERMISSION_TYPES,
  
  payrollRules: DEFAULT_PAYROLL_RULES,
  allowanceTypes: DEFAULT_ALLOWANCE_TYPES,
  deductionTypes: DEFAULT_DEDUCTION_TYPES,
  feeCategories: DEFAULT_FEE_CATEGORIES,
  installmentPlans: DEFAULT_INSTALLMENT_PLANS,
  paymentMethods: DEFAULT_PAYMENT_METHODS,
  
  parentPortalSettings: DEFAULT_PARENT_PORTAL_SETTINGS,
  teacherPortalSettings: DEFAULT_TEACHER_PORTAL_SETTINGS,
  socialSpecialistSettings: DEFAULT_SOCIAL_SPECIALIST_SETTINGS,
  
  importSettings: DEFAULT_IMPORT_SETTINGS,
  exportSettings: DEFAULT_EXPORT_SETTINGS,
  dashboardSettings: DEFAULT_DASHBOARD_SETTINGS,
  
  rolePermissions: DEFAULT_PERMISSION_MATRIX,
  
  googleSheetsUrl: '',
  googleAppsScriptUrl:
    ((import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
    'https://script.google.com/macros/s/AKfycbzw0kggQMGHdusMyKZOuqMC8eLiBzGccm7e7tdZbnMjvyBDqXPgI5f0tiJPKMFYAoln/exec',
  googleSheetWebAppUrl:
    ((import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
    'https://script.google.com/macros/s/AKfycbzw0kggQMGHdusMyKZOuqMC8eLiBzGccm7e7tdZbnMjvyBDqXPgI5f0tiJPKMFYAoln/exec',
  spreadsheetId: ((import.meta as any).env?.VITE_SPREADSHEET_ID as string) || '',
  autoCalculateStatus: true,
  autoSyncIntervalMinutes: 5,
  enableAuditLog: true,
  
  configVersion: '1.0.0',
  lastConfigUpdate: new Date().toISOString(),
};

export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_USERS: User[] = [];
export const INITIAL_LEAVES: LeaveRecord[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_STUDENT_ENROLLMENTS: StudentEnrollment[] = [];
export const INITIAL_STUDENT_TRANSFERS: StudentTransferHistory[] = [];
export const INITIAL_STUDENT_ATTENDANCE: StudentAttendanceRecord[] = [];
export const INITIAL_CLASS_ATTENDANCE: ClassAttendanceRecord[] = [];
export const INITIAL_BEHAVIOR_CASES: BehaviorCase[] = [];
export const INITIAL_BEHAVIOR_LEDGER: BehaviorScoreLedger[] = [];
export const INITIAL_SCHEDULE_SUBSTITUTIONS: ScheduleSubstitution[] = [];
export const INITIAL_LESSON_INSTANCES: LessonInstance[] = [];
export const INITIAL_PARENT_COMMUNICATIONS: ParentCommunicationLog[] = [];

export function generateInitialAttendanceRecords(): AttendanceRecord[] {
  return [];
}

