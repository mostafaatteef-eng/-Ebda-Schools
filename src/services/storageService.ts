import {
  AlertRuleItem,
  AllowanceTypeItem,
  AttendanceRecord,
  AttendanceStatus,
  AuditLogEntry,
  BehaviorLevelItem,
  BehaviorType,
  BehaviorViolation,
  ClassroomItem,
  DeductionTypeItem,
  DepartmentItem,
  Employee,
  GradeItem,
  JobTitleItem,
  LeaveRecord,
  LeaveType,
  LeaveTypeConfig,
  LessonContent,
  PayrollRecord,
  PermissionMatrix,
  PermissionTypeConfig,
  ScheduleConfig,
  ScheduleItem,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceStatusConfig,
  SubjectItem,
  SyncStatus,
  SystemSettings,
  User,
} from '../types';
import {
  DEFAULT_ALERT_RULES,
  DEFAULT_ALLOWANCE_TYPES,
  DEFAULT_BEHAVIOR_LEVELS,
  DEFAULT_BEHAVIOR_RULES,
  DEFAULT_BEHAVIOR_TYPES,
  DEFAULT_CLASSROOMS,
  DEFAULT_DASHBOARD_SETTINGS,
  DEFAULT_DEDUCTION_TYPES,
  DEFAULT_DEPARTMENTS,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_GRADES,
  DEFAULT_HOLIDAYS,
  DEFAULT_IMPORT_SETTINGS,
  DEFAULT_JOB_TITLES,
  DEFAULT_LEAVE_TYPES,
  DEFAULT_PARENT_PORTAL_SETTINGS,
  DEFAULT_PAYROLL_RULES,
  DEFAULT_PERMISSION_MATRIX,
  DEFAULT_PERMISSION_TYPES,
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
import { getCairoCurrentTime, getCairoNowISO, getEgyptianDayName } from '../utils/egyptianTime';

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
  BEHAVIOR_TYPES: 'ntss_behavior_types_v3',
  BEHAVIOR_VIOLATIONS: 'ntss_behavior_violations_v3',
  SCHEDULE: 'ntss_schedule_v3',
  LESSON_CONTENT: 'ntss_lesson_content_v3',
  PAYROLL: 'ntss_payroll_v3',
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

    const settings = this.getSettings();
    const scriptUrl = settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL;

    // 1. Try Backend Online Login First
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
            this.setCurrentUser(result.user);
            return { success: true, user: result.user };
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
    if (users.length === 0 && (cleanUsername === 'admin' || cleanUsername === '001') && (cleanPassword === 'admin123' || cleanPassword === 'admin' || cleanPassword === '1234')) {
      const defaultAdmin: User = {
        id: '001',
        username: 'admin',
        fullName: 'مدير النظام',
        role: 'Admin',
        status: 'Active',
        department: 'الإدارة العامة والتوجيه',
        email: 'admin@ntss-schools.edu.eg',
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

    // Check password if stored locally
    if (found.password && found.password !== cleanPassword) {
      return { success: false, message: 'كلمة المرور غير صحيحة' };
    }

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

  // ---------------- Student Attendance ----------------
  public getStudentAttendance(): StudentAttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENT_ATTENDANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveStudentAttendanceRecord(rec: StudentAttendanceRecord): void {
    const list = this.getStudentAttendance();
    const idx = list.findIndex(r => r.studentId === rec.studentId && r.date === rec.date);
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    const prepared: StudentAttendanceRecord = {
      ...rec,
      id: rec.id || `ATT-STD-${rec.studentId}-${rec.date}`,
      recordedBy: rec.recordedBy || user?.fullName || 'النظام',
      recordedAt: rec.recordedAt || now,
      updatedAt: now,
    };

    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify(list));
    this.notifyChange();
    this.pushPost('saveStudentAttendance', prepared).catch(() => {});
  }

  public bulkSaveStudentAttendance(records: StudentAttendanceRecord[]): void {
    const list = this.getStudentAttendance();
    const map = new Map<string, number>();
    list.forEach((r, i) => map.set(`${r.studentId}_${r.date}`, i));
    const now = getCairoNowISO();
    const user = this.getCurrentUser();

    records.forEach(rec => {
      const key = `${rec.studentId}_${rec.date}`;
      const prepared: StudentAttendanceRecord = {
        ...rec,
        id: rec.id || `ATT-STD-${rec.studentId}-${rec.date}`,
        recordedBy: rec.recordedBy || user?.fullName || 'النظام',
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
    });

    localStorage.setItem(STORAGE_KEYS.STUDENT_ATTENDANCE, JSON.stringify(list));
    this.logAudit('UPDATE', 'STUDENT_ATTENDANCE', `رصد حضور جماعي لعدد (${records.length}) طالب`);
    this.notifyChange();
    this.pushPost('bulkSaveStudentAttendance', records).catch(() => {});
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

  // ---------------- Payroll Engine ----------------
  public getPayrollRecords(): PayrollRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYROLL);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public savePayrollRecord(record: PayrollRecord): void {
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
  public getEmployees(): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveEmployee(emp: Employee): { success: boolean; message?: string } {
    const list = this.getEmployees();
    const idx = list.findIndex(e => e.id === emp.id);
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
    const newRecords: AttendanceRecord[] = [];

    empIds.forEach(id => {
      const emp = employees.find(e => e.id === id);
      if (emp) {
        newRecords.push({
          id: `ATT-${emp.id}-${date}`,
          employeeId: emp.id,
          employeeName: emp.name,
          department: emp.department,
          date,
          dayName: getEgyptianDayName(date),
          checkIn: status === 'حاضر' ? (emp.workStartTime || '07:30') : '',
          checkOut: '',
          workingHours: status === 'حاضر' ? (emp.workingHours || 8) : 0,
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
          overtimeHours: 0,
          status,
        });
      }
    });

    this.bulkSaveAttendance(newRecords);
    return { success: true, count: newRecords.length };
  }

  public quickCheckIn(employeeId: string, date: string, checkInTime?: string, statusOverride?: AttendanceStatus): { success: boolean; record: AttendanceRecord } {
    const emp = this.getEmployees().find(e => e.id === employeeId);
    const nowTime = checkInTime || getCairoCurrentTime();
    const settings = this.getSettings();
    const startTime = emp?.workStartTime || settings.officialStartTime || '07:30';

    const [startH, startM] = startTime.split(':').map(Number);
    const [inH, inM] = nowTime.split(':').map(Number);
    const diffMinutes = (inH * 60 + inM) - (startH * 60 + startM);
    const lateMinutes = Math.max(0, diffMinutes - (settings.gracePeriodMinutes || 15));
    const status: AttendanceStatus = statusOverride || (lateMinutes > 0 ? 'متأخر' : 'حاضر');

    const record: AttendanceRecord = {
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: emp?.name || '',
      department: emp?.department || '',
      date,
      dayName: getEgyptianDayName(date),
      checkIn: nowTime,
      checkOut: '',
      workingHours: emp?.workingHours || 8,
      lateMinutes: status === 'متأخر' ? Math.max(15, lateMinutes) : 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status,
      checkInTimestamp: getCairoNowISO(),
    };

    this.saveAttendanceRecord(record);
    return { success: true, record };
  }

  public quickCheckOut(employeeId: string, date: string, checkOutTime?: string): { success: boolean; record: AttendanceRecord } {
    const list = this.getAttendance();
    const existing = list.find(a => a.employeeId === employeeId && a.date === date);
    const emp = this.getEmployees().find(e => e.id === employeeId);
    const nowTime = checkOutTime || getCairoCurrentTime();

    const record: AttendanceRecord = existing ? {
      ...existing,
      checkOut: nowTime,
      checkOutTimestamp: getCairoNowISO(),
    } : {
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: emp?.name || '',
      department: emp?.department || '',
      date,
      dayName: getEgyptianDayName(date),
      checkIn: emp?.workStartTime || '07:30',
      checkOut: nowTime,
      workingHours: emp?.workingHours || 8,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status: 'حاضر',
      checkOutTimestamp: getCairoNowISO(),
    };

    this.saveAttendanceRecord(record);
    return { success: true, record };
  }

  public bulkCheckOut(empIds: string[], date: string): { success: boolean; count: number } {
    empIds.forEach(id => {
      this.quickCheckOut(id, date);
    });
    return { success: true, count: empIds.length };
  }

  public quickMarkDayOff(employeeId: string, date: string, statusText: string = 'عطلة أسبوعية'): void {
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
      status: statusText as any,
    });
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
    const list = this.getUsers();
    const idx = list.findIndex(u => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase());
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...user };
      this.logAudit('UPDATE', 'USER', `تعديل بيانات المستخدم: ${user.fullName} (@${user.username})`);
    } else {
      const newUser = {
        ...user,
        id: user.id || `USR-${Date.now().toString().slice(-4)}`,
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
    const list = this.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
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

        const nowIso = getCairoNowISO();
        this.setSyncStatus({
          lastSyncTime: nowIso,
          status: 'success',
          connectedToGoogleSheets: true,
          syncedRecordsCount: (d.employees?.length || 0) + (d.students?.length || 0) + (d.attendance?.length || 0),
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

  private async pushPost(action: string, data: any): Promise<void> {
    const settings = this.getSettings();
    const scriptUrl = settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL;
    if (!scriptUrl || scriptUrl.length < 15 || !navigator.onLine) return;

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data }),
      });
    } catch (e) {
      console.warn(`Background push for action "${action}" failed:`, e);
    }
  }
}

export const storageService = new StorageService();
