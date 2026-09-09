import {
  Employee,
  MonthlyAttendanceClosing,
  SalaryHistoryEntry,
  EmployeePermissionRecord,
  User,
} from '../types';
import { storageService } from './storageService';
import { getCairoCurrentDate, getCairoNowISO } from '../utils/egyptianTime';

const STORAGE_KEYS_EXTRA = {
  MONTHLY_CLOSINGS: 'ntss_monthly_closings_v3',
  SALARY_HISTORY: 'ntss_salary_history_v3',
  PERMISSIONS: 'ntss_employee_permissions_v3',
};

export class HRService {
  /* =========================================================================
   * 1. Security Authorization Guard (Staff & HR Management)
   * ========================================================================= */
  public static isHRAdmin(user: User | null | undefined): boolean {
    if (!user) return false;
    return user.role === 'Admin' || user.role === 'HR' || user.role === 'TeacherAffairs';
  }

  public static requireAdmin(user: User | null | undefined): void {
    if (user?.role !== 'Admin' && user?.role !== 'SchoolDirector') {
      throw new Error('غير مصرح لك بتنفيذ هذه العملية الإدارية.');
    }
  }

  /* =========================================================================
   * 2. Permissions Workflow (أذونات وتصاريح الموظفين والمعلمين)
   * ========================================================================= */
  public static getPermissions(filters?: {
    employeeId?: string;
    date?: string;
    month?: number;
    year?: number;
    status?: string;
  }): EmployeePermissionRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS_EXTRA.PERMISSIONS);
    let list: EmployeePermissionRecord[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    if (!filters) return list;

    return list.filter(p => {
      if (filters.employeeId && p.employeeId !== filters.employeeId) return false;
      if (filters.date && p.date !== filters.date) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.month && filters.year) {
        const prefix = `${filters.year}-${String(filters.month).padStart(2, '0')}`;
        if (!p.date.startsWith(prefix)) return false;
      }
      return true;
    });
  }

  public static savePermission(
    perm: Partial<EmployeePermissionRecord>,
    currentUser?: User | null
  ): { success: boolean; data?: EmployeePermissionRecord; message?: string } {
    const list = this.getPermissions();
    const now = getCairoNowISO();
    const user = currentUser || storageService.getCurrentUser();
    const isPermAdmin = user?.role === 'Admin' || user?.role === 'HR' || user?.role === 'TeacherAffairs';

    let targetEmpId = perm.employeeId;
    if (user && !isPermAdmin) {
      targetEmpId = user.employeeId || user.id;
    }

    if (!targetEmpId || !perm.date) {
      return { success: false, message: 'بيانات الموظف وتاريخ الإذن مطلوبة' };
    }

    const emp = storageService.getEmployees().find(e => e.id === targetEmpId || e.employeeNumber === targetEmpId);
    const durationHours = perm.durationHours || 2;

    const prepared: EmployeePermissionRecord = {
      id: perm.id || `PERM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: targetEmpId,
      employeeName: (user && !isPermAdmin) ? (emp?.name || user.fullName) : (perm.employeeName || emp?.name || 'موظف'),
      department: (user && !isPermAdmin) ? (emp?.department || 'هيئة التدريس') : (perm.department || emp?.department || ''),
      date: perm.date,
      permissionType: perm.permissionType || 'إذن خروج مؤقت',
      startTime: perm.startTime || '10:00',
      endTime: perm.endTime || '12:00',
      durationHours,
      reason: perm.reason || 'ظرف شخصي',
      status: isPermAdmin ? (perm.status || 'مقبولة') : 'معلقة',
      approvedBy: isPermAdmin ? (perm.approvedBy || user?.fullName) : undefined,
      createdAt: perm.createdAt || now,
    };

    const idx = list.findIndex(p => p.id === prepared.id);
    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS_EXTRA.PERMISSIONS, JSON.stringify(list));

    if (prepared.status === 'مقبولة') {
      this.syncPermissionToAttendance(prepared);
    }

    storageService.logAudit(
      idx >= 0 ? 'UPDATE' : 'CREATE',
      'LEAVE',
      `تسجيل إذن عمل للموظف: ${prepared.employeeName} (${prepared.permissionType}) بتاريخ ${prepared.date}`
    );

    return { success: true, data: prepared, message: 'تم حفظ طلب الإذن بنجاح' };
  }

  public static approvePermission(
    permId: string,
    currentUser?: User | null
  ): { success: boolean; message?: string } {
    const list = this.getPermissions();
    const target = list.find(p => p.id === permId);
    if (!target) return { success: false, message: 'طلب الإذن غير موجود' };

    const user = currentUser || storageService.getCurrentUser();
    target.status = 'مقبولة';
    target.approvedBy = user?.fullName || 'الموارد البشرية';

    localStorage.setItem(STORAGE_KEYS_EXTRA.PERMISSIONS, JSON.stringify(list));
    this.syncPermissionToAttendance(target);

    storageService.logAudit('UPDATE', 'LEAVE', `اعتماد إذن عمل للموظف: ${target.employeeName} بتاريخ ${target.date}`);
    return { success: true, message: 'تم اعتماد الإذن وتحديث سجل الحضور' };
  }

  public static rejectPermission(
    permId: string,
    rejectionReason: string,
    currentUser?: User | null
  ): { success: boolean; message?: string } {
    const list = this.getPermissions();
    const target = list.find(p => p.id === permId);
    if (!target) return { success: false, message: 'طلب الإذن غير موجود' };

    target.status = 'مرفوضة';
    target.rejectionReason = rejectionReason;

    localStorage.setItem(STORAGE_KEYS_EXTRA.PERMISSIONS, JSON.stringify(list));
    storageService.logAudit('UPDATE', 'LEAVE', `رفض إذن عمل للموظف: ${target.employeeName} - السبب: ${rejectionReason}`);
    return { success: true, message: 'تم رفض طلب الإذن' };
  }

  public static deletePermission(permId: string): { success: boolean } {
    const list = this.getPermissions().filter(p => p.id !== permId);
    localStorage.setItem(STORAGE_KEYS_EXTRA.PERMISSIONS, JSON.stringify(list));
    return { success: true };
  }

  private static syncPermissionToAttendance(perm: EmployeePermissionRecord): void {
    const existing = storageService.getAttendance().find(a => a.employeeId === perm.employeeId && a.date === perm.date);
    if (existing) {
      existing.permissionType = perm.permissionType;
      existing.permissionFrom = perm.startTime;
      existing.permissionTo = perm.endTime;
      existing.notes = (existing.notes ? existing.notes + ' | ' : '') + `إذن معتمد: ${perm.permissionType} (${perm.startTime} - ${perm.endTime})`;
      storageService.saveAttendanceRecord(existing);
    }
  }

  /* =========================================================================
   * 3. Monthly Attendance Closings & Period Locking (إقفال دورة الحضور الشهرية)
   * ========================================================================= */
  public static getMonthlyClosings(): MonthlyAttendanceClosing[] {
    const raw = localStorage.getItem(STORAGE_KEYS_EXTRA.MONTHLY_CLOSINGS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public static getMonthlyClosing(month: number, year: number): MonthlyAttendanceClosing | undefined {
    const list = this.getMonthlyClosings();
    return list.find(c => c.month === month && c.year === year);
  }

  public static isPeriodLocked(month: number, year: number): boolean {
    const closing = this.getMonthlyClosing(month, year);
    return closing ? closing.status === 'LOCKED' || closing.status === 'CLOSED' : false;
  }

  public static closeMonthlyPeriod(
    month: number,
    year: number,
    notes?: string,
    currentUser?: User | null
  ): { success: boolean; closing: MonthlyAttendanceClosing; message: string } {
    const user = currentUser || storageService.getCurrentUser();
    const employees = storageService.getEmployees().filter(e => e.status === 'Active');
    const attendance = storageService.getAttendance();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const monthAttendance = attendance.filter(a => a.date.startsWith(monthPrefix));

    const totalPresentDays = monthAttendance.filter(a => a.status === 'حاضر').length;
    const totalAbsentDays = monthAttendance.filter(a => a.status === 'غائب').length;
    const totalLateMinutes = monthAttendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
    const totalOvertimeHours = monthAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

    const now = getCairoNowISO();
    const closingId = `CLOSE-${year}-${String(month).padStart(2, '0')}`;

    const closing: MonthlyAttendanceClosing = {
      id: closingId,
      month,
      year,
      status: 'CLOSED',
      totalEmployees: employees.length,
      recordedEmployees: new Set(monthAttendance.map(a => a.employeeId)).size,
      totalPresentDays,
      totalAbsentDays,
      totalLateMinutes,
      totalOvertimeHours,
      closedAt: now,
      closedBy: user?.fullName || 'مدير الموارد البشرية',
      notes: notes || `إقفال سجلات حضور وانصراف شهر ${month}/${year}`,
      isPayrollGenerated: false,
      version: 1,
    };

    const list = this.getMonthlyClosings();
    const idx = list.findIndex(c => c.month === month && c.year === year);
    if (idx >= 0) {
      list[idx] = closing;
    } else {
      list.unshift(closing);
    }

    localStorage.setItem(STORAGE_KEYS_EXTRA.MONTHLY_CLOSINGS, JSON.stringify(list));

    storageService.logAudit(
      'UPDATE',
      'ATTENDANCE',
      `إقفال دورة حضور شهر (${month}/${year}) واعتماد السجلات لعدد (${employees.length}) موظف`
    );

    return {
      success: true,
      closing,
      message: `تم بنجاح إقفال دورة حضور وانصراف شهر (${month}/${year}).`,
    };
  }

  public static reopenMonthlyPeriod(
    month: number,
    year: number,
    reason: string,
    currentUser?: User | null
  ): { success: boolean; message: string } {
    const user = currentUser || storageService.getCurrentUser();
    this.requireAdmin(user);

    const list = this.getMonthlyClosings();
    const target = list.find(c => c.month === month && c.year === year);
    if (!target) {
      return { success: false, message: 'سجل الإقفال غير موجود' };
    }

    target.status = 'OPEN';
    target.notes = (target.notes ? target.notes + ' | ' : '') + `إعادة فتح بواسطة ${user?.fullName || 'الإدارة'}: ${reason}`;

    localStorage.setItem(STORAGE_KEYS_EXTRA.MONTHLY_CLOSINGS, JSON.stringify(list));

    storageService.logAudit(
      'UPDATE',
      'ATTENDANCE',
      `إعادة فتح دورة حضور شهر (${month}/${year}) بواسطة (${user?.fullName}): ${reason}`
    );

    return { success: true, message: `تمت إعادة فتح دورة حضور شهر (${month}/${year}) للتعديل` };
  }

  /* =========================================================================
   * 4. Salary History & Staff Adjustments (ملفات وتعديلات عقود الموظفين)
   * ========================================================================= */
  public static getSalaryHistory(employeeId?: string): SalaryHistoryEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS_EXTRA.SALARY_HISTORY);
    let list: SalaryHistoryEntry[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    if (employeeId) {
      return list.filter(h => h.employeeId === employeeId);
    }
    return list;
  }

  public static recordSalaryAdjustment(
    employee: Employee,
    newBasicSalary: number,
    newAllowances: number,
    effectiveDate: string,
    reason: string,
    currentUser?: User | null
  ): { success: boolean; entry: SalaryHistoryEntry } {
    const user = currentUser || storageService.getCurrentUser();
    this.requireAdmin(user);

    const now = getCairoNowISO();
    const entry: SalaryHistoryEntry = {
      id: `SAL-HIST-${employee.id}-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      previousBasicSalary: employee.basicSalary || 0,
      newBasicSalary,
      previousAllowances: employee.allowances || 0,
      newAllowances,
      effectiveDate: effectiveDate || getCairoCurrentDate(),
      reason: reason || 'تعديل الراتب الأساسي والبدلات في ملف الموظف',
      approvedBy: user?.fullName || 'إدارة المدرسة',
      createdAt: now,
    };

    const list = this.getSalaryHistory();
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS_EXTRA.SALARY_HISTORY, JSON.stringify(list));

    const updatedEmployee: Employee = {
      ...employee,
      basicSalary: newBasicSalary,
      allowances: newAllowances,
    };
    storageService.saveEmployee(updatedEmployee);

    storageService.logAudit(
      'UPDATE',
      'EMPLOYEE',
      `تعديل راتب الموظف (${employee.name}) إلى (${newBasicSalary} ج.م) بسريان من ${effectiveDate}: ${reason}`
    );

    return { success: true, entry };
  }

  // Attendance Snapshots for monthly reporting
  public static getPayrollAttendanceSnapshots(month?: number, year?: number): any[] {
    return [];
  }
}

// Backward compatibility alias
export const HRPayrollService = HRService;
