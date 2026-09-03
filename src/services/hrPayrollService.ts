import {
  AttendanceRecord,
  Employee,
  LeaveRecord,
  MonthlyAttendanceClosing,
  PayrollAttendanceSnapshot,
  PayrollCalculationBreakdown,
  PayrollRecord,
  PayrollRule,
  SalaryHistoryEntry,
  EmployeePermissionRecord,
  SystemSettings,
  User,
} from '../types';
import { storageService } from './storageService';
import { STORAGE_KEYS } from './storageServiceConstants';
import { getCairoCurrentDate, getCairoNowISO, getEgyptianDayName } from '../utils/egyptianTime';

const STORAGE_KEYS_EXTRA = {
  MONTHLY_CLOSINGS: 'ntss_monthly_closings_v3',
  SALARY_HISTORY: 'ntss_salary_history_v3',
  PERMISSIONS: 'ntss_employee_permissions_v3',
};

export class HRPayrollService {
  /* =========================================================================
   * 1. Security Authorization Guard (Strict Admin-Only for Payroll & Salaries)
   * ========================================================================= */
  public static isPayrollAdmin(user: User | null | undefined): boolean {
    if (!user) return false;
    return user.role === 'Admin';
  }

  public static requirePayrollAdmin(user: User | null | undefined): void {
    if (!this.isPayrollAdmin(user)) {
      throw new Error('غير مصرح لك بالوصول إلى بيانات أو عمليات مسير الرواتب (Admin Only).');
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

    if (!perm.employeeId || !perm.date) {
      return { success: false, message: 'بيانات الموظف وتاريخ الإذن مطلوبة' };
    }

    const emp = storageService.getEmployees().find(e => e.id === perm.employeeId);
    const durationHours = perm.durationHours || 2;

    const prepared: EmployeePermissionRecord = {
      id: perm.id || `PERM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      employeeId: perm.employeeId,
      employeeName: perm.employeeName || emp?.name || 'موظف',
      department: perm.department || emp?.department || '',
      date: perm.date,
      permissionType: perm.permissionType || 'إذن خروج مؤقت',
      startTime: perm.startTime || '10:00',
      endTime: perm.endTime || '12:00',
      durationHours,
      reason: perm.reason || 'ظرف شخصي',
      status: perm.status || (user?.role === 'Admin' || user?.role === 'HR' ? 'مقبولة' : 'معلقة'),
      approvedBy: perm.approvedBy || (user?.role === 'Admin' || user?.role === 'HR' ? user.fullName : undefined),
      createdAt: perm.createdAt || now,
    };

    const idx = list.findIndex(p => p.id === prepared.id);
    if (idx >= 0) {
      list[idx] = prepared;
    } else {
      list.unshift(prepared);
    }

    localStorage.setItem(STORAGE_KEYS_EXTRA.PERMISSIONS, JSON.stringify(list));

    // If approved, update attendance record status if appropriate
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
   * 3. Monthly Attendance Closings & Period Locking (إقفال الحضور الشهري)
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
  ): { success: boolean; closing: MonthlyAttendanceClosing; snapshotsCount: number; message: string } {
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

    // 1. Generate immutable attendance snapshot
    const snapshots = this.generatePayrollAttendanceSnapshots(month, year, true, user?.fullName);

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
      `إقفال دورة حضور شهر (${month}/${year}) وتثبيت لقطة الحضور لعدد (${snapshots.length}) موظف ومعلم`
    );

    return {
      success: true,
      closing,
      snapshotsCount: snapshots.length,
      message: `تم بنجاح إقفال حضور شهر (${month}/${year}) وتثبيت لقطة المسير.`,
    };
  }

  public static reopenMonthlyPeriod(
    month: number,
    year: number,
    reason: string,
    currentUser?: User | null
  ): { success: boolean; message: string } {
    const user = currentUser || storageService.getCurrentUser();
    this.requirePayrollAdmin(user);

    const list = this.getMonthlyClosings();
    const target = list.find(c => c.month === month && c.year === year);
    if (!target) {
      return { success: false, message: 'سجل الإقفال غير موجود' };
    }

    target.status = 'OPEN';
    target.notes = (target.notes ? target.notes + ' | ' : '') + `إعادة فتح بواسطة ${user?.fullName || 'الإدارة'}: ${reason}`;

    // Unlock snapshots
    const snapshots = this.getPayrollAttendanceSnapshots(month, year);
    snapshots.forEach(s => {
      s.isLocked = false;
    });
    this.savePayrollSnapshotsBatch(snapshots);

    localStorage.setItem(STORAGE_KEYS_EXTRA.MONTHLY_CLOSINGS, JSON.stringify(list));

    storageService.logAudit(
      'UPDATE',
      'ATTENDANCE',
      `إعادة فتح حضور شهر (${month}/${year}) بواسطة (${user?.fullName}): ${reason}`
    );

    return { success: true, message: `تمت إعادة فتح دورة حضور شهر (${month}/${year}) للتعديل` };
  }

  /* =========================================================================
   * 4. Payroll Attendance Snapshots (لقطة الحضور المعتمدة للرواتب)
   * ========================================================================= */
  public static getPayrollAttendanceSnapshots(month?: number, year?: number): PayrollAttendanceSnapshot[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYROLL_SNAPSHOTS);
    let list: PayrollAttendanceSnapshot[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }

    if (month && year) {
      return list.filter(s => s.month === month && s.year === year);
    }
    return list;
  }

  public static savePayrollSnapshotsBatch(snapshots: PayrollAttendanceSnapshot[]): void {
    const current = this.getPayrollAttendanceSnapshots();
    const map = new Map<string, PayrollAttendanceSnapshot>();
    current.forEach(s => map.set(s.id, s));
    snapshots.forEach(s => map.set(s.id, s));

    localStorage.setItem(STORAGE_KEYS.PAYROLL_SNAPSHOTS, JSON.stringify(Array.from(map.values())));
  }

  public static generatePayrollAttendanceSnapshots(
    month: number,
    year: number,
    lock: boolean = false,
    calculatedBy?: string
  ): PayrollAttendanceSnapshot[] {
    const employees = storageService.getEmployees().filter(e => e.status === 'Active');
    const allAttendance = storageService.getAttendance();
    const allLeaves = storageService.getLeaves();
    const allPermissions = this.getPermissions({ month, year });
    const settings = storageService.getSettings();
    const workDaysPerMonth = settings.payrollRules?.workDaysPerMonth || 26;

    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const now = getCairoNowISO();
    const periodId = `PAY-${year}-${String(month).padStart(2, '0')}`;

    const snapshots: PayrollAttendanceSnapshot[] = employees.map(emp => {
      const empAttendance = allAttendance.filter(a => a.employeeId === emp.id && a.date.startsWith(monthPrefix));
      const empLeaves = allLeaves.filter(
        l => l.employeeId === emp.id && l.status === 'مقبولة' && (l.startDate.startsWith(monthPrefix) || l.endDate.startsWith(monthPrefix))
      );
      const empPermissions = allPermissions.filter(p => p.employeeId === emp.id && p.status === 'مقبولة');

      const presentDays = empAttendance.filter(a => a.status === 'حاضر').length;
      const absentDays = empAttendance.filter(a => a.status === 'غائب').length;
      const paidLeaveDays = empLeaves.filter(l => l.leaveType !== 'بدون راتب').reduce((sum, l) => sum + (l.daysCount || 1), 0);
      const unpaidLeaveDays = empLeaves.filter(l => l.leaveType === 'بدون راتب').reduce((sum, l) => sum + (l.daysCount || 1), 0);
      const lateCount = empAttendance.filter(a => (a.lateMinutes || 0) > 0).length;
      const lateMinutes = empAttendance.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);
      const earlyLeaveMinutes = empAttendance.reduce((sum, a) => sum + (a.earlyLeaveMinutes || 0), 0);
      const overtimeHours = empAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

      return {
        id: `SNAP-${emp.id}-${year}-${month}`,
        payrollPeriodId: periodId,
        employeeId: emp.id,
        employeeName: emp.name,
        department: emp.department,
        month,
        year,
        workingDays: workDaysPerMonth,
        presentDays,
        absentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        lateCount,
        lateMinutes,
        earlyLeaveMinutes,
        overtimeHours,
        permissionsCount: empPermissions.length,
        sourceCalculatedAt: now,
        sourceCalculatedBy: calculatedBy || storageService.getCurrentUser()?.fullName || 'النظام',
        isLocked: lock,
      };
    });

    this.savePayrollSnapshotsBatch(snapshots);
    return snapshots;
  }

  /* =========================================================================
   * 5. Payroll Calculation Breakdown Engine (محرك الاحتساب المالي المفصل)
   * ========================================================================= */
  public static calculateEmployeePayrollBreakdown(
    employee: Employee,
    snapshot: PayrollAttendanceSnapshot,
    customRules?: PayrollRule
  ): { breakdown: PayrollCalculationBreakdown; record: PayrollRecord } {
    const settings = storageService.getSettings();
    const rules = customRules || settings.payrollRules;
    const now = getCairoNowISO();

    const basicSalary = employee.basicSalary || 0;
    const allowances = employee.allowances || 0;
    const workDays = rules.workDaysPerMonth > 0 ? rules.workDaysPerMonth : 26;
    const dailyWage = basicSalary / workDays;
    const dailyHours = employee.workingHours || settings.standardDailyHours || 8;
    const hourlyWage = dailyWage / dailyHours;
    const minuteWage = hourlyWage / 60;

    // 1. Absence Deductions
    const absenceDaysTotal = snapshot.absentDays + snapshot.unpaidLeaveDays;
    const absenceDeduction = Math.round(absenceDaysTotal * dailyWage * (rules.absenceDeductionMultiplier || 1));

    // 2. Late Minutes Deductions
    const graceMinutes = rules.lateGraceMinutes || 15;
    const chargeableLateMinutes = Math.max(0, snapshot.lateMinutes - graceMinutes);
    const lateDeduction = Math.round(chargeableLateMinutes * minuteWage * (rules.lateMinuteDeductionRate || 1));

    // 3. Overtime Compensation
    const overtimeAmount = Math.round(snapshot.overtimeHours * hourlyWage * (rules.overtimeRate || 1.5));

    // 4. Gross Total
    const grossSalary = basicSalary + allowances + overtimeAmount;

    // 5. Social Insurance & Other Deductions
    let socialInsurance = 0;
    if (rules.enableSocialInsuranceDeduction) {
      socialInsurance = Math.round((basicSalary * (rules.socialInsuranceRate || 11)) / 100);
    }
    const otherDeductions = socialInsurance;

    // 6. Net Total
    const totalDeductions = absenceDeduction + lateDeduction + otherDeductions;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    const breakdown: PayrollCalculationBreakdown = {
      basicSalary,
      allowances,
      bonuses: 0,
      overtimeAmount,
      absenceDeduction,
      lateDeduction,
      otherDeductions,
      grossSalary,
      netSalary,
      calculationDetails: {
        overtimeRatePerHour: Math.round(hourlyWage * (rules.overtimeRate || 1.5) * 100) / 100,
        dailyWage: Math.round(dailyWage * 100) / 100,
        minuteRate: Math.round(minuteWage * 100) / 100,
        appliedGracePeriodMinutes: graceMinutes,
        calculationFormula: `الأساسي (${basicSalary}) + البدلات (${allowances}) + الإضافي (${overtimeAmount}) - غياب (${absenceDeduction}) - تأخير (${lateDeduction}) - استقطاعات (${otherDeductions}) = صافي (${netSalary}) ج.م`,
      },
    };

    const record: PayrollRecord = {
      id: `PAY-${employee.id}-${snapshot.year}-${snapshot.month}`,
      employeeId: employee.id,
      employeeName: employee.name,
      department: employee.department,
      jobTitle: employee.jobTitle,
      month: snapshot.month,
      year: snapshot.year,
      basicSalary,
      allowances,
      incentives: 0,
      overtimeHours: snapshot.overtimeHours,
      overtimeAmount,
      totalGross: grossSalary,
      absentDaysCount: absenceDaysTotal,
      absenceDeductions: absenceDeduction,
      totalLateMinutes: snapshot.lateMinutes,
      lateDeductions: lateDeduction,
      loanDeductions: otherDeductions,
      otherDeductions: 0,
      totalDeductions,
      netSalary,
      status: 'Draft',
      createdAt: now,
      updatedAt: now,
    };

    return { breakdown, record };
  }

  public static generateMonthlyPayrollFromSnapshots(
    month: number,
    year: number,
    currentUser?: User | null
  ): PayrollRecord[] {
    const user = currentUser || storageService.getCurrentUser();
    this.requirePayrollAdmin(user);

    // Get or generate snapshots
    let snapshots = this.getPayrollAttendanceSnapshots(month, year);
    if (snapshots.length === 0) {
      snapshots = this.generatePayrollAttendanceSnapshots(month, year, true, user?.fullName);
    }

    const employees = storageService.getEmployees().filter(e => e.status === 'Active');
    const empMap = new Map<string, Employee>();
    employees.forEach(e => empMap.set(e.id, e));

    const payrollRecords: PayrollRecord[] = [];

    snapshots.forEach(snap => {
      const emp = empMap.get(snap.employeeId);
      if (emp) {
        const { record } = this.calculateEmployeePayrollBreakdown(emp, snap);
        payrollRecords.push(record);
      }
    });

    const currentRecords = storageService.getPayrollRecords();
    const updated = currentRecords.filter(p => !(p.month === month && p.year === year));
    updated.push(...payrollRecords);

    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(updated));

    // Update monthly closing
    const closing = this.getMonthlyClosing(month, year);
    if (closing) {
      closing.isPayrollGenerated = true;
      closing.payrollGeneratedAt = getCairoNowISO();
      const list = this.getMonthlyClosings();
      const idx = list.findIndex(c => c.id === closing.id);
      if (idx >= 0) list[idx] = closing;
      localStorage.setItem(STORAGE_KEYS_EXTRA.MONTHLY_CLOSINGS, JSON.stringify(list));
    }

    storageService.logAudit(
      'CREATE',
      'PAYROLL',
      `احتساب مسير رواتب شهر (${month}/${year}) لعدد (${payrollRecords.length}) موظف ومعلم اعتماداً على لقطات الحضور المقفلة`
    );

    return payrollRecords;
  }

  /* =========================================================================
   * 6. Salary History & Effective Dating (سجل تعديلات الرواتب وتاريخ السريان)
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
    this.requirePayrollAdmin(user);

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
      reason: reason || 'تعديل هيكل الأجور السنوي',
      approvedBy: user?.fullName || 'المدير المالي والإداري',
      createdAt: now,
    };

    const list = this.getSalaryHistory();
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEYS_EXTRA.SALARY_HISTORY, JSON.stringify(list));

    // Update current employee entity
    const updatedEmployee: Employee = {
      ...employee,
      basicSalary: newBasicSalary,
      allowances: newAllowances,
    };
    storageService.saveEmployee(updatedEmployee);

    storageService.logAudit(
      'UPDATE',
      'PAYROLL',
      `تعديل راتب الموظف (${employee.name}) من (${employee.basicSalary} ج.م) إلى (${newBasicSalary} ج.م) بسريان من تاريخ ${effectiveDate}: ${reason}`
    );

    return { success: true, entry };
  }
}
