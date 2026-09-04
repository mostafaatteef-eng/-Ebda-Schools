import {
  AcademicYear,
  AlertRuleItem,
  AllowanceTypeItem,
  AttendanceDay,
  AttendanceDayStatus,
  AttendanceException,
  AttendanceRecord,
  AttendanceStatus,
  AuditLogEntry,
  BehaviorCase,
  BehaviorCaseStatus,
  BehaviorFollowup,
  BehaviorLevelItem,
  BehaviorScoreLedger,
  BehaviorType,
  BehaviorViolation,
  ClassAttendanceRecord,
  ClassroomItem,
  ConflictRuleConfig,
  DeductionTypeItem,
  DepartmentItem,
  Employee,
  GradeItem,
  Homework,
  JobTitleItem,
  LeaveRecord,
  LeaveType,
  LeaveTypeConfig,
  LessonContent,
  LessonInstance,
  LocationItem,
  ParentCommunicationLog,
  PayrollRecord,
  PermissionMatrix,
  PermissionTypeConfig,
  PositiveBehaviorType,
  PromotionRule,
  ScheduleConfig,
  ScheduleItem,
  SchedulePeriodItem,
  ScheduleSubstitution,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceStatusConfig,
  StudentEnrollment,
  StudentTransferHistory,
  SubjectItem,
  SyncStatus,
  SystemSettings,
  Term,
  User,
} from '../types';
import {
  DEFAULT_ACADEMIC_YEARS,
  DEFAULT_ALERT_RULES,
  DEFAULT_ALLOWANCE_TYPES,
  DEFAULT_BEHAVIOR_LEVELS,
  DEFAULT_BEHAVIOR_RULES,
  DEFAULT_BEHAVIOR_TYPES,
  DEFAULT_CLASSROOMS,
  DEFAULT_CONFLICT_RULES,
  DEFAULT_DASHBOARD_SETTINGS,
  DEFAULT_DEDUCTION_TYPES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_GRADES,
  DEFAULT_HOLIDAYS,
  DEFAULT_IMPORT_SETTINGS,
  DEFAULT_JOB_TITLES,
  DEFAULT_LEAVE_TYPES,
  DEFAULT_LOCATIONS,
  DEFAULT_PARENT_PORTAL_SETTINGS,
  DEFAULT_PAYROLL_RULES,
  DEFAULT_PERMISSION_MATRIX,
  DEFAULT_PERMISSION_TYPES,
  DEFAULT_POSITIVE_BEHAVIOR_TYPES,
  DEFAULT_PROMOTION_RULES,
  DEFAULT_SCHEDULE_CONFIG,
  DEFAULT_SOCIAL_SPECIALIST_SETTINGS,
  DEFAULT_STAGES,
  DEFAULT_STUDENT_ATTENDANCE_RULES,
  DEFAULT_STUDENT_ATTENDANCE_STATUSES,
  DEFAULT_SUBJECTS,
  DEFAULT_TEACHER_ATTENDANCE_RULES,
  DEFAULT_TEACHER_PORTAL_SETTINGS,
  INITIAL_SETTINGS,
} from '../data/initialData';
import { getCairoCurrentDate, getCairoCurrentTime, getCairoNowISO, getEgyptianDayName } from '../utils/egyptianTime';
import { generateClientSessionToken, hashPasswordSHA256, hashPlainSHA256 } from '../utils/cryptoUtils';
import { buildUnifiedAttendanceRecord, calculateAttendanceMetrics } from '../utils/attendanceUtils';
import { computeAttendanceDayReview, calculateStudentLateMinutes } from '../utils/attendanceEngine';
import { SyncQueueService } from './syncQueueService';
import { ParentService } from './parentService';
import { NotificationService } from './notificationService';
import { PayrollAttendanceSnapshot } from '../types_extended';

const STORAGE_KEYS = {
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
  ATTENDANCE_DAYS: 'ntss_attendance_days_v3',
  ATTENDANCE_EXCEPTIONS: 'ntss_attendance_exceptions_v3',
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
  SYNC_QUEUE: 'ntss_sync_queue_v3',
  NOTIFICATIONS: 'ntss_notifications_v3',
  ACADEMIC_YEARS: 'ntss_academic_years_v3',
  STUDENT_ENROLLMENTS: 'ntss_student_enrollments_v3',
  STUDENT_TRANSFERS: 'ntss_student_transfers_v3',
  PROMOTION_RULES: 'ntss_promotion_rules_v3',
  PARENT_COMMUNICATIONS: 'ntss_parent_communications_v3',
  LOCATIONS: 'ntss_locations_v3',
  HOMEWORKS: 'ntss_homeworks_v3',
};

const DEFAULT_BACKEND_URL =
  'https://script.google.com/macros/s/AKfycbyw4O2Y6X5B6yN8U1M3Q4R5T6Y7U8I9O0P1A2S3D4F5G6H7J8K9/exec';

class StorageService {
  private subscribers: Array<() => void> = [];
  private autoSyncInterval: any = null;

  constructor() {
    this.initDefaults();
    this.startAutoSync();
  }

  private initDefaults(): void {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BEHAVIOR_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.BEHAVIOR_TYPES, JSON.stringify(DEFAULT_BEHAVIOR_TYPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEARS)) {
      localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(DEFAULT_ACADEMIC_YEARS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSITIVE_BEHAVIOR_TYPES)) {
      localStorage.setItem(STORAGE_KEYS.POSITIVE_BEHAVIOR_TYPES, JSON.stringify(DEFAULT_POSITIVE_BEHAVIOR_TYPES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROMOTION_RULES)) {
      localStorage.setItem(STORAGE_KEYS.PROMOTION_RULES, JSON.stringify(DEFAULT_PROMOTION_RULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LOCATIONS)) {
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(DEFAULT_LOCATIONS));
    }

    // Auto-bootstrap student enrollments for existing students without enrollments
    this.bootstrapStudentEnrollments();
  }

  private bootstrapStudentEnrollments(): void {
    try {
      const enrollmentsRaw = localStorage.getItem(STORAGE_KEYS.STUDENT_ENROLLMENTS);
      const enrollments: StudentEnrollment[] = enrollmentsRaw ? JSON.parse(enrollmentsRaw) : [];
      const students = this.getStudents();
      const activeYear = this.getActiveAcademicYear() || DEFAULT_ACADEMIC_YEARS[0];

      if (students.length > 0 && enrollments.length === 0 && activeYear) {
        const now = getCairoNowISO();
        const initialEnrollments: StudentEnrollment[] = students.map((std, idx) => ({
          id: `ENR-${std.id}-${activeYear.id}`,
          studentId: std.id,
          academicYearId: activeYear.id,
          academicYearName: activeYear.name,
          grade: std.grade,
          classroom: std.classroom,
          section: std.section || 'أ',
          enrollmentDate: std.enrollmentDate || std.createdAt || activeYear.startDate,
          status: (std.status === 'غير نشط' ? 'INACTIVE' : std.status === 'منقول' ? 'TRANSFERRED' : 'ACTIVE') as any,
          promotionStatus: 'ENROLLED',
          createdAt: now,
          updatedAt: now,
        }));
        localStorage.setItem(STORAGE_KEYS.STUDENT_ENROLLMENTS, JSON.stringify(initialEnrollments));
      }
    } catch (e) {
      console.warn('Error bootstrapping student enrollments:', e);
    }
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifyChange(): void {
    this.subscribers.forEach(cb => cb());
  }

  public startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    const settings = this.getSettings();
    const mins = Math.max(1, settings.autoSyncIntervalMinutes || 5);
    const url = settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL;

    if (url && url.trim().length > 10) {
      this.autoSyncInterval = setInterval(() => {
        this.syncWithGoogleSheets(true).catch(() => {});
      }, mins * 60 * 1000);
    }
  }

