import {
  AcademicYear,
  AttendanceDay,
  AttendanceDayStatus,
  AttendanceException,
  ClassAttendanceRecord,
  SchoolHoliday,
  Student,
  StudentAttendanceRecord,
  StudentAttendanceRules,
  StudentAttendanceStatusConfig,
  StudentEnrollment,
  SystemSettings,
} from '../types';
import { getCairoCurrentDate, getEgyptianDayName } from './egyptianTime';

/**
 * Calculates late minutes based on check-in time and configured rules.
 * Supports Mode A ('from_start' - minutes from school start) and Mode B ('after_grace' - minutes after grace period ends).
 */
export function calculateStudentLateMinutes(
  checkInTime: string | undefined | null,
  rules: StudentAttendanceRules,
  officialStartTimeOverride?: string
): { lateMinutes: number; isLate: boolean } {
  if (!checkInTime || !checkInTime.includes(':')) {
    return { lateMinutes: 0, isLate: false };
  }

  const startTimeStr = officialStartTimeOverride || rules.startTime || '07:45';
  const graceMinutes = rules.gracePeriodMinutes ?? 15;
  const mode = rules.lateCalculationMode || 'from_start';

  const [inH, inM] = checkInTime.split(':').map(Number);
  const [stH, stM] = startTimeStr.split(':').map(Number);

  if (isNaN(inH) || isNaN(inM) || isNaN(stH) || isNaN(stM)) {
    return { lateMinutes: 0, isLate: false };
  }

  const inTotal = inH * 60 + inM;
  const stTotal = stH * 60 + stM;
  const graceEndTotal = stTotal + graceMinutes;

  if (inTotal <= graceEndTotal) {
    return { lateMinutes: 0, isLate: false };
  }

  // If after grace period
  let lateMinutes = 0;
  if (mode === 'after_grace') {
    lateMinutes = Math.max(0, inTotal - graceEndTotal);
  } else {
    // 'from_start' (Default Egyptian standard)
    lateMinutes = Math.max(0, inTotal - stTotal);
  }

  return { lateMinutes, isLate: true };
}

/**
 * Determines if a specific date is a working school day (not weekend, not holiday, and within academic year).
 */
export function isSchoolWorkingDay(
  dateStr: string,
  settings: SystemSettings,
  holidays: SchoolHoliday[] = [],
  academicYears: AcademicYear[] = []
): { isWorkingDay: boolean; reason?: string } {
  const dayName = getEgyptianDayName(dateStr);
  const weekendDays = settings.weekendDays || ['الجمعة', 'السبت'];

  if (weekendDays.includes(dayName)) {
    return { isWorkingDay: false, reason: `عطلة أسبوعية (${dayName})` };
  }

  // Check Holidays
  const matchingHoliday = holidays.find(h => dateStr >= h.startDate && dateStr <= h.endDate);
  if (matchingHoliday) {
    return { isWorkingDay: false, reason: `عطلة رسمية: ${matchingHoliday.name}` };
  }

  // Check Academic Year boundaries if available
  const activeYear = academicYears.find(y => y.status === 'ACTIVE' || y.isDefault);
  if (activeYear && activeYear.startDate && activeYear.endDate) {
    if (dateStr < activeYear.startDate || dateStr > activeYear.endDate) {
      return { isWorkingDay: false, reason: 'خارج نطاق العام الدراسي النشط' };
    }
  }

  return { isWorkingDay: true };
}

/**
 * Validates if a student is eligible for attendance on a given date.
 */
export function isStudentEligibleForDate(
  student: Student,
  dateStr: string,
  enrollment?: StudentEnrollment
): { isEligible: boolean; reason?: string } {
  // Inactive students
  if (student.status !== 'نشط') {
    return { isEligible: false, reason: `حالة الطالب: ${student.status}` };
  }

  // Check enrollment date
  const effectiveEnrollmentDate = enrollment?.enrollmentDate || student.enrollmentDate;
  if (effectiveEnrollmentDate && dateStr < effectiveEnrollmentDate) {
    return { isEligible: false, reason: `قبل تاريخ الالتحاق بالمدرسة (${effectiveEnrollmentDate})` };
  }

  return { isEligible: true };
}

