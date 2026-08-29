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
 * Calculates attendance metrics based on rules
 */
export function calculateAttendanceMetrics(
  checkIn: string,
  checkOut: string,
  officialStartTime: string = '09:00',
  officialEndTime: string = '17:00',
  gracePeriodMinutes: number = 15,
  standardDailyHours: number = 8
) {
  let workingHours = 0;
  let lateMinutes = 0;
  let earlyLeaveMinutes = 0;
  let overtimeHours = 0;

  const inMinutes = timeStringToMinutes(checkIn);
  const outMinutes = timeStringToMinutes(checkOut);
  const startMinutes = timeStringToMinutes(officialStartTime);
  const endMinutes = timeStringToMinutes(officialEndTime);

  // Late calculation
  if (checkIn && inMinutes > 0) {
    if (inMinutes > startMinutes + gracePeriodMinutes) {
      lateMinutes = inMinutes - startMinutes;
    } else {
      lateMinutes = 0; // within grace period
    }
  }

  // Working Hours and Early Leave / Overtime
  if (checkIn && checkOut && outMinutes >= inMinutes) {
    const diffMinutes = outMinutes - inMinutes;
    workingHours = parseFloat((diffMinutes / 60).toFixed(2));

    if (outMinutes < endMinutes) {
      earlyLeaveMinutes = endMinutes - outMinutes;
    }

    if (workingHours > standardDailyHours) {
      overtimeHours = parseFloat((workingHours - standardDailyHours).toFixed(2));
    }
  }

  return {
    workingHours,
    lateMinutes,
    earlyLeaveMinutes,
    overtimeHours
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
  settings: SystemSettings
): AttendanceStatus {
  if (isLeave) return 'إجازة';

  const isWknd = isWeekend(dateStr, settings.weekendDays);
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
export function getDaysInMonth(year: number, month: number): { dayNumber: number; dateStr: string; dayName: string; isWeekend: boolean }[] {
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
      isWeekend: isWeekend(dateStr)
    });
  }
  return result;
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