  // ---------------- Authentication ----------------
  public getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      this.logAudit('LOGIN', 'AUTH', `تسجيل دخول للمستخدم: ${user.fullName} (@${user.username})`);
    } else {
      const current = this.getCurrentUser();
      if (current) {
        this.logAudit('LOGOUT', 'AUTH', `تسجيل خروج للمستخدم: ${current.fullName}`);
      }
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
    this.notifyChange();
  }

  public async login(username: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> {
    const cleanUsername = (username || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    const inputHashed = await hashPasswordSHA256(cleanPassword);
    const settings = this.getSettings();
    const scriptUrl = settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL;

    // 1. Try Backend Online Login First (POST ONLY)
    if (scriptUrl && scriptUrl.length > 15 && navigator.onLine) {
      try {
        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'login',
            username: cleanUsername,
            password: cleanPassword,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.status === 'success' && result.user) {
            const userWithToken: User = {
              ...result.user,
              sessionToken: result.token || generateClientSessionToken(result.user.id, result.user.role),
            };
            this.setCurrentUser(userWithToken);
            return { success: true, user: userWithToken };
          } else if (result.status === 'error') {
            return { success: false, message: result.message || 'بيانات الدخول غير صحيحة' };
          }
        }
      } catch (err) {
        console.warn('Backend login request error, checking local users cache...', err);
      }
    }

    // 2. Fallback to Local Cached Users
    const users = this.getUsers();
    
    // Default Admin First Login initialization if database is completely empty
    if (users.length === 0 && (cleanUsername === 'admin' || cleanUsername === '001') && (cleanPassword === 'admin123' || cleanPassword === 'admin')) {
      const defaultAdmin: User = {
        id: '001',
        username: 'admin',
        password: inputHashed,
        fullName: 'مدير النظام',
        role: 'Admin',
        status: 'Active',
        department: 'الإدارة العامة والتوجيه',
        email: 'admin@ntss-schools.edu.eg',
        mustChangePassword: true,
        sessionToken: generateClientSessionToken('001', 'Admin'),
        createdAt: getCairoNowISO(),
        lastLogin: getCairoNowISO(),
      };
      this.saveUser(defaultAdmin);
      this.setCurrentUser(defaultAdmin);
      return { success: true, user: defaultAdmin };
    }

    const found = users.find(
      u =>
        u.username.toLowerCase() === cleanUsername ||
        (u.id && u.id.toLowerCase() === cleanUsername)
    );

    if (!found) {
      return { success: false, message: 'اسم المستخدم غير موجود بالنظام' };
    }

    if (found.status === 'Inactive' || found.isActive === false) {
      return { success: false, message: 'هذا الحساب معطل حالياً، يرجى مراجعة إدارة المدرسة' };
    }

    // Check password if stored locally (supports plain text migration or hashed match)
    if (found.password) {
      const isPlainMatch = (found.password === cleanPassword);
      const isHashMatch = (found.password === inputHashed);
      if (!isPlainMatch && !isHashMatch) {
        return { success: false, message: 'كلمة المرور غير صحيحة' };
      }
      // Auto-migrate to hash if stored as plain text
      if (isPlainMatch && !isHashMatch) {
        found.password = inputHashed;
      }
    }

    const isDefaultAdmin = (cleanUsername === 'admin' && cleanPassword === 'admin123');
    found.mustChangePassword = found.mustChangePassword || isDefaultAdmin;
    found.sessionToken = generateClientSessionToken(found.id, found.role);
    found.lastLogin = getCairoNowISO();
    
    this.saveUser(found);
    this.setCurrentUser(found);
    return { success: true, user: found };
  }

  // ---------------- Role Permissions ----------------
  public hasPermission(action: keyof PermissionMatrix): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    if (user.role === 'Admin') return true;

    const settings = this.getSettings();
    const rolePermissions = settings.rolePermissions || DEFAULT_PERMISSION_MATRIX;
    const currentRolePerms = rolePermissions[user.role];

    if (!currentRolePerms) return false;
    return !!currentRolePerms[action];
  }

  // ---------------- Settings ----------------
  public getSettings(): SystemSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...INITIAL_SETTINGS };
    try {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        stages: parsed.stages || DEFAULT_STAGES,
        grades: parsed.grades || DEFAULT_GRADES,
        classrooms: parsed.classrooms || DEFAULT_CLASSROOMS,
        subjects: parsed.subjects || DEFAULT_SUBJECTS,
        departments: parsed.departments || DEFAULT_DEPARTMENTS,
        jobTitles: parsed.jobTitles || DEFAULT_JOB_TITLES,
        holidays: parsed.holidays || DEFAULT_HOLIDAYS,
        scheduleConfig: parsed.scheduleConfig || DEFAULT_SCHEDULE_CONFIG,
        studentAttendanceStatuses: parsed.studentAttendanceStatuses || DEFAULT_STUDENT_ATTENDANCE_STATUSES,
        studentAttendanceRules: parsed.studentAttendanceRules || DEFAULT_STUDENT_ATTENDANCE_RULES,
        teacherAttendanceRules: parsed.teacherAttendanceRules || DEFAULT_TEACHER_ATTENDANCE_RULES,
        behaviorScoreRules: parsed.behaviorScoreRules || DEFAULT_BEHAVIOR_RULES,
        behaviorLevels: parsed.behaviorLevels || DEFAULT_BEHAVIOR_LEVELS,
        alertRules: parsed.alertRules || DEFAULT_ALERT_RULES,
        leaveTypes: parsed.leaveTypes || DEFAULT_LEAVE_TYPES,
        permissionTypes: parsed.permissionTypes || DEFAULT_PERMISSION_TYPES,
        payrollRules: parsed.payrollRules || DEFAULT_PAYROLL_RULES,
        allowanceTypes: parsed.allowanceTypes || DEFAULT_ALLOWANCE_TYPES,
        deductionTypes: parsed.deductionTypes || DEFAULT_DEDUCTION_TYPES,
        parentPortalSettings: parsed.parentPortalSettings || DEFAULT_PARENT_PORTAL_SETTINGS,
        teacherPortalSettings: parsed.teacherPortalSettings || DEFAULT_TEACHER_PORTAL_SETTINGS,
        socialSpecialistSettings: parsed.socialSpecialistSettings || DEFAULT_SOCIAL_SPECIALIST_SETTINGS,
        importSettings: parsed.importSettings || DEFAULT_IMPORT_SETTINGS,
        exportSettings: parsed.exportSettings || DEFAULT_EXPORT_SETTINGS,
        dashboardSettings: parsed.dashboardSettings || DEFAULT_DASHBOARD_SETTINGS,
        rolePermissions: parsed.rolePermissions || DEFAULT_PERMISSION_MATRIX,
        configVersion: parsed.configVersion || '1.0.0',
        lastConfigUpdate: parsed.lastConfigUpdate || new Date().toISOString(),
      };
    } catch {
      return { ...INITIAL_SETTINGS };
    }
  }

  public saveSettings(newSettings: Partial<SystemSettings>, auditSummary = 'تحديث إعدادات النظام وقواعد المدرسة'): void {
    const current = this.getSettings();
    const newVersion = this.incrementVersion(current.configVersion || '1.0.0');
    const updated: SystemSettings = {
      ...current,
      ...newSettings,
      configVersion: newVersion,
      lastConfigUpdate: getCairoNowISO(),
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.logAudit(
      'UPDATE',
      'SETTINGS',
      auditSummary,
      JSON.stringify({ version: current.configVersion }),
      JSON.stringify({ version: newVersion })
    );
    this.startAutoSync();
    this.notifyChange();

    // Async sync settings to Google Sheets
    this.pushPost('saveSettings', updated).catch(() => {});
  }

  private incrementVersion(ver: string): string {
    try {
      const parts = ver.split('.').map(p => parseInt(p, 10) || 0);
      if (parts.length >= 3) {
        parts[2] += 1;
        return parts.join('.');
      }
      return `${ver}.1`;
    } catch {
      return '1.0.1';
    }
  }

  // ---------------- Dynamic Master Entity Getters ----------------
  public getGrades(): GradeItem[] {
    return this.getSettings().grades || DEFAULT_GRADES;
  }

  public getClassrooms(): ClassroomItem[] {
    return this.getSettings().classrooms || DEFAULT_CLASSROOMS;
  }

  public getSubjects(): SubjectItem[] {
    return this.getSettings().subjects || DEFAULT_SUBJECTS;
  }

  public getDepartments(): DepartmentItem[] {
    return this.getSettings().departments || DEFAULT_DEPARTMENTS;
  }

  public getJobTitles(): JobTitleItem[] {
    return this.getSettings().jobTitles || DEFAULT_JOB_TITLES;
  }

  public getStudentAttendanceStatuses(): StudentAttendanceStatusConfig[] {
    return this.getSettings().studentAttendanceStatuses || DEFAULT_STUDENT_ATTENDANCE_STATUSES;
  }

  public getLeaveTypesList(): LeaveTypeConfig[] {
    return this.getSettings().leaveTypes || DEFAULT_LEAVE_TYPES;
  }

  public getPermissionTypesList(): PermissionTypeConfig[] {
    return this.getSettings().permissionTypes || DEFAULT_PERMISSION_TYPES;
  }

  public getAllowanceTypes(): AllowanceTypeItem[] {
    return this.getSettings().allowanceTypes || DEFAULT_ALLOWANCE_TYPES;
  }

  public getDeductionTypes(): DeductionTypeItem[] {
    return this.getSettings().deductionTypes || DEFAULT_DEDUCTION_TYPES;
  }

  public getBehaviorLevels(): BehaviorLevelItem[] {
    return this.getSettings().behaviorLevels || DEFAULT_BEHAVIOR_LEVELS;
  }

  public getAlertRules(): AlertRuleItem[] {
    return this.getSettings().alertRules || DEFAULT_ALERT_RULES;
  }

  public getScheduleConfig(): ScheduleConfig {
    return this.getSettings().scheduleConfig || DEFAULT_SCHEDULE_CONFIG;
  }

  public exportSettingsJSON(): string {
    return this.exportSettingsBackupJSON();
  }

  public importSettingsJSON(jsonString: string): boolean {
    const res = this.importSettingsBackupJSON(jsonString);
    return res.success;
  }

  public resetToFactorySettings(): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    this.logAudit('UPDATE', 'SETTINGS', 'إعادة ضبط كافة إعدادات النظام وقواعد التشغيل إلى الوضع المصنعي الافتراضي');
    this.notifyChange();
  }

  public resetToDefaultSettings(): void {
    this.resetToFactorySettings();
  }

  // Check dependencies before deleting or disabling an item
  public checkDependencies(
    entityType: 'grade' | 'classroom' | 'subject' | 'department' | 'jobTitle' | 'leaveType' | 'behaviorType',
    idOrName: string
  ): {
    canDelete: boolean;
    studentCount: number;
    employeeCount: number;
    scheduleCount: number;
    violationCount: number;
    message: string;
  } {
    const students = this.getStudents();
    const employees = this.getEmployees();
    const schedules = this.getSchedule();
    const violations = this.getBehaviorViolations();

    let studentCount = 0;
    let employeeCount = 0;
    let scheduleCount = 0;
    let violationCount = 0;

    switch (entityType) {
      case 'grade': {
        studentCount = students.filter(s => s.grade === idOrName || (s as any).gradeId === idOrName).length;
        scheduleCount = schedules.filter(sc => sc.grade === idOrName || (sc as any).gradeId === idOrName).length;
        break;
      }
      case 'classroom': {
        studentCount = students.filter(s => s.classroom === idOrName || (s as any).classroomId === idOrName).length;
        scheduleCount = schedules.filter(sc => sc.classroom === idOrName || (sc as any).classroomId === idOrName).length;
        break;
      }
      case 'subject': {
        scheduleCount = schedules.filter(sc => sc.subject === idOrName || (sc as any).subjectId === idOrName).length;
        break;
      }
      case 'department': {
        employeeCount = employees.filter(e => e.department === idOrName || (e as any).departmentId === idOrName).length;
        break;
      }
      case 'jobTitle': {
        employeeCount = employees.filter(e => e.jobTitle === idOrName).length;
        break;
      }
      case 'behaviorType': {
        violationCount = violations.filter(v => v.behaviorTypeId === idOrName || v.violationTypeId === idOrName || v.violationName === idOrName).length;
        break;
      }
    }

    const totalUsage = studentCount + employeeCount + scheduleCount + violationCount;
    const canDelete = totalUsage === 0;

    let message = '';
    if (!canDelete) {
      const parts: string[] = [];
      if (studentCount > 0) parts.push(`${studentCount} طالب`);
      if (employeeCount > 0) parts.push(`${employeeCount} موظف`);
      if (scheduleCount > 0) parts.push(`${scheduleCount} حصة بالجدول`);
      if (violationCount > 0) parts.push(`${violationCount} مخالفة سلوكية مسجلة`);
      message = `لا يمكن الحذف لارتباط هذا العنصر بـ: ${parts.join(' و ')}. يفضل تعطيله بدلاً من حذفه.`;
    } else {
      message = 'لا توجد بيانات مرتبطة بهذا العنصر. يمكن حذفه بأمان.';
    }

    return {
      canDelete,
      studentCount,
      employeeCount,
      scheduleCount,
      violationCount,
      message,
    };
  }

  // Backup and Restore Configuration JSON
  public exportSettingsBackupJSON(): string {
    const settings = this.getSettings();
    return JSON.stringify(
      {
        appName: 'NTSS_SCHOOL_CONFIGURATION_BACKUP',
        exportedAt: getCairoNowISO(),
        configVersion: settings.configVersion,
        settings,
      },
      null,
      2
    );
  }

  public importSettingsBackupJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonStr);
      const incoming = parsed.settings || parsed;
      if (!incoming || typeof incoming !== 'object') {
        return { success: false, message: 'ملف التهيئة غير صالح' };
      }
      this.saveSettings(incoming, 'استعادة نسخة احتياطية لإعدادات النظام بالكامل');
      return { success: true, message: 'تم استعادة كافة إعدادات النظام بنجاح' };
    } catch (err: any) {
      return { success: false, message: `فشل استيراد الملف: ${err?.message || 'خطأ غير معروف'}` };
    }
  }

  public resetSettingsSection(sectionKey: string): void {
    const initial = { ...INITIAL_SETTINGS };
    const current = this.getSettings();
    if (sectionKey in initial) {
      (current as any)[sectionKey] = JSON.parse(JSON.stringify((initial as any)[sectionKey]));
      this.saveSettings(current, `إعادة ضبط قسم [${sectionKey}] للإعدادات الافتراضية`);
    }
  }

  // ---------------- Students Management ----------------
  public getStudents(): Student[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getStudentById(id: string): Student | undefined {
    if (!id) return undefined;
    return this.getStudents().find(s => s.id === id || s.studentCode === id);
  }

  public saveStudent(student: Student): { success: boolean; message?: string } {
    const list = this.getStudents();
    const idx = list.findIndex(s => s.id === student.id || (student.studentCode && s.studentCode === student.studentCode));
    const now = getCairoNowISO();

    if (idx >= 0) {
      const old = list[idx];
      list[idx] = { ...old, ...student, updatedAt: now };
      this.logAudit('UPDATE', 'STUDENT', `تعديل بيانات الطالب: ${student.name} (${student.studentCode})`, JSON.stringify(old), JSON.stringify(student), student.id);
    } else {
      const newStudent: Student = {
        ...student,
        id: student.id || `STD-${Date.now().toString().slice(-6)}`,
        createdAt: student.createdAt || now,
        updatedAt: now,
        initialBehaviorScore: student.initialBehaviorScore ?? 100,
        status: student.status || 'نشط',
      };
      list.unshift(newStudent);
      this.logAudit('CREATE', 'STUDENT', `إضافة طالب جديد: ${newStudent.name} (${newStudent.studentCode})`, '', JSON.stringify(newStudent), newStudent.id);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveStudent', student).catch(() => {});
    return { success: true, message: 'تم حفظ بيانات الطالب بنجاح' };
  }

  public deleteStudent(id: string): { success: boolean; message?: string } {
    const list = this.getStudents();
    const target = list.find(s => s.id === id);
    const filtered = list.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
    if (target) {
      this.logAudit('DELETE', 'STUDENT', `حذف الطالب: ${target.name} (${target.studentCode})`, JSON.stringify(target), '', id);
    }
    this.notifyChange();
    this.pushPost('deleteStudent', { id }).catch(() => {});
    return { success: true, message: 'تم حذف الطالب بنجاح' };
  }

  public bulkSaveStudents(newStudents: Student[]): { added: number; updated: number; errors: string[] } {
    const currentList = this.getStudents();
    const studentMap = new Map<string, Student>();
    currentList.forEach(s => studentMap.set(s.id, s));
    currentList.forEach(s => {
      if (s.studentCode) studentMap.set(s.studentCode, s);
      if (s.nationalId) studentMap.set(s.nationalId, s);
    });

    let added = 0;
    let updated = 0;
    const errors: string[] = [];
    const now = getCairoNowISO();

    newStudents.forEach((student, index) => {
      if (!student.name || student.name.trim().length === 0) {
        errors.push(`السجل رقم ${index + 1}: اسم الطالب مفقود`);
        return;
      }

      const existing = (student.id && studentMap.get(student.id)) ||
        (student.studentCode && studentMap.get(student.studentCode)) ||
        (student.nationalId && studentMap.get(student.nationalId));

      if (existing) {
        const updatedRecord: Student = {
          ...existing,
          ...student,
          id: existing.id,
          updatedAt: now,
        };
        const idx = currentList.findIndex(s => s.id === existing.id);
        if (idx >= 0) currentList[idx] = updatedRecord;
        updated++;
      } else {
        const id = student.id || `STD-${Date.now().toString().slice(-6)}-${index + 1}`;
        const newRecord: Student = {
          ...student,
          id,
          studentCode: student.studentCode || `C-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: now,
          updatedAt: now,
          status: student.status || 'نشط',
          initialBehaviorScore: student.initialBehaviorScore ?? 100,
        };
        currentList.push(newRecord);
        studentMap.set(id, newRecord);
        added++;
      }
    });

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(currentList));
    this.logAudit('IMPORT', 'IMPORT', `استيراد مجمع للطلاب: تمت إضافة ${added} وتحديث ${updated}`);
    this.notifyChange();
    this.pushPost('bulkSaveStudents', currentList).catch(() => {});

    return { added, updated, errors };
  }

  // ---------------- Attendance Day Workflow & Student School Attendance ----------------
  public getAttendanceDays(academicYearId?: string): AttendanceDay[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_DAYS);
    if (!raw) return [];
    try {
      const parsed: AttendanceDay[] = JSON.parse(raw);
      if (academicYearId) {
        return parsed.filter(d => d.academicYearId === academicYearId);
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public getAttendanceDayByDate(date: string, academicYearId?: string): AttendanceDay | undefined {
    const days = this.getAttendanceDays();
    if (academicYearId) {
      return days.find(d => d.date === date && d.academicYearId === academicYearId) || days.find(d => d.date === date);
    }
    return days.find(d => d.date === date);
  }

  public saveAttendanceDay(day: AttendanceDay): { success: boolean; message?: string } {
    const list = this.getAttendanceDays();
    const idx = list.findIndex(d => d.id === day.id || (d.date === day.date && d.academicYearId === day.academicYearId));
    
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...day, version: (list[idx].version || 0) + 1 };
    } else {
      list.unshift({ ...day, id: day.id || `DAY-${day.date}`, version: 1 });
    }

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_DAYS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveAttendanceDay', day).catch(() => {});
    return { success: true, message: 'تم حفظ سجل يوم الحضور بنجاح' };
  }

  public recalculateAttendanceDayCounts(date: string, academicYearId?: string): AttendanceDay {
    const activeYear = academicYearId ? this.getAcademicYearById(academicYearId) : this.getActiveAcademicYear();
    const yearId = activeYear?.id || 'AY_CURRENT';
    const activeStudents = this.getStudents().filter(s => s.status === 'نشط');
    const allAttendance = this.getStudentAttendance().filter(a => a.date === date);
    const existingDay = this.getAttendanceDayByDate(date, yearId);

    const recordMap = new Map<string, StudentAttendanceRecord>();
    allAttendance.forEach(r => recordMap.set(r.studentId, r));

    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let unrecordedCount = 0;

    activeStudents.forEach(s => {
      const rec = recordMap.get(s.id);
      if (!rec || rec.status === 'لم يسجل' || !rec.status) {
        unrecordedCount++;
      } else if (rec.status === 'حاضر') {
        presentCount++;
      } else if (rec.status === 'متأخر') {
        lateCount++;
      } else if (rec.status === 'غائب بعذر') {
        absentCount++;
        excusedCount++;
      } else if (rec.status === 'غائب' || rec.status === 'غائب بدون عذر' || rec.status === 'هروب') {
        absentCount++;
      } else {
        presentCount++;
      }
    });

    const recordedCount = activeStudents.length - unrecordedCount;

    const dayRecord: AttendanceDay = {
      id: existingDay?.id || `DAY-${date}-${yearId}`,
      date,
      academicYearId: yearId,
      academicYearName: activeYear?.name || '2025/2026',
      dayName: getEgyptianDayName(date),
      status: existingDay?.status || 'Open',
      totalStudentsCount: activeStudents.length,
      recordedCount,
      presentCount,
      lateCount,
      absentCount,
      excusedCount,
      unrecordedCount,
      openedAt: existingDay?.openedAt || getCairoNowISO(),
      openedBy: existingDay?.openedBy || this.getCurrentUser()?.fullName || 'النظام',
      reviewedAt: existingDay?.reviewedAt,
      reviewedBy: existingDay?.reviewedBy,
      reviewNotes: existingDay?.reviewNotes,
      approvedAt: existingDay?.approvedAt,
      approvedBy: existingDay?.approvedBy,
      lockedAt: existingDay?.lockedAt,
      lockedBy: existingDay?.lockedBy,
      lockNotes: existingDay?.lockNotes,
      version: (existingDay?.version || 0) + 1,
    };

    this.saveAttendanceDay(dayRecord);
    return dayRecord;
  }

  public openAttendanceDay(date: string, academicYearId?: string): { success: boolean; day: AttendanceDay; message?: string } {
    const activeYear = academicYearId ? this.getAcademicYearById(academicYearId) : this.getActiveAcademicYear();
    const yearId = activeYear?.id || 'AY_CURRENT';
    const user = this.getCurrentUser();
    const existing = this.getAttendanceDayByDate(date, yearId);

    if (existing && existing.status === 'Locked') {
      return { success: false, day: existing, message: 'اليوم مقفل ولا يمكن فتحه إلا من خلال صلاحية فك القفل الاستثنائية.' };
    }

    const day = this.recalculateAttendanceDayCounts(date, yearId);
    day.status = 'Open';
    day.openedAt = getCairoNowISO();
    day.openedBy = user?.fullName || 'مدير النظام';
    
    this.saveAttendanceDay(day);
    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `فتح يوم الحضور المدرسي بتاريخ (${date})`);
    return { success: true, day, message: `تم فتح يوم الحضور (${date}) بنجاح` };
  }

  public reviewAttendanceDay(date: string, academicYearId?: string, reviewNotes?: string) {
    const activeYear = academicYearId ? this.getAcademicYearById(academicYearId) : this.getActiveAcademicYear();
    const yearId = activeYear?.id || 'AY_CURRENT';
    const students = this.getStudents();
    const enrollments = this.getStudentEnrollments();
    const schoolAttendance = this.getStudentAttendance();
    const classAttendance = this.getClassAttendance();
    const settings = this.getSettings();
    const statuses = settings.studentAttendanceStatuses || DEFAULT_STUDENT_ATTENDANCE_STATUSES;
    const existingDay = this.getAttendanceDayByDate(date, yearId);

    const review = computeAttendanceDayReview({
      date,
      academicYearId: yearId,
      students,
      enrollments,
      schoolAttendance,
      classAttendance,
      dayRecord: existingDay,
      settings,
      statuses,
    });

    const user = this.getCurrentUser();
    const day = this.recalculateAttendanceDayCounts(date, yearId);
    day.status = 'UnderReview';
    day.reviewedAt = getCairoNowISO();
    day.reviewedBy = user?.fullName || 'مراجع الحضور';
    day.reviewNotes = reviewNotes || existingDay?.reviewNotes;

    this.saveAttendanceDay(day);

    // Save generated exceptions if any
    if (review.exceptions.length > 0) {
      this.batchSaveAttendanceExceptions(review.exceptions);
    }

    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `مراجعة يوم الحضور المدرسي (${date}): مسجل ${review.recordedCount}/${review.totalActiveStudents} (${review.warnings.length} تنبيهات)`);
    return { success: true, day, review, message: 'تمت مراجعة يوم الحضور وفحص كافة الاستثناءات والتطابق' };
  }

  public approveAttendanceDay(
    date: string,
    academicYearId?: string,
    policy: 'block' | 'convertToAbsent' | 'allowNotRecorded' = 'block'
  ): { success: boolean; day: AttendanceDay; message?: string; errors?: string[] } {
    const activeYear = academicYearId ? this.getAcademicYearById(academicYearId) : this.getActiveAcademicYear();
    const yearId = activeYear?.id || 'AY_CURRENT';
    const day = this.recalculateAttendanceDayCounts(date, yearId);
    const user = this.getCurrentUser();

    if (day.unrecordedCount > 0) {
      if (policy === 'block') {
        return {
          success: false,
          day,
          errors: [`لا يمكن اعتماد اليوم لوجود (${day.unrecordedCount}) طالب لم يتم رصد حضورهم بعد.`],
          message: 'يجب رصد جميع الطلاب أو اختيار تحويل غير المسجلين إلى غياب.',
        };
      } else if (policy === 'convertToAbsent') {
        // Convert unrecorded students to absent
        const activeStudents = this.getStudents().filter(s => s.status === 'نشط');
        const dayAttendance = this.getStudentAttendance().filter(a => a.date === date);
        const recordedIds = new Set(dayAttendance.map(a => a.studentId));
        const unrecordedList = activeStudents.filter(s => !recordedIds.has(s.id));

        const autoAbsentRecords: StudentAttendanceRecord[] = unrecordedList.map(s => ({
          id: `ATT-STD-${s.id}-${date}`,
          studentId: s.id,
          studentCode: s.studentCode,
          studentName: s.name,
          academicYearId: yearId,
          stage: s.stage || 'المرحلة الثانوية',
          grade: s.grade,
          classroom: s.classroom,
          date,
          dayName: getEgyptianDayName(date),
          status: 'غائب بدون عذر',
          notes: 'تم تحويله لغائب تلقائياً عند اعتماد اليوم',
          recordedBy: `النظام (${user?.fullName || 'الاعتماد'})`,
          recordedAt: getCairoNowISO(),
        }));

        this.bulkSaveStudentAttendance(autoAbsentRecords);
        this.recalculateAttendanceDayCounts(date, yearId);
      }
    }

    day.status = 'Approved';
    day.approvedAt = getCairoNowISO();
    day.approvedBy = user?.fullName || 'وكيل شؤون الطلاب';

    this.saveAttendanceDay(day);
    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `اعتماد حضور يوم (${date}) رسمياً لـ (${day.totalStudentsCount}) طالب`);
    return { success: true, day, message: `تم اعتماد حضور يوم (${date}) بنجاح وجاهز للقفل النهائي` };
  }

  public lockAttendanceDay(date: string, academicYearId?: string, lockNotes?: string): { success: boolean; day: AttendanceDay; message?: string } {
    const activeYear = academicYearId ? this.getAcademicYearById(academicYearId) : this.getActiveAcademicYear();
    const yearId = activeYear?.id || 'AY_CURRENT';
    const day = this.recalculateAttendanceDayCounts(date, yearId);
    const user = this.getCurrentUser();

    day.status = 'Locked';
    day.lockedAt = getCairoNowISO();
    day.lockedBy = user?.fullName || 'مدير المدرسة';
    day.lockNotes = lockNotes;

    this.saveAttendanceDay(day);
    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `قفل يوم الحضور المدرسي (${date}) نهائياً لمنع التعديل: ${lockNotes || 'قفل نهائي'}`);
    return { success: true, day, message: `تم قفل يوم الحضور (${date}) نهائياً وتأمين السجلات` };
  }

  public unlockAttendanceDay(date: string, academicYearId?: string, overrideReason = 'فك قفل استثنائي بتصريح إدارة المدرسة'): { success: boolean; day: AttendanceDay; message?: string } {
    const activeYear = academicYearId ? this.getAcademicYearById(academicYearId) : this.getActiveAcademicYear();
    const yearId = activeYear?.id || 'AY_CURRENT';
    const day = this.recalculateAttendanceDayCounts(date, yearId);
    const user = this.getCurrentUser();

    day.status = 'Open';
    day.lockedAt = undefined;
    day.lockedBy = undefined;
    day.lockNotes = `تم فك القفل بتاريخ ${getCairoNowISO()}: ${overrideReason}`;

    this.saveAttendanceDay(day);
    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `فك قفل يوم الحضور المدرسي (${date}) استثنائياً: ${overrideReason}`);
    return { success: true, day, message: `تم فك قفل يوم (${date}) بنجاح وأصبح متاحاً للتعديل` };
  }

  public overrideLockedAttendance(params: {
    studentId: string;
    date: string;
    updates: Partial<StudentAttendanceRecord>;
    reason: string;
  }): { success: boolean; record?: StudentAttendanceRecord; message?: string } {
    const { studentId, date, updates, reason } = params;
    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'يجب كتابة سبب واضح ومفصل للتعديل الاستثنائي على السجل المقفل.' };
    }

    const list = this.getStudentAttendance();
    const idx = list.findIndex(r => r.studentId === studentId && r.date === date);
    const user = this.getCurrentUser();
    const now = getCairoNowISO();

    let oldRecord: StudentAttendanceRecord | undefined;
    let updated: StudentAttendanceRecord;

    if (idx >= 0) {
      oldRecord = { ...list[idx] };
      updated = {
        ...list[idx],
        ...updates,
        notes: `${list[idx].notes || ''} [تعديل استثنائي: ${reason}]`,
        updatedBy: user?.fullName || 'مدير النظام',
        updatedAt: now,
        version: (list[idx].version || 0) + 1,
      };
      list[idx] = updated;
    } else {
      const student = this.getStudentById(studentId);
      updated = {
        id: `ATT-STD-${studentId}-${date}`,
        studentId,
        studentName: student?.name || studentId,
        studentCode: student?.studentCode,
        stage: student?.stage || 'المرحلة الثانوية',
        grade: student?.grade || '',
        classroom: student?.classroom || '',
        date,
        dayName: getEgyptianDayName(date),
        status: updates.status || 'حاضر',
        ...updates,
        notes: `[تعديل استثنائي: ${reason}]`,
        recordedBy: user?.fullName || 'مدير النظام',
        recordedAt: now,
        version: 1,
      };
      list.unshift(updated);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify(list));
    this.recalculateAttendanceDayCounts(date);

    this.logAudit(
      'UPDATE',
      'STUDENT_ATTENDANCE',
      `تعديل استثنائي لسجل حضور مقفل: للطالب (${updated.studentName}) بتاريخ (${date}) - السبب: ${reason}`,
      JSON.stringify(oldRecord || {}),
      JSON.stringify(updated),
      studentId
    );

    this.notifyChange();
    this.pushPost('overrideAttendanceRecord', { studentId, date, updates, reason }).catch(() => {});
    return { success: true, record: updated, message: 'تم تطبيق التعديل الاستثنائي وتوثيقه في سجل الرقابة والمراجعة.' };
  }

  // ---------------- Student School Attendance ----------------
  public getStudentAttendance(): StudentAttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_ATTENDANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveStudentAttendanceRecord(rec: StudentAttendanceRecord): { success: boolean; message?: string; dayLocked?: boolean } {
    const day = this.getAttendanceDayByDate(rec.date);
    if (day && day.status === 'Locked') {
      return {
        success: false,
        dayLocked: true,
        message: 'اليوم مقفل ولا يمكن التعديل عليه بدون إجراء التعديل الاستثنائي مع توثيق السبب.',
      };
    }

    const list = this.getStudentAttendance();
    const idx = list.findIndex(r => r.studentId === rec.studentId && r.date === rec.date);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();
    const settings = this.getSettings();

    // Auto calculate late minutes if checkInTime provided
    let calculatedLateMinutes = rec.lateMinutes;
    if (rec.checkInTime && settings.studentAttendanceRules) {
      const lateCalc = calculateStudentLateMinutes(rec.checkInTime, settings.studentAttendanceRules);
      calculatedLateMinutes = lateCalc.lateMinutes;
    }

    const prepared: StudentAttendanceRecord = {
      ...rec,
      id: rec.id || `ATT-STD-${rec.studentId}-${rec.date}`,
      lateMinutes: calculatedLateMinutes,
      recordedBy: rec.recordedBy || user?.fullName || 'شؤون الطلاب',
      recordedAt: rec.recordedAt || now,
      updatedAt: now,
      version: (rec.version || 0) + 1,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify(list));
    this.recalculateAttendanceDayCounts(rec.date);
    this.notifyChange();
    this.pushPost('saveStudentAttendance', prepared).catch(() => {});
    return { success: true, message: 'تم حفظ سجل حضور الطالب بنجاح' };
  }

  public bulkSaveStudentAttendance(records: StudentAttendanceRecord[]): void {
    this.saveStudentSchoolAttendanceBatch(records);
  }

  public saveStudentSchoolAttendanceBatch(records: StudentAttendanceRecord[]): { success: boolean; count: number; dayLocked?: boolean; message?: string } {
    if (records.length === 0) return { success: true, count: 0 };

    const firstDate = records[0].date;
    const day = this.getAttendanceDayByDate(firstDate);
    if (day && day.status === 'Locked') {
      return {
        success: false,
        count: 0,
        dayLocked: true,
        message: 'اليوم مقفل نهائياً. لا يمكن حفظ التعديلات الجماعية على يوم مقفل.',
      };
    }

    const list = this.getStudentAttendance();
    const map = new Map<string, number>();
    list.forEach((r, i) => map.set(`${r.studentId}_${r.date}`, i));
    const now = getCairoNowISO();
    const user = this.getCurrentUser();
    const settings = this.getSettings();

    records.forEach(rec => {
      const key = `${rec.studentId}_${rec.date}`;
      let calculatedLateMinutes = rec.lateMinutes;
      if (rec.checkInTime && settings.studentAttendanceRules) {
        const lateCalc = calculateStudentLateMinutes(rec.checkInTime, settings.studentAttendanceRules);
        calculatedLateMinutes = lateCalc.lateMinutes;
      }

      const prepared: StudentAttendanceRecord = {
        ...rec,
        id: rec.id || `ATT-STD-${rec.studentId}-${rec.date}`,
        lateMinutes: calculatedLateMinutes,
        recordedBy: rec.recordedBy || user?.fullName || 'شؤون الطلاب',
        recordedAt: rec.recordedAt || now,
        updatedAt: now,
        version: (rec.version || 0) + 1,
      };

      if (map.has(key)) {
        const idx = map.get(key)!;
        list[idx] = prepared;
      } else {
        list.push(prepared);
        map.set(key, list.length - 1);
      }
    });

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify(list));
    this.recalculateAttendanceDayCounts(firstDate);
    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `رصد حضور جماعي للمدرسة لعدد (${records.length}) طالب بتاريخ (${firstDate})`);
    this.notifyChange();
    this.pushPost('saveStudentSchoolAttendanceBatch', records).catch(() => {});
    return { success: true, count: records.length, message: `تم رصد حضور (${records.length}) طالب بنجاح` };
  }

  // ---------------- Attendance Exceptions ----------------
  public getAttendanceExceptions(filters?: {
    date?: string;
    status?: 'OPEN' | 'RESOLVED' | 'DISMISSED';
    studentId?: string;
  }): AttendanceException[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE_EXCEPTIONS);
    if (!raw) return [];
    try {
      const parsed: AttendanceException[] = JSON.parse(raw);
      if (!filters) return parsed;
      return parsed.filter(e => {
        if (filters.date && e.date !== filters.date) return false;
        if (filters.status && e.status !== filters.status) return false;
        if (filters.studentId && e.studentId !== filters.studentId) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  public batchSaveAttendanceExceptions(exceptions: AttendanceException[]): void {
    const list = this.getAttendanceExceptions();
    const map = new Map<string, number>();
    list.forEach((e, i) => map.set(e.id, i));

    exceptions.forEach(exc => {
      if (map.has(exc.id)) {
        list[map.get(exc.id)!] = { ...list[map.get(exc.id)!], ...exc };
      } else {
        list.unshift(exc);
        map.set(exc.id, 0);
      }
    });

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_EXCEPTIONS, JSON.stringify(list));
    this.notifyChange();
  }

  public resolveAttendanceException(
    exceptionId: string,
    resolution: string,
    status: 'RESOLVED' | 'DISMISSED' = 'RESOLVED'
  ): { success: boolean; message?: string } {
    const list = this.getAttendanceExceptions();
    const target = list.find(e => e.id === exceptionId);
    if (!target) return { success: false, message: 'الاستثناء غير موجود' };

    const user = this.getCurrentUser();
    target.status = status;
    target.resolution = resolution;
    target.resolvedBy = user?.fullName || 'مشرف الحضور';
    target.resolvedAt = getCairoNowISO();

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE_EXCEPTIONS, JSON.stringify(list));
    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `معالجة استثناء الحضور (${target.studentName}): ${resolution}`);
    this.notifyChange();
    return { success: true, message: 'تمت تسوية استثناء الحضور بنجاح' };
  }

  // ---------------- Behavior & Violations ----------------
  public getBehaviorTypes(): BehaviorType[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BEHAVIOR_TYPES);
    if (!raw) return DEFAULT_BEHAVIOR_TYPES;
    try {
      const parsed = JSON.parse(raw);
      return parsed.length > 0 ? parsed : DEFAULT_BEHAVIOR_TYPES;
    } catch {
      return DEFAULT_BEHAVIOR_TYPES;
    }
  }

  public saveBehaviorType(type: BehaviorType): void {
    const list = this.getBehaviorTypes();
    const idx = list.findIndex(t => t.id === type.id);
    if (idx >= 0) {
      list[idx] = type;
    } else {
      list.push({ ...type, id: type.id || `BEH-${Date.now()}` });
    }
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_TYPES, JSON.stringify(list));
    this.logAudit('UPDATE', 'BEHAVIOR', `تعديل دليل المخالفات: ${type.name}`);
    this.notifyChange();
    this.pushPost('saveBehaviorType', type).catch(() => {});
  }

  public deleteBehaviorType(id: string): void {
    const list = this.getBehaviorTypes().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_TYPES, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('deleteBehaviorType', { id }).catch(() => {});
  }

  public getBehaviorViolations(): BehaviorViolation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BEHAVIOR_VIOLATIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveBehaviorViolation(violation: BehaviorViolation): void {
    const list = this.getBehaviorViolations();
    const idx = list.findIndex(v => v.id === violation.id);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: BehaviorViolation = {
      ...violation,
      id: violation.id || `VIO-${Date.now()}`,
      recordedBy: violation.recordedBy || user?.fullName || 'المشرف',
      createdAt: violation.createdAt || now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
      this.logAudit('UPDATE', 'BEHAVIOR', `تعديل مخالفة للطالب: ${prepared.studentName} - ${prepared.violationName}`);
    } else {
      list.unshift(prepared);
      this.logAudit('CREATE', 'BEHAVIOR', `تسجيل مخالفة جديدة: ${prepared.studentName} - ${prepared.violationName} (-${prepared.pointsDeducted} نقطة)`);
    }

    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_VIOLATIONS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveViolation', prepared).catch(() => {});
  }

  public deleteBehaviorViolation(id: string): void {
    const list = this.getBehaviorViolations();
    const target = list.find(v => v.id === id);
    const filtered = list.filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_VIOLATIONS, JSON.stringify(filtered));
    if (target) {
      this.logAudit('DELETE', 'BEHAVIOR', `حذف مخالفة للطالب: ${target.studentName}`);
    }
    this.notifyChange();
    this.pushPost('deleteViolation', { id }).catch(() => {});
  }

  public calculateStudentBehaviorScore(studentId: string): { currentScore: number; violationsCount: number; statusText: string; statusColor: string } {
    const settings = this.getSettings();
    const rules = settings.behaviorScoreRules || DEFAULT_BEHAVIOR_RULES;
    const violations = this.getBehaviorViolations().filter(v => v.studentId === studentId && v.status !== 'ملغاة');

    const totalDeductions = violations.reduce((sum, v) => sum + (v.pointsDeducted || 0), 0);
    const currentScore = Math.max(rules.minScore, rules.initialScore - totalDeductions);

    let statusText = 'ممتاز';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';

    if (currentScore < rules.dangerThreshold) {
      statusText = 'يحتاج تدخل الإدارة';
      statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (currentScore < rules.warningThreshold) {
      statusText = 'يحتاج متابعة سلوكية';
      statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (currentScore < rules.goodThreshold) {
      statusText = 'جيد';
      statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
    }

    return {
      currentScore,
      violationsCount: violations.length,
      statusText,
      statusColor,
    };
  }

  // ---------------- Class-by-Class Attendance (Period Attendance) ----------------
  public getClassAttendance(filters?: {
    date?: string;
    studentId?: string;
    grade?: string;
    classroom?: string;
    periodNumber?: number;
    teacherId?: string;
  }): ClassAttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASS_ATTENDANCE);
    if (!raw) return [];
    try {
      const parsed: ClassAttendanceRecord[] = JSON.parse(raw);
      if (!filters) return parsed;
      return parsed.filter(c => {
        if (filters.date && c.date !== filters.date) return false;
        if (filters.studentId && c.studentId !== filters.studentId) return false;
        if (filters.grade && c.grade !== filters.grade) return false;
        if (filters.classroom && c.classroom !== filters.classroom) return false;
        if (filters.periodNumber !== undefined && c.periodNumber !== filters.periodNumber) return false;
        if (filters.teacherId && c.teacherId !== filters.teacherId) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  public saveClassAttendanceRecord(rec: ClassAttendanceRecord): { success: boolean; message?: string } {
    const day = this.getAttendanceDayByDate(rec.date);
    if (day && day.status === 'Locked') {
      return { success: false, message: 'اليوم الدراسي مقفل نهائياً. لا يمكن تعديل حضور الحصص ليوم مقفل.' };
    }

    const list = this.getClassAttendance();
    const idx = list.findIndex(
      r => r.studentId === rec.studentId && r.date === rec.date && r.periodNumber === rec.periodNumber
    );
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: ClassAttendanceRecord = {
      ...rec,
      id: rec.id || `ATT-CLS-${rec.studentId}-${rec.date}-P${rec.periodNumber}`,
      teacherName: rec.teacherName || user?.fullName || 'المعلم',
      recordedAt: rec.recordedAt || now,
      updatedAt: now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.CLASS_ATTENDANCE, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveClassAttendance', prepared).catch(() => {});
    return { success: true, message: 'تم حفظ حضور الحصة بنجاح' };
  }

  public saveClassAttendanceBatch(records: ClassAttendanceRecord[]): {
    success: boolean;
    count: number;
    exceptionsGenerated: number;
    message?: string;
  } {
    if (records.length === 0) return { success: true, count: 0, exceptionsGenerated: 0 };

    const firstDate = records[0].date;
    const day = this.getAttendanceDayByDate(firstDate);
    if (day && day.status === 'Locked') {
      return {
        success: false,
        count: 0,
        exceptionsGenerated: 0,
        message: 'اليوم الدراسي مقفل نهائياً. لا يمكن تعديل أو رصد حضور الحصص ليوم مقفل.',
      };
    }

    const list = this.getClassAttendance();
    const map = new Map<string, number>();
    list.forEach((r, i) => map.set(`${r.studentId}_${r.date}_${r.periodNumber}`, i));
    const now = getCairoNowISO();
    const user = this.getCurrentUser();
    const date = records[0].date;

    // For cross-reference mismatch checking
    const schoolAttendance = this.getStudentAttendance().filter(a => a.date === date);
    const schoolMap = new Map<string, StudentAttendanceRecord>();
    schoolAttendance.forEach(s => schoolMap.set(s.studentId, s));

    const generatedExceptions: AttendanceException[] = [];

    records.forEach(rec => {
      const key = `${rec.studentId}_${rec.date}_${rec.periodNumber}`;
      const prepared: ClassAttendanceRecord = {
        ...rec,
        id: rec.id || `ATT-CLS-${rec.studentId}-${rec.date}-P${rec.periodNumber}`,
        teacherName: rec.teacherName || user?.fullName || 'المعلم',
        recordedAt: rec.recordedAt || now,
        updatedAt: now,
      };

      if (map.has(key)) {
        const idx = map.get(key)!;
        list[idx] = prepared;
      } else {
        list.push(prepared);
        map.set(key, list.length - 1);
      }

      // Check Mismatches with School Attendance
      const schoolRec = schoolMap.get(rec.studentId);
      if (schoolRec) {
        const isSchoolAbsent = schoolRec.status === 'غائب' || schoolRec.status === 'غائب بدون عذر' || schoolRec.status === 'غائب بعذر';
        const isClassPresent = rec.status === 'حاضر' || rec.status === 'متأخر';

        if (isSchoolAbsent && isClassPresent) {
          generatedExceptions.push({
            id: `EXC-ABS-PRS-${rec.studentId}-${rec.date}-P${rec.periodNumber}`,
            studentId: rec.studentId,
            studentName: rec.studentName,
            studentCode: rec.studentCode,
            grade: rec.grade,
            classroom: rec.classroom,
            date: rec.date,
            periodNumber: rec.periodNumber,
            type: 'SCHOOL_ABSENT_CLASS_PRESENT',
            severity: 'CRITICAL',
            description: `الطالب مسجل غائب في الحضور المدرسي العام، ولكنه رُصد ${rec.status} في حصة ${rec.subjectName || ''} (حصة ${rec.periodNumber}).`,
            schoolStatus: schoolRec.status,
            classStatus: rec.status,
            status: 'OPEN',
            createdAt: now,
          });
        }

        const isSchoolPresent = schoolRec.status === 'حاضر' || schoolRec.status === 'متأخر';
        const isClassAbsent = rec.status === 'غائب' || rec.status === 'هروب';

        if (isSchoolPresent && isClassAbsent) {
          generatedExceptions.push({
            id: `EXC-PRS-ABS-${rec.studentId}-${rec.date}-P${rec.periodNumber}`,
            studentId: rec.studentId,
            studentName: rec.studentName,
            studentCode: rec.studentCode,
            grade: rec.grade,
            classroom: rec.classroom,
            date: rec.date,
            periodNumber: rec.periodNumber,
            type: rec.status === 'هروب' ? 'CLASS_TRUANCY' : 'SCHOOL_PRESENT_CLASS_ABSENT',
            severity: rec.status === 'هروب' ? 'CRITICAL' : 'WARNING',
            description: rec.status === 'هروب'
              ? `اشتباه هروب: الطالب حاضر في المدرسة لكنه هرَب من حصة ${rec.subjectName || ''} (حصة ${rec.periodNumber}).`
              : `الطالب حاضر بالمدرسة ولكنه لم يحضر حصة ${rec.subjectName || ''} (حصة ${rec.periodNumber}).`,
            schoolStatus: schoolRec.status,
            classStatus: rec.status,
            status: 'OPEN',
            createdAt: now,
          });
        }
      }
    });

    localStorage.setItem(STORAGE_KEYS.CLASS_ATTENDANCE, JSON.stringify(list));

    if (generatedExceptions.length > 0) {
      this.batchSaveAttendanceExceptions(generatedExceptions);
    }

    this.logAudit(
      'UPDATE',
      'CLASS_ATTENDANCE',
      `رصد حضور جماعي للحصة: (${records.length}) طالب - مادة ${records[0]?.subjectName || ''} - فصل (${records[0]?.grade} ${records[0]?.classroom}) - تم رصد (${generatedExceptions.length}) استثناء`
    );

    this.notifyChange();
    this.pushPost('saveClassAttendanceBatch', records).catch(() => {});
    return {
      success: true,
      count: records.length,
      exceptionsGenerated: generatedExceptions.length,
      message: `تم رصد حضور الحصة لـ (${records.length}) طالب بنجاح`,
    };
  }

  // ---------------- Schedule Periods & Config ----------------
  public getSchedulePeriods(): SchedulePeriodItem[] {
    const settings = this.getSettings();
    return settings.scheduleConfig?.periods || DEFAULT_SCHEDULE_CONFIG.periods;
  }

  public saveSchedulePeriods(periods: SchedulePeriodItem[]): void {
    const settings = this.getSettings();
    const scheduleConfig = settings.scheduleConfig || { ...DEFAULT_SCHEDULE_CONFIG };
    scheduleConfig.periods = periods;
    this.saveSettings({ scheduleConfig }, `تحديث توقيتات وتفاصيل الحصص الدراسية (${periods.length} حصة)`);
  }

  // ---------------- Schedule & Lesson Content ----------------
  public getSchedule(): ScheduleItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveScheduleItem(item: ScheduleItem): void {
    const list = this.getSchedule();
    const idx = list.findIndex(s => s.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push({ ...item, id: item.id || `SCH-${Date.now()}` });
    }
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(list));
    this.logAudit('UPDATE', 'SCHEDULE', `تعديل الجدول الدراسي: ${item.grade} ${item.classroom} - ${item.subject}`);
    this.notifyChange();
    this.pushPost('saveScheduleItem', item).catch(() => {});
  }

  public deleteScheduleItem(id: string): void {
    const list = this.getSchedule().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('deleteScheduleItem', { id }).catch(() => {});
  }

  public getLessonContents(): LessonContent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LESSON_CONTENT);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveLessonContent(lesson: LessonContent): void {
    const list = this.getLessonContents();
    const idx = list.findIndex(l => l.id === lesson.id);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: LessonContent = {
      ...lesson,
      id: lesson.id || `LES-${Date.now()}`,
      teacherName: lesson.teacherName || user?.fullName || 'المعلم',
      createdAt: lesson.createdAt || now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.LESSON_CONTENT, JSON.stringify(list));
    this.logAudit('CREATE', 'LESSON', `تسجيل ما تم تدريسه: ${prepared.subject} (${prepared.grade} - ${prepared.classroom}) - ${prepared.lessonTitle}`);
    this.notifyChange();
    this.pushPost('saveLessonContent', prepared).catch(() => {});
  }

  // ---------------- Homework Engine ----------------
  public getHomeworks(): Homework[] {
    const raw = localStorage.getItem(STORAGE_KEYS.HOMEWORKS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveHomework(hw: Partial<Homework>): Homework {
    const list = this.getHomeworks();
    const idx = list.findIndex(h => h.id === hw.id);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: Homework = {
      id: hw.id || `HW-${Date.now()}`,
      lessonInstanceId: hw.lessonInstanceId,
      scheduleItemId: hw.scheduleItemId,
      teacherId: hw.teacherId || user?.employeeId || user?.id || 'TCH',
      teacherName: hw.teacherName || user?.fullName || 'المعلم',
      subject: hw.subject || 'المادة',
      grade: hw.grade || '',
      classroom: hw.classroom || '',
      title: hw.title || 'واجب مدرسي',
      description: hw.description || '',
      questions: hw.questions || '',
      assignedDate: hw.assignedDate || now.split('T')[0],
      dueDate: hw.dueDate || now.split('T')[0],
      maxScore: hw.maxScore || 10,
      status: (hw.status as any) || 'Published',
      isVisibleToParent: hw.isVisibleToParent !== false,
      isVisibleToStudent: hw.isVisibleToStudent !== false,
      links: hw.links || [],
      createdAt: hw.createdAt || now,
      updatedAt: now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.HOMEWORKS, JSON.stringify(list));
    this.logAudit('CREATE', 'LESSON', `تكليف واجب: ${prepared.title} - ${prepared.subject} (${prepared.classroom})`);
    this.notifyChange();
    this.pushPost('saveHomework', prepared).catch(() => {});
    return prepared;
  }

  // ---------------- Payroll Engine ----------------
  public getPayrollRecords(): PayrollRecord[] {
    const user = this.getCurrentUser();
    if (user && user.role !== 'Admin') {
      this.logAudit('SECURITY_VIOLATION', 'PAYROLL', `محاولة وصول غير مصرح بها لمسير الرواتب من: ${user.fullName} (${user.role})`);
      return [];
    }
    const raw = localStorage.getItem(STORAGE_KEYS.PAYROLL);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public savePayrollRecord(record: PayrollRecord): { success: boolean; message?: string } {
    const user = this.getCurrentUser();
    if (user && user.role !== 'Admin') {
      this.logAudit('SECURITY_VIOLATION', 'PAYROLL', `محاولة تعديل مسير الرواتب غير مصرح بها من: ${user.fullName}`);
      return { success: false, message: 'غير مصرح بتعديل سجلات الرواتب. الصلاحية مقصورة على مدير النظام.' };
    }

    const list = this.getPayrollRecords();
    const idx = list.findIndex(r => r.id === record.id || (r.employeeId === record.employeeId && r.month === record.month && r.year === record.year));
    const now = getCairoNowISO();

    const prepared: PayrollRecord = {
      ...record,
      id: record.id || `PAY-${record.employeeId}-${record.year}-${record.month}`,
      updatedAt: now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.push(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(list));
    this.logAudit('UPDATE', 'PAYROLL', `تحديث مسير مرتب: ${prepared.employeeName} (${prepared.month}/${prepared.year})`);
    this.notifyChange();
    this.pushPost('savePayroll', prepared).catch(() => {});
    return { success: true, message: 'تم حفظ سجل الراتب بنجاح' };
  }

  public savePayrollRecordsBatch(records: PayrollRecord[]): { success: boolean; message?: string } {
    const user = this.getCurrentUser();
    if (user && user.role !== 'Admin') {
      this.logAudit('SECURITY_VIOLATION', 'PAYROLL', `محاولة تعديل دفعة رواتب غير مصرح بها من: ${user.fullName}`);
      return { success: false, message: 'غير مصرح بتعديل مسير الرواتب.' };
    }
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(records));
    this.logAudit('UPDATE', 'PAYROLL', `تحديث دفعة مسير الرواتب (${records.length} سجل)`);
    this.notifyChange();
    this.pushPost('bulkSavePayroll', records).catch(() => {});
    return { success: true, message: 'تم حفظ دفعة الرواتب بنجاح' };
  }

  public generateMonthlyPayroll(month: number, year: number): PayrollRecord[] {
    const employees = this.getEmployees().filter(e => e.status === 'Active');
    const allAttendance = this.getAttendance();
    const settings = this.getSettings();
    const rules = settings.payrollRules || DEFAULT_PAYROLL_RULES;
    const now = getCairoNowISO();

    const payrollRecords: PayrollRecord[] = employees.map(emp => {
      const basicSalary = emp.basicSalary || 0;
      const allowances = emp.allowances || 0;
      const dailyWage = rules.workDaysPerMonth > 0 ? basicSalary / rules.workDaysPerMonth : basicSalary / 30;

      // Filter employee attendance for that month
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      const empAttendance = allAttendance.filter(a => a.employeeId === emp.id && a.date.startsWith(monthPrefix));

      const absentCount = empAttendance.filter(a => a.status === 'غائب').length;
      const totalLateMins = empAttendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
      const totalOvertimeHours = empAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

      const absenceDeductions = Math.round(absentCount * dailyWage * rules.absenceDeductionMultiplier);
      const hourlyWage = dailyWage / (emp.workingHours || 8);
      const minuteWage = hourlyWage / 60;
      const lateDeductions = Math.round(Math.max(0, totalLateMins - rules.lateGraceMinutes) * minuteWage * rules.lateMinuteDeductionRate);
      
      const overtimeAmount = Math.round(totalOvertimeHours * hourlyWage * rules.overtimeRate);
      const totalGross = basicSalary + allowances + overtimeAmount;

      let loanDeductions = 0;
      let socialInsurance = 0;
      if (rules.enableSocialInsuranceDeduction) {
        socialInsurance = Math.round((basicSalary * rules.socialInsuranceRate) / 100);
      }

      const totalDeductions = absenceDeductions + lateDeductions + loanDeductions + socialInsurance;
      const netSalary = Math.max(0, totalGross - totalDeductions);

      return {
        id: `PAY-${emp.id}-${year}-${month}`,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        jobTitle: emp.jobTitle,
        month,
        year,
        basicSalary,
        allowances,
        incentives: 0,
        overtimeHours: totalOvertimeHours,
        overtimeAmount,
        totalGross,
        absentDaysCount: absentCount,
        absenceDeductions,
        totalLateMinutes: totalLateMins,
        lateDeductions,
        loanDeductions: loanDeductions + socialInsurance,
        otherDeductions: 0,
        totalDeductions,
        netSalary,
        status: 'Draft',
        createdAt: now,
        updatedAt: now,
      };
    });

    const currentList = this.getPayrollRecords();
    const updatedList = currentList.filter(p => !(p.month === month && p.year === year));
    updatedList.push(...payrollRecords);

    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(updatedList));
    this.logAudit('CREATE', 'PAYROLL', `إنشاء مسير الرواتب الشهري لشهر (${month}/${year}) لعدد (${payrollRecords.length}) موظف ومعلم`);
    this.notifyChange();
    this.pushPost('bulkSavePayroll', payrollRecords).catch(() => {});

    return payrollRecords;
  }

  // ---------------- Employees & Teachers ----------------
  public getEmployees(options?: { includeFinancials?: boolean }): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) return [];
    try {
      const list: Employee[] = JSON.parse(raw);
      const user = this.getCurrentUser();
      const isAdmin = !user || user.role === 'Admin';
      if (!isAdmin && !options?.includeFinancials) {
        // Red-Team Guard: Sanitize sensitive payroll compensation for non-admin callers
        return list.map(e => ({
          ...e,
          basicSalary: 0,
          allowances: 0,
        }));
      }
      return list;
    } catch {
      return [];
    }
  }

  public saveEmployee(emp: Employee): { success: boolean; message?: string } {
    const list = this.getEmployees({ includeFinancials: true });
    const user = this.getCurrentUser();
    const isAdmin = !user || user.role === 'Admin';
    const idx = list.findIndex(e => e.id === emp.id);

    // Guard against non-admin altering salaries
    if (!isAdmin) {
      if (idx >= 0) {
        emp.basicSalary = list[idx].basicSalary;
        emp.allowances = list[idx].allowances;
      } else {
        emp.basicSalary = 0;
        emp.allowances = 0;
      }
    }

    if (idx >= 0) {
      const old = list[idx];
      list[idx] = emp;
      this.logAudit('UPDATE', 'EMPLOYEE', `تعديل بيانات الموظف/المعلم: ${emp.name} (${emp.department})`, JSON.stringify(old), JSON.stringify(emp), emp.id);
    } else {
      list.push(emp);
      this.logAudit('CREATE', 'EMPLOYEE', `إضافة موظف/معلم جديد: ${emp.name} (${emp.jobTitle})`, '', JSON.stringify(emp), emp.id);
    }
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveEmployee', emp).catch(() => {});
    return { success: true, message: 'تم حفظ بيانات الموظف بنجاح' };
  }

  public deleteEmployee(id: string): { success: boolean; message?: string } {
    const list = this.getEmployees();
    const target = list.find(e => e.id === id);
    const filtered = list.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
    if (target) {
      this.logAudit('DELETE', 'EMPLOYEE', `حذف الموظف: ${target.name}`, JSON.stringify(target), '', id);
    }
    this.notifyChange();
    this.pushPost('deleteEmployee', { id }).catch(() => {});
    return { success: true, message: 'تم حذف الموظف بنجاح' };
  }

  // ---------------- Attendance (Staff & Teachers) ----------------
  public getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveAttendanceRecord(record: AttendanceRecord): void {
    const list = this.getAttendance();
    const idx = list.findIndex(a => a.employeeId === record.employeeId && a.date === record.date);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: AttendanceRecord = {
      ...record,
      id: record.id || `ATT-${record.employeeId}-${record.date}`,
      updatedBy: user?.fullName || 'النظام',
      updatedAt: now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      prepared.createdBy = user?.fullName || 'النظام';
      prepared.createdAt = now;
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveAttendance', prepared).catch(() => {});
  }

  public bulkSaveAttendance(records: AttendanceRecord[]): void {
    const list = this.getAttendance();
    const map = new Map<string, number>();
    list.forEach((r, i) => map.set(`${r.employeeId}_${r.date}`, i));
    const now = getCairoNowISO();

    records.forEach(rec => {
      const key = `${rec.employeeId}_${rec.date}`;
      const prepared: AttendanceRecord = {
        ...rec,
        id: rec.id || `ATT-${rec.employeeId}-${rec.date}`,
        updatedAt: now,
      };

      if (map.has(key)) {
        list[map.get(key)!] = prepared;
      } else {
        list.push(prepared);
        map.set(key, list.length - 1);
      }
    });

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('bulkSaveAttendance', records).catch(() => {});
  }

  public bulkMarkAttendance(empIds: string[], date: string, status: AttendanceStatus): { success: boolean; count: number } {
    const employees = this.getEmployees();
    const settings = this.getSettings();
    const newRecords: AttendanceRecord[] = [];

    empIds.forEach(id => {
      const emp = employees.find(e => e.id === id);
      if (emp) {
        const checkIn = status === 'حاضر' ? (emp.workStartTime || settings.officialStartTime || '07:30') : '';
        const rec = buildUnifiedAttendanceRecord({
          employee: emp,
          dateStr: date,
          checkIn,
          settings,
          statusOverride: status === 'حاضر' ? undefined : status,
        });
        newRecords.push(rec);
      }
    });

    this.bulkSaveAttendance(newRecords);
    return { success: true, count: newRecords.length };
  }

  public quickCheckIn(employeeId: string, date: string, checkInTime?: string, statusOverride?: AttendanceStatus): { success: boolean; record: AttendanceRecord } {
    const emp = this.getEmployees().find(e => e.id === employeeId);
    const nowTime = checkInTime || getCairoCurrentTime();
    const settings = this.getSettings();

    const record = buildUnifiedAttendanceRecord({
      employee: emp,
      dateStr: date,
      checkIn: nowTime,
      settings,
      statusOverride,
    });

    this.saveAttendanceRecord(record);
    return { success: true, record };
  }

  public quickCheckOut(employeeId: string, date: string, checkOutTime?: string, allowMissingCheckIn: boolean = false): { success: boolean; record?: AttendanceRecord; message?: string } {
    const list = this.getAttendance();
    const existing = list.find(a => a.employeeId === employeeId && a.date === date);
    const emp = this.getEmployees().find(e => e.id === employeeId);
    const nowTime = checkOutTime || getCairoCurrentTime();
    const settings = this.getSettings();

    if (!existing || !existing.checkIn) {
      if (!allowMissingCheckIn) {
        return {
          success: false,
          message: `الموظف (${emp?.name || employeeId}) ليس لديه تسجيل حضور مسبق لهذا اليوم. لا يمكن تسجيل الانصراف بدون حضور.`
        };
      }
      const checkInFallback = emp?.workStartTime || settings.officialStartTime || '07:30';
      const record = buildUnifiedAttendanceRecord({
        employee: emp,
        dateStr: date,
        checkIn: checkInFallback,
        checkOut: nowTime,
        settings,
        statusOverride: 'حاضر',
      });
      record.notes = (record.notes ? record.notes + ' | ' : '') + 'تسجيل انصراف مع اعتماد حضور تلقائي بطلب المستخدم';
      this.saveAttendanceRecord(record);
      return { success: true, record };
    }

    const updated = buildUnifiedAttendanceRecord({
      employee: emp,
      dateStr: date,
      checkIn: existing.checkIn,
      checkOut: nowTime,
      settings,
      statusOverride: existing.status,
    });
    if (existing.notes) updated.notes = existing.notes;
    if (existing.checkInTimestamp) updated.checkInTimestamp = existing.checkInTimestamp;

    this.saveAttendanceRecord(updated);
    return { success: true, record: updated };
  }

  public bulkCheckOut(empIds: string[], date: string, checkOutTime?: string): { success: boolean; count: number; skippedCount: number } {
    const list = this.getAttendance();
    let successCount = 0;
    let skippedCount = 0;

    empIds.forEach(id => {
      const existing = list.find(a => a.employeeId === id && a.date === date);
      if (existing && existing.checkIn) {
        const res = this.quickCheckOut(id, date, checkOutTime, false);
        if (res.success) successCount++;
      } else {
        skippedCount++;
      }
    });

    return { success: true, count: successCount, skippedCount };
  }

  public quickMarkDayOff(employeeId: string, date: string, statusText: string = 'عطلة أسبوعية'): void {
    const emp = this.getEmployees().find(e => e.id === employeeId);
    const settings = this.getSettings();
    const rec = buildUnifiedAttendanceRecord({
      employee: emp,
      dateStr: date,
      settings,
      statusOverride: statusText as AttendanceStatus,
    });
    this.saveAttendanceRecord(rec);
  }

  public quickMarkAbsent(employeeId: string, date: string, category?: string, reason?: string): void {
    const emp = this.getEmployees().find(e => e.id === employeeId);
    this.saveAttendanceRecord({
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: emp?.name || '',
      department: emp?.department || '',
      date,
      dayName: getEgyptianDayName(date),
      checkIn: '',
      checkOut: '',
      workingHours: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status: 'غائب',
      absenceReasonCategory: category,
      reason,
    });
  }

  public quickMarkPermission(employeeId: string, date: string, permData: any): void {
    const emp = this.getEmployees().find(e => e.id === employeeId);
    this.saveAttendanceRecord({
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: emp?.name || '',
      department: emp?.department || '',
      date,
      dayName: getEgyptianDayName(date),
      checkIn: '',
      checkOut: '',
      workingHours: emp?.workingHours || 8,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status: 'مأذونية',
      permissionType: typeof permData === 'string' ? permData : permData?.type || 'إذن خروج',
      permissionFrom: permData?.from,
      permissionTo: permData?.to,
      reason: permData?.reason,
    });
  }

  public quickMarkLeave(employeeId: string, startDate: string, endDate: string, leaveType: LeaveType, reason: string): void {
    const emp = this.getEmployees().find(e => e.id === employeeId);
    this.saveAttendanceRecord({
      id: `ATT-${employeeId}-${startDate}`,
      employeeId,
      employeeName: emp?.name || '',
      department: emp?.department || '',
      date: startDate,
      dayName: getEgyptianDayName(startDate),
      checkIn: '',
      checkOut: '',
      workingHours: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status: 'إجازة',
      leaveType,
      leaveStartDate: startDate,
      leaveEndDate: endDate,
      reason,
    });

    this.saveLeave({
      id: `LEV-${Date.now()}`,
      employeeId,
      employeeName: emp?.name || '',
      department: emp?.department || '',
      leaveType,
      startDate,
      endDate,
      daysCount: 1,
      status: 'مقبولة',
      reason,
      createdAt: getCairoNowISO(),
    });
  }

  public deleteAttendanceRecord(id: string): void {
    const list = this.getAttendance().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('deleteAttendance', { id }).catch(() => {});
  }

  // ---------------- Users ----------------
  public getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveUser(user: User): { success: boolean; message?: string } {
    const caller = this.getCurrentUser();
    const isCallerAdmin = !caller || caller.role === 'Admin';
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());

    // Non-admins cannot create users or escalate roles
    if (caller && !isCallerAdmin) {
      if (idx < 0 || list[idx].id !== caller.id) {
        return { success: false, message: 'غير مصرح بإنشاء أو تعديل حسابات مستخدمين آخرين.' };
      }
      if (user.role && user.role !== caller.role) {
        return { success: false, message: 'غير مصرح بترقية الصلاحيات أو تغيير الدور الوظيفي.' };
      }
      user.role = caller.role;
    }

    if (idx >= 0) {
      const existing = list[idx];

      // Anti-Lockout Guard: Do not allow demoting or deactivating the last active Admin
      if (existing.role === 'Admin' && user.role !== 'Admin') {
        const otherAdmins = list.filter(u => u.role === 'Admin' && u.status === 'Active' && u.id !== existing.id);
        if (otherAdmins.length === 0) {
          return { success: false, message: 'لا يمكن خفض رتبة آخر مدير نشط في النظام لتفادي قفل المنظومة.' };
        }
      }
      if (existing.role === 'Admin' && user.status === 'Inactive') {
        const otherAdmins = list.filter(u => u.role === 'Admin' && u.status === 'Active' && u.id !== existing.id);
        if (otherAdmins.length === 0) {
          return { success: false, message: 'لا يمكن تعطيل آخر مدير نشط في النظام لتفادي قفل المنظومة.' };
        }
      }

      const passwordToSave = (user.password && user.password.trim().length > 0)
        ? user.password.trim()
        : existing.password;

      list[idx] = {
        ...existing,
        ...user,
        password: passwordToSave,
      };
      this.logAudit('UPDATE', 'USER', `تعديل بيانات المستخدم: ${user.fullName} (@${user.username})`);
    } else {
      if (caller && !isCallerAdmin) {
        return { success: false, message: 'غير مصرح بإضافة مستخدم جديد.' };
      }
      const newUser: User = {
        ...user,
        id: user.id || `USR-${Date.now().toString().slice(-4)}`,
        password: user.password && user.password.trim() ? user.password.trim() : '123456',
        mustChangePassword: user.mustChangePassword !== undefined ? user.mustChangePassword : true,
        createdAt: user.createdAt || getCairoNowISO(),
      };
      list.push(newUser);
      this.logAudit('CREATE', 'USER', `إضافة مستخدم جديد: ${newUser.fullName} (@${newUser.username})`);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveUser', user).catch(() => {});
    return { success: true, message: 'تم حفظ المستخدم بنجاح' };
  }

  public deleteUser(id: string): { success: boolean; message?: string } {
    const caller = this.getCurrentUser();
    if (caller && caller.role !== 'Admin') {
      return { success: false, message: 'غير مصرح بحذف المستخدمين. خاص بمدير النظام فقط.' };
    }
    const list = this.getUsers();
    const toDelete = list.find(u => u.id === id);
    if (toDelete?.role === 'Admin') {
      const remainingAdmins = list.filter(u => u.role === 'Admin' && u.status === 'Active' && u.id !== id);
      if (remainingAdmins.length === 0) {
        return { success: false, message: 'لا يمكن حذف آخر مدير نشط في النظام للحفاظ على أمان المنظومة.' };
      }
    }
    const filtered = list.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    this.logAudit('DELETE', 'USER', `حذف مستخدم النظام: ${id}`);
    this.notifyChange();
    this.pushPost('deleteUser', { id }).catch(() => {});
    return { success: true, message: 'تم حذف المستخدم بنجاح' };
  }

  // ---------------- Leaves & Permissions ----------------
  public getLeaves(): LeaveRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveLeave(leave: LeaveRecord): { success: boolean; message?: string } {
    const list = this.getLeaves();
    const idx = list.findIndex(l => l.id === leave.id);
    if (idx >= 0) {
      list[idx] = leave;
    } else {
      list.unshift({ ...leave, id: leave.id || `LEV-${Date.now()}`, createdAt: getCairoNowISO() });
    }
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(list));
    this.logAudit('CREATE', 'LEAVE', `طلب إجازة للموظف: ${leave.employeeName} (${leave.leaveType})`);
    this.notifyChange();
    this.pushPost('saveLeave', leave).catch(() => {});
    return { success: true, message: 'تم حفظ طلب الإجازة بنجاح' };
  }

  public deleteLeave(id: string): { success: boolean; message?: string } {
    const list = this.getLeaves().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(list));
    this.logAudit('DELETE', 'LEAVE', `حذف سجل إجازة: ${id}`);
    this.notifyChange();
    this.pushPost('deleteLeave', { id }).catch(() => {});
    return { success: true, message: 'تم حذف سجل الإجازة بنجاح' };
  }

  // ---------------- Audit Log ----------------
  public getAuditLogs(): AuditLogEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public logAudit(
    action: string,
    entity: AuditLogEntry['entity'] = 'ATTENDANCE',
    details: string,
    oldValue?: string,
    newValue?: string,
    targetId?: string
  ): void {
    const user = this.getCurrentUser();
    const entry: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: getCairoNowISO(),
      username: user?.username || 'admin',
      userRole: user?.role || 'Admin',
      performedBy: user?.fullName || 'مدير النظام',
      action,
      entity,
      targetId,
      details,
      oldValue,
      newValue,
    };

    const logs = this.getAuditLogs();
    logs.unshift(entry);
    if (logs.length > 500) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // ---------------- Cloud Sync (Google Sheets & Apps Script) ----------------
  public getSyncStatus(): SyncStatus {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
    if (!raw) {
      return {
        lastSyncTime: null,
        status: 'idle',
        connectedToGoogleSheets: false,
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { lastSyncTime: null, status: 'idle', connectedToGoogleSheets: false };
    }
  }

  public getSyncState(): SyncStatus {
    return this.getSyncStatus();
  }

  private setSyncStatus(status: SyncStatus): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(status));
    this.notifyChange();
  }

  public async syncWithGoogleSheets(isBackground = false): Promise<boolean> {
    const settings = this.getSettings();
    const scriptUrl = settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL;

    if (!scriptUrl || scriptUrl.length < 15) {
      this.setSyncStatus({
        lastSyncTime: null,
        status: 'idle',
        connectedToGoogleSheets: false,
        errorMessage: 'لم يتم ربط رابط Google Apps Script بعد',
      });
      return false;
    }

    if (!isBackground) {
      this.setSyncStatus({
        ...this.getSyncStatus(),
        status: 'syncing',
      });
    }

    try {
      const response = await fetch(`${scriptUrl}?action=getAll&t=${Date.now()}`);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const d = result.data;
        if (Array.isArray(d.employees)) localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(d.employees));
        if (Array.isArray(d.attendance)) localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(d.attendance));
        if (Array.isArray(d.users)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(d.users));
        if (Array.isArray(d.leaves)) localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(d.leaves));
        if (Array.isArray(d.students)) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(d.students));
        if (Array.isArray(d.studentAttendance)) localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify(d.studentAttendance));
        if (Array.isArray(d.behaviorTypes)) localStorage.setItem(STORAGE_KEYS.BEHAVIOR_TYPES, JSON.stringify(d.behaviorTypes));
        if (Array.isArray(d.behaviorViolations)) localStorage.setItem(STORAGE_KEYS.BEHAVIOR_VIOLATIONS, JSON.stringify(d.behaviorViolations));
        if (Array.isArray(d.schedule)) localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(d.schedule));
        if (Array.isArray(d.lessonContent)) localStorage.setItem(STORAGE_KEYS.LESSON_CONTENT, JSON.stringify(d.lessonContent));
        if (Array.isArray(d.payroll)) localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(d.payroll));
        if (Array.isArray(d.academicYears)) localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(d.academicYears));
        if (Array.isArray(d.studentEnrollments)) localStorage.setItem(STORAGE_KEYS.STUDENT_ENROLLMENTS, JSON.stringify(d.studentEnrollments));
        if (Array.isArray(d.studentTransfers)) localStorage.setItem(STORAGE_KEYS.STUDENT_TRANSFERS, JSON.stringify(d.studentTransfers));
        if (Array.isArray(d.classAttendance)) localStorage.setItem(STORAGE_KEYS.CLASS_ATTENDANCE, JSON.stringify(d.classAttendance));
        if (Array.isArray(d.positiveBehaviorTypes)) localStorage.setItem(STORAGE_KEYS.POSITIVE_BEHAVIOR_TYPES, JSON.stringify(d.positiveBehaviorTypes));
        if (Array.isArray(d.behaviorLedger)) localStorage.setItem(STORAGE_KEYS.BEHAVIOR_LEDGER, JSON.stringify(d.behaviorLedger));
        if (Array.isArray(d.behaviorCases)) localStorage.setItem(STORAGE_KEYS.BEHAVIOR_CASES, JSON.stringify(d.behaviorCases));
        if (Array.isArray(d.scheduleSubstitutions)) localStorage.setItem(STORAGE_KEYS.SCHEDULE_SUBSTITUTIONS, JSON.stringify(d.scheduleSubstitutions));
        if (Array.isArray(d.lessonInstances)) localStorage.setItem(STORAGE_KEYS.LESSON_INSTANCES, JSON.stringify(d.lessonInstances));
        if (Array.isArray(d.parentCommunications)) localStorage.setItem(STORAGE_KEYS.PARENT_COMMUNICATIONS, JSON.stringify(d.parentCommunications));
        if (Array.isArray(d.locations)) localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(d.locations));

        const nowIso = getCairoNowISO();
        this.setSyncStatus({
          lastSyncTime: nowIso,
          status: 'success',
          connectedToGoogleSheets: true,
          syncedRecordsCount:
            (d.employees?.length || 0) +
            (d.students?.length || 0) +
            (d.attendance?.length || 0) +
            (d.academicYears?.length || 0) +
            (d.studentEnrollments?.length || 0),
        });

        this.notifyChange();
        return true;
      } else {
        throw new Error(result.message || 'فشل استرجاع البيانات من السكربت');
      }
    } catch (err: any) {
      console.warn('Sync failed:', err.message);
      this.setSyncStatus({
        ...this.getSyncStatus(),
        status: 'error',
        errorMessage: err.message || 'تعذر الاتصال بـ Google Sheets',
      });
      return false;
    }
  }

  // ---------------- Academic Years & Terms ----------------
  public getAcademicYears(): AcademicYear[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEARS);
    if (!raw) return DEFAULT_ACADEMIC_YEARS;
    try {
      const parsed = JSON.parse(raw);
      return parsed.length > 0 ? parsed : DEFAULT_ACADEMIC_YEARS;
    } catch {
      return DEFAULT_ACADEMIC_YEARS;
    }
  }

  public getActiveAcademicYear(): AcademicYear | null {
    const list = this.getAcademicYears();
    return list.find(y => y.status === 'ACTIVE' || y.isDefault) || list[0] || null;
  }

  public getAcademicYearById(id: string): AcademicYear | null {
    const list = this.getAcademicYears();
    return list.find(y => y.id === id) || null;
  }

  public saveAcademicYear(year: AcademicYear): { success: boolean; message?: string } {
    const list = this.getAcademicYears();
    const idx = list.findIndex(y => y.id === year.id);
    const prepared: AcademicYear = {
      ...year,
      id: year.id || `AY_${Date.now()}`,
    };

    // If marked active or default, demote others
    if (prepared.status === 'ACTIVE' || prepared.isDefault) {
      list.forEach(y => {
        if (y.id !== prepared.id) {
          if (prepared.status === 'ACTIVE' && y.status === 'ACTIVE') {
            y.status = 'CLOSED';
          }
          if (prepared.isDefault) {
            y.isDefault = false;
          }
        }
      });
    }

    if (idx >= 0) {
      list[idx] = prepared;
      this.logAudit('UPDATE', 'SETTINGS', `تعديل العام الدراسي: ${prepared.name}`);
    } else {
      list.unshift(prepared);
      this.logAudit('CREATE', 'SETTINGS', `إضافة عام دراسي جديد: ${prepared.name}`);
    }

    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(list));

    // Update settings if this is the active year
    if (prepared.status === 'ACTIVE') {
      const currentTerm = prepared.terms?.find(t => t.isCurrent)?.name || prepared.terms?.[0]?.name || 'الفصل الدراسي الأول';
      this.saveSettings({
        currentAcademicYear: prepared.name,
        currentTerm,
        academicYearStartDate: prepared.startDate,
        academicYearEndDate: prepared.endDate,
      });
    }

    this.notifyChange();
    this.pushPost('saveAcademicYear', prepared).catch(() => {});
    return { success: true, message: 'تم حفظ العام الدراسي بنجاح' };
  }

  public deleteAcademicYear(id: string): { success: boolean; message?: string } {
    const enrollments = this.getStudentEnrollments(undefined, id);
    if (enrollments.length > 0) {
      return {
        success: false,
        message: `لا يمكن حذف هذا العام الدراسي لوجود (${enrollments.length}) قيد طلابي مرتبط به. يمكنك إغلاقه بدلاً من ذلك.`,
      };
    }

    const list = this.getAcademicYears().filter(y => y.id !== id);
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(list));
    this.logAudit('DELETE', 'SETTINGS', `حذف العام الدراسي: ${id}`);
    this.notifyChange();
    this.pushPost('deleteAcademicYear', { id }).catch(() => {});
    return { success: true, message: 'تم حذف العام الدراسي بنجاح' };
  }

  public setActiveAcademicYear(id: string): { success: boolean; message?: string } {
    const list = this.getAcademicYears();
    const target = list.find(y => y.id === id);
    if (!target) return { success: false, message: 'العام الدراسي غير موجود' };

    list.forEach(y => {
      y.status = y.id === id ? 'ACTIVE' : 'CLOSED';
      y.isDefault = y.id === id;
      y.isLocked = y.id !== id;
    });

    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(list));
    const currentTerm = target.terms?.find(t => t.isCurrent)?.name || target.terms?.[0]?.name || 'الفصل الدراسي الأول';
    this.saveSettings({
      currentAcademicYear: target.name,
      currentTerm,
      academicYearStartDate: target.startDate,
      academicYearEndDate: target.endDate,
    });

    this.logAudit('UPDATE', 'SETTINGS', `تفعيل العام الدراسي: ${target.name}`);
    this.notifyChange();
    this.pushPost('saveAcademicYear', target).catch(() => {});
    return { success: true, message: `تم تفعيل ${target.name} كعام دراسي نشط للمدرسة` };
  }

  public closeAcademicYear(id: string, reason = 'إغلاق نهاية العام وترحيل البيانات'): { success: boolean; message?: string } {
    const list = this.getAcademicYears();
    const target = list.find(y => y.id === id);
    if (!target) return { success: false, message: 'العام الدراسي غير موجود' };

    target.status = 'CLOSED';
    target.isLocked = true;
    target.closedAt = getCairoNowISO();
    target.closedBy = this.getCurrentUser()?.fullName || 'مدير النظام';

    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(list));
    this.logAudit('UPDATE', 'SETTINGS', `إغلاق العام الدراسي (${target.name}): ${reason}`);
    this.notifyChange();
    this.pushPost('saveAcademicYear', target).catch(() => {});
    return { success: true, message: `تم إغلاق العام الدراسي ${target.name} وأرشفته بنجاح` };
  }

  public reopenAcademicYear(id: string): { success: boolean; message?: string } {
    const list = this.getAcademicYears();
    const target = list.find(y => y.id === id);
    if (!target) return { success: false, message: 'العام الدراسي غير موجود' };

    target.status = 'Active';
    target.isLocked = false;
    target.closedAt = undefined;
    target.closedBy = undefined;

    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(list));
    this.logAudit('UPDATE', 'SETTINGS', `إعادة فتح العام الدراسي (${target.name})`);
    this.notifyChange();
    this.pushPost('saveAcademicYear', target).catch(() => {});
    return { success: true, message: `تمت إعادة فتح العام الدراسي ${target.name} بنجاح` };
  }

  public getTerms(yearId?: string): Term[] {
    if (yearId) {
      const year = this.getAcademicYearById(yearId);
      return year?.terms || [];
    }
    const active = this.getActiveAcademicYear();
    return active?.terms || [];
  }

  // ---------------- Student Enrollments & Transfers ----------------
  public getStudentEnrollments(studentId?: string, academicYearId?: string): StudentEnrollment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_ENROLLMENTS);
    if (!raw) return [];
    try {
      const parsed: StudentEnrollment[] = JSON.parse(raw);
      return parsed.filter(e => {
        if (studentId && e.studentId !== studentId) return false;
        if (academicYearId && e.academicYearId !== academicYearId) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  public saveStudentEnrollment(enrollment: StudentEnrollment): { success: boolean; message?: string } {
    const list = this.getStudentEnrollments();
    const idx = list.findIndex(e => e.id === enrollment.id || (e.studentId === enrollment.studentId && e.academicYearId === enrollment.academicYearId));
    const now = getCairoNowISO();

    const prepared: StudentEnrollment = {
      ...enrollment,
      id: enrollment.id || `ENR-${enrollment.studentId}-${enrollment.academicYearId}`,
      updatedAt: now,
      createdAt: enrollment.createdAt || now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.push(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_ENROLLMENTS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveStudentEnrollment', prepared).catch(() => {});
    return { success: true, message: 'تم حفظ قيد الطالب بنجاح' };
  }

  public batchSaveStudentEnrollments(enrollments: StudentEnrollment[]): { success: boolean; count: number } {
    const list = this.getStudentEnrollments();
    const map = new Map<string, number>();
    list.forEach((e, idx) => map.set(`${e.studentId}_${e.academicYearId}`, idx));
    const now = getCairoNowISO();

    enrollments.forEach(enr => {
      const key = `${enr.studentId}_${enr.academicYearId}`;
      const prepared: StudentEnrollment = {
        ...enr,
        id: enr.id || `ENR-${enr.studentId}-${enr.academicYearId}`,
        updatedAt: now,
        createdAt: enr.createdAt || now,
      };

      if (map.has(key)) {
        const idx = map.get(key)!;
        list[idx] = prepared;
      } else {
        list.push(prepared);
        map.set(key, list.length - 1);
      }
    });

    localStorage.setItem(STORAGE_KEYS.STUDENT_ENROLLMENTS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('batchSaveStudentEnrollments', enrollments).catch(() => {});
    return { success: true, count: enrollments.length };
  }

  public getStudentTransferHistory(studentId?: string): StudentTransferHistory[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_TRANSFERS);
    if (!raw) return [];
    try {
      const parsed: StudentTransferHistory[] = JSON.parse(raw);
      if (studentId) {
        return parsed.filter(t => t.studentId === studentId);
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public saveStudentTransfer(transfer: StudentTransferHistory): { success: boolean; message?: string } {
    const list = this.getStudentTransferHistory();
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: StudentTransferHistory = {
      ...transfer,
      id: transfer.id || `TRF-${Date.now()}`,
      transferDate: transfer.transferDate || now.split('T')[0],
      approvedBy: transfer.approvedBy || user?.fullName || 'شؤون الطلاب',
      createdAt: now,
    };

    list.unshift(prepared);
    localStorage.setItem(STORAGE_KEYS.STUDENT_TRANSFERS, JSON.stringify(list));

    // Also update current student grade / classroom if applicable
    const student = this.getStudentById(transfer.studentId);
    if (student) {
      const updatedStudent: Student = {
        ...student,
        grade: transfer.toGrade || student.grade,
        classroom: transfer.toClassroom || student.classroom,
        updatedAt: now,
      };
      this.saveStudent(updatedStudent);
    }

    this.logAudit('UPDATE', 'STUDENT', `نقل طالب (${transfer.studentName}): من ${transfer.fromGrade} - ${transfer.fromClassroom} إلى ${transfer.toGrade} - ${transfer.toClassroom}`);
    this.notifyChange();
    this.pushPost('saveStudentTransfer', prepared).catch(() => {});
    return { success: true, message: 'تم تسجيل حركة نقل الطالب بنجاح' };
  }

  // ---------------- Promotion Rules & Execution ----------------
  public getPromotionRules(): PromotionRule[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMOTION_RULES);
    if (!raw) return DEFAULT_PROMOTION_RULES;
    try {
      const parsed = JSON.parse(raw);
      return parsed.length > 0 ? parsed : DEFAULT_PROMOTION_RULES;
    } catch {
      return DEFAULT_PROMOTION_RULES;
    }
  }

  public savePromotionRules(rules: PromotionRule[]): void {
    localStorage.setItem(STORAGE_KEYS.PROMOTION_RULES, JSON.stringify(rules));
    this.logAudit('UPDATE', 'SETTINGS', `تحديث قواعد ترحيل الطلاب ونهاية العام (${rules.length} قاعدة)`);
    this.notifyChange();
    this.pushPost('savePromotionRules', rules).catch(() => {});
  }

  public executeStudentPromotion(params: {
    sourceYearId: string;
    targetYearId: string;
    rules: PromotionRule[];
    studentDecisions: Array<{
      studentId: string;
      decision: 'PROMOTED' | 'RETAINED' | 'GRADUATED' | 'TRANSFERRED_OUT';
      targetGrade: string;
      targetClassroom: string;
      notes?: string;
    }>;
  }): { success: boolean; promotedCount: number; retainedCount: number; errors: string[] } {
    const { sourceYearId, targetYearId, studentDecisions } = params;
    const targetYear = this.getAcademicYearById(targetYearId);
    if (!targetYear) {
      return { success: false, promotedCount: 0, retainedCount: 0, errors: ['العام الدراسي المستهدف غير موجود'] };
    }

    const students = this.getStudents();
    const studentsMap = new Map(students.map(s => [s.id, s]));
    const newEnrollments: StudentEnrollment[] = [];
    const updatedStudents: Student[] = [];
    let promotedCount = 0;
    let retainedCount = 0;
    const now = getCairoNowISO();

    studentDecisions.forEach(item => {
      const student = studentsMap.get(item.studentId);
      if (!student) return;

      if (item.decision === 'PROMOTED') {
        promotedCount++;
      } else if (item.decision === 'RETAINED') {
        retainedCount++;
      }

      // Create new enrollment record for the target year
      newEnrollments.push({
        id: `ENR-${student.id}-${targetYearId}`,
        studentId: student.id,
        academicYearId: targetYearId,
        academicYearName: targetYear.name,
        grade: item.targetGrade,
        classroom: item.targetClassroom,
        section: student.section || 'أ',
        enrollmentDate: targetYear.startDate,
        status: item.decision === 'TRANSFERRED_OUT' ? 'TRANSFERRED' : 'ACTIVE',
        promotionStatus: item.decision,
        promotionNotes: item.notes,
        createdAt: now,
        updatedAt: now,
      });

      // Update student current grade/classroom
      updatedStudents.push({
        ...student,
        grade: item.targetGrade,
        classroom: item.targetClassroom,
        status: item.decision === 'TRANSFERRED_OUT' ? 'منقول' : item.decision === 'GRADUATED' ? 'متخرج' : 'نشط',
        updatedAt: now,
      });
    });

    // Save batch enrollments
    this.batchSaveStudentEnrollments(newEnrollments);

    // Save updated students
    const fullStudentList = this.getStudents();
    const updatedMap = new Map(updatedStudents.map(s => [s.id, s]));
    const mergedStudents = fullStudentList.map(s => (updatedMap.has(s.id) ? updatedMap.get(s.id)! : s));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mergedStudents));

    this.logAudit(
      'UPDATE',
      'STUDENT',
      `تنفيذ ترحيل الطلاب للعام (${targetYear.name}): تم ترحيل ${promotedCount} طالب وإبقاء ${retainedCount} طالب`
    );

    this.notifyChange();
    return { success: true, promotedCount, retainedCount, errors: [] };
  }

  public rollbackStudentPromotion(targetYearId: string): { success: boolean; rollbackedCount: number } {
    const enrollments = this.getStudentEnrollments();
    const targetEnrollments = enrollments.filter(e => e.academicYearId === targetYearId);
    const count = targetEnrollments.length;

    if (count === 0) {
      return { success: false, rollbackedCount: 0 };
    }

    const remainingEnrollments = enrollments.filter(e => e.academicYearId !== targetYearId);
    localStorage.setItem(STORAGE_KEYS.STUDENT_ENROLLMENTS, JSON.stringify(remainingEnrollments));

    this.logAudit('DELETE', 'STUDENT', `تراجع عن ترحيل الطلاب للعام الدراسي (${targetYearId}): تم حذف (${count}) قيد`);
    this.notifyChange();
    return { success: true, rollbackedCount: count };
  }

  public saveClassAttendance(records: ClassAttendanceRecord[]): { success: boolean; message?: string } {
    const res = this.saveClassAttendanceBatch(records);
    return { success: res.success, message: res.message };
  }

  // ---------------- Positive Behavior Types & Ledger ----------------
  public getPositiveBehaviorTypes(): PositiveBehaviorType[] {
    const raw = localStorage.getItem(STORAGE_KEYS.POSITIVE_BEHAVIOR_TYPES);
    if (!raw) return DEFAULT_POSITIVE_BEHAVIOR_TYPES;
    try {
      const parsed = JSON.parse(raw);
      return parsed.length > 0 ? parsed : DEFAULT_POSITIVE_BEHAVIOR_TYPES;
    } catch {
      return DEFAULT_POSITIVE_BEHAVIOR_TYPES;
    }
  }

  public savePositiveBehaviorType(type: PositiveBehaviorType): void {
    const list = this.getPositiveBehaviorTypes();
    const idx = list.findIndex(t => t.id === type.id);
    if (idx >= 0) {
      list[idx] = type;
    } else {
      list.push({ ...type, id: type.id || `POS-${Date.now()}` });
    }
    localStorage.setItem(STORAGE_KEYS.POSITIVE_BEHAVIOR_TYPES, JSON.stringify(list));
    this.logAudit('UPDATE', 'BEHAVIOR', `تعديل دليل السلوك الإيجابي: ${type.name}`);
    this.notifyChange();
    this.pushPost('savePositiveBehaviorType', type).catch(() => {});
  }

  public deletePositiveBehaviorType(id: string): void {
    const list = this.getPositiveBehaviorTypes().filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.POSITIVE_BEHAVIOR_TYPES, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('deletePositiveBehaviorType', { id }).catch(() => {});
  }

  public getBehaviorLedger(studentId?: string): BehaviorScoreLedger[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BEHAVIOR_LEDGER);
    if (!raw) return [];
    try {
      const parsed: BehaviorScoreLedger[] = JSON.parse(raw);
      if (studentId) {
        return parsed.filter(l => l.studentId === studentId);
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public addBehaviorScoreTransaction(transaction: BehaviorScoreLedger): { success: boolean; newScore: number; message?: string } {
    const list = this.getBehaviorLedger();

    // Idempotency & Double-Spend Guard: If this transaction ID is already recorded, reject duplicate
    if (transaction.id && list.some(l => l.id === transaction.id)) {
      const existing = list.find(l => l.id === transaction.id)!;
      return {
        success: true,
        newScore: existing.balanceAfter !== undefined ? existing.balanceAfter : 100,
        message: 'تم تفادي تكرار تسجيل المعاملة السلوكية مسبقاً (Idempotent)',
      };
    }

    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    // Calculate current student score
    const student = this.getStudentById(transaction.studentId);
    const prevScore = student ? this.calculateStudentBehaviorScore(student.id).currentScore : 100;
    const delta = transaction.type === 'POSITIVE' || transaction.type === 'RESTORE' ? Math.abs(transaction.points) : -Math.abs(transaction.points);
    const newScore = Math.max(0, Math.min(100, prevScore + delta));

    const prepared: BehaviorScoreLedger = {
      ...transaction,
      id: transaction.id || `LEDG-${Date.now()}`,
      balanceAfter: newScore,
      recordedBy: transaction.recordedBy || user?.fullName || 'الأخصائي الاجتماعي',
      createdAt: now,
    };

    list.unshift(prepared);
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_LEDGER, JSON.stringify(list));

    this.logAudit(
      'CREATE',
      'BEHAVIOR',
      `تسجيل معاملة سلوكية (${transaction.type === 'POSITIVE' ? 'تعزيز إيجابي' : 'حسم مخالفة'}): للطالب ${transaction.studentName} (${delta > 0 ? '+' : ''}${delta} نقطة)`
    );

    this.notifyChange();
    this.pushPost('addBehaviorLedger', prepared).catch(() => {});
    return { success: true, newScore, message: 'تم تسجيل المعاملة بنجاح' };
  }

  // ---------------- Behavior Cases & Followups ----------------
  public getBehaviorCases(filters?: { studentId?: string; status?: BehaviorCaseStatus }): BehaviorCase[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BEHAVIOR_CASES);
    if (!raw) return [];
    try {
      const parsed: BehaviorCase[] = JSON.parse(raw);
      return parsed.filter(c => {
        if (filters?.studentId && c.studentId !== filters.studentId) return false;
        if (filters?.status && c.status !== filters.status) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  public saveBehaviorCase(bCase: BehaviorCase): { success: boolean; message?: string } {
    const list = this.getBehaviorCases();
    const idx = list.findIndex(c => c.id === bCase.id);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: BehaviorCase = {
      ...bCase,
      id: bCase.id || `CASE-${Date.now()}`,
      caseNumber: bCase.caseNumber || `CASE-${Math.floor(1000 + Math.random() * 9000)}`,
      openedBy: bCase.openedBy || user?.fullName || 'الأخصائي الاجتماعي',
      createdAt: bCase.createdAt || now,
      updatedAt: now,
      followups: bCase.followups || [],
    };

    if (idx >= 0) {
      list[idx] = prepared;
      this.logAudit('UPDATE', 'BEHAVIOR', `تحديث ملف الحالة السلوكية: ${prepared.caseNumber} - ${prepared.studentName}`);
    } else {
      list.unshift(prepared);
      this.logAudit('CREATE', 'BEHAVIOR', `فتح ملف حالة سلوكية جديد: ${prepared.caseNumber} - ${prepared.studentName}`);
    }

    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_CASES, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveBehaviorCase', prepared).catch(() => {});
    return { success: true, message: 'تم حفظ الحالة السلوكية بنجاح' };
  }

  public addBehaviorCaseFollowup(caseId: string, followup: Omit<BehaviorFollowup, 'id' | 'createdAt'>): { success: boolean } {
    const list = this.getBehaviorCases();
    const target = list.find(c => c.id === caseId);
    if (!target) return { success: false };

    const now = getCairoNowISO();
    const newFollowup: BehaviorFollowup = {
      ...followup,
      id: `FOL-${Date.now()}`,
      createdAt: now,
    };

    target.followups = target.followups || [];
    target.followups.push(newFollowup);
    target.updatedAt = now;

    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_CASES, JSON.stringify(list));
    this.logAudit('UPDATE', 'BEHAVIOR', `إضافة جلسة متابعة للحالة (${target.caseNumber}): ${followup.summary}`);
    this.notifyChange();
    this.pushPost('saveBehaviorCase', target).catch(() => {});
    return { success: true };
  }

  public closeBehaviorCase(caseId: string, resolutionSummary: string): { success: boolean } {
    const list = this.getBehaviorCases();
    const target = list.find(c => c.id === caseId);
    if (!target) return { success: false };

    const now = getCairoNowISO();
    target.status = 'CLOSED';
    target.resolutionSummary = resolutionSummary;
    target.closedAt = now;
    target.updatedAt = now;

    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_CASES, JSON.stringify(list));
    this.logAudit('UPDATE', 'BEHAVIOR', `إغلاق الحالة السلوكية (${target.caseNumber}) بنجاح: ${resolutionSummary}`);
    this.notifyChange();
    this.pushPost('saveBehaviorCase', target).catch(() => {});
    return { success: true };
  }

  // ---------------- Comprehensive Student 360 Profile ----------------
  public getStudent360Profile(studentId: string) {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const enrollments = this.getStudentEnrollments(studentId);
    const transfers = this.getStudentTransferHistory(studentId);
    const schoolAttendance = this.getStudentAttendance().filter(a => a.studentId === studentId);
    const classAttendance = this.getClassAttendance({ grade: student.grade }).filter(a => a.studentId === studentId);
    const violations = this.getBehaviorViolations().filter(v => v.studentId === studentId);
    const ledger = this.getBehaviorLedger(studentId);
    const cases = this.getBehaviorCases({ studentId });
    const parentCommunications = this.getParentCommunications(studentId);

    // Attendance stats
    const totalDays = schoolAttendance.length;
    const presentDays = schoolAttendance.filter(a => a.status === 'حاضر' || a.status === 'حاضر متأخر').length;
    const absentDays = schoolAttendance.filter(a => a.status === 'غياب بدون عذر' || a.status === 'غياب بعذر').length;
    const lateDays = schoolAttendance.filter(a => a.status === 'حاضر متأخر').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Behavior score
    const behaviorInfo = this.calculateStudentBehaviorScore(studentId);
    const positivePoints = ledger.filter(l => l.type === 'POSITIVE').reduce((s, l) => s + l.points, 0);

    return {
      student,
      enrollments,
      transfers,
      schoolAttendance,
      classAttendance,
      violations,
      ledger,
      cases,
      parentCommunications,
      stats: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        attendancePercentage,
        currentBehaviorScore: behaviorInfo.currentScore,
        behaviorStatusText: behaviorInfo.statusText,
        behaviorStatusColor: behaviorInfo.statusColor,
        violationsCount: violations.length,
        positivePoints,
        openCasesCount: cases.filter(c => c.status !== 'CLOSED').length,
        parentCommunicationsCount: parentCommunications.length,
      },
    };
  }

  // ---------------- Locations & Conflict Detection & Schedule Substitutions ----------------
  public getLocations(): LocationItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
    if (!raw) return DEFAULT_LOCATIONS;
    try {
      const parsed = JSON.parse(raw);
      return parsed.length > 0 ? parsed : DEFAULT_LOCATIONS;
    } catch {
      return DEFAULT_LOCATIONS;
    }
  }

  public saveLocation(loc: LocationItem): void {
    const list = this.getLocations();
    const idx = list.findIndex(l => l.id === loc.id);
    if (idx >= 0) {
      list[idx] = loc;
    } else {
      list.push({ ...loc, id: loc.id || `LOC_${Date.now()}` });
    }
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveLocation', loc).catch(() => {});
  }

  public deleteLocation(id: string): void {
    const list = this.getLocations().filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('deleteLocation', { id }).catch(() => {});
  }

  public checkScheduleConflicts(
    candidate: ScheduleItem,
    existingSchedule?: ScheduleItem[]
  ): { hasConflict: boolean; conflicts: Array<{ type: string; message: string; severity: 'ERROR' | 'WARNING' }> } {
    const schedule = existingSchedule || this.getSchedule();
    const conflicts: Array<{ type: string; message: string; severity: 'ERROR' | 'WARNING' }> = [];

    // Filter out the item being edited itself
    const others = schedule.filter(s => s.id !== candidate.id);

    // 1. Teacher Double-Booking
    const teacherClash = others.find(
      s => s.teacherId === candidate.teacherId && s.dayOfWeek === candidate.dayOfWeek && s.periodNumber === candidate.periodNumber
    );
    if (teacherClash) {
      conflicts.push({
        type: 'TEACHER_BUSY',
        message: `المعلم (${candidate.teacherName}) لديه حصة أخرى في نفس الوقت لـ (${teacherClash.grade} - ${teacherClash.classroom})`,
        severity: 'ERROR',
      });
    }

    // 2. Classroom Double-Booking
    const classClash = others.find(
      s =>
        s.grade === candidate.grade &&
        s.classroom === candidate.classroom &&
        s.dayOfWeek === candidate.dayOfWeek &&
        s.periodNumber === candidate.periodNumber
    );
    if (classClash) {
      conflicts.push({
        type: 'ROOM_BUSY',
        message: `الفصل (${candidate.grade} - ${candidate.classroom}) لديه مادة (${classClash.subject}) مسندة بالفعل في الحصة رقم ${candidate.periodNumber}`,
        severity: 'ERROR',
      });
    }

    // 3. Location/Lab Double-Booking
    if (candidate.locationId) {
      const locClash = others.find(
        s =>
          s.locationId === candidate.locationId &&
          s.dayOfWeek === candidate.dayOfWeek &&
          s.periodNumber === candidate.periodNumber
      );
      if (locClash) {
        conflicts.push({
          type: 'LOCATION_BUSY',
          message: `المعمل أو القاعة المحددة محجوزة في نفس الحصة لفصل (${locClash.grade} - ${locClash.classroom})`,
          severity: 'ERROR',
        });
      }
    }

    // 4. Consecutive Periods Warning (more than 3 periods in a row)
    const teacherDailyPeriods = others
      .filter(s => s.teacherId === candidate.teacherId && s.dayOfWeek === candidate.dayOfWeek)
      .map(s => s.periodNumber);
    teacherDailyPeriods.push(candidate.periodNumber);
    teacherDailyPeriods.sort((a, b) => a - b);

    let consecutive = 1;
    let maxConsecutive = 1;
    for (let i = 1; i < teacherDailyPeriods.length; i++) {
      if (teacherDailyPeriods[i] === teacherDailyPeriods[i - 1] + 1) {
        consecutive++;
        if (consecutive > maxConsecutive) maxConsecutive = consecutive;
      } else if (teacherDailyPeriods[i] !== teacherDailyPeriods[i - 1]) {
        consecutive = 1;
      }
    }

    if (maxConsecutive > 3) {
      conflicts.push({
        type: 'MAX_CONSECUTIVE_EXCEEDED',
        message: `تنبيه: المعلم سيكون لديه ${maxConsecutive} حصص متتالية في هذا اليوم بدون استراحة`,
        severity: 'WARNING',
      });
    }

    return {
      hasConflict: conflicts.some(c => c.severity === 'ERROR'),
      conflicts,
    };
  }

  public getSubstitutions(filters?: {
    date?: string;
    status?: string;
    originalTeacherId?: string;
    substituteTeacherId?: string;
  }): ScheduleSubstitution[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE_SUBSTITUTIONS);
    if (!raw) return [];
    try {
      const parsed: ScheduleSubstitution[] = JSON.parse(raw);
      if (!filters) return parsed;
      return parsed.filter(s => {
        if (filters.date && s.date !== filters.date) return false;
        if (filters.status && s.status !== filters.status) return false;
        if (filters.originalTeacherId && s.originalTeacherId !== filters.originalTeacherId) return false;
        if (filters.substituteTeacherId && s.substituteTeacherId !== filters.substituteTeacherId) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  public saveSubstitution(sub: ScheduleSubstitution): { success: boolean; message?: string } {
    const list = this.getSubstitutions();
    const idx = list.findIndex(s => s.id === sub.id);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: ScheduleSubstitution = {
      ...sub,
      id: sub.id || `SUB-${Date.now()}`,
      assignedBy: sub.assignedBy || user?.fullName || 'مشرف الجدول',
      createdAt: sub.createdAt || now,
      updatedAt: now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
      this.logAudit('UPDATE', 'SCHEDULE', `تعديل حصة احتياطي: ${prepared.grade} ${prepared.classroom} - المعلم البديل: ${prepared.substituteTeacherName}`);
    } else {
      list.unshift(prepared);
      this.logAudit('CREATE', 'SCHEDULE', `إسناد حصة احتياطي: ${prepared.grade} ${prepared.classroom} (حصة ${prepared.periodNumber}) إلى المعلم البديل ${prepared.substituteTeacherName}`);
    }

    localStorage.setItem(STORAGE_KEYS.SCHEDULE_SUBSTITUTIONS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveSubstitution', prepared).catch(() => {});
    return { success: true, message: 'تم إسناد حصة الاحتياطي بنجاح' };
  }

  public deleteSubstitution(id: string): { success: boolean } {
    const list = this.getSubstitutions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_SUBSTITUTIONS, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('deleteSubstitution', { id }).catch(() => {});
    return { success: true };
  }

  public getAvailableSubstituteTeachers(
    date: string,
    day: string,
    periodNumber: number,
    originalTeacherId: string
  ): Employee[] {
    const employees = this.getEmployees().filter(
      e => (e.department?.includes('تعليم') || e.department?.includes('معلم') || e.jobTitle?.includes('معلم') || e.isTeacher) && e.status === 'Active'
    );
    const schedule = this.getSchedule();
    const substitutions = this.getSubstitutions({ date });

    // Busy teacher IDs for this period
    const busyInSchedule = new Set(
      schedule
        .filter(s => s.dayOfWeek === day && s.periodNumber === periodNumber)
        .map(s => s.teacherId)
    );

    const busyInSubstitutions = new Set(
      substitutions
        .filter(s => s.periodNumber === periodNumber && s.status !== 'CANCELLED')
        .map(s => s.substituteTeacherId)
    );

    return employees.filter(emp => emp.id !== originalTeacherId && !busyInSchedule.has(emp.id) && !busyInSubstitutions.has(emp.id));
  }

  public getLessonInstances(filters?: { scheduleItemId?: string; date?: string }): LessonInstance[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LESSON_INSTANCES);
    if (!raw) return [];
    try {
      const parsed: LessonInstance[] = JSON.parse(raw);
      if (!filters) return parsed;
      return parsed.filter(i => {
        if (filters.scheduleItemId && i.scheduleItemId !== filters.scheduleItemId) return false;
        if (filters.date && i.date !== filters.date) return false;
        return true;
      });
    } catch {
      return [];
    }
  }

  public saveLessonInstance(instance: LessonInstance): { success: boolean } {
    const list = this.getLessonInstances();
    const idx = list.findIndex(i => i.id === instance.id || (i.scheduleItemId === instance.scheduleItemId && i.date === instance.date));
    const now = getCairoNowISO();

    const prepared: LessonInstance = {
      ...instance,
      id: instance.id || `LINST-${Date.now()}`,
      updatedAt: now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.push(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.LESSON_INSTANCES, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveLessonInstance', prepared).catch(() => {});
    return { success: true };
  }

  // ---------------- Parent Communication ----------------
  public getParentCommunications(studentId?: string): ParentCommunicationLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PARENT_COMMUNICATIONS);
    if (!raw) return [];
    try {
      const parsed: ParentCommunicationLog[] = JSON.parse(raw);
      if (studentId) {
        return parsed.filter(l => l.studentId === studentId);
      }
      return parsed;
    } catch {
      return [];
    }
  }

  public saveParentCommunication(log: ParentCommunicationLog): { success: boolean; message?: string } {
    const list = this.getParentCommunications();
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: ParentCommunicationLog = {
      ...log,
      id: log.id || `COMM-${Date.now()}`,
      date: log.date || now.split('T')[0],
      recordedBy: log.recordedBy || user?.fullName || 'المدرسة',
      createdAt: now,
    };

    list.unshift(prepared);
    localStorage.setItem(STORAGE_KEYS.PARENT_COMMUNICATIONS, JSON.stringify(list));
    this.logAudit('CREATE', 'STUDENT', `تسجيل تواصل مع ولي أمر الطالب: ${prepared.studentName} (${prepared.type} - ${prepared.reason})`);
    this.notifyChange();
    this.pushPost('saveParentCommunication', prepared).catch(() => {});
    return { success: true, message: 'تم تسجيل سجل التواصل مع ولي الأمر بنجاح' };
  }

  // ---------------- Payroll Attendance Snapshots ----------------
  public getPayrollAttendanceSnapshots(): PayrollAttendanceSnapshot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYROLL_SNAPSHOTS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public savePayrollAttendanceSnapshot(snapshot: PayrollAttendanceSnapshot): void {
    const list = this.getPayrollAttendanceSnapshots();
    const idx = list.findIndex(s => s.id === snapshot.id);
    if (idx >= 0) {
      list[idx] = snapshot;
    } else {
      list.unshift(snapshot);
    }
    localStorage.setItem(STORAGE_KEYS.PAYROLL_SNAPSHOTS, JSON.stringify(list));
    this.notifyChange();
  }

  // ---------------- Sync Queue & Notifications Accessors ----------------
  public getSyncQueue(): any[] {
    return SyncQueueService.getQueue();
  }

  public saveSyncQueue(queue: any[]): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    this.notifyChange();
  }

  public getNotifications(): any[] {
    return NotificationService.getNotifications();
  }

  public getSyncQueueSummary() {
    return SyncQueueService.getQueueSummary();
  }

  public async retrySyncQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    SyncQueueService.retryFailed();
    return this.processSyncQueue();
  }

  public async processSyncQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
    return SyncQueueService.processQueue(async (action, payload) => {
      const settings = this.getSettings();
      const scriptUrl = settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL;
      if (!scriptUrl || scriptUrl.length < 15) {
        return { success: false, message: 'Google Apps Script URL not configured' };
      }
      const currentUser = this.getCurrentUser();

      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action,
          data: payload,
          userRole: currentUser?.role || '',
          userId: currentUser?.id || '',
          sessionToken: currentUser?.sessionToken || '',
        }),
      });

      if (!response.ok) {
        return { success: false, message: `HTTP Error: ${response.status}` };
      }

      const res = await response.json();
      return {
        success: res.status === 'success',
        message: res.message || (res.status === 'success' ? 'Synced' : 'Failed to sync')
      };
    });
  }

  public getParentLinkedStudents(currentUser?: User | null) {
    const user = currentUser || this.getCurrentUser();
    return ParentService.getMyLinkedStudents(user);
  }

  public getParentDayView(studentId: string, targetDate?: string, currentUser?: User | null) {
    const user = currentUser || this.getCurrentUser();
    return ParentService.getParentDayView(studentId, targetDate, user);
  }

  public getParentAttendanceSummary(studentId: string, currentUser?: User | null) {
    const user = currentUser || this.getCurrentUser();
    return ParentService.getParentAttendanceSummary(studentId, user);
  }

  private async pushPost(action: string, data: any): Promise<void> {
    // 1. Enqueue mutation
    SyncQueueService.enqueue(action, action.replace('save', '').toLowerCase(), data);

    // 2. Trigger asynchronous queue processing if online
    if (navigator.onLine) {
      setTimeout(() => {
        this.processSyncQueue().then(() => {
          this.notifyChange();
        }).catch(() => {});
      }, 50);
    }
  }
}

export const storageService = new StorageService();