export interface AttendanceDayReviewResult {
  date: string;
  academicYearId?: string;
  dayStatus: AttendanceDayStatus;
  isValidForApproval: boolean;
  totalActiveStudents: number;
  recordedCount: number;
  unrecordedCount: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  excusedCount: number;
  escapedCount: number;
  unrecordedStudents: Student[];
  missingReasonRecords: StudentAttendanceRecord[];
  classMismatchesCount: number;
  exceptions: AttendanceException[];
  warnings: string[];
  blockers: string[];
}

/**
 * Conducts a comprehensive Day Review to prepare for Day Approval and Day Locking.
 */
export function computeAttendanceDayReview(params: {
  date: string;
  academicYearId?: string;
  students: Student[];
  enrollments: StudentEnrollment[];
  schoolAttendance: StudentAttendanceRecord[];
  classAttendance: ClassAttendanceRecord[];
  dayRecord?: AttendanceDay;
  settings: SystemSettings;
  statuses: StudentAttendanceStatusConfig[];
}): AttendanceDayReviewResult {
  const { date, academicYearId, students, schoolAttendance, classAttendance, dayRecord, settings, statuses } = params;

  const activeStudents = students.filter(s => s.status === 'نشط');
  const totalActiveStudents = activeStudents.length;

  const daySchoolRecords = schoolAttendance.filter(r => r.date === date);
  const schoolRecordMap = new Map<string, StudentAttendanceRecord>();
  daySchoolRecords.forEach(r => schoolRecordMap.set(r.studentId, r));

  const unrecordedStudents: Student[] = [];
  const missingReasonRecords: StudentAttendanceRecord[] = [];
  let presentCount = 0;
  let lateCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let escapedCount = 0;

  activeStudents.forEach(s => {
    const rec = schoolRecordMap.get(s.id);
    if (!rec || rec.status === 'لم يسجل' || !rec.status) {
      unrecordedStudents.push(s);
    } else {
      const statusConfig = statuses.find(st => st.name === rec.status || st.id === rec.statusId);

      if (rec.status === 'حاضر') presentCount++;
      else if (rec.status === 'متأخر') lateCount++;
      else if (rec.status === 'غائب' || rec.status === 'غائب بدون عذر') absentCount++;
      else if (rec.status === 'غائب بعذر') {
        absentCount++;
        excusedCount++;
      } else if (rec.status === 'هروب') escapedCount++;
      else if (statusConfig?.countsAsPresent) presentCount++;
      else if (statusConfig?.countsAsAbsent) absentCount++;

      // Reason check
      if ((statusConfig?.requiresReason || rec.status === 'غائب بعذر') && !rec.absenceReason && !rec.absenceReasonText) {
        missingReasonRecords.push(rec);
      }
    }
  });

  const recordedCount = totalActiveStudents - unrecordedStudents.length;
  const unrecordedCount = unrecordedStudents.length;

  // Class vs School Attendance Discrepancies (Mismatches)
  const exceptions: AttendanceException[] = [];
  const dayClassRecords = classAttendance.filter(c => c.date === date);

  dayClassRecords.forEach(cr => {
    const sr = schoolRecordMap.get(cr.studentId);
    const student = activeStudents.find(s => s.id === cr.studentId);
    const sName = student?.name || cr.studentName || cr.studentId;

    // 1. School Present, Class Absent
    if (sr && (sr.status === 'حاضر' || sr.status === 'متأخر') && cr.status === 'غائب') {
      exceptions.push({
        id: `EXC-MISMATCH-1-${cr.id}`,
        date,
        academicYearId,
        studentId: cr.studentId,
        studentName: sName,
        grade: cr.grade,
        classroom: cr.classroom,
        type: 'MISMATCH_PRESENT_ABSENT',
        severity: 'WARNING',
        description: `الطالب حاضر بالمدرسة صباحاً ولكن تم تسجيله غائباً في الحصة ${cr.periodNumber || ''} (${cr.subject})`,
        periodNumber: cr.periodNumber,
        subject: cr.subject,
        teacherName: cr.teacherName,
        schoolStatus: sr.status,
        classStatus: cr.status,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      });
    }

    // 2. School Absent, Class Present (Critical warning)
    if (sr && (sr.status === 'غائب' || sr.status === 'غائب بدون عذر' || sr.status === 'غائب بعذر') && cr.status === 'حاضر') {
      exceptions.push({
        id: `EXC-MISMATCH-2-${cr.id}`,
        date,
        academicYearId,
        studentId: cr.studentId,
        studentName: sName,
        grade: cr.grade,
        classroom: cr.classroom,
        type: 'MISMATCH_ABSENT_PRESENT',
        severity: 'CRITICAL',
        description: `تنبيه خطير: الطالب مسجل غائباً عن المدرسة بالكامل اليوم، ولكن المعلم (${cr.teacherName}) رصده حاضراً في حصة ${cr.subject}!`,
        periodNumber: cr.periodNumber,
        subject: cr.subject,
        teacherName: cr.teacherName,
        schoolStatus: sr.status,
        classStatus: cr.status,
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      });
    }
  });

  const warnings: string[] = [];
  const blockers: string[] = [];

  const policy = settings.studentAttendanceRules?.missingRecordOnApproval || 'block';

  if (unrecordedCount > 0) {
    if (policy === 'block') {
      blockers.push(`يوجد (${unrecordedCount}) طالب لم يتم رصد حضورهم. سياسة المدرسة تمنع الاعتماد قبل اكتمال الرصد.`);
    } else if (policy === 'convertToAbsent') {
      warnings.push(`يوجد (${unrecordedCount}) طالب غير مسجلين، سيتم تحويلهم تلقائياً إلى غائب بدون عذر عند الاعتماد.`);
    } else {
      warnings.push(`يوجد (${unrecordedCount}) طالب بدون رصد حضور.`);
    }
  }

  if (missingReasonRecords.length > 0) {
    warnings.push(`يوجد (${missingReasonRecords.length}) حالة غياب تتطلب توثيق العذر المقبول.`);
  }

  if (exceptions.length > 0) {
    warnings.push(`تم رصد (${exceptions.length}) تضارب بين الحضور الصباحي وحضور الحصص الدراسية.`);
  }

  const isValidForApproval = blockers.length === 0;

  return {
    date,
    academicYearId,
    dayStatus: dayRecord?.status || 'Open',
    isValidForApproval,
    totalActiveStudents,
    recordedCount,
    unrecordedCount,
    presentCount,
    lateCount,
    absentCount,
    excusedCount,
    escapedCount,
    unrecordedStudents,
    missingReasonRecords,
    classMismatchesCount: exceptions.length,
    exceptions,
    warnings,
    blockers,
  };
}

