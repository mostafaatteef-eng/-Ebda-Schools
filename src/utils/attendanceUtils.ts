import { AttendanceRecord, AttendanceStatus, Employee, LeaveRecord, SystemSettings } from '../types';

export const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

/**
 * Returns the current local time string formatted as HH:mm (24h)
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Converts "HH:mm" string to total minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to "HH:mm"
 */
export function minutesToTimeString(minutes: number): string {
  if (isNaN(minutes) || minutes < 0) return '00:00';
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = Math.floor(minutes % 60);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Formats minutes into human Arabic string: e.g. "27 دقيقة" or "1 س و 15 د"
 */
export function formatMinutesToHuman(minutes: number): string {
  if (!minutes || minutes <= 0) return '0 دقيقة';
  if (minutes < 60) return `${minutes} دقيقة`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return `${hrs} ${hrs === 1 ? 'ساعة' : hrs === 2 ? 'ساعتان' : 'ساعات'}`;
  return `${hrs} س و ${rem} د`;
}

/**
 * Gets Arabic day name for a given date YYYY-MM-DD
 */
export function getArabicDayName(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return ARABIC_DAYS[date.getDay()] || '';
}

/**
 * Formats a date string (YYYY-MM-DD) into full Arabic: e.g. "السبت 29 أغسطس 2026"
 */
export function getArabicFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  const dayName = ARABIC_DAYS[date.getDay()];
  const dayNum = date.getDate();
  const monthName = ARABIC_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName} ${dayNum} ${monthName} ${year}`;
}

/**
 * Checks if a given date string is in the weekend list
 */
export function isWeekend(dateStr: string, weekendDays: string[] = ['الجمعة', 'السبت']): boolean {
  const dayName = getArabicDayName(dateStr);
  return weekendDays.includes(dayName);
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Unified Core Calculation: Computes Late, Early Leave, Working Hours, and Overtime
 * Supporting Employee schedule overrides and Configurable Late Calculation Mode
 */
export interface AttendanceCalculationInput {
  employee?: Partial<Employee> | null;
  dateStr: string;
  checkIn?: string;
  checkOut?: string;
  settings: SystemSettings;
  statusOverride?: AttendanceStatus;
  isLeave?: boolean;
}

export function calculateAttendanceMetrics(
  checkIn: string = '',
  checkOut: string = '',
  officialStartTime: string = '07:30',
  officialEndTime: string = '14:30',
  gracePeriodMinutes: number = 15,
  standardDailyHours: number = 7,
  lateCalculationMode: 'from_start' | 'after_grace' = 'from_start'
): {
  workingHours: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeHours: number;
} {
  let workingHours = 0;
  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  let overtimeHours = 0;

  const inMinutes = timeStringToMinutes(checkIn);
  const outMinutes = timeStringToMinutes(checkOut);
  const startMinutes = timeStringToMinutes(officialStartTime);
  const endMinutes = timeStringToMinutes(officialEndTime);

  // Late calculation
  // Mode A (default): if checkIn is past (start + grace), late is measured from start time (e.g., 09:00 start, 15m grace, 09:16 in = 16 mins late)
  // Mode B: if checkIn is past (start + grace), late is measured after grace period only (e.g. 09:16 in = 1 min late)
  if (checkIn && inMinutes > 0) {
    if (inMinutes > startMinutes + gracePeriodMinutes) {
      if (lateCalculationMode === 'after_grace') {
        lateMinutes = inMinutes - (startMinutes + gracePeriodMinutes);
      } else {
        lateMinutes = inMinutes - startMinutes;
      }
    } else {
      lateMinutes = 0; // within grace period
    }
  }

  // Working Hours and Early Leave / Overtime
  if (checkIn && checkOut && outMinutes >= inMinutes) {
    const diffMinutes = outMinutes - inMinutes;
    workingHours = parseFloat((diffMinutes / 60).toFixed(2));

    if (endMinutes > 0 && outMinutes < endMinutes) {
      earlyLeaveMinutes = Math.max(0, endMinutes - outMinutes);
    }

    if (workingHours > standardDailyHours) {
      overtimeHours = parseFloat((workingHours - standardDailyHours).toFixed(2));
    } else if (endMinutes > 0 && outMinutes > endMinutes) {
      // Overtime based on official shift end
      const diffEnd = outMinutes - endMinutes;
      if (diffEnd >= 30) {
        overtimeHours = parseFloat((diffEnd / 60).toFixed(2));
      }
    }
  }

  return {
    workingHours,
    lateMinutes: Math.max(0, lateMinutes),
    earlyLeaveMinutes: Math.max(0, earlyLeaveMinutes),
    overtimeHours: Math.max(0, overtimeHours)
  };
}

/**
 * Unified Attendance Record Builder:
 * Single Source of Truth for creating or updating Attendance Records
 */
export function buildUnifiedAttendanceRecord(
  input: AttendanceCalculationInput
): AttendanceRecord {
  const { employee, dateStr, checkIn = '', checkOut = '', settings, statusOverride, isLeave } = input;

  const startTime = employee?.workStartTime || settings.officialStartTime || '07:30';
  const endTime = employee?.workEndTime || settings.officialEndTime || '14:30';
  const graceMinutes = settings.gracePeriodMinutes ?? 15;
  const standardHours = employee?.workingHours || settings.standardDailyHours || 7;
  const lateMode = settings.lateCalculationMode || 'from_start';
  const weekendDays = employee?.daysOff && employee.daysOff.length > 0 ? employee.daysOff : (settings.weekendDays || ['الجمعة', 'السبت']);

  const metrics = calculateAttendanceMetrics(
    checkIn,
    checkOut,
    startTime,
    endTime,
    graceMinutes,
    standardHours,
    lateMode
  );

  let status: AttendanceStatus = statusOverride || 'حاضر';

  if (isLeave) {
    status = 'إجازة';
  } else if (!statusOverride) {
    if (!checkIn) {
      if (isWeekend(dateStr, weekendDays)) {
        status = 'عطلة أسبوعية';
      } else {
        status = 'غائب';
      }
    } else if (metrics.lateMinutes > 0) {
      status = 'متأخر';
    } else {
      status = 'حاضر';
    }
  }

  // If checkIn was present but no checkOut yet, default working hours to shift standard until checkout occurs
  const calculatedWorkingHours = (checkIn && !checkOut) ? standardHours : metrics.workingHours;

  return {
    id: `ATT-${employee?.id || 'EMP'}-${dateStr}`,
    employeeId: employee?.id || '',
    employeeName: employee?.name || '',
    department: employee?.department || '',
    date: dateStr,
    dayName: getArabicDayName(dateStr),
    checkIn,
    checkOut,
    workingHours: calculatedWorkingHours,
    lateMinutes: metrics.lateMinutes,
    earlyLeaveMinutes: metrics.earlyLeaveMinutes,
    overtimeHours: metrics.overtimeHours,
    status,
    checkInTimestamp: checkIn ? new Date().toISOString() : undefined,
    checkOutTimestamp: checkOut ? new Date().toISOString() : undefined,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Computes status automatically
 */
export function determineAttendanceStatus(
  dateStr: string,
  checkIn: string,
  lateMinutes: number,
  isLeave: boolean,
  settings: SystemSettings,
  employeeDaysOff?: string[]
): AttendanceStatus {
  if (isLeave) return 'إجازة';

  const weekendDays = employeeDaysOff && employeeDaysOff.length > 0 ? employeeDaysOff : settings.weekendDays;
  const isWknd = isWeekend(dateStr, weekendDays);
  if (!checkIn) {
    if (isWknd) return 'عطلة أسبوعية';
    return 'غائب';
  }

  if (lateMinutes > 0) {
    return 'متأخر';
  }

  return 'حاضر';
}

/**
 * Get days count for a given year & month (1-indexed month)
 */
export function getDaysInMonth(
  year: number,
  month: number,
  weekendDays: string[] = ['الجمعة', 'السبت']
): { dayNumber: number; dateStr: string; dayName: string; isWeekend: boolean }[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = formatDateKey(date);
    const dayName = ARABIC_DAYS[date.getDay()];
    result.push({
      dayNumber: d,
      dateStr,
      dayName,
      isWeekend: isWeekend(dateStr, weekendDays)
    });
  }
  return result;
}

/**
 * Computes the dynamic list of financial/academic years based on actual data
 */
export function deriveDynamicYears(
  attendanceRecords: AttendanceRecord[] = [],
  employees: Employee[] = [],
  settings?: SystemSettings
): number[] {
  const yearsSet = new Set<number>();
  const currentYear = new Date().getFullYear();
  yearsSet.add(currentYear);
  yearsSet.add(currentYear - 1);
  yearsSet.add(currentYear + 1);

  attendanceRecords.forEach(a => {
    if (a.date) {
      const y = parseInt(a.date.slice(0, 4), 10);
      if (!isNaN(y) && y >= 2020 && y <= 2040) yearsSet.add(y);
    }
  });

  employees.forEach(e => {
    if (e.hireDate) {
      const y = parseInt(e.hireDate.slice(0, 4), 10);
      if (!isNaN(y) && y >= 2020 && y <= 2040) yearsSet.add(y);
    }
  });

  return Array.from(yearsSet).sort((a, b) => a - b);
}

/**
 * Helper to calculate cross-year leave days overlapping with a specific year
 */
export function getLeaveDaysForYear(leave: LeaveRecord, targetYear: number): number {
  if (!leave.startDate || !leave.endDate) return leave.daysCount || 0;
  
  const start = new Date(leave.startDate + 'T00:00:00');
  const end = new Date(leave.endDate + 'T00:00:00');
  const yearStart = new Date(targetYear, 0, 1);
  const yearEnd = new Date(targetYear, 11, 31);

  if (end < yearStart || start > yearEnd) return 0;

  const effectiveStart = start < yearStart ? yearStart : start;
  const effectiveEnd = end > yearEnd ? yearEnd : end;

  const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

/**
 * Generates badge styling for each attendance status
 */
export function getBadgeColorForStatus(status: AttendanceStatus): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'حاضر':
      return { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'متأخر':
      return { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'غائب':
      return { bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' };
    case 'مأذونية':
    case 'إذن عمل':
      return { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'إجازة':
      return { bg: 'bg-purple-50 text-purple-700', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
    case 'عطلة أسبوعية':
    case 'راحة':
      return { bg: 'bg-slate-100 text-slate-600', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
    case 'نصف يوم':
      return { bg: 'bg-orange-50 text-orange-700', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500' };
    default:
      return { bg: 'bg-slate-100 text-slate-700', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
  }
}
