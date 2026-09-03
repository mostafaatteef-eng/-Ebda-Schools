import * as XLSX from 'xlsx';
import { AttendanceRecord, Employee, LeaveRecord, MonthSummaryItem, AnnualSummaryItem, AuditLogEntry } from '../types';

export class ExportService {
  /**
   * Export Full Database to Excel with all Sheets matching the Google Sheets architecture
   */
  public static exportFullDatabaseToExcel(
    employees: Employee[],
    attendance: AttendanceRecord[],
    leaves: LeaveRecord[],
    settings: any,
    auditLogs: AuditLogEntry[]
  ) {
    const wb = XLSX.utils.book_new();

    // 1. Employees Sheet
    const empData = employees.map(e => ({
      'رقم الموظف': e.id,
      'اسم الموظف': e.name,
      'الهوية الوطنية': e.nationalId || '',
      'القسم / الإدارة': e.department,
      'المسمى الوظيفي': e.jobTitle,
      'تاريخ التعيين': e.hireDate,
      'الراتب الأساسي': e.basicSalary || '',
      'ساعات العمل': e.workingHours,
      'وقت الحضور الرسمي': e.workStartTime,
      'وقت الانصراف الرسمي': e.workEndTime,
      'أيام العطلة': (e.daysOff || []).join(', '),
      'الحالة': e.status === 'Active' ? 'نشط' : 'معطل',
      'رقم الجوال': e.phone || '',
      'البريد الإلكتروني': e.email || ''
    }));
    const wsEmp = XLSX.utils.json_to_sheet(empData);
    XLSX.utils.book_append_sheet(wb, wsEmp, 'Employees');

    // 2. Attendance Sheet
    const attData = attendance.map(a => ({
      'معرف السجل': a.id,
      'رقم الموظف': a.employeeId,
      'اسم الموظف': a.employeeName,
      'القسم': a.department,
      'التاريخ': a.date,
      'اليوم': a.dayName,
      'وقت الحضور': a.checkIn || '-',
      'وقت الانصراف': a.checkOut || '-',
      'ساعات العمل الفعلية': a.workingHours,
      'دقائق التأخير': a.lateMinutes,
      'مغادرة مبكرة (دقيقة)': a.earlyLeaveMinutes,
      'ساعات إضافية': a.overtimeHours,
      'حالة الحضور': a.status,
      'ملاحظات': a.notes || '',
      'تم التسجيل بواسطة': a.createdBy || 'System',
      'آخر تحديث': a.updatedAt || ''
    }));
    const wsAtt = XLSX.utils.json_to_sheet(attData);
    XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance');

    // 3. Leaves Sheet
    const lvData = leaves.map(l => ({
      'معرف الإجازة': l.id,
      'رقم الموظف': l.employeeId,
      'اسم الموظف': l.employeeName,
      'القسم': l.department,
      'نوع الإجازة': l.leaveType,
      'تاريخ البدء': l.startDate,
      'تاريخ الانتهاء': l.endDate,
      'عدد الأيام': l.daysCount,
      'الحالة': l.status,
      'السبب / المبرر': l.reason,
      'المعتمد بواسطة': l.approvedBy || '',
      'تاريخ الإنشاء': l.createdAt
    }));
    const wsLeaves = XLSX.utils.json_to_sheet(lvData);
    XLSX.utils.book_append_sheet(wb, wsLeaves, 'Leaves');

    // 4. Settings Sheet
    const setRows = Object.entries(settings).map(([k, v]) => ({
      'مفتاح الإعداد': k,
      'القيمة': Array.isArray(v) ? v.join(', ') : String(v)
    }));
    const wsSettings = XLSX.utils.json_to_sheet(setRows);
    XLSX.utils.book_append_sheet(wb, wsSettings, 'Settings');

    // 5. Audit Log Sheet
    const logsData = auditLogs.map(log => ({
      'المعرف': log.id,
      'الوقت والتاريخ': log.timestamp,
      'المستخدم': log.username,
      'الدور': log.userRole,
      'نوع العملية': log.action,
      'الكيان': log.entity,
      'التفاصيل': log.details,
      'القيمة السابقة': log.oldValue || '',
      'القيمة الجديدة': log.newValue || ''
    }));
    const wsLogs = XLSX.utils.json_to_sheet(logsData);
    XLSX.utils.book_append_sheet(wb, wsLogs, 'Audit_Log');

    // Save File
    XLSX.writeFile(wb, `HR_Attendance_System_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  /**
   * Export Monthly Attendance Matrix
   */
  public static exportMonthlyMatrix(
    year: number,
    monthName: string,
    monthNum: number,
    daysList: { dayNumber: number; dateStr: string; dayName: string; isWeekend: boolean }[],
    employees: Employee[],
    attendance: AttendanceRecord[],
    summary: MonthSummaryItem[]
  ) {
    const rows = employees.map(emp => {
      const row: Record<string, any> = {
        'رقم الموظف': emp.id,
        'اسم الموظف': emp.name,
        'القسم': emp.department
      };

      daysList.forEach(d => {
        const rec = attendance.find(a => a.employeeId === emp.id && a.date === d.dateStr);
        row[`${d.dayNumber}`] = rec ? rec.status : (d.isWeekend ? 'عطلة' : 'غائب');
      });

      const s = summary.find(sm => sm.employeeId === emp.id);
      if (s) {
        row['أيام الحضور'] = s.presentDays;
        row['أيام التأخير'] = s.lateDays;
        row['إجمالي دقائق التأخير'] = s.totalLateMinutes;
        row['أيام الغياب'] = s.absentDays;
        row['أيام الإجازة'] = s.leaveDays;
        row['إجمالي الساعات'] = s.totalWorkingHours;
        row['ساعات إضافية'] = s.totalOvertimeHours;
        row['نسبة الالتزام'] = `${s.attendanceRate}%`;
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `حضور_${monthName}_${year}`);
    XLSX.writeFile(wb, `تقرير_حضور_${monthName}_${year}.xlsx`);
  }

  /**
   * Export Annual Summary
   */
  public static exportAnnualSummary(year: number, items: AnnualSummaryItem[]) {
    const data = items.map(it => ({
      'رقم الموظف': it.employeeId,
      'اسم الموظف': it.employeeName,
      'القسم': it.department,
      'المسمى الوظيفي': it.jobTitle,
      'أيام العمل المتوقعة': it.totalWorkDaysExpected,
      'أيام الحضور الفعلي': it.totalPresent,
      'مرات التأخير': it.totalLateCount,
      'إجمالي دقائق التأخير': it.totalLateMinutes,
      'أيام الغياب': it.totalAbsent,
      'إجمالي الإجازات': it.totalLeaves,
      'الإجازات الاعتيادية المستخدمة': it.annualLeavesUsed,
      'الإجازات المرضية': it.sickLeavesUsed,
      'إجمالي الساعات الفعلية': it.totalHoursWorked,
      'معدل الحضور السنوي': `${it.attendanceRate}%`
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `الملخص_السنوي_${year}`);
    XLSX.writeFile(wb, `الملخص_السنوي_للموظفين_${year}.xlsx`);
  }

  /**
   * Export Leaves to Excel
   */
  public static exportLeavesToExcel(leaves: LeaveRecord[], fileName: string = 'سجل_الإجازات') {
    const data = leaves.map((l, idx) => ({
      'م': idx + 1,
      'رقم الموظف': l.employeeId,
      'اسم الموظف': l.employeeName,
      'القسم': l.department,
      'نوع الإجازة': l.leaveType,
      'تاريخ البدء': l.startDate,
      'تاريخ الانتهاء': l.endDate,
      'عدد الأيام': l.daysCount,
      'الحالة': l.status,
      'السبب': l.reason,
      'المعتمد': l.approvedBy || '-',
      'تاريخ التقديم': l.createdAt,
    }));
    this.exportToExcel(data, fileName, 'الإجازات');
  }

  /**
   * Generic Excel Export Helper for custom tables & daily records
   */
  public static exportToExcel(data: Record<string, any>[], fileName: string = 'Export', sheetName: string = 'Sheet1') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  /**
   * Generic Print Helper
   */
  public static triggerPrint() {
    window.print();
  }
}