/**
 * Calculates Student Attendance Summary for a Month / Semester.
 */
export function computeStudentMonthlyMetrics(params: {
  student: Student;
  month: number; // 1-12
  year: number; // e.g. 2026
  attendanceRecords: StudentAttendanceRecord[];
  settings: SystemSettings;
  holidays?: SchoolHoliday[];
  academicYears?: AcademicYear[];
}) {
  const { student, month, year, attendanceRecords, settings, holidays = [], academicYears = [] } = params;

  const daysInMonth = new Date(year, month, 0).getDate();
  const cairoToday = getCairoCurrentDate();

  let eligibleSchoolDays = 0;
  let presentDays = 0;
  let lateDays = 0;
  let totalLateMinutes = 0;
  let excusedAbsentDays = 0;
  let unexcusedAbsentDays = 0;
  let escapedDays = 0;
  let unrecordedEligibleDays = 0;

  const dayStatusMap = new Map<string, { status: string; symbol: string; color: string; notes?: string; isWeekend?: boolean; isHoliday?: boolean }>();

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const workingDayCheck = isSchoolWorkingDay(dayStr, settings, holidays, academicYears);
    const eligibilityCheck = isStudentEligibleForDate(student, dayStr);

    const isFuture = dayStr > cairoToday;
    const rec = attendanceRecords.find(r => r.studentId === student.id && r.date === dayStr);

    if (!workingDayCheck.isWorkingDay) {
      dayStatusMap.set(dayStr, {
        status: workingDayCheck.reason || 'عطلة',
        symbol: '—',
        color: 'text-slate-300 bg-slate-50',
        isWeekend: workingDayCheck.reason?.includes('عطلة أسبوعية'),
        isHoliday: workingDayCheck.reason?.includes('عطلة رسمية'),
      });
      continue;
    }

    if (!eligibilityCheck.isEligible) {
      dayStatusMap.set(dayStr, {
        status: eligibilityCheck.reason || 'غير مقيد',
        symbol: '—',
        color: 'text-slate-300 bg-slate-50',
      });
      continue;
    }

    if (isFuture) {
      dayStatusMap.set(dayStr, {
        status: 'مستقبل',
        symbol: '·',
        color: 'text-slate-200',
      });
      continue;
    }

    // This is an eligible past/current school day
    eligibleSchoolDays++;

    if (!rec || rec.status === 'لم يسجل' || !rec.status) {
      unrecordedEligibleDays++;
      dayStatusMap.set(dayStr, {
        status: 'لم يسجل',
        symbol: '؟',
        color: 'text-amber-500 bg-amber-50 font-bold',
      });
    } else if (rec.status === 'حاضر') {
      presentDays++;
      dayStatusMap.set(dayStr, {
        status: 'حاضر',
        symbol: 'ح',
        color: 'text-emerald-700 bg-emerald-50 font-bold',
      });
    } else if (rec.status === 'متأخر') {
      presentDays++;
      lateDays++;
      totalLateMinutes += rec.lateMinutes || 0;
      dayStatusMap.set(dayStr, {
        status: `متأخر (${rec.lateMinutes || 0} دقيقة)`,
        symbol: 'ت',
        color: 'text-amber-700 bg-amber-100 font-bold',
      });
    } else if (rec.status === 'غائب بعذر') {
      excusedAbsentDays++;
      dayStatusMap.set(dayStr, {
        status: `بعذر: ${rec.absenceReason || 'مقبول'}`,
        symbol: 'ع',
        color: 'text-indigo-700 bg-indigo-50 font-bold',
      });
    } else if (rec.status === 'غائب' || rec.status === 'غائب بدون عذر') {
      unexcusedAbsentDays++;
      dayStatusMap.set(dayStr, {
        status: 'غائب بدون عذر',
        symbol: 'غ',
        color: 'text-rose-700 bg-rose-100 font-bold',
      });
    } else if (rec.status === 'هروب') {
      escapedDays++;
      unexcusedAbsentDays++;
      dayStatusMap.set(dayStr, {
        status: 'هروب من المدرسة',
        symbol: 'هـ',
        color: 'text-red-900 bg-red-200 font-bold',
      });
    } else if (rec.status === 'مأذون') {
      presentDays++;
      dayStatusMap.set(dayStr, {
        status: 'مأذون له بالانصراف',
        symbol: 'م',
        color: 'text-purple-700 bg-purple-50 font-bold',
      });
    } else {
      presentDays++;
      dayStatusMap.set(dayStr, {
        status: rec.status,
        symbol: 'ح',
        color: 'text-emerald-700 bg-emerald-50',
      });
    }
  }

  const totalAbsences = unexcusedAbsentDays + excusedAbsentDays;
  const attendanceRate = eligibleSchoolDays > 0 ? Math.round((presentDays / eligibleSchoolDays) * 100) : 100;

  return {
    month,
    year,
    daysInMonth,
    eligibleSchoolDays,
    presentDays,
    lateDays,
    totalLateMinutes,
    totalAbsences,
    excusedAbsentDays,
    unexcusedAbsentDays,
    escapedDays,
    unrecordedEligibleDays,
    attendanceRate,
    dayStatusMap,
  };
}
