export type UserRole = 'Admin' | 'HR' | 'Supervisor' | 'Employee' | 'Viewer';

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

export type LeaveType = 'سنوية' | 'مرضية' | 'طارئة' | 'عارضة' | 'بدون راتب' | 'رسمية' | 'أمومة/أبوة' | 'أخرى';

export type LeaveStatus = 'معلقة' | 'مقبولة' | 'مرفوضة';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  employeeId?: string;
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
  workingHours: number; // e.g. 8
  workStartTime: string; // e.g. "09:00"
  workEndTime: string; // e.g. "17:00"
  daysOff: string[]; // e.g. ["Friday", "Saturday"] or ["الجمعة", "السبت"]
  status: 'Active' | 'Inactive';
  phone?: string;
  email?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  dayName: string; // الأحد، الإثنين...
  checkIn: string; // "09:05" or ""
  checkOut: string; // "17:15" or ""
  workingHours: number; // 8.16
  lateMinutes: number; // calculated according to workStartTime and gracePeriod
  earlyLeaveMinutes: number; // calculated if left before workEndTime
  overtimeHours: number; // extra hours
  status: AttendanceStatus;
  
  // Detailed metadata for Google Sheets & reporting
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

export interface SystemSettings {
  companyName: string;
  officialStartTime: string; // "09:00"
  officialEndTime: string; // "17:00"
  gracePeriodMinutes: number; // 15
  standardDailyHours: number; // 8
  weekendDays: string[]; // ["الجمعة", "السبت"]
  overtimeRate: number; // 1.5
  annualLeaveAllowance: number; // 21
  sickLeaveAllowance: number; // 15
  emergencyLeaveAllowance: number; // 6
  autoCalculateStatus: boolean;
  googleSheetsUrl?: string;
  googleAppsScriptUrl?: string;
  googleSheetWebAppUrl?: string;
  googleClientId?: string;
  defaultLanguage?: string;
  timeZone?: string;
  spreadsheetId?: string;
  autoSyncIntervalMinutes: number; // 5
  enableAuditLog: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  username?: string;
  userRole?: UserRole;
  performedBy?: string;
  action: string;
  entity?: 'ATTENDANCE' | 'EMPLOYEE' | 'LEAVE' | 'USER' | 'SETTINGS' | 'AUTH' | 'SYNC';
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
  attendanceRate: number; // %
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
  attendanceRate: number; // %
}

export interface SyncStatus {
  lastSyncTime: string | null;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
  syncedRecordsCount?: number;
  connectedToGoogleSheets: boolean;
}

export type SyncState = SyncStatus;
