import {
  AbsenceReasonCategory,
  AttendanceRecord,
  AttendanceStatus,
  AuditLogEntry,
  Employee,
  LeaveRecord,
  LeaveType,
  PermissionType,
  SyncStatus,
  SystemSettings,
  User,
  UserRole
} from '../types';
import { INITIAL_SETTINGS } from '../data/initialData';
import {
  calculateAttendanceMetrics,
  determineAttendanceStatus,
  getArabicDayName,
  timeStringToMinutes
} from '../utils/attendanceUtils';

const STORAGE_KEYS = {
  SETTINGS: 'hr_production_settings_v3',
  EMPLOYEES: 'hr_production_employees_v3',
  ATTENDANCE: 'hr_production_attendance_v3',
  LEAVES: 'hr_production_leaves_v3',
  PERMISSIONS: 'hr_production_permissions_v3',
  USERS: 'hr_production_users_v3',
  AUDIT_LOGS: 'hr_production_audit_logs_v3',
  CURRENT_USER: 'hr_production_current_user_v3',
  SYNC_STATUS: 'hr_production_sync_status_v3'
};

const DEFAULT_BACKEND_URL =
  ((import.meta as any).env?.VITE_GOOGLE_APPS_SCRIPT_URL as string) ||
  'https://script.google.com/macros/s/AKfycbzw0kggQMGHdusMyKZOuqMC8eLiBzGccm7e7tdZbnMjvyBDqXPgI5f0tiJPKMFYAoln/exec';

class StorageService {
  private autoSyncInterval: any = null;
  private subscribers: Array<() => void> = [];

  // ---------------- Initialization ----------------
  public initialize(): void {
    const legacyKeys = [
      'hr_app_settings',
      'hr_app_employees',
      'hr_app_attendance',
      'hr_app_leaves',
      'hr_app_users',
      'hr_app_audit_logs',
      'hr_app_current_user',
      'hr_production_settings_v2',
      'hr_production_employees_v2',
      'hr_production_attendance_v2'
    ];
    legacyKeys.forEach(k => localStorage.removeItem(k));

    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      const initial = { ...INITIAL_SETTINGS, googleAppsScriptUrl: DEFAULT_BACKEND_URL };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initial));
    }
    if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEAVES)) {
      localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PERMISSIONS)) {
      localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ATTENDANCE)) {
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify([]));
    }

    this.startAutoSync();

    // Trigger initial background sync
    setTimeout(() => {
      this.syncWithGoogleSheets(true).catch(() => {});
    }, 500);
  }

  public subscribe(cb: () => void): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== cb);
    };
  }

  private notifyChange(): void {
    this.subscribers.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('Subscriber notification error:', e);
      }
    });
  }

  public startAutoSync(): void {
    if (this.autoSyncInterval) clearInterval(this.autoSyncInterval);
    const settings = this.getSettings();
    const mins = Math.max(1, settings.autoSyncIntervalMinutes || 5);
    const url = settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL;

    if (url && url.trim().length > 10) {
      this.autoSyncInterval = setInterval(() => {
        this.syncWithGoogleSheets(true).catch(() => {});
      }, mins * 60 * 1000);
    }
  }

  // ---------------- Authentication (Username + Password) ----------------
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

  public async login(
    usernameInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: User; message?: string }> {
    const cleanUsername = usernameInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanUsername || !cleanPassword) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    const settings = this.getSettings();
    const backendUrl = (settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL).trim();

    if (!backendUrl || backendUrl.length < 10) {
      return {
        success: false,
        message: 'عنوان الخادم غير مهيأ. يرجى مراجعة المسؤول.'
      };
    }

    try {
      const payload = {
        action: 'login',
        username: cleanUsername,
        password: cleanPassword
      };

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`خطأ في استجابة الخادم: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success' && result.user) {
        const authenticatedUser: User = {
          id: result.user.id || '001',
          username: result.user.username || cleanUsername,
          fullName: result.user.fullName || cleanUsername,
          role: (result.user.role as UserRole) || 'HR',
          department: result.user.department || '',
          employeeId: result.user.employeeId || '',
          email: result.user.email || '',
          status: (result.user.status as any) || 'Active',
          isActive: true,
          createdAt: result.user.createdAt || new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        this.setCurrentUser(authenticatedUser);
        this.syncWithGoogleSheets(true).catch(() => {});

        return {
          success: true,
          user: authenticatedUser,
          message: result.message || 'تم تسجيل الدخول بنجاح'
        };
      } else {
        return {
          success: false,
          message: result.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.'
        };
      }
    } catch (networkErr: any) {
      console.warn('Backend login network error, trying fallback query:', networkErr);

      try {
        const getUrl = `${backendUrl}?action=login&username=${encodeURIComponent(
          cleanUsername
        )}&password=${encodeURIComponent(cleanPassword)}`;
        const getRes = await fetch(getUrl);
        const getJson = await getRes.json();

        if (getJson.status === 'success' && getJson.user) {
          const authUser: User = {
            id: getJson.user.id || '001',
            username: getJson.user.username || cleanUsername,
            fullName: getJson.user.fullName || cleanUsername,
            role: (getJson.user.role as UserRole) || 'HR',
            department: getJson.user.department || '',
            employeeId: getJson.user.employeeId || '',
            email: getJson.user.email || '',
            status: (getJson.user.status as any) || 'Active',
            isActive: true,
            createdAt: getJson.user.createdAt || new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };

          this.setCurrentUser(authUser);
          this.syncWithGoogleSheets(true).catch(() => {});

          return {
            success: true,
            user: authUser,
            message: getJson.message || 'تم تسجيل الدخول بنجاح'
          };
        } else {
          return {
            success: false,
            message: getJson.message || 'اسم المستخدم أو كلمة المرور غير صحيحة.'
          };
        }
      } catch (fallbackErr: any) {
        return {
          success: false,
          message: 'تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.'
        };
      }
    }
  }

  // ---------------- Employees ----------------
  public getEmployees(): Employee[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getEmployeeById(id: string): Employee | undefined {
    return this.getEmployees().find(e => e.id === id);
  }

  public saveEmployee(employee: Employee): { success: boolean; message?: string } {
    const employees = this.getEmployees();
    const existingIndex = employees.findIndex(e => e.id === employee.id);
    const isNew = existingIndex === -1;

    let updated: Employee[];
    if (isNew) {
      if (employees.some(e => e.id.toLowerCase() === employee.id.toLowerCase())) {
        return { success: false, message: 'رقم الموظف موجود مسبقاً' };
      }
      updated = [...employees, employee];
      this.logAudit('CREATE', 'EMPLOYEE', `إضافة موظف جديد: ${employee.name} (${employee.id})`);
    } else {
      updated = employees.map(e => (e.id === employee.id ? employee : e));
      this.logAudit('UPDATE', 'EMPLOYEE', `تعديل بيانات الموظف: ${employee.name} (${employee.id})`);
    }

    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(updated));
    this.notifyChange();

    this.postToBackend('saveEmployee', employee);
    return { success: true };
  }

  public deleteEmployee(id: string): boolean {
    const employees = this.getEmployees();
    const target = employees.find(e => e.id === id);
    if (!target) return false;

    const filtered = employees.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
    this.logAudit('DELETE', 'EMPLOYEE', `حذف الموظف: ${target.name} (${target.id})`);
    this.notifyChange();

    this.postToBackend('deleteEmployee', { id });
    return true;
  }

  // ---------------- Attendance ----------------
  public getAttendance(): AttendanceRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public getAttendanceByDate(date: string): AttendanceRecord[] {
    return this.getAttendance().filter(a => a.date === date);
  }

  public getAttendanceRecord(employeeId: string, date: string): AttendanceRecord | undefined {
    return this.getAttendance().find(a => a.employeeId === employeeId && a.date === date);
  }

  public saveAttendance(record: AttendanceRecord): { success: boolean; message?: string } {
    const attendance = this.getAttendance();
    const existingIndex = attendance.findIndex(
      a => a.id === record.id || (a.employeeId === record.employeeId && a.date === record.date)
    );

    const fullRecord: AttendanceRecord = {
      ...record,
      updatedAt: new Date().toISOString()
    };

    let updated: AttendanceRecord[];
    if (existingIndex === -1) {
      updated = [...attendance, fullRecord];
      this.logAudit(
        'CREATE',
        'ATTENDANCE',
        `تسجيل حضور للموظف: ${record.employeeName} بتاريخ ${record.date} (الحالة: ${record.status})`
      );
    } else {
      updated = [...attendance];
      updated[existingIndex] = fullRecord;
      this.logAudit(
        'UPDATE',
        'ATTENDANCE',
        `تعديل حضور الموظف: ${record.employeeName} بتاريخ ${record.date} (الحالة: ${record.status})`
      );
    }

    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
    this.notifyChange();

    this.postToBackend('saveAttendance', fullRecord);
    return { success: true };
  }

  public saveAttendanceRecord(record: AttendanceRecord): { success: boolean; message?: string } {
    return this.saveAttendance(record);
  }

  public bulkSaveAttendance(records: AttendanceRecord[]): { success: boolean; count: number } {
    if (!records || records.length === 0) return { success: true, count: 0 };

    const attendance = this.getAttendance();
    const map = new Map<string, AttendanceRecord>();

    attendance.forEach(a => {
      map.set(`${a.employeeId}_${a.date}`, a);
    });

    const now = new Date().toISOString();
    records.forEach(r => {
      map.set(`${r.employeeId}_${r.date}`, {
        ...r,
        updatedAt: now
      });
    });

    const updated = Array.from(map.values());
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(updated));
    this.logAudit('BULK_SAVE', 'ATTENDANCE', `حفظ جماعي لسجلات الحضور (${records.length} سجل)`);
    this.notifyChange();

    this.postToBackend('bulkSaveAttendance', records);
    return { success: true, count: records.length };
  }

  public deleteAttendance(id: string): boolean {
    const attendance = this.getAttendance();
    const target = attendance.find(a => a.id === id);
    if (!target) return false;

    const filtered = attendance.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(filtered));
    this.logAudit('DELETE', 'ATTENDANCE', `حذف سجل حضور: ${target.employeeName} بتاريخ ${target.date}`);
    this.notifyChange();

    this.postToBackend('deleteAttendance', { id });
    return true;
  }

  public deleteAttendanceRecord(id: string): boolean {
    return this.deleteAttendance(id);
  }

  // ---------------- Quick Attendance Actions ----------------
  public quickCheckIn(
    employeeId: string,
    date: string,
    checkInTime: string,
    forceStatus?: AttendanceStatus,
    notes?: string
  ): { success: boolean; record: AttendanceRecord } {
    const employee = this.getEmployeeById(employeeId);
    const settings = this.getSettings();
    const existing = this.getAttendanceRecord(employeeId, date);

    const startTime = employee?.workStartTime || settings.officialStartTime || '09:00';
    const gracePeriod = settings.gracePeriodMinutes ?? 15;
    const dayName = getArabicDayName(date);

    let status: AttendanceStatus = forceStatus || 'حاضر';
    let lateMinutes = 0;

    if (!forceStatus && settings.autoCalculateStatus) {
      const inMin = timeStringToMinutes(checkInTime);
      const startMin = timeStringToMinutes(startTime);
      if (inMin > startMin + gracePeriod) {
        status = 'متأخر';
        lateMinutes = inMin - startMin;
      }
    } else if (forceStatus === 'متأخر') {
      const inMin = timeStringToMinutes(checkInTime);
      const startMin = timeStringToMinutes(startTime);
      lateMinutes = inMin > startMin ? inMin - startMin : 15;
    }

    const newRecord: AttendanceRecord = {
      id: existing?.id || `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: employee?.name || existing?.employeeName || employeeId,
      department: employee?.department || existing?.department || '',
      date,
      dayName,
      checkIn: checkInTime,
      checkOut: existing?.checkOut || '',
      workingHours: 0,
      lateMinutes,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status,
      notes: notes || existing?.notes,
      checkInTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (newRecord.checkIn && newRecord.checkOut) {
      const metrics = calculateAttendanceMetrics(
        newRecord.checkIn,
        newRecord.checkOut,
        startTime,
        employee?.workEndTime || settings.officialEndTime || '17:00',
        gracePeriod,
        employee?.workingHours || settings.standardDailyHours || 8
      );
      newRecord.workingHours = metrics.workingHours;
      newRecord.earlyLeaveMinutes = metrics.earlyLeaveMinutes;
      newRecord.overtimeHours = metrics.overtimeHours;
    }

    this.saveAttendance(newRecord);
    return { success: true, record: newRecord };
  }

  public quickCheckOut(
    employeeId: string,
    date: string,
    checkOutTime: string
  ): { success: boolean; record?: AttendanceRecord } {
    const employee = this.getEmployeeById(employeeId);
    const settings = this.getSettings();
    const existing = this.getAttendanceRecord(employeeId, date);

    if (!existing) {
      // Create new record with checkout
      const rec: AttendanceRecord = {
        id: `ATT-${employeeId}-${date}`,
        employeeId,
        employeeName: employee?.name || employeeId,
        department: employee?.department || '',
        date,
        dayName: getArabicDayName(date),
        checkIn: '',
        checkOut: checkOutTime,
        workingHours: 0,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeHours: 0,
        status: 'حاضر',
        checkOutTimestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.saveAttendance(rec);
      return { success: true, record: rec };
    }

    const startTime = employee?.workStartTime || settings.officialStartTime || '09:00';
    const endTime = employee?.workEndTime || settings.officialEndTime || '17:00';
    const grace = settings.gracePeriodMinutes ?? 15;
    const stdHours = employee?.workingHours || settings.standardDailyHours || 8;

    let workingHours = 0;
    let earlyLeaveMinutes = 0;
    let overtimeHours = 0;

    if (existing.checkIn) {
      const metrics = calculateAttendanceMetrics(
        existing.checkIn,
        checkOutTime,
        startTime,
        endTime,
        grace,
        stdHours
      );
      workingHours = metrics.workingHours;
      earlyLeaveMinutes = metrics.earlyLeaveMinutes;
      overtimeHours = metrics.overtimeHours;
    }

    const updated: AttendanceRecord = {
      ...existing,
      checkOut: checkOutTime,
      workingHours,
      earlyLeaveMinutes,
      overtimeHours,
      checkOutTimestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.saveAttendance(updated);
    return { success: true, record: updated };
  }

  public quickMarkDayOff(employeeId: string, date: string, reason = 'عطلة أسبوعية'): void {
    const employee = this.getEmployeeById(employeeId);
    const rec: AttendanceRecord = {
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: employee?.name || employeeId,
      department: employee?.department || '',
      date,
      dayName: getArabicDayName(date),
      checkIn: '',
      checkOut: '',
      workingHours: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status: reason === 'عطلة أسبوعية' ? 'عطلة أسبوعية' : 'راحة',
      notes: reason,
      updatedAt: new Date().toISOString()
    };
    this.saveAttendance(rec);
  }

  public quickMarkAbsent(
    employeeId: string,
    date: string,
    category: AbsenceReasonCategory,
    reason?: string
  ): void {
    const employee = this.getEmployeeById(employeeId);
    const rec: AttendanceRecord = {
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: employee?.name || employeeId,
      department: employee?.department || '',
      date,
      dayName: getArabicDayName(date),
      checkIn: '',
      checkOut: '',
      workingHours: 0,
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status: 'غائب',
      absenceReasonCategory: category,
      reason: reason || category,
      notes: reason,
      updatedAt: new Date().toISOString()
    };
    this.saveAttendance(rec);
  }

  public quickMarkPermission(
    employeeId: string,
    date: string,
    permData: { type: string; from: string; to: string; reason?: string }
  ): void {
    const employee = this.getEmployeeById(employeeId);
    const fromMin = timeStringToMinutes(permData.from);
    const toMin = timeStringToMinutes(permData.to);
    const duration = toMin > fromMin ? toMin - fromMin : 60;

    const rec: AttendanceRecord = {
      id: `ATT-${employeeId}-${date}`,
      employeeId,
      employeeName: employee?.name || employeeId,
      department: employee?.department || '',
      date,
      dayName: getArabicDayName(date),
      checkIn: permData.from,
      checkOut: permData.to,
      workingHours: +(duration / 60).toFixed(2),
      lateMinutes: 0,
      earlyLeaveMinutes: 0,
      overtimeHours: 0,
      status: 'مأذونية',
      permissionType: permData.type as PermissionType,
      permissionFrom: permData.from,
      permissionTo: permData.to,
      permissionDurationMinutes: duration,
      reason: permData.reason,
      notes: `${permData.type} من ${permData.from} إلى ${permData.to}`,
      updatedAt: new Date().toISOString()
    };
    this.saveAttendance(rec);
  }

  public quickMarkLeave(
    employeeId: string,
    startDate: string,
    endDate: string,
    leaveType: LeaveType,
    reason?: string
  ): void {
    const employee = this.getEmployeeById(employeeId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

    // Save in Leaves
    const leaveRec: LeaveRecord = {
      id: `LEV-${Date.now()}-${employeeId}`,
      employeeId,
      employeeName: employee?.name || employeeId,
      department: employee?.department || '',
      leaveType,
      startDate,
      endDate,
      daysCount,
      status: 'مقبولة',
      reason: reason || `إجازة ${leaveType}`,
      createdAt: new Date().toISOString()
    };
    this.saveLeave(leaveRec);

    // Mark daily records
    const current = new Date(start);
    while (current <= end) {
      const dStr = current.toISOString().split('T')[0];
      const attRec: AttendanceRecord = {
        id: `ATT-${employeeId}-${dStr}`,
        employeeId,
        employeeName: employee?.name || employeeId,
        department: employee?.department || '',
        date: dStr,
        dayName: getArabicDayName(dStr),
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
        leaveDaysCount: daysCount,
        notes: `إجازة ${leaveType}`,
        updatedAt: new Date().toISOString()
      };
      this.saveAttendance(attRec);
      current.setDate(current.getDate() + 1);
    }
  }

  public bulkMarkAttendance(
    employeeIds: string[],
    date: string,
    status: AttendanceStatus,
    checkIn = '09:00',
    checkOut = '17:00'
  ): { success: boolean; count: number } {
    const records: AttendanceRecord[] = [];
    const settings = this.getSettings();
    const dayName = getArabicDayName(date);

    employeeIds.forEach(empId => {
      const employee = this.getEmployeeById(empId);
      const startTime = employee?.workStartTime || settings.officialStartTime || '09:00';
      const endTime = employee?.workEndTime || settings.officialEndTime || '17:00';
      const isPresent = status === 'حاضر' || status === 'متأخر';

      records.push({
        id: `ATT-${empId}-${date}`,
        employeeId: empId,
        employeeName: employee?.name || empId,
        department: employee?.department || '',
        date,
        dayName,
        checkIn: isPresent ? checkIn : '',
        checkOut: isPresent ? checkOut : '',
        workingHours: isPresent ? 8 : 0,
        lateMinutes: status === 'متأخر' ? 15 : 0,
        earlyLeaveMinutes: 0,
        overtimeHours: 0,
        status,
        updatedAt: new Date().toISOString()
      });
    });

    return this.bulkSaveAttendance(records);
  }

  public bulkCheckOut(
    employeeIds: string[],
    date: string,
    checkOutTime = '17:00'
  ): { success: boolean; count: number } {
    let count = 0;
    employeeIds.forEach(empId => {
      const res = this.quickCheckOut(empId, date, checkOutTime);
      if (res.success) count++;
    });
    return { success: true, count };
  }

  // ---------------- Leaves ----------------
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
    const leaves = this.getLeaves();
    const existingIdx = leaves.findIndex(l => l.id === leave.id);

    let updated: LeaveRecord[];
    if (existingIdx === -1) {
      updated = [...leaves, leave];
      this.logAudit(
        'CREATE',
        'LEAVE',
        `طلب إجازة جديدة: ${leave.employeeName} (${leave.leaveType}) من ${leave.startDate} إلى ${leave.endDate}`
      );
    } else {
      updated = [...leaves];
      updated[existingIdx] = leave;
      this.logAudit('UPDATE', 'LEAVE', `تحديث طلب إجازة: ${leave.employeeName} (${leave.status})`);
    }

    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(updated));
    this.notifyChange();

    this.postToBackend('saveLeave', leave);
    return { success: true };
  }

  public deleteLeave(id: string): boolean {
    const leaves = this.getLeaves();
    const target = leaves.find(l => l.id === id);
    if (!target) return false;

    const filtered = leaves.filter(l => l.id !== id);
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(filtered));
    this.logAudit('DELETE', 'LEAVE', `حذف طلب إجازة: ${target.employeeName}`);
    this.notifyChange();

    this.postToBackend('deleteLeave', { id });
    return true;
  }

  // ---------------- Permissions ----------------
  public getPermissions(): any[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public savePermission(perm: any): { success: boolean; message?: string } {
    const permissions = this.getPermissions();
    const idx = permissions.findIndex(p => p.id === perm.id);

    let updated: any[];
    if (idx === -1) {
      updated = [...permissions, perm];
      this.logAudit('CREATE', 'PERMISSION' as any, `تسجيل إذن عمل للموظف: ${perm.employeeName} (${perm.date})`);
    } else {
      updated = [...permissions];
      updated[idx] = perm;
      this.logAudit('UPDATE', 'PERMISSION' as any, `تحديث إذن عمل: ${perm.employeeName} (${perm.date})`);
    }

    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(updated));
    this.notifyChange();

    this.postToBackend('savePermission', perm);
    return { success: true };
  }

  public deletePermission(id: string): boolean {
    const permissions = this.getPermissions();
    const target = permissions.find(p => p.id === id);
    if (!target) return false;

    const filtered = permissions.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(filtered));
    this.logAudit('DELETE', 'PERMISSION' as any, `حذف إذن عمل: ${target.employeeName}`);
    this.notifyChange();

    this.postToBackend('deletePermission', { id });
    return true;
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
    const users = this.getUsers();
    const cleanUsername = user.username.trim().toLowerCase();
    const existingIdx = users.findIndex(
      u => u.id === user.id || u.username.toLowerCase() === cleanUsername
    );

    let updated: User[];
    if (existingIdx === -1) {
      updated = [...users, { ...user, username: cleanUsername }];
      this.logAudit('CREATE', 'USER', `إضافة مستخدم جديد للنظام: ${user.fullName} (@${cleanUsername})`);
    } else {
      updated = [...users];
      updated[existingIdx] = { ...user, username: cleanUsername };
      this.logAudit('UPDATE', 'USER', `تعديل بيانات المستخدم: ${user.fullName} (@${cleanUsername})`);
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    this.notifyChange();

    this.postToBackend('saveUser', user);
    return { success: true };
  }

  public deleteUser(id: string): boolean {
    const users = this.getUsers();
    const target = users.find(u => u.id === id);
    if (!target) return false;

    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === id) {
      return false;
    }

    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
    this.logAudit('DELETE', 'USER', `حذف مستخدم: ${target.fullName} (@${target.username})`);
    this.notifyChange();

    this.postToBackend('deleteUser', { id });
    return true;
  }

  // ---------------- Settings ----------------
  public getSettings(): SystemSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...INITIAL_SETTINGS, googleAppsScriptUrl: DEFAULT_BACKEND_URL };
    try {
      return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return { ...INITIAL_SETTINGS, googleAppsScriptUrl: DEFAULT_BACKEND_URL };
    }
  }

  public saveSettings(settings: SystemSettings): { success: boolean; message?: string } {
    const merged = { ...this.getSettings(), ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    this.logAudit('UPDATE', 'SETTINGS', 'تحديث إعدادات النظام ومواعيد الدوام وسياسات الحضور');
    this.startAutoSync();
    this.notifyChange();

    this.postToBackend('saveSettings', merged);
    return { success: true };
  }

  // ---------------- Audit Logs ----------------
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
    entity: 'ATTENDANCE' | 'EMPLOYEE' | 'LEAVE' | 'USER' | 'SETTINGS' | 'AUTH' | 'SYNC' | string,
    details: string,
    targetId?: string
  ): void {
    const currentUser = this.getCurrentUser();
    const log: AuditLogEntry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      username: currentUser?.username || 'system',
      userRole: currentUser?.role || 'Admin',
      performedBy: currentUser?.fullName || 'النظام',
      action,
      entity: entity as any,
      targetId,
      details
    };

    const logs = this.getAuditLogs();
    const updated = [log, ...logs].slice(0, 500);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));

    this.postToBackend('addAuditLog', log);
  }

  // ---------------- Sync State ----------------
  public getSyncStatus(): SyncStatus {
    const raw = localStorage.getItem(STORAGE_KEYS.SYNC_STATUS);
    if (!raw) {
      return {
        status: 'idle',
        connectedToGoogleSheets: true,
        lastSyncTime: null
      };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {
        status: 'idle',
        connectedToGoogleSheets: true,
        lastSyncTime: null
      };
    }
  }

  public getSyncState(): SyncStatus {
    return this.getSyncStatus();
  }

  public setSyncStatus(status: Partial<SyncStatus>): void {
    const current = this.getSyncStatus();
    const updated = { ...current, ...status };
    localStorage.setItem(STORAGE_KEYS.SYNC_STATUS, JSON.stringify(updated));
    this.notifyChange();
  }

  // ---------------- Backend Direct API Sync ----------------
  public async syncWithGoogleSheets(silent = false): Promise<{ success: boolean; message?: string }> {
    const settings = this.getSettings();
    const url = (settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL).trim();

    if (!url || url.length < 10) {
      return { success: false, message: 'عنوان الخادم غير مهيأ' };
    }

    if (!silent) {
      this.setSyncStatus({ status: 'syncing' });
    }

    try {
      const response = await fetch(`${url}?action=getAll`);
      if (!response.ok) {
        throw new Error(`خطأ اتصال: ${response.status}`);
      }

      const resJson = await response.json();

      if (resJson.status === 'success' && resJson.data) {
        const { employees, attendance, leaves, permissions, settings: backendSettings, users } = resJson.data;

        if (Array.isArray(employees) && employees.length > 0) {
          localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
        }
        if (Array.isArray(attendance)) {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
        }
        if (Array.isArray(leaves)) {
          localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
        }
        if (Array.isArray(permissions)) {
          localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
        }
        if (Array.isArray(users) && users.length > 0) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        }
        if (backendSettings && Object.keys(backendSettings).length > 0) {
          const currentSettings = this.getSettings();
          const merged = { ...currentSettings, ...backendSettings };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        }

        const now = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        this.setSyncStatus({
          status: 'success',
          lastSyncTime: now,
          connectedToGoogleSheets: true,
          errorMessage: undefined
        });

        this.notifyChange();
        return { success: true, message: 'تمت المزامنة بنجاح مع الخادم' };
      } else {
        throw new Error(resJson.message || 'خطأ في معالجة البيانات من الخادم');
      }
    } catch (err: any) {
      console.warn('Sync failed:', err);
      this.setSyncStatus({
        status: 'error',
        errorMessage: err.message || 'تعذر الاتصال بالخادم',
        connectedToGoogleSheets: false
      });
      return { success: false, message: err.message || 'فشلت المزامنة' };
    }
  }

  private async postToBackend(action: string, data: any): Promise<void> {
    const settings = this.getSettings();
    const url = (settings.googleAppsScriptUrl || DEFAULT_BACKEND_URL).trim();

    if (!url || url.length < 10) return;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ action, data })
      });
    } catch (e) {
      console.warn(`Failed async post for ${action}:`, e);
    }
  }
}

export const storageService = new StorageService();
storageService.initialize();
